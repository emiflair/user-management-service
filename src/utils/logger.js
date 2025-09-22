const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({ format: format.simple() }),
    new transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 5_000_000, maxFiles: 3 }),
    new transports.File({ filename: 'logs/combined.log', maxsize: 10_000_000, maxFiles: 5 }),
  ],
});

logger.http = (msg) => logger.log({ level: 'http', message: msg });

module.exports = logger;
