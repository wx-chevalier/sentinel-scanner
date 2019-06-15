import * as path from 'path';
import * as winston from 'winston';

const { createLogger, format, transports } = winston;

const formats = [
  format.label({
    label: path.basename(`${module.parent}/${module.filename}`)
  }),
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  format.printf(
    info =>
      `${info.label}[${info.level}]: ${info.timestamp} --- ${info.message}`
  )
];

export const logger = createLogger({
  level: 'info',
  format: format.combine(...formats),
  exitOnError: false,
  transports: [
    // 生产环境下区分 Error 与其他
    new transports.File({
      filename: path.resolve('logs/error.log'),
      level: 'error',
      handleExceptions: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new transports.File({
      filename: path.resolve('logs/info.log'),
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
      format: format.combine(...formats, format.colorize())
    })
  );
}
