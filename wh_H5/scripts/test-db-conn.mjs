import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'topic_mall'
    });
    console.log('Successfully connected to MySQL');
    await connection.end();
  } catch (error) {
    console.error('Failed to connect to MySQL:', error.message);
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('Database topic_mall does not exist. Attempting to create it...');
      try {
        const rootConn = await mysql.createConnection({
          host: process.env.DB_HOST || '127.0.0.1',
          port: Number(process.env.DB_PORT || 3306),
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASS || ''
        });
        await rootConn.query('CREATE DATABASE IF NOT EXISTS topic_mall');
        console.log('Database topic_mall created successfully');
        await rootConn.end();
      } catch (createError) {
        console.error('Failed to create database:', createError.message);
      }
    }
  }
}

testConnection();
