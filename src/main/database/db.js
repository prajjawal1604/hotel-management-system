// main/database/db.js
import { MongoClient, ServerApiVersion } from 'mongodb';

let db = null;
let client = null;

export const connectDB = async (connectionString) => {
  try {
    // Create a MongoClient with options
    client = new MongoClient(connectionString, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });

    // Connect to MongoDB
    await client.connect();
    
    // Verify connection with ping
    await client.db("admin").command({ ping: 1 });
    console.log("Connected successfully to MongoDB!");
    
    // Set the database to hms_db instead of hotel-management
    db = client.db('hms_db');  // Changed this line
    console.log('Connected to database:', db.databaseName);
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

export const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

export const closeDB = async () => {
  try {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
};