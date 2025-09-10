/**
 * Performance Tests
 * Tests cho performance, load testing và stress testing
 */

const request = require('supertest');
const CCCDSystem = require('../main');
const { spawn } = require('child_process');
const path = require('path');

describe('Performance Tests', () => {
    let app;
    let server;
    let system;

    beforeAll(async () => {
        system = new CCCDSystem();
        await system.startAPIServer({ port: 0, host: 'localhost' });
        app = system.app;
        server = system.server;
    });

    afterAll(async () => {
        if (server) {
            await new Promise((resolve) => {
                server.close(resolve);
            });
        }
    });

    const runCLICommand = (args) => {
        return new Promise((resolve, reject) => {
            const mainScript = path.join(__dirname, '../main.js');
            const child = spawn('node', [mainScript, ...args], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                resolve({
                    code,
                    stdout,
                    stderr
                });
            });

            child.on('error', (error) => {
                reject(error);
            });
        });
    };

    describe('API Performance Tests', () => {
        test('should handle single CCCD generation within acceptable time', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001'],
                    quantity: 1
                })
                .expect(200);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(response.body.success).toBe(true);
            expect(duration).toBeLessThan(1000); // Should complete within 1 second
        });

        test('should handle medium batch generation efficiently', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001', '079', '024'],
                    quantity: 100
                })
                .expect(200);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(100);
            expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
        });

        test('should handle large batch generation efficiently', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001'],
                    quantity: 1000
                })
                .expect(200);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1000);
            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
        });

        test('should handle single CCCD analysis within acceptable time', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .post('/api/analyze-cccd')
                .send({
                    cccd: '001010101678',
                    detailed: true,
                    location: true
                })
                .expect(200);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(response.body.success).toBe(true);
            expect(duration).toBeLessThan(500); // Should complete within 500ms
        });

        test('should handle batch analysis efficiently', async () => {
            // Generate test CCCDs first
            const generateResponse = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001'],
                    quantity: 50
                })
                .expect(200);

            const testCCCDs = generateResponse.body.data.map(item => item.cccd_number);

            const startTime = Date.now();
            
            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send({
                    cccdList: testCCCDs
                })
                .expect(200);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalAnalyzed).toBe(50);
            expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
        });

        test('should handle large batch analysis efficiently', async () => {
            // Generate test CCCDs first
            const generateResponse = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001', '079', '024'],
                    quantity: 200
                })
                .expect(200);

            const testCCCDs = generateResponse.body.data.map(item => item.cccd_number);

            const startTime = Date.now();
            
            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send({
                    cccdList: testCCCDs
                })
                .expect(200);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalAnalyzed).toBe(200);
            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
        });
    });

    describe('Concurrent Load Tests', () => {
        test('should handle concurrent generation requests', async () => {
            const promises = [];
            const startTime = Date.now();

            // Make 10 concurrent generation requests
            for (let i = 0; i < 10; i++) {
                promises.push(
                    request(app)
                        .post('/api/generate-cccd')
                        .send({
                            provinceCodes: ['001'],
                            quantity: 10
                        })
                );
            }

            const responses = await Promise.all(promises);
            const endTime = Date.now();
            const duration = endTime - startTime;

            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(10);
            });

            expect(duration).toBeLessThan(10000); // All requests should complete within 10 seconds
        });

        test('should handle concurrent analysis requests', async () => {
            const testCCCDs = [
                '001010101678',
                '079010101678',
                '024010101678',
                '031010101678',
                '048010101678',
                '056010101678',
                '064010101678',
                '072010101678',
                '080010101678',
                '088010101678'
            ];

            const promises = [];
            const startTime = Date.now();

            // Make concurrent analysis requests
            for (const cccd of testCCCDs) {
                promises.push(
                    request(app)
                        .post('/api/analyze-cccd')
                        .send({
                            cccd,
                            detailed: true,
                            location: true
                        })
                );
            }

            const responses = await Promise.all(promises);
            const endTime = Date.now();
            const duration = endTime - startTime;

            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.valid).toBe(true);
            });

            expect(duration).toBeLessThan(5000); // All requests should complete within 5 seconds
        });

        test('should handle mixed concurrent operations', async () => {
            const promises = [];
            const startTime = Date.now();

            // Mix of different operations
            promises.push(
                request(app).post('/api/generate-cccd').send({
                    provinceCodes: ['001'],
                    quantity: 20
                })
            );

            promises.push(
                request(app).post('/api/analyze-cccd').send({
                    cccd: '001010101678',
                    detailed: true
                })
            );

            promises.push(
                request(app).get('/api/generate-cccd/options')
            );

            promises.push(
                request(app).get('/health')
            );

            promises.push(
                request(app).post('/api/generate-cccd').send({
                    provinceCodes: ['079'],
                    quantity: 15
                })
            );

            const responses = await Promise.all(promises);
            const endTime = Date.now();
            const duration = endTime - startTime;

            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            expect(duration).toBeLessThan(5000); // All operations should complete within 5 seconds
        });
    });

    describe('Memory Usage Tests', () => {
        test('should handle large data sets without memory issues', async () => {
            const initialMemory = process.memoryUsage();

            // Generate large dataset
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001'],
                    quantity: 1000
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1000);

            // Analyze large dataset
            const testCCCDs = response.body.data.map(item => item.cccd_number);
            const batchResponse = await request(app)
                .post('/api/analyze-cccd/batch')
                .send({
                    cccdList: testCCCDs
                })
                .expect(200);

            expect(batchResponse.body.success).toBe(true);

            const finalMemory = process.memoryUsage();
            const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

            // Memory increase should be reasonable (less than 100MB)
            expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
        });

        test('should handle multiple large operations without memory leaks', async () => {
            const initialMemory = process.memoryUsage();

            // Perform multiple large operations
            for (let i = 0; i < 5; i++) {
                const response = await request(app)
                    .post('/api/generate-cccd')
                    .send({
                        provinceCodes: ['001', '079', '024'],
                        quantity: 200
                    })
                    .expect(200);

                expect(response.body.success).toBe(true);

                const testCCCDs = response.body.data.map(item => item.cccd_number);
                const batchResponse = await request(app)
                    .post('/api/analyze-cccd/batch')
                    .send({
                        cccdList: testCCCDs
                    })
                    .expect(200);

                expect(batchResponse.body.success).toBe(true);
            }

            const finalMemory = process.memoryUsage();
            const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

            // Memory increase should be reasonable even after multiple operations
            expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024);
        });
    });

    describe('CLI Performance Tests', () => {
        test('should handle CLI generation efficiently', async () => {
            const startTime = Date.now();
            
            const result = await runCLICommand([
                'cli', 'generate',
                '-p', '001',
                '-q', '50'
            ]);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
        });

        test('should handle CLI analysis efficiently', async () => {
            const startTime = Date.now();
            
            const result = await runCLICommand([
                'cli', 'analyze', '001010101678',
                '-d', '-l'
            ]);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích CCCD thành công!');
            expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
        });

        test('should handle CLI batch analysis efficiently', async () => {
            // Create test file
            const fs = require('fs');
            const testFile = path.join(__dirname, 'perf_test_cccds.json');
            const testCCCDs = Array.from({ length: 100 }, (_, i) => 
                `001${String(i).padStart(9, '0')}678`
            );
            fs.writeFileSync(testFile, JSON.stringify(testCCCDs));

            const startTime = Date.now();
            
            const result = await runCLICommand([
                'cli', 'batch-analyze', testFile
            ]);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích hàng loạt thành công!');
            expect(duration).toBeLessThan(10000); // Should complete within 10 seconds

            // Clean up
            fs.unlinkSync(testFile);
        });
    });

    describe('Stress Tests', () => {
        test('should handle rapid sequential requests', async () => {
            const startTime = Date.now();

            // Make 50 rapid sequential requests
            for (let i = 0; i < 50; i++) {
                const response = await request(app)
                    .get('/health')
                    .expect(200);
                
                expect(response.body.success).toBe(true);
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(10000); // All requests should complete within 10 seconds
        });

        test('should handle burst requests', async () => {
            const promises = [];
            const startTime = Date.now();

            // Make 100 burst requests
            for (let i = 0; i < 100; i++) {
                promises.push(
                    request(app)
                        .get('/health')
                        .catch(err => err.response)
                );
            }

            const responses = await Promise.all(promises);
            const endTime = Date.now();
            const duration = endTime - startTime;

            // Most requests should succeed (some might be rate limited)
            const successCount = responses.filter(r => r && r.status === 200).length;
            expect(successCount).toBeGreaterThan(50); // At least 50% should succeed
            expect(duration).toBeLessThan(15000); // All requests should complete within 15 seconds
        });

        test('should handle sustained load', async () => {
            const startTime = Date.now();
            const promises = [];

            // Make requests for 30 seconds
            const makeRequest = () => {
                return request(app)
                    .post('/api/generate-cccd')
                    .send({
                        provinceCodes: ['001'],
                        quantity: 5
                    })
                    .catch(err => err.response);
            };

            // Start making requests
            const interval = setInterval(() => {
                promises.push(makeRequest());
            }, 100); // Every 100ms

            // Stop after 5 seconds (not 30 to keep test reasonable)
            setTimeout(() => {
                clearInterval(interval);
            }, 5000);

            // Wait for all requests to complete
            await new Promise(resolve => setTimeout(resolve, 6000));

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Check results
            const responses = await Promise.all(promises);
            const successCount = responses.filter(r => r && r.status === 200).length;
            const totalRequests = responses.length;

            expect(totalRequests).toBeGreaterThan(40); // Should have made many requests
            expect(successCount).toBeGreaterThan(totalRequests * 0.8); // At least 80% should succeed
            expect(duration).toBeLessThan(7000); // Should complete within 7 seconds
        });
    });

    describe('Response Time Benchmarks', () => {
        test('should meet response time requirements for health check', async () => {
            const measurements = [];

            // Measure 10 health check requests
            for (let i = 0; i < 10; i++) {
                const startTime = Date.now();
                await request(app).get('/health').expect(200);
                const endTime = Date.now();
                measurements.push(endTime - startTime);
            }

            const avgResponseTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
            const maxResponseTime = Math.max(...measurements);

            expect(avgResponseTime).toBeLessThan(100); // Average should be under 100ms
            expect(maxResponseTime).toBeLessThan(500); // Max should be under 500ms
        });

        test('should meet response time requirements for generation', async () => {
            const measurements = [];

            // Measure 5 generation requests
            for (let i = 0; i < 5; i++) {
                const startTime = Date.now();
                await request(app)
                    .post('/api/generate-cccd')
                    .send({
                        provinceCodes: ['001'],
                        quantity: 10
                    })
                    .expect(200);
                const endTime = Date.now();
                measurements.push(endTime - startTime);
            }

            const avgResponseTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
            const maxResponseTime = Math.max(...measurements);

            expect(avgResponseTime).toBeLessThan(1000); // Average should be under 1 second
            expect(maxResponseTime).toBeLessThan(2000); // Max should be under 2 seconds
        });

        test('should meet response time requirements for analysis', async () => {
            const measurements = [];

            // Measure 10 analysis requests
            for (let i = 0; i < 10; i++) {
                const startTime = Date.now();
                await request(app)
                    .post('/api/analyze-cccd')
                    .send({
                        cccd: '001010101678',
                        detailed: true,
                        location: true
                    })
                    .expect(200);
                const endTime = Date.now();
                measurements.push(endTime - startTime);
            }

            const avgResponseTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
            const maxResponseTime = Math.max(...measurements);

            expect(avgResponseTime).toBeLessThan(200); // Average should be under 200ms
            expect(maxResponseTime).toBeLessThan(500); // Max should be under 500ms
        });
    });
});