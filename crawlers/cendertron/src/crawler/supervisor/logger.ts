import * as path from 'path';
import * as winston from 'winston';

const rootDir = path.join('/root', 'logs', 'cendertron');

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    // 生产环境下区分 Error 与其他
    new winston.transports.File({
      filename: path.join(rootDir, 'error.log'),
      level: 'error',
      handleExceptions: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(rootDir, 'combined.log'),
      handleExceptions: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// 开发环境下打印全部 Log
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      handleExceptions: true,
      format: winston.format.simple()
    })
  );
}
