import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import authRoutes from '../routes/authRoutes.js';
import articleRoutes from '../routes/articleRoutes.js';
import notificationRoutes from '../routes/notificationRoutes.js';
import livekitRoutes from '../routes/livekitRoutes.js';
import uploadRoutes from '../routes/uploadRoutes.js';
import cleanupRoutes from '../routes/cleanupRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// CORS configuration - Allow all origins in production for Vercel
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.CLIENT_URL
    ].filter(Boolean);
    
    if (allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, ''))) || 
        origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in serverless for flexibility
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/api', (req, res) => {
  res.json({ message: 'XploreTechNews API is running', status: 'ok' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/livekit', livekitRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/cleanup', cleanupRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Export for Vercel serverless
export default app;
