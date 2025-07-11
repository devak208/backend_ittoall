import express from 'express';
import { auth } from '../lib/auth.js';

const router = express.Router();

// Handle all auth routes with Better Auth
router.all('/*', async (req, res) => {
  try {
    // Create a proper request object for Better Auth
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;
    
    const request = new Request(fullUrl, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });
    
    const response = await auth.handler(request);
    
    // Set the status code
    res.status(response.status || 200);
    
    // Set headers
    if (response.headers) {
      for (const [key, value] of response.headers.entries()) {
        res.setHeader(key, value);
      }
    }
    
    // Send the response
    const responseText = await response.text();
    
    if (responseText) {
      // Try to parse as JSON, if it fails send as text
      try {
        const jsonData = JSON.parse(responseText);
        res.json(jsonData);
      } catch {
        res.send(responseText);
      }
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Auth handler error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;
