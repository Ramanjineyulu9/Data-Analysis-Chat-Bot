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
    const { question, chatId } = req.body;
    const file = req.file;
    let fileContent = '';
    let fileName = 'No file provided';

    if (file) {
      fileContent = file.buffer.toString('utf-8');
      fileName = file.originalname;
    }

    const { agent, getContext } = buildAgent(fileContent);

    const connection = await pool.getConnection();
    const [historyRows] = await connection.query(
      'SELECT question, answer FROM analyses WHERE user_id = ? AND chat_id = ? ORDER BY created_at DESC LIMIT 5', 
      [userId, chatId || 'default']
    );

    const messages = [];
    for (let row of historyRows.reverse()) {
      messages.push({ role: 'user', content: row.question });
      messages.push({ role: 'assistant', content: row.answer });
    }
    
    messages.push({ role: 'user', content: question });

    const response = await agent.generate(messages);
    const answerText = response.text;

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

    const finalResult = {
      answer: answerText,
      chart: chartConfig || { type: 'none' },
      insights: [], 
      headData: headData,
      cleanedCsv: cleanedCsv
    };

    await connection.query(
      'INSERT INTO analyses (id, user_id, chat_id, file_name, question, answer, chart_json) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        crypto.randomUUID(), 
        userId, 
        chatId || 'default',
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
    // Fetch all, we will group them in frontend or backend
    const [rows] = await connection.query('SELECT * FROM analyses WHERE user_id = ? ORDER BY created_at ASC', [req.user.id]);
    connection.release();
    
    // Group by chat_id
    const grouped = {};
    rows.forEach(row => {
      const cid = row.chat_id || 'default';
      if (!grouped[cid]) {
        grouped[cid] = {
          chat_id: cid,
          title: row.question, // First question becomes title
          updated_at: row.created_at,
          messages: []
        };
      }
      grouped[cid].messages.push(row);
      grouped[cid].updated_at = row.created_at; // Update to latest
    });
    
    // Sort by updated_at DESC
    const sortedChats = Object.values(grouped).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    res.json(sortedChats);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch history' });
  }
});

module.exports = router;
