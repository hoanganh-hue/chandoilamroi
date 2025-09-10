/**
 * Monitoring Service
 * Service để monitoring hệ thống, health checks và metrics
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class MonitoringService {
    constructor() {
        this.startTime = Date.now();
        this.requestCount = 0;
        this.errorCount = 0;
        this.responseTimes = [];
        this.lastHealthCheck = Date.now();
        this.systemMetrics = {
            cpu: null,
            memory: null,
            disk: null,
            uptime: null
        };
    }

    /**
     * Tăng số lượng request
     */
    incrementRequestCount() {
        this.requestCount++;
    }

    /**
     * Tăng số lượng lỗi
     */
    incrementErrorCount() {
        this.errorCount++;
    }

    /**
     * Thêm thời gian response
     */
    addResponseTime(responseTime) {
        this.responseTimes.push(responseTime);

        // Giữ chỉ 1000 response times gần nhất
        if (this.responseTimes.length > 1000) {
            this.responseTimes = this.responseTimes.slice(-1000);
        }
    }

    /**
     * Lấy thống kê response time
     */
    getResponseTimeStats() {
        if (this.responseTimes.length === 0) {
            return {
                count: 0,
                average: 0,
                min: 0,
                max: 0,
                p95: 0,
                p99: 0
            };
        }

        const sorted = [...this.responseTimes].sort((a, b) => a - b);
        const count = sorted.length;
        const average = sorted.reduce((a, b) => a + b, 0) / count;
        const min = sorted[0];
        const max = sorted[count - 1];
        const p95Index = Math.floor(count * 0.95);
        const p99Index = Math.floor(count * 0.99);

        return {
            count,
            average: Math.round(average * 100) / 100,
            min,
            max,
            p95: sorted[p95Index] || 0,
            p99: sorted[p99Index] || 0
        };
    }

    /**
     * Lấy thông tin hệ thống
     */
    getSystemInfo() {
        try {
            const uptime = Date.now() - this.startTime;
            const systemUptime = os.uptime();

            // CPU usage (simplified)
            let cpuUsage = 0;
            let cpuInfo = { usage: 0, cores: 0, model: 'Unknown' };
            try {
                const cpus = os.cpus();
                cpuUsage = this._calculateCpuUsage(cpus);
                cpuInfo = {
                    usage: cpuUsage,
                    cores: cpus.length,
                    model: cpus[0]?.model || 'Unknown'
                };
            } catch (cpuError) {
                logger.warn('Failed to calculate CPU usage', { error: cpuError.message });
            }

            // Memory usage
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            const usedMemory = totalMemory - freeMemory;

            // Disk usage (simplified)
            let diskUsage = { available: false, error: 'Failed to get disk info' };
            try {
                diskUsage = this._getDiskUsage();
            } catch (diskError) {
                logger.warn('Failed to get disk usage', { error: diskError.message });
            }

            this.systemMetrics = {
                cpu: cpuInfo,
                memory: {
                    total: totalMemory,
                    free: freeMemory,
                    used: usedMemory,
                    usage: Math.round((usedMemory / totalMemory) * 100 * 100) / 100
                },
                disk: diskUsage,
                uptime: {
                    system: systemUptime,
                    application: uptime
                }
            };

            return this.systemMetrics;
        } catch (error) {
            logger.logError(error, { context: 'monitoring_service.getSystemInfo' });
            // Return safe default values
            return {
                cpu: { usage: 0, cores: 0, model: 'Unknown' },
                memory: { total: 0, free: 0, used: 0, usage: 0 },
                disk: { available: false, error: error.message },
                uptime: { system: 0, application: Date.now() - this.startTime }
            };
        }
    }

    /**
     * Tính CPU usage (simplified)
     */
    _calculateCpuUsage(cpus) {
        try {
            let totalIdle = 0;
            let totalTick = 0;

            cpus.forEach(cpu => {
                for (const type in cpu.times) {
                    totalTick += cpu.times[type];
                }
                totalIdle += cpu.times.idle;
            });

            return Math.round(100 - (100 * totalIdle / totalTick) * 100) / 100;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Lấy thông tin disk usage
     */
    _getDiskUsage() {
        try {
            const stats = fs.statSync(process.cwd());
            return {
                available: true,
                path: process.cwd(),
                lastModified: stats.mtime
            };
        } catch (error) {
            return {
                available: false,
                error: error.message
            };
        }
    }

    /**
     * Health check chi tiết
     */
    async performHealthCheck() {
        try {
            this.lastHealthCheck = Date.now();
            const systemInfo = this.getSystemInfo();
            const responseStats = this.getResponseTimeStats();

            const healthStatus = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: Date.now() - this.startTime,
                version: '1.0.0',
                metrics: {
                    requests: {
                        total: this.requestCount,
                        errors: this.errorCount,
                        errorRate: this.requestCount > 0 ?
                            Math.round((this.errorCount / this.requestCount) * 100 * 100) / 100 : 0
                    },
                    responseTime: responseStats,
                    system: systemInfo
                },
                checks: {
                    memory: systemInfo.memory.usage < 90 ? 'healthy' : 'warning',
                    cpu: systemInfo.cpu.usage < 80 ? 'healthy' : 'warning',
                    disk: systemInfo.disk.available ? 'healthy' : 'error',
                    uptime: 'healthy'
                }
            };

            // Determine overall status
            const checkValues = Object.values(healthStatus.checks);
            if (checkValues.includes('error')) {
                healthStatus.status = 'unhealthy';
            } else if (checkValues.includes('warning')) {
                healthStatus.status = 'degraded';
            }

            return healthStatus;
        } catch (error) {
            logger.logError(error, { context: 'monitoring_service.performHealthCheck' });
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message
            };
        }
    }

    /**
     * Lấy metrics cho monitoring
     */
    getMetrics() {
        const responseStats = this.getResponseTimeStats();
        const systemInfo = this.getSystemInfo();

        return {
            timestamp: new Date().toISOString(),
            uptime: Date.now() - this.startTime,
            requests: {
                total: this.requestCount,
                errors: this.errorCount,
                errorRate: this.requestCount > 0 ?
                    Math.round((this.errorCount / this.requestCount) * 100 * 100) / 100 : 0
            },
            responseTime: responseStats,
            system: {
                cpu: systemInfo.cpu,
                memory: systemInfo.memory,
                disk: systemInfo.disk
            }
        };
    }

    /**
     * Reset metrics
     */
    resetMetrics() {
        this.requestCount = 0;
        this.errorCount = 0;
        this.responseTimes = [];
        this.startTime = Date.now();
        logger.info('Metrics reset', { context: 'monitoring_service' });
    }

    /**
     * Lấy thống kê chi tiết
     */
    getDetailedStats() {
        const responseStats = this.getResponseTimeStats();
        const systemInfo = this.getSystemInfo();

        return {
            timestamp: new Date().toISOString(),
            uptime: {
                application: Date.now() - this.startTime,
                system: os.uptime(),
                formatted: this._formatUptime(Date.now() - this.startTime)
            },
            performance: {
                requests: {
                    total: this.requestCount,
                    errors: this.errorCount,
                    success: this.requestCount - this.errorCount,
                    errorRate: this.requestCount > 0 ?
                        Math.round((this.errorCount / this.requestCount) * 100 * 100) / 100 : 0
                },
                responseTime: responseStats,
                throughput: this.requestCount / ((Date.now() - this.startTime) / 1000) // requests per second
            },
            system: {
                platform: os.platform(),
                arch: os.arch(),
                nodeVersion: process.version,
                cpu: systemInfo.cpu,
                memory: systemInfo.memory,
                disk: systemInfo.disk
            },
            health: {
                lastCheck: this.lastHealthCheck,
                status: 'healthy'
            }
        };
    }

    /**
     * Format uptime
     */
    _formatUptime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Kiểm tra health của các components
     */
    async checkComponentHealth() {
        const checks = {
            config: await this._checkConfigHealth(),
            services: await this._checkServicesHealth(),
            filesystem: await this._checkFilesystemHealth(),
            memory: await this._checkMemoryHealth()
        };

        const overallHealth = Object.values(checks).every(check => check.status === 'healthy')
            ? 'healthy' : 'degraded';

        return {
            status: overallHealth,
            timestamp: new Date().toISOString(),
            components: checks
        };
    }

    /**
     * Kiểm tra health của config
     */
    async _checkConfigHealth() {
        try {
            const CCCDConfig = require('../config/cccd_config');
            const validation = CCCDConfig.validateConfig();

            return {
                status: validation.valid ? 'healthy' : 'degraded',
                details: validation
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    /**
     * Kiểm tra health của services
     */
    async _checkServicesHealth() {
        try {
            const CCCDGeneratorService = require('./cccd_generator_service');
            const CCCDAnalyzerService = require('./cccd_analyzer_service');

            // Test generator service
            const generator = new CCCDGeneratorService();
            const generatorTest = generator.generateCccdList(['001'], null, null, null, 1);

            // Test analyzer service
            const analyzer = new CCCDAnalyzerService();
            const analyzerTest = analyzer.analyzeCccdStructure('001010101678');

            return {
                status: 'healthy',
                details: {
                    generator: generatorTest.error ? 'error' : 'ok',
                    analyzer: analyzerTest.valid ? 'ok' : 'error'
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    /**
     * Kiểm tra health của filesystem
     */
    async _checkFilesystemHealth() {
        try {
            const outputDir = path.join(process.cwd(), 'output');
            const logsDir = path.join(process.cwd(), 'logs');

            // Check if directories exist and are writable
            const outputWritable = fs.existsSync(outputDir) ||
                (() => { try { fs.mkdirSync(outputDir, { recursive: true }); return true; } catch { return false; } })();

            const logsWritable = fs.existsSync(logsDir) ||
                (() => { try { fs.mkdirSync(logsDir, { recursive: true }); return true; } catch { return false; } })();

            return {
                status: (outputWritable && logsWritable) ? 'healthy' : 'degraded',
                details: {
                    output: outputWritable ? 'writable' : 'not writable',
                    logs: logsWritable ? 'writable' : 'not writable'
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    /**
     * Kiểm tra health của memory
     */
    async _checkMemoryHealth() {
        try {
            const systemInfo = this.getSystemInfo();
            const memoryUsage = systemInfo.memory.usage;

            let status = 'healthy';
            if (memoryUsage > 90) {
                status = 'unhealthy';
            } else if (memoryUsage > 80) {
                status = 'degraded';
            }

            return {
                status,
                details: {
                    usage: `${memoryUsage}%`,
                    total: `${Math.round(systemInfo.memory.total / 1024 / 1024)}MB`,
                    free: `${Math.round(systemInfo.memory.free / 1024 / 1024)}MB`
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }
}

module.exports = MonitoringService;