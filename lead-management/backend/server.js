// Load environment configurations before importing any other files
require('dotenv').config();

const app = require('./app');
const db = require('./src/database');
const logger = require('./src/config/logger');

const PORT = parseInt(process.env.PORT || '5000', 10);

let server;

// Verify Database connection before starting Express Server
const startServer = async () => {
  try {
    logger.info('Testing database connection...');
    const result = await db.query('SELECT NOW()');
    logger.info(`Database connection successful. Server time: ${result.rows[0].now}`);

    server = app.listen(PORT, () => {
      logger.info(`Application successfully started on port ${PORT} in [${process.env.NODE_ENV}] mode`);
    });
  } catch (error) {
    logger.error('Failed to initialize database connection. Exiting process...', error);
    process.exit(1);
  }
};

// Graceful shutdown sequence
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown sequence...`);
  
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await db.pool.end();
        logger.info('Database connection pool ended successfully.');
        process.exit(0);
      } catch (err) {
        logger.error('Error closing database connection pool', err);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

// Register system signals for graceful terminations
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Catch unhandled runtime events
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception occurred!', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection occurred!', reason);
  gracefulShutdown('unhandledRejection');
});

startServer();
