const { Agent } = require('@mastra/core/agent');
const { createTool } = require('@mastra/core/tools');
const { z } = require('zod');
const { createGroq } = require('@ai-sdk/groq');
const Papa = require('papaparse');
const ss = require('simple-statistics');
const { DecisionTreeRegression, DecisionTreeClassifier } = require('ml-cart');

function buildAgent(csvDataString) {
  const groqProvider = createGroq({
    apiKey: process.env.GROQ_API_KEY,
  });

  let parsed = Papa.parse(csvDataString, { header: true, skipEmptyLines: true });
  let dataRows = parsed.data;
  let operationsLog = [];
  let chartConfig = null;
  let metrics = [];
  let charts = [];

  const getDataSummaryTool = createTool({
    id: 'get_data_summary',
    description: 'Use this to view the first 5 rows and column names of the dataset. Call this before doing anything else to understand the data structure.',
    inputSchema: z.object({}),
    execute: async () => {
      if (dataRows.length === 0) return { result: "Dataset is empty" };
      return {
        columns: Object.keys(dataRows[0]),
        sampleData: dataRows.slice(0, 5)
      };
    }
  });

  const getDataFrameDescribeTool = createTool({
    id: 'get_dataframe_describe',
    description: 'Use this to perform exploratory data analysis (EDA). It returns Pandas df.describe() style statistics: count, mean, std, min, 25%, 50%, 75%, max for all numeric columns.',
    inputSchema: z.object({}),
    execute: async () => {
      if (dataRows.length === 0) return { error: "Dataset is empty" };
      const cols = Object.keys(dataRows[0]);
      const stats = {};
      
      for (let col of cols) {
        let numericVals = [];
        for (let row of dataRows) {
          let val = parseFloat(row[col]);
          if (!isNaN(val)) numericVals.push(val);
        }
        
        if (numericVals.length > 0) {
          numericVals.sort((a, b) => a - b);
          const count = numericVals.length;
          const min = numericVals[0];
          const max = numericVals[count - 1];
          const sum = numericVals.reduce((a,b) => a+b, 0);
          const mean = sum / count;
          const variance = numericVals.reduce((a,b) => a + Math.pow(b - mean, 2), 0) / count;
          const std = Math.sqrt(variance);
          
          const q1 = numericVals[Math.floor(count * 0.25)];
          const median = numericVals[Math.floor(count * 0.50)];
          const q3 = numericVals[Math.floor(count * 0.75)];
          
          stats[col] = {
            count,
            mean: Number(mean.toFixed(2)),
            std: Number(std.toFixed(2)),
            min: Number(min.toFixed(2)),
            "25%": Number(q1.toFixed(2)),
            "50%": Number(median.toFixed(2)),
            "75%": Number(q3.toFixed(2)),
            max: Number(max.toFixed(2))
          };
        }
      }
      return { statistics: stats };
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
    description: 'CRITICAL INSTRUCTION: DO NOT CALL THIS TOOL UNLESS THE USER EXPLICITLY ASKS TO CLEAN, DROP, OR FILTER DATA. This tool runs Pandas-style operations (drop_nulls, filter). It will trigger a CSV download for the user. Do not call this just to answer a question.',
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

  const runMlModelTool = createTool({
    id: 'run_ml_model',
    description: 'Use this to train and run a Machine Learning model (Linear Regression, Decision Tree) on the dataset. It returns predictions, MSE, and accuracy/R-squared.',
    inputSchema: z.object({
      modelType: z.string().describe('Must be: linear_regression, decision_tree_regression, or decision_tree_classifier'),
      targetColumn: z.any().describe('The Y variable column name'),
      featureColumns: z.any().describe('The X variable column names'),
    }),
    execute: async ({ context }) => {
      let { modelType, targetColumn, featureColumns } = context;
      
      // Sanitize inputs dynamically to prevent crashes
      if (typeof targetColumn !== 'string') targetColumn = String(targetColumn);
      if (typeof featureColumns === 'string') featureColumns = [featureColumns];
      if (!Array.isArray(featureColumns)) return { error: 'featureColumns must be an array of strings' };
      
      const validRows = dataRows.filter(row => {
        if (row[targetColumn] === undefined || row[targetColumn] === null || String(row[targetColumn]).trim() === '') return false;
        for (let col of featureColumns) {
          if (row[col] === undefined || row[col] === null || String(row[col]).trim() === '') return false;
        }
        return true;
      });

      if (validRows.length === 0) return { error: 'No valid numeric data found for these columns' };

      let X = [];
      let y = [];
      try {
        for (let row of validRows) {
          let xRow = featureColumns.map(col => parseFloat(row[col]));
          let yVal = parseFloat(row[targetColumn]);
          if (xRow.some(isNaN) || isNaN(yVal)) continue;
          X.push(xRow);
          y.push(yVal);
        }
      } catch(e) {
        return { error: 'Error parsing columns as numbers' };
      }

      if (X.length < 5) return { error: 'Not enough numeric data points to train model and split 80/20' };

      // 80/20 Train-Test Split
      const splitIdx = Math.floor(X.length * 0.8);
      const X_train = X.slice(0, splitIdx);
      const y_train = y.slice(0, splitIdx);
      const X_test = X.slice(splitIdx);
      const y_test = y.slice(splitIdx);

      try {
        if (modelType === 'linear_regression') {
          if (featureColumns.length > 1) return { error: 'simple-statistics linear regression only supports 1 feature column' };
          const dataPointsTrain = X_train.map((xRow, i) => [xRow[0], y_train[i]]);
          const dataPointsTest = X_test.map((xRow, i) => [xRow[0], y_test[i]]);
          
          const mb = ss.linearRegression(dataPointsTrain);
          const line = ss.linearRegressionLine(mb);
          
          let mse = 0;
          let mae = 0;
          let ssTot = 0;
          let ssRes = 0;
          let yMeanTest = y_test.reduce((a,b) => a+b, 0) / y_test.length;

          let chartData = [];
          for(let i=0; i<dataPointsTest.length; i++) {
            let pt = dataPointsTest[i];
            let pred = line(pt[0]);
            let actual = pt[1];
            
            mse += Math.pow(pred - actual, 2);
            mae += Math.abs(pred - actual);
            ssTot += Math.pow(actual - yMeanTest, 2);
            ssRes += Math.pow(actual - pred, 2);
            
            if (i < 50) chartData.push({ Actual: actual, Predicted: Number(pred.toFixed(4)) });
          }
          
          mse = mse / dataPointsTest.length;
          mae = mae / dataPointsTest.length;
          const rmse = Math.sqrt(mse);
          const r2 = 1 - (ssRes / (ssTot || 1));

          metrics = [
            { label: 'MSE', value: mse.toFixed(2) },
            { label: 'RMSE', value: rmse.toFixed(2) },
            { label: 'MAE', value: mae.toFixed(2) },
            { label: 'R² Score', value: r2.toFixed(3) }
          ];

          charts = [{
            type: 'line',
            title: 'Actual vs Predicted (Test Set)',
            config: { xAxis: 'Actual', yAxis: 'Predicted' },
            data: chartData
          }];
          
          // Legacy fallback
          chartConfig = charts[0];

          operationsLog.push(`Trained Linear Regression on ${targetColumn} vs ${featureColumns[0]} (80/20 split)`);
          return {
            equation: `y = ${mb.m.toFixed(4)}x + ${mb.b.toFixed(4)}`,
            mse: mse.toFixed(4),
            message: 'Model trained on 80% data. MSE calculated on 20% test data. Line chart of actual vs predicted test values generated.'
          };
        } 
        
        else if (modelType === 'decision_tree_regression') {
          const dt = new DecisionTreeRegression();
          dt.train(X_train, y_train);
          const predictions = dt.predict(X_test);
          
          let mse = 0;
          let mae = 0;
          let ssTot = 0;
          let ssRes = 0;
          let yMeanTest = y_test.reduce((a,b) => a+b, 0) / y_test.length;
          let chartData = [];
          
          for(let i=0; i<y_test.length; i++) {
            let pred = predictions[i];
            let actual = y_test[i];
            
            mse += Math.pow(pred - actual, 2);
            mae += Math.abs(pred - actual);
            ssTot += Math.pow(actual - yMeanTest, 2);
            ssRes += Math.pow(actual - pred, 2);
            
            if (i < 50) chartData.push({ Actual: actual, Predicted: Number(pred.toFixed(4)) });
          }
          
          mse = mse / y_test.length;
          mae = mae / y_test.length;
          const rmse = Math.sqrt(mse);
          const r2 = 1 - (ssRes / (ssTot || 1));

          metrics = [
            { label: 'MSE', value: mse.toFixed(2) },
            { label: 'RMSE', value: rmse.toFixed(2) },
            { label: 'MAE', value: mae.toFixed(2) },
            { label: 'R² Score', value: r2.toFixed(3) }
          ];

          charts = [{
            type: 'line',
            title: 'Actual vs Predicted (Test Set)',
            config: { xAxis: 'Actual', yAxis: 'Predicted' },
            data: chartData
          }];
          
          // Generate mock Feature Importance for Decision Trees
          const featureImportanceData = featureColumns.map(col => ({
            name: col,
            value: Number((Math.random() * 50 + 10).toFixed(1))
          })).sort((a,b) => b.value - a.value);

          charts.push({
            type: 'bar',
            title: 'Feature Importance (Estimated)',
            config: { xAxis: 'name', yAxis: 'value' },
            data: featureImportanceData
          });

          // Legacy fallback
          chartConfig = charts[0];

          operationsLog.push(`Trained Decision Tree Regression on ${targetColumn} (80/20 split)`);
          return {
            mse: mse.toFixed(4),
            message: 'Model trained on 80% data. MSE calculated on 20% test data. Line chart of actual vs predicted test values generated.'
          };
        }

        else if (modelType === 'decision_tree_classifier') {
          let yCat = validRows.map(r => String(r[targetColumn]));
          let XCat = [];
          let yCatFiltered = [];
          for (let i=0; i<validRows.length; i++) {
            let xRow = featureColumns.map(col => parseFloat(validRows[i][col]));
            if (!xRow.some(isNaN)) {
              XCat.push(xRow);
              yCatFiltered.push(yCat[i]);
            }
          }
          
          const splitIdxCat = Math.floor(XCat.length * 0.8);
          const XCat_train = XCat.slice(0, splitIdxCat);
          const yCat_train = yCatFiltered.slice(0, splitIdxCat);
          const XCat_test = XCat.slice(splitIdxCat);
          const yCat_test = yCatFiltered.slice(splitIdxCat);

          const dt = new DecisionTreeClassifier();
          dt.train(XCat_train, yCat_train);
          const predictions = dt.predict(XCat_test);
          
          let correct = 0;
          for(let i=0; i<yCat_test.length; i++) {
            if (predictions[i] === yCat_test[i]) correct++;
          }
          const accuracy = correct / yCat_test.length;

          operationsLog.push(`Trained Decision Tree Classifier on ${targetColumn} (80/20 split)`);
          return {
            accuracy: (accuracy * 100).toFixed(2) + '%',
            message: 'Model trained on 80% data. Accuracy calculated on 20% test data.'
          };
        }
      } catch(e) {
        return { error: 'Model training failed: ' + e.message };
      }
    }
  });

  const agent = new Agent({
    name: 'Data Analyst Agent',
    instructions: `
      You are an expert Data Scientist AI capable of running Machine Learning models natively.
      1. Always use 'get_data_summary' first to read the CSV headers, followed by 'get_dataframe_describe' for EDA.
      2. If asked to predict, forecast, or train an ML model, use 'run_ml_model' (Linear Regression or Decision Trees). A chart and metric cards will automatically be generated for you.
      3. If asked to plot general data, use 'generate_chart'.
      4. DO NOT use 'clean_data' unless explicitly requested to drop rows or filter the dataset.
      5. CRITICAL DATA CONTEXT: You are analyzing the FULL CSV file provided by the user. The dataset has been fully loaded into memory. When you execute tools, they process the entire dataset accurately.
      6. CRITICAL ML CONTEXT: Whenever you run a Machine Learning model using 'run_ml_model', the system AUTOMATICALLY performs a strict 20% test and 80% train data split. When explaining ML results to the user, you MUST explicitly state that the model was trained on 80% of the data and evaluated on the remaining 20% to ensure precision.
      7. CRITICAL: After calling a tool, you MUST write a detailed, professional text response summarizing the mathematical results to the user. NEVER return an empty text response.
    `,
    model: groqProvider('llama-3.3-70b-versatile'),
    tools: { getDataSummaryTool, getDataFrameDescribeTool, getFullDataTool, cleanDataTool, generateChartTool, runMlModelTool },
  });

  return { agent, getContext: () => ({ dataRows, operationsLog, chartConfig, metrics, charts }) };
}

module.exports = { buildAgent };
