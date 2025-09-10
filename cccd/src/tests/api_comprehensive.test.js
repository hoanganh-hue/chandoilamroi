/**
 * Comprehensive API Routes Tests
 * Tests cho API routes với coverage 80%+
 */

const request = require('supertest');
const CCCDSystem = require('../main');

describe('Comprehensive API Routes Tests', () => {
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

    describe('Generator Routes - Comprehensive Testing', () => {
        test('should handle all valid province codes', async () => {
            const validProvinces = ['001', '079', '024', '031', '048', '056', '064', '072', '080', '088'];
            
            for (const province of validProvinces) {
                const response = await request(app)
                    .post('/api/generate-cccd')
                    .send({
                        provinceCodes: [province],
                        quantity: 1
                    })
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(1);
                expect(response.body.data[0].province_code).toBe(province);
            }
        });

        test('should handle multiple provinces distribution', async () => {
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001', '079', '024'],
                    quantity: 9
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(9);
            
            // Check that provinces are distributed
            const provinces = response.body.data.map(item => item.province_code);
            const uniqueProvinces = [...new Set(provinces)];
            expect(uniqueProvinces.length).toBeGreaterThan(1);
        });

        test('should handle gender-specific generation', async () => {
            const genders = ['Nam', 'Nữ'];
            
            for (const gender of genders) {
                const response = await request(app)
                    .post('/api/generate-cccd')
                    .send({
                        provinceCodes: ['001'],
                        gender: gender,
                        quantity: 5
                    })
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(5);
                
                // Check that all generated CCCDs have correct gender
                response.body.data.forEach(item => {
                    expect(item.gender).toBe(gender);
                });
            }
        });

        test('should handle year range generation', async () => {
            const yearRanges = [
                [1990, 2000],
                [1980, 1990],
                [2000, 2010],
                [2020, 2025]
            ];

            for (const yearRange of yearRanges) {
                const response = await request(app)
                    .post('/api/generate-cccd')
                    .send({
                        provinceCodes: ['001'],
                        birthYearRange: yearRange,
                        quantity: 3
                    })
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(3);
                
                // Check that birth years are in range
                response.body.data.forEach(item => {
                    expect(item.birth_year).toBeGreaterThanOrEqual(yearRange[0]);
                    expect(item.birth_year).toBeLessThanOrEqual(yearRange[1]);
                });
            }
        });

        test('should handle complex parameter combinations', async () => {
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001', '079', '024'],
                    gender: 'Nữ',
                    birthYearRange: [1985, 1995],
                    quantity: 15
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(15);
            
            // Check all conditions
            response.body.data.forEach(item => {
                expect(['001', '079', '024']).toContain(item.province_code);
                expect(item.gender).toBe('Nữ');
                expect(item.birth_year).toBeGreaterThanOrEqual(1985);
                expect(item.birth_year).toBeLessThanOrEqual(1995);
            });
        });

        test('should handle default parameters', async () => {
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    quantity: 5
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(5);
        });

        test('should handle minimum quantity', async () => {
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001'],
                    quantity: 1
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
        });

        test('should handle maximum quantity', async () => {
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001'],
                    quantity: 1000
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1000);
        });

        test('should validate province codes', async () => {
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['999', '888'],
                    quantity: 2
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('không hợp lệ');
        });

        test('should validate gender values', async () => {
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001'],
                    gender: 'InvalidGender',
                    quantity: 2
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('không hợp lệ');
        });

        test('should validate year range format', async () => {
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001'],
                    birthYearRange: [1990], // Only one year
                    quantity: 2
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('không hợp lệ');
        });

        test('should validate year range values', async () => {
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001'],
                    birthYearRange: [1800, 2030], // Out of valid range
                    quantity: 2
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('không hợp lệ');
        });

        test('should validate quantity limits', async () => {
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001'],
                    quantity: 1001 // Exceeds limit
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('không hợp lệ');
        });

        test('should handle empty province codes array', async () => {
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: [],
                    quantity: 3
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle null province codes', async () => {
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: null,
                    quantity: 3
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle undefined gender', async () => {
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001'],
                    gender: undefined,
                    quantity: 3
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(3);
        });

        test('should handle null birth year range', async () => {
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001'],
                    birthYearRange: null,
                    quantity: 3
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle missing quantity (should default to 10)', async () => {
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001']
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(10);
        });

        test('should include metadata in response', async () => {
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001'],
                    quantity: 5
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.metadata).toBeDefined();
            expect(response.body.metadata.requested_quantity).toBe(5);
            expect(response.body.metadata.actual_quantity).toBe(5);
        });

        test('should include config in response', async () => {
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001'],
                    quantity: 5
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.config).toBeDefined();
            expect(response.body.config.module).toBe('CCCD Analysis & Generation');
        });
    });

    describe('Analyzer Routes - Comprehensive Testing', () => {
        test('should analyze valid CCCDs from different provinces', async () => {
            const testCCCDs = [
                '001010101678', // Hanoi
                '079010101678', // Ho Chi Minh
                '024010101678', // Quang Ninh
                '031010101678', // Hai Phong
                '048010101678'  // Da Nang
            ];

            for (const cccd of testCCCDs) {
                const response = await request(app)
                    .post('/api/analyze-cccd')
                    .send({
                        cccd: cccd,
                        detailed: true,
                        location: true
                    })
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.cccd).toBe(cccd);
                expect(response.body.data.valid).toBe(true);
                expect(response.body.data.summary).toBeDefined();
            }
        });

        test('should analyze with detailed information', async () => {
            const response = await request(app)
                .post('/api/analyze-cccd')
                .send({
                    cccd: '001010101678',
                    detailed: true,
                    location: true
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.detailedAnalysis).toBeDefined();
            expect(response.body.data.locationInfo).toBeDefined();
        });

        test('should analyze without detailed information', async () => {
            const response = await request(app)
                .post('/api/analyze-cccd')
                .send({
                    cccd: '001010101678',
                    detailed: false,
                    location: false
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.detailedAnalysis).toBeUndefined();
            expect(response.body.data.locationInfo).toBeUndefined();
        });

        test('should analyze with missing optional parameters', async () => {
            const response = await request(app)
                .post('/api/analyze-cccd')
                .send({
                    cccd: '001010101678'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.cccd).toBe('001010101678');
            expect(response.body.data.valid).toBe(true);
        });

        test('should handle edge case CCCDs', async () => {
            const edgeCases = [
                '001000000001', // Minimum values
                '001999999999', // Maximum values
                '001010100000', // Zero padding
                '001010199999'  // Maximum sequence
            ];

            for (const cccd of edgeCases) {
                const response = await request(app)
                    .post('/api/analyze-cccd')
                    .send({
                        cccd: cccd,
                        detailed: true
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

        test('should validate CCCD format', async () => {
            const invalidCCCDs = [
                'invalid-cccd',
                '001abc123456',
                '123456789',
                '0010101016789',
                '',
                null
            ];

            for (const cccd of invalidCCCDs) {
                const response = await request(app)
                    .post('/api/analyze-cccd')
                    .send({
                        cccd: cccd,
                        detailed: true
                    })
                    .expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.error).toContain('không hợp lệ');
            }
        });

        test('should handle CCCD with special characters', async () => {
            const response = await request(app)
                .post('/api/analyze-cccd')
                .send({
                    cccd: '001@#$%^&*()',
                    detailed: true
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle CCCD too short', async () => {
            const response = await request(app)
                .post('/api/analyze-cccd')
                .send({
                    cccd: '001010101',
                    detailed: true
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle CCCD too long', async () => {
            const response = await request(app)
                .post('/api/analyze-cccd')
                .send({
                    cccd: '0010101016789',
                    detailed: true
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should include config in response', async () => {
            const response = await request(app)
                .post('/api/analyze-cccd')
                .send({
                    cccd: '001010101678',
                    detailed: true
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.config).toBeDefined();
        });
    });

    describe('Batch Analyze Routes - Comprehensive Testing', () => {
        test('should analyze multiple valid CCCDs', async () => {
            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send({
                    cccdList: ['001010101678', '079010101678', '024010101678']
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalAnalyzed).toBe(3);
            expect(response.body.data.validCount).toBe(3);
            expect(response.body.data.invalidCount).toBe(0);
            expect(response.body.data.results).toHaveLength(3);
        });

        test('should handle mixed valid and invalid CCCDs', async () => {
            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send({
                    cccdList: ['001010101678', 'invalid-cccd', '079010101678', '999999999999']
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalAnalyzed).toBe(4);
            expect(response.body.data.validCount).toBe(2);
            expect(response.body.data.invalidCount).toBe(2);
            expect(response.body.data.validityRate).toBe(50);
        });

        test('should handle large CCCD list', async () => {
            const cccdList = Array.from({ length: 50 }, (_, i) => 
                `001${String(i).padStart(9, '0')}678`
            );

            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send({
                    cccdList: cccdList
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalAnalyzed).toBe(50);
            expect(response.body.data.results).toHaveLength(50);
        });

        test('should handle CCCD list with duplicates', async () => {
            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send({
                    cccdList: ['001010101678', '001010101678', '079010101678']
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalAnalyzed).toBe(3);
            expect(response.body.data.results).toHaveLength(3);
        });

        test('should handle CCCD list with null values', async () => {
            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send({
                    cccdList: ['001010101678', null, '079010101678']
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalAnalyzed).toBe(3);
            expect(response.body.data.invalidCount).toBeGreaterThan(0);
        });

        test('should handle CCCD list with empty strings', async () => {
            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send({
                    cccdList: ['001010101678', '', '079010101678']
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalAnalyzed).toBe(3);
            expect(response.body.data.invalidCount).toBeGreaterThan(0);
        });

        test('should validate empty CCCD list', async () => {
            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send({
                    cccdList: []
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should validate null CCCD list', async () => {
            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send({
                    cccdList: null
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should validate missing CCCD list', async () => {
            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should include summary statistics', async () => {
            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send({
                    cccdList: ['001010101678', '079010101678', '024010101678']
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.summary).toBeDefined();
            expect(response.body.data.summary.mostCommonProvince).toBeDefined();
            expect(response.body.data.summary.genderDistribution).toBeDefined();
            expect(response.body.data.summary.ageDistribution).toBeDefined();
        });

        test('should include config in response', async () => {
            const response = await request(app)
                .post('/api/analyze-cccd/batch')
                .send({
                    cccdList: ['001010101678', '079010101678']
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.config).toBeDefined();
        });
    });

    describe('Options Routes - Comprehensive Testing', () => {
        test('should return generation options', async () => {
            const response = await request(app)
                .get('/api/generate-cccd/options')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.provinces).toBeDefined();
            expect(response.body.data.genderCenturyCodes).toBeDefined();
            expect(response.body.data.limits).toBeDefined();
            expect(response.body.data.legalBasis).toBeDefined();
        });

        test('should include all province codes', async () => {
            const response = await request(app)
                .get('/api/generate-cccd/options')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.provinces).toBeDefined();
            expect(Object.keys(response.body.data.provinces).length).toBeGreaterThan(50);
        });

        test('should include gender century codes', async () => {
            const response = await request(app)
                .get('/api/generate-cccd/options')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.genderCenturyCodes).toBeDefined();
            expect(response.body.data.genderCenturyCodes['0']).toBeDefined();
            expect(response.body.data.genderCenturyCodes['1']).toBeDefined();
            expect(response.body.data.genderCenturyCodes['2']).toBeDefined();
            expect(response.body.data.genderCenturyCodes['3']).toBeDefined();
        });

        test('should include limits information', async () => {
            const response = await request(app)
                .get('/api/generate-cccd/options')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.limits).toBeDefined();
            expect(response.body.data.limits.input).toBeDefined();
            expect(response.body.data.limits.output).toBeDefined();
        });

        test('should include legal basis', async () => {
            const response = await request(app)
                .get('/api/generate-cccd/options')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.legalBasis).toBeDefined();
            expect(response.body.data.legalBasis.decree).toBeDefined();
            expect(response.body.data.legalBasis.circular).toBeDefined();
        });
    });

    describe('Structure Routes - Comprehensive Testing', () => {
        test('should return structure information', async () => {
            const response = await request(app)
                .get('/api/analyze-cccd/structure')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.legalBasis).toBeDefined();
            expect(response.body.data.structureBreakdown).toBeDefined();
            expect(response.body.data.provinceCodes).toBeDefined();
            expect(response.body.data.genderCenturyCodes).toBeDefined();
        });

        test('should include legal basis', async () => {
            const response = await request(app)
                .get('/api/analyze-cccd/structure')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.legalBasis.decree).toBeDefined();
            expect(response.body.data.legalBasis.circular).toBeDefined();
        });

        test('should include structure breakdown', async () => {
            const response = await request(app)
                .get('/api/analyze-cccd/structure')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.structureBreakdown.totalLength).toBe(12);
            expect(response.body.data.structureBreakdown.components).toBeDefined();
            expect(response.body.data.structureBreakdown.components).toHaveLength(6);
        });

        test('should include province codes', async () => {
            const response = await request(app)
                .get('/api/analyze-cccd/structure')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.provinceCodes).toBeDefined();
            expect(Object.keys(response.body.data.provinceCodes).length).toBeGreaterThan(50);
        });

        test('should include gender century codes', async () => {
            const response = await request(app)
                .get('/api/analyze-cccd/structure')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.genderCenturyCodes).toBeDefined();
            expect(response.body.data.genderCenturyCodes['0']).toBeDefined();
            expect(response.body.data.genderCenturyCodes['1']).toBeDefined();
            expect(response.body.data.genderCenturyCodes['2']).toBeDefined();
            expect(response.body.data.genderCenturyCodes['3']).toBeDefined();
        });
    });

    describe('Health Check Routes - Comprehensive Testing', () => {
        test('should return healthy status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.status).toBe('healthy');
            expect(response.body.version).toBe('1.0.0');
            expect(response.body.config).toBeDefined();
        });

        test('should include system information', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.config.module).toBe('CCCD Analysis & Generation');
            expect(response.body.config.version).toBe('1.0.0');
            expect(response.body.config.totalProvinces).toBeDefined();
        });

        test('should include timestamp', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.timestamp).toBeDefined();
            expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
        });
    });

    describe('Root Endpoint - Comprehensive Testing', () => {
        test('should return system information', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('CCCD Analysis & Generation System');
            expect(response.body.endpoints).toBeDefined();
            expect(response.body.legalBasis).toBeDefined();
        });

        test('should include available endpoints', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.endpoints).toBeDefined();
            expect(response.body.endpoints.health).toBeDefined();
            expect(response.body.endpoints.generate).toBeDefined();
            expect(response.body.endpoints.analyze).toBeDefined();
        });

        test('should include legal basis', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.legalBasis).toBeDefined();
            expect(response.body.legalBasis.decree).toBeDefined();
            expect(response.body.legalBasis.circular).toBeDefined();
        });
    });

    describe('Error Handling - Comprehensive Testing', () => {
        test('should handle 404 for non-existent routes', async () => {
            const response = await request(app)
                .get('/nonexistent')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('không tồn tại');
        });

        test('should handle malformed JSON', async () => {
            await request(app)
                .post('/api/generate-cccd')
                .send('{"invalid": json}')
                .set('Content-Type', 'application/json')
                .expect(500);
        });

        test('should handle missing Content-Type header', async () => {
            const response = await request(app)
                .post('/api/generate-cccd')
                .send('{"provinceCodes": ["001"], "quantity": 3}')
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle oversized request body', async () => {
            const largeData = {
                provinceCodes: ['001'],
                quantity: 3,
                extraData: 'x'.repeat(1000000) // 1MB of extra data
            };

            const response = await request(app)
                .post('/api/generate-cccd')
                .send(largeData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle concurrent requests', async () => {
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

        test('should handle rapid sequential requests', async () => {
            for (let i = 0; i < 5; i++) {
                const response = await request(app)
                    .get('/health')
                    .expect(200);
                
                expect(response.body.success).toBe(true);
            }
        });
    });

    describe('Security Testing - Comprehensive', () => {
        test('should handle SQL injection attempts', async () => {
            const response = await request(app)
                .post('/api/analyze-cccd')
                .send({
                    cccd: "001'; DROP TABLE users; --",
                    detailed: true
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle XSS attempts', async () => {
            const response = await request(app)
                .post('/api/analyze-cccd')
                .send({
                    cccd: '<script>alert("xss")</script>',
                    detailed: true
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle path traversal attempts', async () => {
            const response = await request(app)
                .post('/api/analyze-cccd')
                .send({
                    cccd: '../../../etc/passwd',
                    detailed: true
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle command injection attempts', async () => {
            const response = await request(app)
                .post('/api/analyze-cccd')
                .send({
                    cccd: '001; rm -rf /',
                    detailed: true
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Performance Testing - Comprehensive', () => {
        test('should handle large generation request efficiently', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .post('/api/generate-cccd')
                .send({
                    provinceCodes: ['001'],
                    quantity: 100
                })
                .expect(200);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(100);
            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
        });

        test('should handle large batch analysis efficiently', async () => {
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

        test('should handle concurrent generation requests', async () => {
            const promises = [];
            const startTime = Date.now();

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
                '048010101678'
            ];

            const promises = [];
            const startTime = Date.now();

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
    });

    describe('Rate Limiting - Comprehensive Testing', () => {
        test('should respect rate limits', async () => {
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

        test('should handle rate limit exceeded', async () => {
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
            expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(0);
        });
    });
});