/**
 * End-to-End Tests
 * Tests cho full workflows và integration scenarios
 */

const request = require('supertest');
const CCCDSystem = require('../main');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('End-to-End Tests', () => {
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

    describe('Full API Workflow', () => {
        test('should complete full generate -> analyze -> batch analyze workflow', async () => {
            // Step 1: Generate CCCDs
            const generateResponse = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001', '079'],
                    gender: 'Nam',
                    birthYearRange: [1990, 2000],
                    quantity: 5
                })
                .expect(200);

            expect(generateResponse.body.success).toBe(true);
            expect(generateResponse.body.data).toHaveLength(5);

            const generatedCCCDs = generateResponse.body.data.map(item => item.cccd_number);

            // Step 2: Analyze individual CCCDs
            for (const cccd of generatedCCCDs) {
                const analyzeResponse = await request(app)
                    .post('/api/analyze-cccd')
                    .send({
                        cccd,
                        detailed: true,
                        location: true
                    })
                    .expect(200);

                expect(analyzeResponse.body.success).toBe(true);
                expect(analyzeResponse.body.data.valid).toBe(true);
                expect(analyzeResponse.body.data.cccd).toBe(cccd);
            }

            // Step 3: Batch analyze all generated CCCDs
            const batchResponse = await request(app)
                .post('/api/analyze-cccd/batch')
                .send({
                    cccdList: generatedCCCDs
                })
                .expect(200);

            expect(batchResponse.body.success).toBe(true);
            expect(batchResponse.body.data.totalAnalyzed).toBe(5);
            expect(batchResponse.body.data.validCount).toBe(5);
            expect(batchResponse.body.data.invalidCount).toBe(0);
        });

        test('should handle mixed valid/invalid CCCDs in batch workflow', async () => {
            // Generate some valid CCCDs
            const generateResponse = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001'],
                    quantity: 3
                })
                .expect(200);

            const validCCCDs = generateResponse.body.data.map(item => item.cccd_number);
            const mixedCCCDs = [...validCCCDs, 'invalid-cccd', '999999999999', ''];

            // Batch analyze mixed list
            const batchResponse = await request(app)
                .post('/api/analyze-cccd/batch')
                .send({
                    cccdList: mixedCCCDs
                })
                .expect(200);

            expect(batchResponse.body.success).toBe(true);
            expect(batchResponse.body.data.totalAnalyzed).toBe(6);
            expect(batchResponse.body.data.validCount).toBe(3);
            expect(batchResponse.body.data.invalidCount).toBe(3);
        });

        test('should handle large scale workflow', async () => {
            // Generate large number of CCCDs
            const generateResponse = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001', '079', '024', '031'],
                    quantity: 100
                })
                .expect(200);

            expect(generateResponse.body.success).toBe(true);
            expect(generateResponse.body.data).toHaveLength(100);

            const generatedCCCDs = generateResponse.body.data.map(item => item.cccd_number);

            // Batch analyze all
            const batchResponse = await request(app)
                .post('/api/analyze-cccd/batch')
                .send({
                    cccdList: generatedCCCDs
                })
                .expect(200);

            expect(batchResponse.body.success).toBe(true);
            expect(batchResponse.body.data.totalAnalyzed).toBe(100);
            expect(batchResponse.body.data.validCount).toBe(100);
            expect(batchResponse.body.data.invalidCount).toBe(0);

            // Verify statistics
            expect(batchResponse.body.data.summary).toBeDefined();
            expect(batchResponse.body.data.summary.mostCommonProvince).toBeDefined();
            expect(batchResponse.body.data.summary.genderDistribution).toBeDefined();
        });
    });

    describe('CLI to API Integration', () => {
        test('should generate via CLI and analyze via API', async () => {
            // Generate CCCDs via CLI
            const cliResult = await runCLICommand([
                'cli', 'generate',
                '-p', '001',
                '-g', 'Nữ',
                '-q', '3',
                '-o', 'cli_generated.json'
            ]);

            expect(cliResult.code).toBe(0);
            expect(cliResult.stdout).toContain('✅ Tạo CCCD thành công!');

            // Read generated file
            const outputFile = path.join(__dirname, '../output/cli_generated.json');
            expect(fs.existsSync(outputFile)).toBe(true);

            const generatedData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
            expect(generatedData).toHaveLength(3);

            const cccdNumbers = generatedData.map(item => item.cccd_number);

            // Analyze via API
            for (const cccd of cccdNumbers) {
                const response = await request(app)
                    .post('/api/analyze-cccd')
                    .send({
                        cccd,
                        detailed: true,
                        location: true
                    })
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.valid).toBe(true);
                expect(response.body.data.summary.gender).toBe('Nữ');
            }

            // Clean up
            fs.unlinkSync(outputFile);
        });

        test('should analyze via CLI and verify via API', async () => {
            const testCCCD = '001010101678';

            // Analyze via CLI
            const cliResult = await runCLICommand([
                'cli', 'analyze', testCCCD,
                '-d', '-l',
                '-o', 'cli_analysis.json'
            ]);

            expect(cliResult.code).toBe(0);
            expect(cliResult.stdout).toContain('✅ Phân tích CCCD thành công!');

            // Read CLI analysis result
            const outputFile = path.join(__dirname, '../output/cli_analysis.json');
            expect(fs.existsSync(outputFile)).toBe(true);

            const cliAnalysis = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

            // Analyze same CCCD via API
            const apiResponse = await request(app)
                .post('/api/analyze-cccd')
                .send({
                    cccd: testCCCD,
                    detailed: true,
                    location: true
                })
                .expect(200);

            expect(apiResponse.body.success).toBe(true);

            // Compare results
            expect(cliAnalysis.cccd).toBe(apiResponse.body.data.cccd);
            expect(cliAnalysis.valid).toBe(apiResponse.body.data.valid);
            expect(cliAnalysis.summary.provinceName).toBe(apiResponse.body.data.summary.provinceName);
            expect(cliAnalysis.summary.gender).toBe(apiResponse.body.data.summary.gender);

            // Clean up
            fs.unlinkSync(outputFile);
        });
    });

    describe('File-based Workflows', () => {
        test('should handle complete file-based batch workflow', async () => {
            // Create test file with CCCD list
            const testFile = path.join(__dirname, 'e2e_test_cccds.json');
            const testCCCDs = [
                '001010101678',
                '079010101678',
                '024010101678',
                '031010101678'
            ];
            fs.writeFileSync(testFile, JSON.stringify(testCCCDs));

            // Batch analyze via CLI
            const cliResult = await runCLICommand([
                'cli', 'batch-analyze', testFile,
                '-o', 'e2e_batch_result.json'
            ]);

            expect(cliResult.code).toBe(0);
            expect(cliResult.stdout).toContain('✅ Phân tích hàng loạt thành công!');

            // Read CLI result
            const outputFile = path.join(__dirname, '../output/e2e_batch_result.json');
            expect(fs.existsSync(outputFile)).toBe(true);

            const cliResultData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
            expect(cliResultData.totalAnalyzed).toBe(4);
            expect(cliResultData.validCount).toBe(4);

            // Verify via API batch analyze
            const apiResponse = await request(app)
                .post('/api/analyze-cccd/batch')
                .send({
                    cccdList: testCCCDs
                })
                .expect(200);

            expect(apiResponse.body.success).toBe(true);
            expect(apiResponse.body.data.totalAnalyzed).toBe(4);
            expect(apiResponse.body.data.validCount).toBe(4);

            // Compare results
            expect(cliResultData.totalAnalyzed).toBe(apiResponse.body.data.totalAnalyzed);
            expect(cliResultData.validCount).toBe(apiResponse.body.data.validCount);

            // Clean up
            fs.unlinkSync(testFile);
            fs.unlinkSync(outputFile);
        });

        test('should handle text file format workflow', async () => {
            // Create text file with CCCD list
            const testFile = path.join(__dirname, 'e2e_test_cccds.txt');
            const testCCCDs = [
                '001010101678',
                '079010101678',
                '024010101678'
            ];
            fs.writeFileSync(testFile, testCCCDs.join('\n'));

            // Batch analyze via CLI
            const cliResult = await runCLICommand([
                'cli', 'batch-analyze', testFile,
                '-f', 'table',
                '-o', 'e2e_text_result.json'
            ]);

            expect(cliResult.code).toBe(0);
            expect(cliResult.stdout).toContain('✅ Phân tích hàng loạt thành công!');

            // Read result
            const outputFile = path.join(__dirname, '../output/e2e_text_result.json');
            expect(fs.existsSync(outputFile)).toBe(true);

            const resultData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
            expect(resultData.totalAnalyzed).toBe(3);

            // Clean up
            fs.unlinkSync(testFile);
            fs.unlinkSync(outputFile);
        });
    });

    describe('Error Recovery Workflows', () => {
        test('should handle partial failure in batch workflow', async () => {
            const mixedCCCDs = [
                '001010101678', // Valid
                'invalid-cccd', // Invalid
                '079010101678', // Valid
                '999999999999', // Invalid
                '024010101678'  // Valid
            ];

            // Batch analyze via API
            const apiResponse = await request(app)
                .post('/api/analyze-cccd/batch')
                .send({
                    cccdList: mixedCCCDs
                })
                .expect(200);

            expect(apiResponse.body.success).toBe(true);
            expect(apiResponse.body.data.totalAnalyzed).toBe(5);
            expect(apiResponse.body.data.validCount).toBe(3);
            expect(apiResponse.body.data.invalidCount).toBe(2);

            // Verify individual analysis still works
            for (const cccd of mixedCCCDs) {
                const response = await request(app)
                    .post('/api/analyze-cccd')
                    .send({
                        cccd,
                        detailed: true
                    });

                if (cccd === '001010101678' || cccd === '079010101678' || cccd === '024010101678') {
                    expect(response.status).toBe(200);
                    expect(response.body.success).toBe(true);
                    expect(response.body.data.valid).toBe(true);
                } else {
                    expect(response.status).toBe(400);
                    expect(response.body.success).toBe(false);
                }
            }
        });

        test('should handle file corruption gracefully', async () => {
            // Create corrupted JSON file
            const corruptedFile = path.join(__dirname, 'corrupted_test.json');
            fs.writeFileSync(corruptedFile, '{"invalid": json content}');

            // Try to batch analyze via CLI
            const cliResult = await runCLICommand([
                'cli', 'batch-analyze', corruptedFile
            ]);

            expect(cliResult.code).toBe(1);
            expect(cliResult.stdout).toContain('❌ File không chứa danh sách CCCD hợp lệ') || 
                   expect(cliResult.stderr).toContain('❌ File không chứa danh sách CCCD hợp lệ');

            // Clean up
            fs.unlinkSync(corruptedFile);
        });
    });

    describe('Performance and Stress Workflows', () => {
        test('should handle concurrent API requests', async () => {
            const promises = [];
            const testCCCDs = [
                '001010101678',
                '079010101678',
                '024010101678',
                '031010101678',
                '048010101678'
            ];

            // Make concurrent analyze requests
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
            
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.valid).toBe(true);
            });
        });

        test('should handle mixed concurrent operations', async () => {
            const promises = [];

            // Mix of generate and analyze requests
            promises.push(
                request(app)
                    .post('/api/generate-cccd')
                    .send({
                        provinceCodes: ['001'],
                        quantity: 5
                    })
            );

            promises.push(
                request(app)
                    .post('/api/analyze-cccd')
                    .send({
                        cccd: '001010101678',
                        detailed: true
                    })
            );

            promises.push(
                request(app)
                    .get('/api/generate-cccd/options')
            );

            promises.push(
                request(app)
                    .get('/health')
            );

            const responses = await Promise.all(promises);
            
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });
        });
    });

    describe('Configuration and System Workflows', () => {
        test('should verify system configuration consistency', async () => {
            // Get config via CLI
            const cliConfigResult = await runCLICommand(['cli', 'config']);
            expect(cliConfigResult.code).toBe(0);

            // Get config via API
            const apiResponse = await request(app)
                .get('/api/generate-cccd/options')
                .expect(200);

            expect(apiResponse.body.success).toBe(true);
            expect(apiResponse.body.data.provinces).toBeDefined();
            expect(apiResponse.body.data.limits).toBeDefined();

            // Verify consistency
            const cliConfig = JSON.parse(cliConfigResult.stdout.split('\n📄 Chi tiết:\n')[1]);
            expect(cliConfig.config.totalProvinces).toBe(apiResponse.body.data.provinces.length);
        });

        test('should handle system health monitoring', async () => {
            // Check health via API
            const healthResponse = await request(app)
                .get('/health')
                .expect(200);

            expect(healthResponse.body.success).toBe(true);
            expect(healthResponse.body.status).toBe('healthy');
            expect(healthResponse.body.version).toBe('1.0.0');

            // Verify system is responsive
            const startTime = Date.now();
            await request(app).get('/health').expect(200);
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
        });
    });

    describe('Data Integrity Workflows', () => {
        test('should maintain data consistency across operations', async () => {
            // Generate CCCDs
            const generateResponse = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001'],
                    gender: 'Nam',
                    birthYearRange: [1990, 1995],
                    quantity: 10
                })
                .expect(200);

            const generatedCCCDs = generateResponse.body.data;

            // Verify all generated CCCDs are valid
            for (const cccdData of generatedCCCDs) {
                const analyzeResponse = await request(app)
                    .post('/api/analyze-cccd')
                    .send({
                        cccd: cccdData.cccd_number,
                        detailed: true
                    })
                    .expect(200);

                expect(analyzeResponse.body.data.valid).toBe(true);
                expect(analyzeResponse.body.data.summary.gender).toBe('Nam');
                expect(analyzeResponse.body.data.summary.provinceName).toBe('Hà Nội');
                
                // Verify birth year is in range
                const birthYear = parseInt(analyzeResponse.body.data.summary.birthDate.split('/')[2]);
                expect(birthYear).toBeGreaterThanOrEqual(1990);
                expect(birthYear).toBeLessThanOrEqual(1995);
            }

            // Batch analyze and verify consistency
            const batchResponse = await request(app)
                .post('/api/analyze-cccd/batch')
                .send({
                    cccdList: generatedCCCDs.map(item => item.cccd_number)
                })
                .expect(200);

            expect(batchResponse.body.data.totalAnalyzed).toBe(10);
            expect(batchResponse.body.data.validCount).toBe(10);
            expect(batchResponse.body.data.invalidCount).toBe(0);
        });

        test('should handle edge case CCCDs correctly', async () => {
            const edgeCaseCCCDs = [
                '001000000001', // Minimum values
                '001999999999', // Maximum values
                '001010100000', // Zero padding
                '001010199999'  // Maximum sequence
            ];

            for (const cccd of edgeCaseCCCDs) {
                const response = await request(app)
                    .post('/api/analyze-cccd')
                    .send({
                        cccd,
                        detailed: true,
                        location: true
                    });

                if (response.status === 200) {
                    expect(response.body.data.valid).toBe(true);
                    expect(response.body.data.summary.provinceName).toBe('Hà Nội');
                } else {
                    expect(response.status).toBe(400);
                    expect(response.body.success).toBe(false);
                }
            }
        });
    });
});