const pool = require('./db');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function migrate() {
  try {
    // First connect without database to create it if it doesn't exist
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'datawise_user',
      password: process.env.DB_PASSWORD || 'datawise_password'
    });
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'datawise'}\``);
    await tempConnection.end();

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
        file_name VARCHAR(255) NOT NULL,
        question TEXT NOT NULL,
        answer TEXT,
        chart_json JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    console.log('Database migrated successfully');
    connection.release();
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrate();
