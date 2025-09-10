/**
 * Generator Service Tests
 * Unit tests cho CCCD Generator Service
 */

const CCCDGeneratorService = require('../services/cccd_generator_service');
const CCCDConfig = require('../config/cccd_config');

describe('CCCDGeneratorService', () => {
    let generatorService;

    beforeEach(() => {
        generatorService = new CCCDGeneratorService();
    });

    describe('Constructor', () => {
        test('should initialize with config data', () => {
            expect(generatorService.provinces).toBeDefined();
            expect(generatorService.genderCenturyCodes).toBeDefined();
            expect(Object.keys(generatorService.provinces).length).toBeGreaterThan(0);
            expect(Object.keys(generatorService.genderCenturyCodes).length).toBeGreaterThan(0);
        });

        test('should use config data instead of hardcoded values', () => {
            const configProvinces = CCCDConfig.getProvinceCodes();
            const configGenderCodes = CCCDConfig.getGenderCenturyCodes();

            expect(generatorService.provinces).toEqual(configProvinces);
            expect(generatorService.genderCenturyCodes).toEqual(configGenderCodes);
        });
    });

    describe('generateCccdList', () => {
        test('should generate correct number of CCCDs', () => {
            const results = generatorService.generateCccdList(null, null, null, null, 5);
            expect(results).toHaveLength(5);
        });

        test('should validate input limits', () => {
            const results = generatorService.generateCccdList(null, null, null, null, 2000);
            expect(results.error).toBeDefined();
            expect(results.error).toContain('vượt quá giới hạn');
        });

        test('should generate valid CCCD format', () => {
            const results = generatorService.generateCccdList(['001'], null, null, null, 1);
            expect(results[0].cccd_number).toMatch(/^\d{12}$/);
        });

        test('should respect gender parameter', () => {
            const results = generatorService.generateCccdList(['001'], 'Nam', null, null, 10);
            results.forEach(result => {
                expect(result.gender).toBe('Nam');
            });
        });

        test('should respect gender parameter for female', () => {
            const results = generatorService.generateCccdList(['001'], 'Nữ', null, null, 10);
            results.forEach(result => {
                expect(result.gender).toBe('Nữ');
            });
        });

        test('should use correct gender century codes (Nam = Even)', () => {
            const results = generatorService.generateCccdList(['001'], 'Nam', 1990, null, 10);
            results.forEach(result => {
                const genderCenturyCode = parseInt(result.cccd_number.substring(3, 4), 10);
                expect([0, 2]).toContain(genderCenturyCode); // Nam thế kỷ 20 = 0, thế kỷ 21 = 2
            });
        });

        test('should use correct gender century codes (Nữ = Odd)', () => {
            const results = generatorService.generateCccdList(['001'], 'Nữ', 1990, null, 10);
            results.forEach(result => {
                const genderCenturyCode = parseInt(result.cccd_number.substring(3, 4), 10);
                expect([1, 3]).toContain(genderCenturyCode); // Nữ thế kỷ 20 = 1, thế kỷ 21 = 3
            });
        });

        test('should respect birth year', () => {
            const results = generatorService.generateCccdList(['001'], null, 1995, null, 10);
            results.forEach(result => {
                expect(result.birth_year).toBe(1995);
            });
        });

        test('should include metadata for first result', () => {
            const results = generatorService.generateCccdList(['001'], null, null, null, 5);
            expect(results[0]._metadata).toBeDefined();
            expect(results[0]._metadata.requested_quantity).toBe(5);
            expect(results[0]._metadata.actual_quantity).toBe(5);
        });

        test('should handle invalid province codes gracefully', () => {
            const results = generatorService.generateCccdList(['999'], null, null, null, 1);
            expect(results.error).toBeDefined();
            expect(results.error).toContain('Không có mã tỉnh hợp lệ');
        });
    });

    describe('CCCD Structure', () => {
        test('should generate CCCD with correct structure', () => {
            const results = generatorService.generateCccdList(['001'], 'Nam', 1990, null, 1);
            const cccd = results[0].cccd_number;

            // Province code (positions 1-3)
            expect(cccd.substring(0, 3)).toBe('001');

            // Gender century code (position 4) - should be 0 for male born in 1990 (20th century)
            const genderCenturyCode = parseInt(cccd.substring(3, 4), 10);
            expect(genderCenturyCode).toBe(0);

            // Year code (positions 5-6) - should be '90' for 1990
            const yearCode = cccd.substring(4, 6);
            expect(yearCode).toBe('90');

            // Random sequence (positions 7-12) - should be 6 digits
            const randomSequence = cccd.substring(6, 12);
            expect(randomSequence).toMatch(/^\d{6}$/);
        });
    });
});
