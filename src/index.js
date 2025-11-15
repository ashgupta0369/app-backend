import app from './app.js';
import dotenv from 'dotenv';
import { connectDB, initializeModels } from './db/index.js';
dotenv.config();

const PORT = process.env.PORT || 3001;

// Initialize database connection and start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize model relationships
    await initializeModels();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();