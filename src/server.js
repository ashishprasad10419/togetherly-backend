const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const { initSocket } = require('./sockets');
const logger = require('./utils/logger');

async function start() {
  try {
    await connectDB();
    const server = http.createServer(app);
    initSocket(server);

    server.listen(env.port, () => {
      logger.info(`Togetherly API running on :${env.port} (${env.nodeEnv})`);
    });

    const shutdown = (signal) => {
      logger.warn(`Received ${signal}. Shutting down...`);
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (err) => logger.error('unhandledRejection', err));
    process.on('uncaughtException', (err) => logger.error('uncaughtException', err));
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
