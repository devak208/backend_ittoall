import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import deviceRoutes from './routes/deviceRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { cronService } from './services/cronService.js';
import chalk from 'chalk';



// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration  
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Replace with your actual domain
    : true, // Allow all origins in development for mobile testing
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware with colors
app.use((req, res, next) => {
  console.log(chalk.blue.bold('\n--- Incoming Request ---'));
  console.log(`${chalk.cyan(req.method)} ${chalk.white(req.originalUrl)}`);
  console.log(chalk.gray('Headers:'), JSON.stringify(req.headers, null, 2));
  console.log(chalk.gray('Query:'), JSON.stringify(req.query, null, 2));
  console.log(chalk.gray('Params:'), JSON.stringify(req.params, null, 2));
  console.log(chalk.gray('Body:'), JSON.stringify(req.body, null, 2));

  const oldSend = res.send;
  let responseBody;
  res.send = function (body) {
    responseBody = body;
    return oldSend.call(this, body);
  };

  res.on('finish', () => {
    const statusColor = res.statusCode >= 400 ? chalk.red : chalk.green;
    console.log(chalk.magenta.bold('--- Outgoing Response ---'));
    console.log('Status:', statusColor(res.statusCode));
    console.log('Response Body:', chalk.yellow(typeof responseBody === 'object' ? JSON.stringify(responseBody, null, 2) : responseBody));
    console.log(); // empty line for spacing
  });

  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Device Approval Service is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});


// API routes
app.use('/api/v1', deviceRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(` server is running in port : ${PORT}`);
  // Start cron jobs
  cronService.startAll();
});

export default app;
