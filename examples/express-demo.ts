import express from 'express';
import { Logger, LogLevel, ExpressAdapter } from '../src';

async function startServer() {
  // Initialize the logger with console-only output
  const logger = new Logger({
    level: LogLevel.DEBUG,
    logToFile: false,        // Disable file logging
    structured: true,        // Keep JSON structure for console
    colorize: true,         // Enable colors for better readability
    defaultContext: {
      service: 'express-demo',
      environment: 'development'
    },
    // Explicitly set rotation options to null/undefined when not logging to file
    rotationOptions: undefined
  });

  // Create Express app
  const app = express();

  // Initialize the logging adapter with security options
  const loggingAdapter = new ExpressAdapter({
    excludePaths: ['/health', '/metrics'],
    logBody: true,
    logHeaders: true,
    logQuery: true,
    sensitiveHeaders: [
      'authorization',
      'x-api-key',
      'cookie',
      'session-token'
    ],
    sensitiveBodyFields: [
      'password',
      'creditCard',
      'ssn',
      'token'
    ]
  });

  loggingAdapter.initialize(logger);

  // Middleware setup
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(loggingAdapter.middleware());

  // Simulated database operation
  async function simulateDbQuery(operation: string, delay: number = 1000): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, delay));
    if (Math.random() > 0.8) {
      throw new Error(`Database ${operation} failed`);
    }
    return { success: true };
  }

  // Health check endpoint (excluded from logging)
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
  });

  // Example of successful POST request with sensitive data
  app.post('/api/users', async (req, res) => {
    const reqLogger = req.context!.logger;
    
    try {
      const userData = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password, // Will be redacted in logs
        creditCard: req.body.creditCard // Will be redacted in logs
      };

      reqLogger.debug('Processing user registration', { username: userData.username });
      
      await reqLogger.time(
        'User registration completed',
        async () => await simulateDbQuery('user_creation', 1500),
        { operation: 'user_registration' }
      );

      reqLogger.info('User registered successfully', { 
        username: userData.username,
        email: userData.email 
      });

      res.status(201).json({ 
        success: true, 
        message: 'User registered successfully' 
      });
    } catch (error) {
      reqLogger.error('User registration failed', error as Error, {
        username: req.body.username
      });
      res.status(500).json({ 
        success: false, 
        message: 'Registration failed' 
      });
    }
  });

  // Example of error handling and logging
  app.get('/api/users/:id', async (req, res) => {
    const reqLogger = req.context!.logger.withContext({
      userId: req.params.id
    });

    try {
      reqLogger.debug('Fetching user details');
      
      const result = await reqLogger.time(
        'User fetch completed',
        async () => await simulateDbQuery('user_fetch'),
        { operation: 'user_fetch' }
      );

      res.json(result);
    } catch (error) {
      reqLogger.error('Failed to fetch user', error as Error, {
        userId: req.params.id
      });
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch user' 
      });
    }
  });

  // Example of request with query parameters
  app.get('/api/search', (req, res) => {
    const reqLogger = req.context!.logger;
    const { q, filter, token } = req.query; // token will be redacted

    reqLogger.info('Processing search request', {
      query: q,
      filter: filter
    });

    res.json({
      results: ['result1', 'result2'],
      query: q,
      filter: filter
    });
  });

  // Example of handling different HTTP methods
  app.all('/api/echo', (req, res) => {
    const reqLogger = req.context!.logger;
    
    reqLogger.info('Echo request received', {
      method: req.method,
      contentType: req.get('content-type')
    });

    res.json({
      method: req.method,
      headers: req.headers,
      query: req.query,
      body: req.body
    });
  });

  // Error handling middleware
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    req.context?.logger.error('Unhandled error', err, {
      path: req.path,
      method: req.method
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  });

  // Start the server
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    logger.info('Express demo server started', { port });
    console.log('\nDemo server is running on http://localhost:' + port);
    console.log('\nTry these example requests:');
    console.log('1. Create user (with redacted sensitive data):');
    console.log('   curl -X POST -H "Content-Type: application/json" -d \'{"username":"testuser","email":"test@example.com","password":"secret123","creditCard":"4111-1111-1111-1111"}\' http://localhost:3000/api/users');
    console.log('\n2. Fetch user (with simulated errors):');
    console.log('   curl http://localhost:3000/api/users/123');
    console.log('\n3. Search (with query params):');
    console.log('   curl "http://localhost:3000/api/search?q=test&filter=recent&token=secret"');
    console.log('\n4. Echo (test different HTTP methods):');
    console.log('   curl -X POST http://localhost:3000/api/echo -H "Authorization: Bearer secret-token" -H "Content-Type: application/json" -d \'{"test":"data"}\'');
    console.log('\nWatch the console for structured, colorized logs!\n');
  });
}

// Start the server and handle any errors
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});