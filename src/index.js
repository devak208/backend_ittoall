import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser'; // Add this import
import deviceRoutes from './routes/deviceRoutes.js';
import authRoutes from './routes/authRoutes.js';
import authCustomRoutes from './routes/authCustomRoutes.js';
import productRoutes from './routes/productRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { cronService } from './services/cronService.js';
import chalk from 'chalk';
import { EmailService } from './services/emailService.js';
// Import order routes
import orderRoutes from './routes/orderRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration  
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://192.168.90.56:3000',
    process.env.FRONTEND_URL
  ],
  credentials: true // This is important for cookies to work with CORS
}));

// Cookie parser middleware
app.use(cookieParser());

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
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    message: 'Device Approval Service is running',
    // ...existing code...
  });
});

// API routes
// API routes
app.use('/api/v1', deviceRoutes);
app.use('/api/v1/products', productRoutes);
// app.use('/api/auth', authRoutes); // Remove Better Auth handler
app.use('/api/v1/auth', authCustomRoutes); // Custom auth routes

// Use order routes
app.use('/api/v1/orders', orderRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, async () => {
  console.log(` server is running in port : ${PORT}`);
  
  // Test email configuration
  const emailService = new EmailService();
  await emailService.testEmailConnection();
  
  // Start cron jobs
  cronService.startAll();
});

export default app;
