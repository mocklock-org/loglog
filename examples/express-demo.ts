import express from 'express';
import { Logger, LogLevel, ExpressAdapter } from '../src';

// Initialize logger with environment-specific config
const logger = new Logger({
  environment: process.env.NODE_ENV || 'development',
  serverConfig: {
    enableConsole: true,
    enableFile: true,
    enableRemote: false,
    level: LogLevel.INFO,
    logDirectory: 'logs',
    structured: true,
    colorize: true,
    timestamp: true,
    labels: {
      app: 'express-demo'
    },
    rotationOptions: {
      maxSize: '10m',
      maxFiles: '7d',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true
    }
  }
});

// Create Express app with logging
const app = express();

// Setup logging adapter
const loggingAdapter = new ExpressAdapter({
  excludePaths: ['/health'],
  logBody: true,
  sensitiveHeaders: ['authorization'],
  sensitiveBodyFields: ['password']
});

loggingAdapter.initialize(logger);

// Add middleware
app.use(express.json());
app.use(loggingAdapter.middleware());

// Example routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  req.context?.logger.info('Login attempt', { username }); // password automatically redacted

  res.json({ success: true, username });
});

app.get('/api/users/:id', (req, res) => {
  const reqLogger = req.context!.logger.withContext({ userId: req.params.id });
  reqLogger.info('Fetching user');

  res.json({ id: req.params.id, name: 'Test User' });
});

// Start server
app.listen(3000, () => {
  logger.info('Server started', { port: 3000 });
});