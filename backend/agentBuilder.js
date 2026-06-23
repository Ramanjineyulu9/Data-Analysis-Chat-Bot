const { Agent } = require('@mastra/core/agent');
const { createTool } = require('@mastra/core/tools');
const { z } = require('zod');
const { createGroq } = require('@ai-sdk/groq');
const Papa = require('papaparse');

function buildAgent(csvDataString) {
  const groqProvider = createGroq({
    apiKey: process.env.GROQ_API_KEY,
  });

  let parsed = Papa.parse(csvDataString, { header: true, skipEmptyLines: true });
  let dataRows = parsed.data;
  let operationsLog = [];
  let chartConfig = null;

  const getSummaryTool = createTool({
    id: 'get_data_summary',
    description: 'Get the column names and first 5 rows of the dataset to understand its structure.',
    inputSchema: z.object({}),
    execute: async () => {
      if (dataRows.length === 0) return { result: "Dataset is empty" };
      return {
        columns: Object.keys(dataRows[0]),
        sampleData: dataRows.slice(0, 5)
      };
    }
  });

  const getFullDataTool = createTool({
    id: 'get_full_data',
    description: 'Retrieve all rows of data. Use this ONLY when you specifically need to calculate mathematical formulas like MSE, linear regression, or precise averages across the entire dataset.',
    inputSchema: z.object({}),
    execute: async () => {
      // Return maximum 500 rows to prevent context window explosion
      return {
        totalRows: dataRows.length,
        data: dataRows.slice(0, 500),
        note: "Data truncated to first 500 rows to fit context window."
      };
    }
  });

  const generateChartTool = createTool({
    id: 'generate_chart',
    description: 'Generates a visual chart (bar, line, pie, area) based on the data. ALWAYS use this when the user asks for a visual or when it would help explain trends.',
    inputSchema: z.object({
      type: z.enum(['bar', 'line', 'pie', 'area']),
      title: z.string(),
      data: z.array(z.object({ name: z.string(), value: z.number() })).max(15).describe("The data points for the chart, max 15 points.")
    }),
    execute: async (params) => {
      const input = params.context || params.inputData || params.input || params;
      chartConfig = input;
      return { success: true, message: `Chart "${input.title}" generated successfully.` };
    }
  });

  const cleanDataTool = createTool({
    id: 'clean_data',
    description: 'Removes duplicates or drops missing values from the dataset. Use ONLY if the user explicitly asks to clean data.',
    inputSchema: z.object({
      action: z.enum(['remove_duplicates', 'drop_missing']),
      columns: z.array(z.string()).optional().describe("Columns to check for missing values. If omitted, checks all.")
    }),
    execute: async (params) => {
      const input = params.context || params.inputData || params.input || params;
      if (input.action === 'remove_duplicates') {
        const unique = [];
        const seen = new Set();
        for (let row of dataRows) {
          const str = JSON.stringify(row);
          if (!seen.has(str)) {
            seen.add(str);
            unique.push(row);
          }
        }
        dataRows = unique;
        operationsLog.push('removed_duplicates');
      } else if (input.action === 'drop_missing') {
        const cols = input.columns || Object.keys(dataRows[0] || {});
        dataRows = dataRows.filter(row => {
          return cols.every(col => row[col] !== null && row[col] !== undefined && row[col] !== '');
        });
        operationsLog.push('dropped_missing');
      }
      return { success: true, remainingRows: dataRows.length };
    }
  });

  const agent = new Agent({
    name: 'Data Analyst Agent',
    instructions: `You are an expert Data Analyst and Machine Learning Engineer.
    1. First, always use get_data_summary to understand the dataset structure.
    2. If asked to compute complex metrics like MSE or regression, use get_full_data to read the rows and calculate the exact numbers yourself.
    3. Always generate a chart using generate_chart if you find interesting trends or if asked.
    4. Provide your final response in clear text, highlighting "Machine Learning Insights". Do not output JSON. Just write a professional, natural language answer.
    5. ONLY use clean_data if the user explicitly asks.`,
    model: groqProvider('llama-3.3-70b-versatile'),
    tools: { getSummaryTool, getFullDataTool, generateChartTool, cleanDataTool },
  });

  return { agent, getContext: () => ({ dataRows, operationsLog, chartConfig }) };
}

module.exports = { buildAgent };
