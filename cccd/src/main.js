/**
 * Main Entry Point
 * Điểm vào chính của hệ thống CCCD Analysis & Generation
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Command } = require('commander');
const CCCDConfig = require('./config/cccd_config');
const logger = require('./utils/logger');
const generatorRoutes = require('./api/routes/generator');
const analyzerRoutes = require('./api/routes/analyzer');
const cliCommands = require('./cli/commands_new');

class CCCDSystem {
    constructor() {
        this.app = null;
        this.server = null;
        this.program = new Command();
        this.setupCLI();
    }

    setupCLI() {
        this.program
            .name('cccd-system')
            .description('Hệ thống phân tích và tạo CCCD theo quy định pháp luật Việt Nam')
            .version('1.0.0');

        // Add CLI commands as subcommands
        this.program.addCommand(cliCommands);

        // API mode
        this.program
            .command('api')
            .description('Chạy API server')
            .option('-p, --port <port>', 'Port cho API server', '3000')
            .option('-h, --host <host>', 'Host cho API server', 'localhost')
            .action(async(options) => {
                await this.startAPIServer(options);
            });

        // Default: show help
        this.program
            .command('*')
            .action(() => {
                this.program.help();
            });
    }

    async startAPIServer(options) {
        try {
            logger.info('Starting CCCD API Server', options);

            // Validate configuration
            const validation = CCCDConfig.validateConfig();
            if (!validation.valid) {
                logger.error('Configuration validation failed', validation.errors);
                console.error('❌ Cấu hình không hợp lệ:', validation.errors);
                process.exit(1);
            }

            if (validation.warnings.length > 0) {
                logger.warn('Configuration warnings', validation.warnings);
                validation.warnings.forEach(warning => console.warn('⚠️', warning));
            }

            // Create Express app
            this.app = express();

            // Security middleware
            this.app.use(helmet());
            this.app.use(cors({
                origin: CCCDConfig.SECURITY_CONFIG.allowed_origins,
                credentials: true
            }));

            // Rate limiting
            const limiter = rateLimit({
                windowMs: 60 * 1000, // 1 minute
                max: CCCDConfig.SECURITY_CONFIG.rate_limit_per_minute,
                message: {
                    success: false,
                    error: 'Quá nhiều yêu cầu, vui lòng thử lại sau'
                },
                standardHeaders: true,
                legacyHeaders: false
            });
            this.app.use('/api/', limiter);

            // Body parsing middleware
            this.app.use(express.json({ limit: '10mb' }));
            this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

            // Request logging middleware
            this.app.use((req, res, next) => {
                const start = Date.now();
                res.on('finish', () => {
                    const responseTime = Date.now() - start;
                    logger.logRequest(req, res, responseTime);
                });
                next();
            });

            // Health check endpoint
            this.app.get('/health', (req, res) => {
                res.json({
                    success: true,
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    version: '1.0.0',
                    config: CCCDConfig.getConfigSummary()
                });
            });

            // API routes
            this.app.use('/api', generatorRoutes);
            this.app.use('/api', analyzerRoutes);

            // Root endpoint
            this.app.get('/', (req, res) => {
                res.json({
                    success: true,
                    message: 'CCCD Analysis & Generation System',
                    version: '1.0.0',
                    endpoints: {
                        health: '/health',
                        generate: '/api/generate-cccd',
                        analyze: '/api/analyze-cccd',
                        options: '/api/generate-cccd/options',
                        structure: '/api/analyze-cccd/structure'
                    },
                    documentation: 'https://github.com/your-org/cccd-analysis-system',
                    legalBasis: CCCDConfig.getLegalBasis()
                });
            });

            // 404 handler
            this.app.use('*', (req, res) => {
                res.status(404).json({
                    success: false,
                    error: 'Endpoint không tồn tại',
                    availableEndpoints: [
                        'GET /',
                        'GET /health',
                        'POST /api/generate-cccd',
                        'POST /api/analyze-cccd',
                        'GET /api/generate-cccd/options',
                        'GET /api/analyze-cccd/structure'
                    ]
                });
            });

            // Error handling middleware
            this.app.use((error, req, res, _next) => {
                logger.logError(error, {
                    url: req.url,
                    method: req.method,
                    ip: req.ip
                });

                res.status(500).json({
                    success: false,
                    error: 'Lỗi hệ thống',
                    message: process.env.NODE_ENV === 'development' ? error.message : 'Vui lòng thử lại sau'
                });
            });

            // Start server
            const port = parseInt(options.port, 10);
            const host = options.host;

            this.server = this.app.listen(port, host, () => {
                console.log('🚀 CCCD API Server đã khởi động!');
                console.log(`📍 URL: http://${host}:${port}`);
                console.log(`📋 Health check: http://${host}:${port}/health`);
                console.log(`📚 API Documentation: http://${host}:${port}/`);
                console.log(`⚙️  Configuration: ${JSON.stringify(CCCDConfig.getConfigSummary(), null, 2)}`);

                logger.info('CCCD API Server started', {
                    host,
                    port,
                    config: CCCDConfig.getConfigSummary()
                });
            });

            // Graceful shutdown
            process.on('SIGTERM', () => this.gracefulShutdown());
            process.on('SIGINT', () => this.gracefulShutdown());

        } catch (error) {
            logger.logError(error, { action: 'startAPIServer' });
            console.error('❌ Lỗi khởi động API server:', error.message);
            process.exit(1);
        }
    }

    async gracefulShutdown() {
        logger.info('Graceful shutdown initiated');
        console.log('\n🛑 Đang tắt server...');

        if (this.server) {
            this.server.close(() => {
                logger.info('Server closed gracefully');
                console.log('✅ Server đã tắt thành công');
                process.exit(0);
            });

            // Force close after 10 seconds
            setTimeout(() => {
                logger.error('Force closing server after timeout');
                console.log('⚠️  Force closing server...');
                process.exit(1);
            }, 10000);
        } else {
            process.exit(0);
        }
    }

    async run() {
        try {
            // Parse command line arguments
            await this.program.parseAsync(process.argv);

            // If no command provided, show help
            if (process.argv.length <= 2) {
                this.program.help();
            }

        } catch (error) {
            logger.logError(error, { action: 'run' });
            console.error('❌ Lỗi hệ thống:', error.message);
            process.exit(1);
        }
    }
}

// Start the system
if (require.main === module) {
    const system = new CCCDSystem();
    system.run().catch(error => {
        console.error('❌ Lỗi khởi động hệ thống:', error.message);
        process.exit(1);
    });
}

module.exports = CCCDSystem;
