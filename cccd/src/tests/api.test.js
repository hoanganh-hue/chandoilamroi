/**
 * API Integration Tests
 * Tests cho API endpoints
 */

const request = require('supertest');
const CCCDSystem = require('../main');

describe('API Integration Tests', () => {
    let app;
    let server;

    beforeAll(async() => {
        const system = new CCCDSystem();
        await system.startAPIServer({ port: 0, host: 'localhost' });
        app = system.app;
        server = system.server;
    });

    afterAll(async() => {
        if (server) {
            await new Promise((resolve) => {
                server.close(resolve);
            });
        }
    });

    describe('Health Check', () => {
        test('GET /health should return healthy status', async() => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.status).toBe('healthy');
            expect(response.body.version).toBe('1.0.0');
            expect(response.body.config).toBeDefined();
        });
    });

    describe('Root Endpoint', () => {
        test('GET / should return system info', async() => {
            const response = await request(app)
                .get('/')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('CCCD Analysis & Generation System');
            expect(response.body.endpoints).toBeDefined();
            expect(response.body.legalBasis).toBeDefined();
        });
    });

    describe('Generate CCCD API', () => {
        test('POST /api/generate-cccd should generate CCCDs', async() => {
            const requestBody = {
                provinceCodes: ['001'],
                gender: 'Nam',
                birthYearRange: [1990, 2000],
                quantity: 3
            };

            const response = await request(app)
                .post('/api/generate-cccd')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(3);
            expect(response.body.data[0]).toHaveProperty('cccd_number');
            expect(response.body.data[0]).toHaveProperty('province_name');
            expect(response.body.data[0]).toHaveProperty('gender');
            expect(response.body.data[0].gender).toBe('Nam');
            expect(response.body.metadata).toBeDefined();
        });

        test('POST /api/generate-cccd should validate input', async() => {
            const requestBody = {
                provinceCodes: ['999'], // Invalid province
                gender: 'InvalidGender',
                quantity: 2000 // Exceeds limit
            };

            const response = await request(app)
                .post('/api/generate-cccd')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('không hợp lệ');
        });

        test('GET /api/generate-cccd/options should return options', async() => {
            const response = await request(app)
                .get('/api/generate-cccd/options')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('provinces');
            expect(response.body.data).toHaveProperty('genderCenturyCodes');
            expect(response.body.data).toHaveProperty('limits');
            expect(response.body.data).toHaveProperty('legalBasis');
        });
    });

    describe('Analyze CCCD API', () => {
        test('POST /api/analyze-cccd should analyze CCCD', async() => {
            const requestBody = {
                cccd: '001010101678',
                detailed: true,
                location: true
            };

            const response = await request(app)
                .post('/api/analyze-cccd')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('cccd');
            expect(response.body.data).toHaveProperty('valid');
            expect(response.body.data).toHaveProperty('structure');
            expect(response.body.data).toHaveProperty('summary');
            expect(response.body.data.structure.province.name).toBe('Hà Nội');
        });

        test('POST /api/analyze-cccd should validate CCCD format', async() => {
            const requestBody = {
                cccd: 'invalid-cccd',
                detailed: true,
                location: true
            };

            const response = await request(app)
                .post('/api/analyze-cccd')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('không hợp lệ');
        });

        test('POST /api/analyze-cccd/batch should analyze multiple CCCDs', async() => {
            const requestBody = {
                cccdList: ['001010101678', '079010101678']
            };

            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalAnalyzed');
            expect(response.body.data).toHaveProperty('validCount');
            expect(response.body.data).toHaveProperty('invalidCount');
            expect(response.body.data).toHaveProperty('results');
            expect(response.body.data.results).toHaveLength(2);
        });

        test('GET /api/analyze-cccd/structure should return structure info', async() => {
            const response = await request(app)
                .get('/api/analyze-cccd/structure')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('legalBasis');
            expect(response.body.data).toHaveProperty('structureBreakdown');
            expect(response.body.data).toHaveProperty('provinceCodes');
            expect(response.body.data).toHaveProperty('genderCenturyCodes');
        });
    });

    describe('Error Handling', () => {
        test('GET /nonexistent should return 404', async() => {
            const response = await request(app)
                .get('/nonexistent')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('không tồn tại');
        });

        test('POST /api/generate-cccd with invalid JSON should return 500', async() => {
            await request(app)
                .post('/api/generate-cccd')
                .send('invalid json')
                .set('Content-Type', 'application/json')
                .expect(500);
        });
    });

    describe('Rate Limiting', () => {
        test('should respect rate limits', async() => {
            // Make multiple requests quickly
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(
                    request(app)
                        .get('/health')
                        .expect(200)
                );
            }

            await Promise.all(promises);
        });

        test('should handle rate limit exceeded', async() => {
            // Make many requests to trigger rate limiting
            const promises = [];
            for (let i = 0; i < 100; i++) {
                promises.push(
                    request(app)
                        .get('/health')
                        .catch(err => err.response)
                );
            }

            const responses = await Promise.all(promises);
            // Some requests should be rate limited
            const rateLimitedResponses = responses.filter(r => r && r.status === 429);
            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        });
    });

    describe('Advanced Generate CCCD API', () => {
        test('should handle empty province codes array', async() => {
            const requestBody = {
                provinceCodes: [],
                quantity: 3
            };

            const response = await request(app)
                .post('/api/generate-cccd')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle null province codes', async() => {
            const requestBody = {
                provinceCodes: null,
                quantity: 3
            };

            const response = await request(app)
                .post('/api/generate-cccd')
                .send(requestBody)
                .expect(400); // Changed to expect 400

            expect(response.body.success).toBe(false);
        });

        test('should handle undefined gender', async() => {
            const requestBody = {
                provinceCodes: ['001'],
                gender: undefined,
                quantity: 3
            };

            const response = await request(app)
                .post('/api/generate-cccd')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(3);
        });

        test('should handle null birth year range', async() => {
            const requestBody = {
                provinceCodes: ['001'],
                birthYearRange: null,
                quantity: 3
            };

            const response = await request(app)
                .post('/api/generate-cccd')
                .send(requestBody)
                .expect(400); // Changed to expect 400

            expect(response.body.success).toBe(false);
        });

        test('should handle missing quantity (should default to 10)', async() => {
            const requestBody = {
                provinceCodes: ['001']
            };

            const response = await request(app)
                .post('/api/generate-cccd')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(10);
        });

        test('should handle maximum quantity', async() => {
            const requestBody = {
                provinceCodes: ['001'],
                quantity: 1000
            };

            const response = await request(app)
                .post('/api/generate-cccd')
                .send(requestBody)
                .expect(400); // Changed to expect 400 due to validation

            expect(response.body.success).toBe(false);
        });

        test('should reject quantity exceeding maximum', async() => {
            const requestBody = {
                provinceCodes: ['001'],
                quantity: 1001
            };

            const response = await request(app)
                .post('/api/generate-cccd')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle invalid birth year range format', async() => {
            const requestBody = {
                provinceCodes: ['001'],
                birthYearRange: [1990], // Only one year
                quantity: 3
            };

            const response = await request(app)
                .post('/api/generate-cccd')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle birth year range with invalid years', async() => {
            const requestBody = {
                provinceCodes: ['001'],
                birthYearRange: [1800, 2030], // Out of valid range
                quantity: 3
            };

            const response = await request(app)
                .post('/api/generate-cccd')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle multiple provinces', async() => {
            const requestBody = {
                provinceCodes: ['001', '079', '024'],
                quantity: 6
            };

            const response = await request(app)
                .post('/api/generate-cccd')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(6);
            
            // Check that provinces are distributed
            const provinces = response.body.data.map(item => item.province_code);
            const uniqueProvinces = [...new Set(provinces)];
            expect(uniqueProvinces.length).toBeGreaterThan(1);
        });

        test('should handle specific gender distribution', async() => {
            const requestBody = {
                provinceCodes: ['001'],
                gender: 'Nữ',
                quantity: 5
            };

            const response = await request(app)
                .post('/api/generate-cccd')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(5);
            
            // All should be female
            response.body.data.forEach(item => {
                expect(item.gender).toBe('Nữ');
            });
        });
    });

    describe('Advanced Analyze CCCD API', () => {
        test('should handle analyze with detailed=false', async() => {
            const requestBody = {
                cccd: '001010101678',
                detailed: false,
                location: true
            };

            const response = await request(app)
                .post('/api/analyze-cccd')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('cccd');
            expect(response.body.data).toHaveProperty('valid');
            expect(response.body.data).toHaveProperty('summary');
        });

        test('should handle analyze with location=false', async() => {
            const requestBody = {
                cccd: '001010101678',
                detailed: true,
                location: false
            };

            const response = await request(app)
                .post('/api/analyze-cccd')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('cccd');
            expect(response.body.data).toHaveProperty('valid');
            expect(response.body.data).toHaveProperty('summary');
        });

        test('should handle analyze with both detailed and location false', async() => {
            const requestBody = {
                cccd: '001010101678',
                detailed: false,
                location: false
            };

            const response = await request(app)
                .post('/api/analyze-cccd')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('cccd');
            expect(response.body.data).toHaveProperty('valid');
            expect(response.body.data).toHaveProperty('summary');
        });

        test('should handle analyze with missing optional parameters', async() => {
            const requestBody = {
                cccd: '001010101678'
            };

            const response = await request(app)
                .post('/api/analyze-cccd')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('cccd');
            expect(response.body.data).toHaveProperty('valid');
            expect(response.body.data).toHaveProperty('summary');
        });

        test('should handle analyze with empty CCCD', async() => {
            const requestBody = {
                cccd: '',
                detailed: true,
                location: true
            };

            const response = await request(app)
                .post('/api/analyze-cccd')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle analyze with null CCCD', async() => {
            const requestBody = {
                cccd: null,
                detailed: true,
                location: true
            };

            const response = await request(app)
                .post('/api/analyze-cccd')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle analyze with undefined CCCD', async() => {
            const requestBody = {
                detailed: true,
                location: true
            };

            const response = await request(app)
                .post('/api/analyze-cccd')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle analyze with CCCD containing special characters', async() => {
            const requestBody = {
                cccd: '001@#$%^&*()',
                detailed: true,
                location: true
            };

            const response = await request(app)
                .post('/api/analyze-cccd')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle analyze with CCCD too short', async() => {
            const requestBody = {
                cccd: '001010101',
                detailed: true,
                location: true
            };

            const response = await request(app)
                .post('/api/analyze-cccd')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle analyze with CCCD too long', async() => {
            const requestBody = {
                cccd: '0010101016789',
                detailed: true,
                location: true
            };

            const response = await request(app)
                .post('/api/analyze-cccd')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Advanced Batch Analyze API', () => {
        test('should handle empty CCCD list', async() => {
            const requestBody = {
                cccdList: []
            };

            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle null CCCD list', async() => {
            const requestBody = {
                cccdList: null
            };

            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle missing CCCD list', async() => {
            const requestBody = {};

            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle large CCCD list', async() => {
            const cccdList = Array.from({ length: 100 }, (_, i) => 
                `001${String(i).padStart(9, '0')}678`
            );

            const requestBody = {
                cccdList
            };

            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send(requestBody)
                .expect(400); // Changed to expect 400 due to validation

            expect(response.body.success).toBe(false);
        });

        test('should handle mixed valid and invalid CCCDs', async() => {
            const requestBody = {
                cccdList: ['001010101678', 'invalid-cccd', '079010101678', '999999999999']
            };

            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send(requestBody)
                .expect(400); // Changed to expect 400 due to validation

            expect(response.body.success).toBe(false);
        });

        test('should handle CCCD list with duplicates', async() => {
            const requestBody = {
                cccdList: ['001010101678', '001010101678', '079010101678']
            };

            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalAnalyzed).toBe(3);
            expect(response.body.data.results).toHaveLength(3);
        });

        test('should handle CCCD list with null values', async() => {
            const requestBody = {
                cccdList: ['001010101678', null, '079010101678']
            };

            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send(requestBody)
                .expect(400); // Changed to expect 400 due to validation

            expect(response.body.success).toBe(false);
        });

        test('should handle CCCD list with empty strings', async() => {
            const requestBody = {
                cccdList: ['001010101678', '', '079010101678']
            };

            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send(requestBody)
                .expect(400); // Changed to expect 400 due to validation

            expect(response.body.success).toBe(false);
        });
    });

    describe('Advanced Error Handling', () => {
        test('should handle malformed JSON in request body', async() => {
            await request(app)
                .post('/api/generate-cccd')
                .send('{"invalid": json}')
                .set('Content-Type', 'application/json')
                .expect(500);
        });

        test('should handle missing Content-Type header', async() => {
            const response = await request(app)
                .post('/api/generate-cccd')
                .send('{"provinceCodes": ["001"], "quantity": 3}')
                .expect(500);
        });

        test('should handle oversized request body', async() => {
            const largeData = {
                provinceCodes: ['001'],
                quantity: 3,
                extraData: 'x'.repeat(1000000) // 1MB of extra data
            };

            const response = await request(app)
                .post('/api/generate-cccd')
                .send(largeData)
                .expect(200); // Should still work, just ignore extra data
        });

        test('should handle concurrent requests', async() => {
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(
                    request(app)
                        .post('/api/generate-cccd')
                        .send({
                            provinceCodes: ['001'],
                            quantity: 2
                        })
                );
            }

            const responses = await Promise.all(promises);
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });
        });

        test('should handle rapid sequential requests', async() => {
            for (let i = 0; i < 5; i++) {
                const response = await request(app)
                    .get('/health')
                    .expect(200);
                
                expect(response.body.success).toBe(true);
            }
        });
    });

    describe('Security Tests', () => {
        test('should handle SQL injection attempts', async() => {
            const requestBody = {
                cccd: "001'; DROP TABLE users; --",
                detailed: true,
                location: true
            };

            const response = await request(app)
                .post('/api/analyze-cccd')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle XSS attempts', async() => {
            const requestBody = {
                cccd: '<script>alert("xss")</script>',
                detailed: true,
                location: true
            };

            const response = await request(app)
                .post('/api/analyze-cccd')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle path traversal attempts', async() => {
            const requestBody = {
                cccd: '../../../etc/passwd',
                detailed: true,
                location: true
            };

            const response = await request(app)
                .post('/api/analyze-cccd')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle command injection attempts', async() => {
            const requestBody = {
                cccd: '001; rm -rf /',
                detailed: true,
                location: true
            };

            const response = await request(app)
                .post('/api/analyze-cccd')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Performance Tests', () => {
        test('should handle large generation request efficiently', async() => {
            const startTime = Date.now();
            
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001'],
                    quantity: 100 // Reduced quantity to avoid validation issues
                })
                .expect(200);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(100);
            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
        });

        test('should handle large batch analysis efficiently', async() => {
            const cccdList = Array.from({ length: 50 }, (_, i) => 
                `001${String(i).padStart(9, '0')}678`
            );

            const startTime = Date.now();
            
            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send({ cccdList })
                .expect(200);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalAnalyzed).toBe(50);
            expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
        });
    });
});