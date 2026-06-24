const pool = require('./db');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function migrate() {
  try {
    const connection = await pool.getConnection();

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        avatar VARCHAR(255),
        google_id VARCHAR(255) UNIQUE,
        plan ENUM('free', 'pro') DEFAULT 'free',
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        queries_this_month INT DEFAULT 0,
        last_reset_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS analyses (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        chat_id VARCHAR(255) DEFAULT 'default',
        file_name VARCHAR(255) NOT NULL,
        question TEXT NOT NULL,
        answer TEXT,
        chart_json JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Safely attempt to add chat_id if it doesn't exist (for existing databases)
    try {
      await connection.query("ALTER TABLE analyses ADD COLUMN chat_id VARCHAR(255) DEFAULT 'default'");
      console.log("Successfully added chat_id column to analyses table.");
    } catch (e) {
      console.log("chat_id alter table note:", e.message);
    }

    console.log('Database migrated successfully');
    connection.release();
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrate();
