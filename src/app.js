import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  optionsSuccessStatus: 200,
};
// console.log('corsOptions', corsOptions);
app.use(cors(corsOptions)); // Enable CORS for all routes
app.use(express.json({ limit: '16kb' })); // Parse JSON request bodies
app.use(cookieParser()); // Parse Cookie header and populate req.cookies
app.use(express.urlencoded({ extended: true, limit: '16kb' })); // Parse URL-encoded request bodies
app.use(express.static('public')); // Serve static files from the "public" directory

// Import routes
import userRoutes from './routes/user.routes.js';
import categoryRoutes from './routes/category.routes.js';
import addressRoutes from './routes/address.routes.js';
import agentRoutes from './routes/agent.routes.js';
import { sendSuccess, sendNotFound, sendError } from './utils/ApiResponse.js';

// API routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/category', categoryRoutes);
app.use('/api/v1/address', addressRoutes);
app.use('/api/v1/agents', agentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  return sendSuccess(res, 'Server is running', {
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Check if error is our custom ApiError
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      success: false,
      message: err.message,
      data: null,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Handle other errors
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    statusCode: statusCode,
    success: false,
    message: message,
    data: null,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  });
});

// 404 handler (must be after error handler)
app.use((req, res) => {
  return sendNotFound(res, `Route ${req.originalUrl} not found`);
});

export default app;
