const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { checkAndIncrementUsage } = require('../lib/usage');
const multer = require('multer');
const crypto = require('crypto');
const pool = require('../lib/db');
const Papa = require('papaparse');
const { buildAgent } = require('../agentBuilder');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const rateLimitMap = new Map();

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  const userId = req.user.id;
  
  // Rate limiting
  const now = Date.now();
  const userRate = rateLimitMap.get(userId) || [];
  const recentRequests = userRate.filter(time => now - time < 60000);
  if (recentRequests.length >= 20) {
    return res.status(429).json({ error: 'Rate limit exceeded.' });
  }
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);

  // Check usage
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
    }

    // Initialize Mastra Agent with file data
    const { agent, getContext } = buildAgent(fileContent);

    // Fetch conversation history from MySQL for Agent Memory
    const connection = await pool.getConnection();
    const [historyRows] = await connection.query(
      'SELECT question, answer FROM analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 5', 
      [userId]
    );

    // Format Memory for Mastra
    const messages = [];
    // Reverse because we queried DESC (newest first), but we want chronological order
    for (let row of historyRows.reverse()) {
      messages.push({ role: 'user', content: row.question });
      messages.push({ role: 'assistant', content: row.answer });
    }
    
    // Add current question
    messages.push({ role: 'user', content: question });

    // Execute Agent Loop (Agent will call tools automatically)
    const response = await agent.generate(messages);
    const answerText = response.text;

    // Retrieve tool execution results
    const context = getContext();
    const { dataRows, operationsLog, chartConfig } = context;

    let headData = null;
    let cleanedCsv = null;

    if (dataRows && dataRows.length > 0) {
      headData = {
        columns: Object.keys(dataRows[0]),
        rows: dataRows.slice(0, 5).map(row => Object.values(row))
      };
    }

    if (operationsLog.length > 0) {
      cleanedCsv = Papa.unparse(dataRows);
    }

    // We no longer need the AI to format JSON! We build the response payload manually.
    const finalResult = {
      answer: answerText,
      chart: chartConfig || { type: 'none' },
      insights: [], // Machine Learning insights are now written directly into the answerText by the agent
      headData: headData,
      cleanedCsv: cleanedCsv
    };

    // Save to memory
    await connection.query(
      'INSERT INTO analyses (id, user_id, file_name, question, answer, chart_json) VALUES (?, ?, ?, ?, ?, ?)',
      [
        crypto.randomUUID(), 
        userId, 
        fileName, 
        question, 
        answerText, 
        chartConfig ? JSON.stringify(chartConfig) : null
      ]
    );
    connection.release();

    res.json(finalResult);

  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: 'Internal server error during analysis: ' + (error.message || error) });
  }
});

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
