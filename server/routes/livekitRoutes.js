import express from 'express';
import { AccessToken } from 'livekit-server-sdk';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'wss://your-livekit-server.livekit.cloud';

// @desc    Get LiveKit connection token
// @route   POST /api/livekit/token
// @access  Public
router.post('/token', async (req, res) => {
  try {
    const { roomName, participantName } = req.body;

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      return res.status(500).json({ 
        message: 'LiveKit credentials not configured',
        error: 'Missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET' 
      });
    }

    if (!roomName || !participantName) {
      return res.status(400).json({ 
        message: 'Room name and participant name are required' 
      });
    }

    // Create access token
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      ttl: '1h', // Token valid for 1 hour
    });

    // Grant permissions to the room
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    res.json({
      token,
      url: LIVEKIT_URL,
      roomName,
      participantName
    });
  } catch (error) {
    console.error('LiveKit token error:', error);
    res.status(500).json({ 
      message: 'Failed to generate token', 
      error: error.message 
    });
  }
});

// @desc    Get LiveKit server info
// @route   GET /api/livekit/info
// @access  Public
router.get('/info', (req, res) => {
  res.json({
    configured: !!(LIVEKIT_API_KEY && LIVEKIT_API_SECRET),
    url: LIVEKIT_URL
  });
});

export default router;
