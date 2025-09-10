/**
 * Logger Utility
 * Hệ thống logging cho ứng dụng CCCD
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

class Logger {
    constructor() {
        this.logDir = path.dirname('./logs/cccd_analysis.log');
        this.ensureLogDirectory();
        this.logger = this.createLogger();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    createLogger() {
        const logFormat = winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            winston.format.errors({ stack: true }),
            winston.format.json()
        );

        const consoleFormat = winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                let metaStr = '';
                if (Object.keys(meta).length > 0) {
                    metaStr = ` ${JSON.stringify(meta)}`;
                }
                return `${timestamp} [${level}]: ${message}${metaStr}`;
            })
        );

        return winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: logFormat,
            defaultMeta: { service: 'cccd-system' },
            transports: [
                new winston.transports.File({
                    filename: './logs/cccd_analysis.log',
                    maxsize: 10 * 1024 * 1024, // 10MB
                    maxFiles: 5,
                    tailable: true
                }),
                new winston.transports.File({
                    filename: './logs/cccd_error.log',
                    level: 'error',
                    maxsize: 10 * 1024 * 1024, // 10MB
                    maxFiles: 5,
                    tailable: true
                }),
                new winston.transports.Console({
                    format: consoleFormat
                })
            ],
            exceptionHandlers: [
                new winston.transports.File({
                    filename: './logs/cccd_exceptions.log'
                })
            ],
            rejectionHandlers: [
                new winston.transports.File({
                    filename: './logs/cccd_rejections.log'
                })
            ]
        });
    }

    info(message, meta = {}) {
        this.logger.info(message, meta);
    }

    error(message, meta = {}) {
        this.logger.error(message, meta);
    }

    warn(message, meta = {}) {
        this.logger.warn(message, meta);
    }

    debug(message, meta = {}) {
        this.logger.debug(message, meta);
    }

    logRequest(req, res, responseTime) {
        this.info('HTTP Request', {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`
        });
    }

    logError(error, context = {}) {
        this.error('Application Error', {
            message: error.message,
            stack: error.stack,
            context: context
        });
    }

    logCCCDOperation(operation, details) {
        this.info(`CCCD ${operation}`, details);
    }
}

module.exports = new Logger();
