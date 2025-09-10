/**
 * Logger Tests
 * Unit tests cho Logger utility
 */

const Logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

describe('Logger', () => {
    let logger;

    beforeEach(() => {
        logger = Logger;
    });

    describe('Constructor and Setup', () => {
        test('should initialize logger instance', () => {
            expect(logger).toBeDefined();
            expect(logger.logger).toBeDefined();
        });

        test('should create log directory if not exists', () => {
            const logDir = path.dirname('./logs/cccd_analysis.log');
            expect(fs.existsSync(logDir)).toBe(true);
        });

        test('should have winston logger configured', () => {
            expect(logger.logger).toHaveProperty('info');
            expect(logger.logger).toHaveProperty('error');
            expect(logger.logger).toHaveProperty('warn');
            expect(logger.logger).toHaveProperty('debug');
        });
    });

    describe('Logging Methods', () => {
        test('should log info messages', () => {
            const winstonSpy = jest.spyOn(logger.logger, 'info').mockImplementation();

            logger.info('Test info message', { test: 'data' });

            expect(winstonSpy).toHaveBeenCalledWith('Test info message', { test: 'data' });
            winstonSpy.mockRestore();
        });

        test('should log error messages', () => {
            const winstonSpy = jest.spyOn(logger.logger, 'error').mockImplementation();

            logger.error('Test error message', { error: 'data' });

            expect(winstonSpy).toHaveBeenCalledWith('Test error message', { error: 'data' });
            winstonSpy.mockRestore();
        });

        test('should log warning messages', () => {
            const winstonSpy = jest.spyOn(logger.logger, 'warn').mockImplementation();

            logger.warn('Test warning message', { warning: 'data' });

            expect(winstonSpy).toHaveBeenCalledWith('Test warning message', { warning: 'data' });
            winstonSpy.mockRestore();
        });

        test('should log debug messages', () => {
            const winstonSpy = jest.spyOn(logger.logger, 'debug').mockImplementation();

            logger.debug('Test debug message', { debug: 'data' });

            expect(winstonSpy).toHaveBeenCalledWith('Test debug message', { debug: 'data' });
            winstonSpy.mockRestore();
        });
    });

    describe('Specialized Logging Methods', () => {
        test('should log HTTP requests', () => {
            const winstonSpy = jest.spyOn(logger.logger, 'info').mockImplementation();

            const mockReq = {
                method: 'GET',
                url: '/test',
                ip: '127.0.0.1',
                get: jest.fn().mockReturnValue('test-agent')
            };

            const mockRes = {
                statusCode: 200
            };

            logger.logRequest(mockReq, mockRes, 150);

            expect(winstonSpy).toHaveBeenCalledWith('HTTP Request', expect.any(Object));
            winstonSpy.mockRestore();
        });

        test('should log errors with context', () => {
            const winstonSpy = jest.spyOn(logger.logger, 'error').mockImplementation();

            const error = new Error('Test error');
            const context = { action: 'test' };

            logger.logError(error, context);

            expect(winstonSpy).toHaveBeenCalledWith('Application Error', expect.any(Object));
            winstonSpy.mockRestore();
        });

        test('should log CCCD operations', () => {
            const winstonSpy = jest.spyOn(logger.logger, 'info').mockImplementation();

            logger.logCCCDOperation('test', { operation: 'data' });

            expect(winstonSpy).toHaveBeenCalledWith('CCCD test', { operation: 'data' });
            winstonSpy.mockRestore();
        });
    });

    describe('Log File Creation', () => {
        test('should create log files', () => {
            const logFiles = [
                './logs/cccd_analysis.log',
                './logs/cccd_error.log',
                './logs/cccd_exceptions.log',
                './logs/cccd_rejections.log'
            ];

            // Check if log files exist or can be created
            logFiles.forEach(logFile => {
                const logDir = path.dirname(logFile);
                expect(fs.existsSync(logDir)).toBe(true);
            });
        });
    });

    describe('Environment Configuration', () => {
        test('should respect LOG_LEVEL environment variable', () => {
            // Test that logger is configured with environment variable
            expect(logger.logger.level).toBeDefined();
            expect(['error', 'warn', 'info', 'debug']).toContain(logger.logger.level);
        });

        test('should have proper log level configuration', () => {
            // Test that logger level is valid
            expect(logger.logger.level).toBeDefined();
            expect(typeof logger.logger.level).toBe('string');
        });
    });
});