const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { checkAndIncrementUsage } = require('../lib/usage');
const Groq = require('groq-sdk');
const Papa = require('papaparse');
const multer = require('multer');
const crypto = require('crypto');
const pool = require('../lib/db');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy_key',
});

// Basic rate limiting (in-memory for simplicity)
const rateLimitMap = new Map();

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  const userId = req.user.id;
  
  // Rate limiting: 20 req / min
  const now = Date.now();
  const userRate = rateLimitMap.get(userId) || [];
  const recentRequests = userRate.filter(time => now - time < 60000);
  if (recentRequests.length >= 20) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
  }
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);

  // Check usage limits
  const usageCheck = await checkAndIncrementUsage(userId);
  if (!usageCheck.allowed) {
    return res.status(403).json({ error: usageCheck.reason });
  }

  try {
    const { question } = req.body;
    const file = req.file;
    let fileContent = '';
    let fileName = 'No file provided';

    if (file) {
      fileContent = file.buffer.toString('utf-8');
      fileName = file.originalname;
      if (fileContent.length > 15000) {
        fileContent = fileContent.substring(0, 15000) + '\n...[Data Truncated due to size limits]...';
      }
    }

    const systemPrompt = `You are an expert Machine Learning Engineer and Data Scientist. Respond ONLY in valid JSON format: { "answer": "Detailed text with MSE values or regression metrics if requested", "chart": { "type": "bar/line/pie/area", "title": "Chart Title", "data": [{"name": "category", "value": 10}] }, "insights": ["insight 1"], "suggestedQuestions": ["q1"], "operations": [] }.
    
    CRITICAL INSTRUCTIONS:
    1. For the "chart" object: ALWAYS try to generate a graph if possible. Max 15 data points.
    2. For the "operations" array: MUST BE EMPTY [] unless the user explicitly asks to clean, filter, or remove duplicates. Do NOT clean data by default.
    3. If the user asks for Machine Learning metrics (MSE, Logistic Regression, etc.), calculate or estimate them based on the provided data sample and include the numbers in your "answer" and "insights".`;
    
    const userPrompt = `Here is the data (CSV format):\n${fileContent}\n\nQuestion: ${question}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });
    
    const responseText = completion.choices[0].message.content;
    
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText.substring(jsonStart, jsonEnd + 1));
    } catch (e) {
      console.error("Failed to parse Groq JSON", responseText);
      return res.status(500).json({ error: 'AI failed to return valid JSON' });
    }

    // Apply Operations and generate Head Data
    let headData = null;
    let cleanedCsv = null;

    if (file) {
      const fullFileContent = file.buffer.toString('utf-8');
      let parsed = Papa.parse(fullFileContent, { header: true, skipEmptyLines: true });
      let dataRows = parsed.data;
      let dataModified = false;

      const operations = parsedResponse.operations || [];
      for (let op of operations) {
        if (op.action === 'remove_duplicates') {
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
          dataModified = true;
        } else if (op.action === 'drop_missing') {
          const cols = op.columns || Object.keys(dataRows[0] || {});
          dataRows = dataRows.filter(row => {
            return cols.every(col => row[col] !== null && row[col] !== undefined && row[col] !== '');
          });
          dataModified = true;
        }
      }

      if (dataRows.length > 0) {
        headData = {
          columns: Object.keys(dataRows[0]),
          rows: dataRows.slice(0, 5).map(row => Object.values(row))
        };
      }

      if (dataModified) {
        cleanedCsv = Papa.unparse(dataRows);
      }
    }

    parsedResponse.headData = headData;
    parsedResponse.cleanedCsv = cleanedCsv;

    // Save history
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO analyses (id, user_id, file_name, question, answer, chart_json) VALUES (?, ?, ?, ?, ?, ?)',
      [
        crypto.randomUUID(), 
        userId, 
        fileName, 
        question, 
        parsedResponse.answer || 'No answer generated.', 
        parsedResponse.chart ? JSON.stringify(parsedResponse.chart) : null
      ]
    );
    connection.release();

    res.json(parsedResponse);

  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: 'Internal server error during analysis: ' + (error.message || error) });
  }
});

// Get History
router.get('/history', requireAuth, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM analyses WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch history' });
  }
});

module.exports = router;
