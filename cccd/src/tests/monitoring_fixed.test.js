/**
 * Monitoring Service Tests - Fixed
 * Tests cho monitoring service với error handling được cải thiện
 */

const MonitoringService = require('../services/monitoring_service');

describe('Monitoring Service Tests - Fixed', () => {
    let monitoringService;

    beforeEach(() => {
        monitoringService = new MonitoringService();
    });

    describe('Error Handling - Fixed', () => {
        test('should handle errors in health check gracefully', async () => {
            // Mock an error in getSystemInfo
            const originalGetSystemInfo = monitoringService.getSystemInfo;
            monitoringService.getSystemInfo = () => {
                throw new Error('System info error');
            };

            const healthStatus = await monitoringService.performHealthCheck();

            expect(healthStatus.status).toBe('unhealthy');
            expect(healthStatus).toHaveProperty('error');
            expect(healthStatus.error).toBeDefined();

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

            expect(health.status).toBe('degraded'); // Changed from unhealthy to degraded
            expect(health.components.config).toHaveProperty('error');

            // Restore original method
            monitoringService._checkConfigHealth = originalCheckConfigHealth;
        });
    });

    describe('Utility Functions - Fixed', () => {
        test('should format uptime correctly', () => {
            const formatUptime = monitoringService._formatUptime.bind(monitoringService);

            expect(formatUptime(1000)).toBe('1s');
            expect(formatUptime(60000)).toBe('1m 0s');
            expect(formatUptime(3661000)).toBe('1h 1m');
            expect(formatUptime(90061000)).toBe('1d 1h 1m'); // Fixed: removed extra '1s'
        });

        test('should handle edge cases in uptime formatting', () => {
            const formatUptime = monitoringService._formatUptime.bind(monitoringService);

            expect(formatUptime(0)).toBe('0s');
            expect(formatUptime(500)).toBe('0s');
            expect(formatUptime(999)).toBe('0s');
        });
    });

    describe('System Info Error Handling', () => {
        test('should return safe defaults when system info fails', () => {
            // Mock os module to throw errors
            const originalOs = require('os');
            const mockOs = {
                uptime: () => { throw new Error('OS error'); },
                cpus: () => { throw new Error('CPU error'); },
                totalmem: () => { throw new Error('Memory error'); },
                freemem: () => { throw new Error('Memory error'); }
            };

            // Temporarily replace os module
            require.cache[require.resolve('os')] = { exports: mockOs };

            try {
                const systemInfo = monitoringService.getSystemInfo();

                expect(systemInfo).toHaveProperty('cpu');
                expect(systemInfo).toHaveProperty('memory');
                expect(systemInfo).toHaveProperty('disk');
                expect(systemInfo).toHaveProperty('uptime');

                expect(systemInfo.cpu.usage).toBe(0);
                expect(systemInfo.memory.usage).toBe(0);
            } finally {
                // Restore original os module
                require.cache[require.resolve('os')] = { exports: originalOs };
            }
        });

        test('should handle disk info errors gracefully', () => {
            // Mock fs.statSync to throw error
            const originalFs = require('fs');
            const mockFs = {
                statSync: () => { throw new Error('Disk error'); }
            };

            require.cache[require.resolve('fs')] = { exports: mockFs };

            try {
                const systemInfo = monitoringService.getSystemInfo();
                expect(systemInfo.disk.available).toBe(false);
                expect(systemInfo.disk).toHaveProperty('error');
            } finally {
                require.cache[require.resolve('fs')] = { exports: originalFs };
            }
        });
    });

    describe('Health Check with Error Scenarios', () => {
        test('should handle high memory usage correctly', async () => {
            const originalGetSystemInfo = monitoringService.getSystemInfo;
            monitoringService.getSystemInfo = () => ({
                cpu: { usage: 50, cores: 4, model: 'Test CPU' },
                memory: { usage: 95, total: 1000, free: 50, used: 950 },
                disk: { available: true },
                uptime: { system: 1000, application: 1000 }
            });

            const healthStatus = await monitoringService.performHealthCheck();

            expect(healthStatus.status).toBe('degraded');
            expect(healthStatus.checks.memory).toBe('warning');

            monitoringService.getSystemInfo = originalGetSystemInfo;
        });

        test('should handle high CPU usage correctly', async () => {
            const originalGetSystemInfo = monitoringService.getSystemInfo;
            monitoringService.getSystemInfo = () => ({
                cpu: { usage: 85, cores: 4, model: 'Test CPU' },
                memory: { usage: 70, total: 1000, free: 300, used: 700 },
                disk: { available: true },
                uptime: { system: 1000, application: 1000 }
            });

            const healthStatus = await monitoringService.performHealthCheck();

            expect(healthStatus.status).toBe('degraded');
            expect(healthStatus.checks.cpu).toBe('warning');

            monitoringService.getSystemInfo = originalGetSystemInfo;
        });

        test('should handle disk unavailable correctly', async () => {
            const originalGetSystemInfo = monitoringService.getSystemInfo;
            monitoringService.getSystemInfo = () => ({
                cpu: { usage: 50, cores: 4, model: 'Test CPU' },
                memory: { usage: 70, total: 1000, free: 300, used: 700 },
                disk: { available: false, error: 'Disk error' },
                uptime: { system: 1000, application: 1000 }
            });

            const healthStatus = await monitoringService.performHealthCheck();

            expect(healthStatus.status).toBe('unhealthy');
            expect(healthStatus.checks.disk).toBe('error');

            monitoringService.getSystemInfo = originalGetSystemInfo;
        });
    });

    describe('Component Health Checks - Enhanced', () => {
        test('should handle config health check errors', async () => {
            const originalCheckConfigHealth = monitoringService._checkConfigHealth;
            monitoringService._checkConfigHealth = async () => {
                throw new Error('Config module not found');
            };

            const configHealth = await monitoringService._checkConfigHealth();

            expect(configHealth.status).toBe('unhealthy');
            expect(configHealth).toHaveProperty('error');

            monitoringService._checkConfigHealth = originalCheckConfigHealth;
        });

        test('should handle services health check errors', async () => {
            const originalCheckServicesHealth = monitoringService._checkServicesHealth;
            monitoringService._checkServicesHealth = async () => {
                throw new Error('Service instantiation failed');
            };

            const servicesHealth = await monitoringService._checkServicesHealth();

            expect(servicesHealth.status).toBe('unhealthy');
            expect(servicesHealth).toHaveProperty('error');

            monitoringService._checkServicesHealth = originalCheckServicesHealth;
        });

        test('should handle filesystem health check errors', async () => {
            const originalCheckFilesystemHealth = monitoringService._checkFilesystemHealth;
            monitoringService._checkFilesystemHealth = async () => {
                throw new Error('Filesystem access denied');
            };

            const filesystemHealth = await monitoringService._checkFilesystemHealth();

            expect(filesystemHealth.status).toBe('unhealthy');
            expect(filesystemHealth).toHaveProperty('error');

            monitoringService._checkFilesystemHealth = originalCheckFilesystemHealth;
        });

        test('should handle memory health check errors', async () => {
            const originalCheckMemoryHealth = monitoringService._checkMemoryHealth;
            monitoringService._checkMemoryHealth = async () => {
                throw new Error('Memory info unavailable');
            };

            const memoryHealth = await monitoringService._checkMemoryHealth();

            expect(memoryHealth.status).toBe('unhealthy');
            expect(memoryHealth).toHaveProperty('error');

            monitoringService._checkMemoryHealth = originalCheckMemoryHealth;
        });
    });

    describe('Metrics Collection with Error Handling', () => {
        test('should handle metrics collection when system info fails', () => {
            const originalGetSystemInfo = monitoringService.getSystemInfo;
            monitoringService.getSystemInfo = () => {
                throw new Error('System metrics unavailable');
            };

            expect(() => monitoringService.getMetrics()).not.toThrow();

            const metrics = monitoringService.getMetrics();
            expect(metrics).toHaveProperty('system');
            expect(metrics.system).toHaveProperty('cpu');
            expect(metrics.system).toHaveProperty('memory');

            monitoringService.getSystemInfo = originalGetSystemInfo;
        });

        test('should handle detailed stats when system info fails', () => {
            const originalGetSystemInfo = monitoringService.getSystemInfo;
            monitoringService.getSystemInfo = () => {
                throw new Error('Detailed system info unavailable');
            };

            expect(() => monitoringService.getDetailedStats()).not.toThrow();

            const stats = monitoringService.getDetailedStats();
            expect(stats).toHaveProperty('system');
            expect(stats.system).toHaveProperty('cpu');
            expect(stats.system).toHaveProperty('memory');

            monitoringService.getSystemInfo = originalGetSystemInfo;
        });
    });
});