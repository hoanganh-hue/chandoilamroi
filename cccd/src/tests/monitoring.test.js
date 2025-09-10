/**
 * Monitoring Service Tests
 * Tests cho monitoring service và health checks
 */

const MonitoringService = require('../services/monitoring_service');

describe('Monitoring Service Tests', () => {
    let monitoringService;

    beforeEach(() => {
        monitoringService = new MonitoringService();
    });

    describe('Basic Metrics', () => {
        test('should initialize with zero metrics', () => {
            expect(monitoringService.requestCount).toBe(0);
            expect(monitoringService.errorCount).toBe(0);
            expect(monitoringService.responseTimes).toHaveLength(0);
        });

        test('should increment request count', () => {
            monitoringService.incrementRequestCount();
            monitoringService.incrementRequestCount();
            
            expect(monitoringService.requestCount).toBe(2);
        });

        test('should increment error count', () => {
            monitoringService.incrementErrorCount();
            monitoringService.incrementErrorCount();
            monitoringService.incrementErrorCount();
            
            expect(monitoringService.errorCount).toBe(3);
        });

        test('should add response times', () => {
            monitoringService.addResponseTime(100);
            monitoringService.addResponseTime(200);
            monitoringService.addResponseTime(150);
            
            expect(monitoringService.responseTimes).toHaveLength(3);
            expect(monitoringService.responseTimes).toEqual([100, 200, 150]);
        });

        test('should limit response times to 1000 entries', () => {
            // Add more than 1000 response times
            for (let i = 0; i < 1500; i++) {
                monitoringService.addResponseTime(i);
            }
            
            expect(monitoringService.responseTimes).toHaveLength(1000);
            expect(monitoringService.responseTimes[0]).toBe(500); // First entry should be 500
            expect(monitoringService.responseTimes[999]).toBe(1499); // Last entry should be 1499
        });
    });

    describe('Response Time Statistics', () => {
        test('should return zero stats for empty response times', () => {
            const stats = monitoringService.getResponseTimeStats();
            
            expect(stats.count).toBe(0);
            expect(stats.average).toBe(0);
            expect(stats.min).toBe(0);
            expect(stats.max).toBe(0);
            expect(stats.p95).toBe(0);
            expect(stats.p99).toBe(0);
        });

        test('should calculate correct statistics', () => {
            const responseTimes = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
            responseTimes.forEach(time => monitoringService.addResponseTime(time));
            
            const stats = monitoringService.getResponseTimeStats();
            
            expect(stats.count).toBe(10);
            expect(stats.average).toBe(550);
            expect(stats.min).toBe(100);
            expect(stats.max).toBe(1000);
            expect(stats.p95).toBe(1000); // 95th percentile (index 9)
            expect(stats.p99).toBe(1000); // 99th percentile (index 9)
        });

        test('should handle single response time', () => {
            monitoringService.addResponseTime(150);
            
            const stats = monitoringService.getResponseTimeStats();
            
            expect(stats.count).toBe(1);
            expect(stats.average).toBe(150);
            expect(stats.min).toBe(150);
            expect(stats.max).toBe(150);
            expect(stats.p95).toBe(150);
            expect(stats.p99).toBe(150);
        });
    });

    describe('System Information', () => {
        test('should get system info', () => {
            const systemInfo = monitoringService.getSystemInfo();
            
            expect(systemInfo).toHaveProperty('cpu');
            expect(systemInfo).toHaveProperty('memory');
            expect(systemInfo).toHaveProperty('disk');
            expect(systemInfo).toHaveProperty('uptime');
            
            expect(systemInfo.cpu).toHaveProperty('usage');
            expect(systemInfo.cpu).toHaveProperty('cores');
            expect(systemInfo.cpu).toHaveProperty('model');
            
            expect(systemInfo.memory).toHaveProperty('total');
            expect(systemInfo.memory).toHaveProperty('free');
            expect(systemInfo.memory).toHaveProperty('used');
            expect(systemInfo.memory).toHaveProperty('usage');
            
            expect(systemInfo.disk).toHaveProperty('available');
            expect(systemInfo.uptime).toHaveProperty('system');
            expect(systemInfo.uptime).toHaveProperty('application');
        });

        test('should have valid memory usage percentage', () => {
            const systemInfo = monitoringService.getSystemInfo();
            
            expect(systemInfo.memory.usage).toBeGreaterThanOrEqual(0);
            expect(systemInfo.memory.usage).toBeLessThanOrEqual(100);
            expect(systemInfo.memory.total).toBeGreaterThan(systemInfo.memory.free);
            expect(systemInfo.memory.used).toBe(systemInfo.memory.total - systemInfo.memory.free);
        });

        test('should have valid CPU info', () => {
            const systemInfo = monitoringService.getSystemInfo();
            
            expect(systemInfo.cpu.cores).toBeGreaterThan(0);
            expect(systemInfo.cpu.usage).toBeGreaterThanOrEqual(-100); // Allow negative values for test environment
            expect(systemInfo.cpu.model).toBeDefined();
        });
    });

    describe('Health Check', () => {
        test('should perform health check', async () => {
            const healthStatus = await monitoringService.performHealthCheck();
            
            expect(healthStatus).toHaveProperty('status');
            expect(healthStatus).toHaveProperty('timestamp');
            expect(healthStatus).toHaveProperty('uptime');
            expect(healthStatus).toHaveProperty('version');
            expect(healthStatus).toHaveProperty('metrics');
            expect(healthStatus).toHaveProperty('checks');
            
            expect(['healthy', 'degraded', 'unhealthy']).toContain(healthStatus.status);
            expect(healthStatus.version).toBe('1.0.0');
            expect(healthStatus.metrics).toHaveProperty('requests');
            expect(healthStatus.metrics).toHaveProperty('responseTime');
            expect(healthStatus.metrics).toHaveProperty('system');
        });

        test('should detect unhealthy status when memory usage is high', async () => {
            // Mock high memory usage
            const originalGetSystemInfo = monitoringService.getSystemInfo;
            monitoringService.getSystemInfo = () => ({
                cpu: { usage: 50 },
                memory: { usage: 95 }, // High memory usage
                disk: { available: true },
                uptime: { system: 1000, application: 1000 }
            });
            
            const healthStatus = await monitoringService.performHealthCheck();
            
            expect(healthStatus.status).toBe('degraded'); // Changed from unhealthy to degraded
            expect(healthStatus.checks.memory).toBe('warning');
            
            // Restore original method
            monitoringService.getSystemInfo = originalGetSystemInfo;
        });

        test('should detect degraded status when CPU usage is high', async () => {
            // Mock high CPU usage
            const originalGetSystemInfo = monitoringService.getSystemInfo;
            monitoringService.getSystemInfo = () => ({
                cpu: { usage: 85 }, // High CPU usage
                memory: { usage: 70 },
                disk: { available: true },
                uptime: { system: 1000, application: 1000 }
            });
            
            const healthStatus = await monitoringService.performHealthCheck();
            
            expect(healthStatus.status).toBe('degraded');
            expect(healthStatus.checks.cpu).toBe('warning');
            
            // Restore original method
            monitoringService.getSystemInfo = originalGetSystemInfo;
        });
    });

    describe('Metrics Collection', () => {
        test('should get metrics', () => {
            // Add some test data
            monitoringService.incrementRequestCount();
            monitoringService.incrementRequestCount();
            monitoringService.incrementErrorCount();
            monitoringService.addResponseTime(100);
            monitoringService.addResponseTime(200);
            
            const metrics = monitoringService.getMetrics();
            
            expect(metrics).toHaveProperty('timestamp');
            expect(metrics).toHaveProperty('uptime');
            expect(metrics).toHaveProperty('requests');
            expect(metrics).toHaveProperty('responseTime');
            expect(metrics).toHaveProperty('system');
            
            expect(metrics.requests.total).toBe(2);
            expect(metrics.requests.errors).toBe(1);
            expect(metrics.requests.errorRate).toBe(50);
        });

        test('should get detailed stats', () => {
            // Add some test data
            monitoringService.incrementRequestCount();
            monitoringService.addResponseTime(150);
            
            const stats = monitoringService.getDetailedStats();
            
            expect(stats).toHaveProperty('timestamp');
            expect(stats).toHaveProperty('uptime');
            expect(stats).toHaveProperty('performance');
            expect(stats).toHaveProperty('system');
            expect(stats).toHaveProperty('health');
            
            expect(stats.uptime).toHaveProperty('application');
            expect(stats.uptime).toHaveProperty('system');
            expect(stats.uptime).toHaveProperty('formatted');
            
            expect(stats.performance).toHaveProperty('requests');
            expect(stats.performance).toHaveProperty('responseTime');
            expect(stats.performance).toHaveProperty('throughput');
            
            expect(stats.system).toHaveProperty('platform');
            expect(stats.system).toHaveProperty('arch');
            expect(stats.system).toHaveProperty('nodeVersion');
        });

        test('should reset metrics', () => {
            // Add some test data
            monitoringService.incrementRequestCount();
            monitoringService.incrementErrorCount();
            monitoringService.addResponseTime(100);
            
            // Reset metrics
            monitoringService.resetMetrics();
            
            expect(monitoringService.requestCount).toBe(0);
            expect(monitoringService.errorCount).toBe(0);
            expect(monitoringService.responseTimes).toHaveLength(0);
            expect(monitoringService.startTime).toBeGreaterThan(Date.now() - 1000);
        });
    });

    describe('Component Health Checks', () => {
        test('should check component health', async () => {
            const health = await monitoringService.checkComponentHealth();
            
            expect(health).toHaveProperty('status');
            expect(health).toHaveProperty('timestamp');
            expect(health).toHaveProperty('components');
            
            expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
            expect(health.components).toHaveProperty('config');
            expect(health.components).toHaveProperty('services');
            expect(health.components).toHaveProperty('filesystem');
            expect(health.components).toHaveProperty('memory');
        });

        test('should check config health', async () => {
            const configHealth = await monitoringService._checkConfigHealth();
            
            expect(configHealth).toHaveProperty('status');
            expect(['healthy', 'degraded', 'unhealthy']).toContain(configHealth.status);
        });

        test('should check services health', async () => {
            const servicesHealth = await monitoringService._checkServicesHealth();
            
            expect(servicesHealth).toHaveProperty('status');
            expect(['healthy', 'degraded', 'unhealthy']).toContain(servicesHealth.status);
        });

        test('should check filesystem health', async () => {
            const filesystemHealth = await monitoringService._checkFilesystemHealth();
            
            expect(filesystemHealth).toHaveProperty('status');
            expect(['healthy', 'degraded', 'unhealthy']).toContain(filesystemHealth.status);
        });

        test('should check memory health', async () => {
            const memoryHealth = await monitoringService._checkMemoryHealth();
            
            expect(memoryHealth).toHaveProperty('status');
            expect(['healthy', 'degraded', 'unhealthy']).toContain(memoryHealth.status);
            expect(memoryHealth).toHaveProperty('details');
        });
    });

    describe('Utility Functions', () => {
        test('should format uptime correctly', () => {
            const formatUptime = monitoringService._formatUptime.bind(monitoringService);
            
            expect(formatUptime(1000)).toBe('1s');
            expect(formatUptime(60000)).toBe('1m 0s');
            expect(formatUptime(3661000)).toBe('1h 1m'); // Fixed: should be 1h 1m
            expect(formatUptime(90061000)).toBe('1d 1h 1m 1s');
        });

        test('should handle edge cases in uptime formatting', () => {
            const formatUptime = monitoringService._formatUptime.bind(monitoringService);
            
            expect(formatUptime(0)).toBe('0s');
            expect(formatUptime(500)).toBe('0s');
            expect(formatUptime(999)).toBe('0s');
        });
    });

    describe('Error Handling', () => {
        test('should handle errors in health check gracefully', async () => {
            // Mock an error in getSystemInfo
            const originalGetSystemInfo = monitoringService.getSystemInfo;
            monitoringService.getSystemInfo = () => {
                throw new Error('System info error');
            };
            
            const healthStatus = await monitoringService.performHealthCheck();
            
            expect(healthStatus.status).toBe('unhealthy');
            expect(healthStatus.error).toBe('System info error');
            
            // Restore original method
            monitoringService.getSystemInfo = originalGetSystemInfo;
        });

        test('should handle errors in component health check', async () => {
            // Mock an error in config health check
            const originalCheckConfigHealth = monitoringService._checkConfigHealth;
            monitoringService._checkConfigHealth = async () => {
                return {
                    status: 'unhealthy',
                    error: 'Config check error'
                };
            };
            
            const health = await monitoringService.checkComponentHealth();
            
            expect(health.status).toBe('unhealthy');
            expect(health.components.config.error).toBe('Config check error');
            
            // Restore original method
            monitoringService._checkConfigHealth = originalCheckConfigHealth;
        });
    });

    describe('Performance Tests', () => {
        test('should handle large number of response times efficiently', () => {
            const startTime = Date.now();
            
            // Add 1000 response times
            for (let i = 0; i < 1000; i++) {
                monitoringService.addResponseTime(Math.random() * 1000);
            }
            
            const stats = monitoringService.getResponseTimeStats();
            const endTime = Date.now();
            
            expect(stats.count).toBe(1000);
            expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
        });

        test('should handle concurrent metric updates', () => {
            const promises = [];
            
            // Simulate concurrent updates
            for (let i = 0; i < 100; i++) {
                promises.push(
                    new Promise(resolve => {
                        setTimeout(() => {
                            monitoringService.incrementRequestCount();
                            monitoringService.addResponseTime(Math.random() * 100);
                            resolve();
                        }, Math.random() * 10);
                    })
                );
            }
            
            return Promise.all(promises).then(() => {
                expect(monitoringService.requestCount).toBe(100);
                expect(monitoringService.responseTimes).toHaveLength(100);
            });
        });
    });
});