/**
 * Analyzer Service Tests
 * Unit tests cho CCCD Analyzer Service
 */

const CCCDAnalyzerService = require('../services/cccd_analyzer_service');
const CCCDConfig = require('../config/cccd_config');

describe('CCCDAnalyzerService', () => {
    let analyzerService;

    beforeEach(() => {
        analyzerService = new CCCDAnalyzerService();
    });

    describe('Constructor', () => {
        test('should initialize with config data', () => {
            expect(analyzerService.provinces).toBeDefined();
            expect(analyzerService.genderCenturyCodes).toBeDefined();
            expect(Object.keys(analyzerService.provinces).length).toBeGreaterThan(0);
            expect(Object.keys(analyzerService.genderCenturyCodes).length).toBeGreaterThan(0);
        });

        test('should use config data instead of hardcoded values', () => {
            const configProvinces = CCCDConfig.getProvinceCodes();
            const configGenderCodes = CCCDConfig.getGenderCenturyCodes();

            expect(analyzerService.provinces).toEqual(configProvinces);
            expect(analyzerService.genderCenturyCodes).toEqual(configGenderCodes);
        });
    });

    describe('validateCccdFormat', () => {
        test('should validate correct CCCD format', () => {
            const result = analyzerService.validateCccdFormat('001012345678');
            expect(result.valid).toBe(true);
            expect(result.error).toBeNull();
        });

        test('should reject empty CCCD', () => {
            const result = analyzerService.validateCccdFormat('');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('không được để trống');
        });

        test('should reject non-numeric CCCD', () => {
            const result = analyzerService.validateCccdFormat('00101234567a');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('chỉ được chứa chữ số');
        });

        test('should reject wrong length CCCD', () => {
            const result = analyzerService.validateCccdFormat('00101234567');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('phải có đúng 12 chữ số');
        });
    });

    describe('analyzeCccdStructure', () => {
        test('should analyze valid CCCD correctly', () => {
            const analysis = analyzerService.analyzeCccdStructure('001010101678');

            expect(analysis.valid).toBe(true);
            expect(analysis.cccd).toBe('001010101678');
            expect(analysis.structure).toBeDefined();
            expect(analysis.summary).toBeDefined();
            expect(analysis.validation).toBeDefined();
        });

        test('should identify province correctly', () => {
            const analysis = analyzerService.analyzeCccdStructure('001010101678');
            expect(analysis.structure.province.code).toBe('001');
            expect(analysis.structure.province.name).toBe('Hà Nội');
            expect(analysis.structure.province.valid).toBe(true);
        });

        test('should identify gender correctly (Nam = Even)', () => {
            const analysis = analyzerService.analyzeCccdStructure('001010101678');
            // CCCD: 001010101678, gender century code is 0 (even = Nam)
            expect(analysis.structure.genderCentury.gender).toBe('Nam');
            expect(analysis.structure.genderCentury.century).toBe(20);
        });

        test('should identify gender correctly (Nữ = Odd)', () => {
            const analysis = analyzerService.analyzeCccdStructure('001110101678');
            // CCCD: 001110101678, gender century code is 1 (odd = Nữ)
            expect(analysis.structure.genderCentury.gender).toBe('Nữ');
            expect(analysis.structure.genderCentury.century).toBe(20);
        });

        test('should calculate birth date correctly', () => {
            const analysis = analyzerService.analyzeCccdStructure('001010101678');
            // CCCD: 001010101678
            // Province: 001 (Hà Nội)
            // Gender/Century: 0 (Nam, thế kỷ 20)
            // Year: 10 (1910)
            // Month: 10 (October)
            // Day: 16 (16th)

            expect(analysis.structure.birthDate.yearCode).toBe('10');
            expect(analysis.structure.birthDate.monthCode).toBe('10');
            expect(analysis.structure.birthDate.dayCode).toBe('16');
            expect(analysis.structure.birthDate.fullYear).toBe(1910);
            expect(analysis.structure.birthDate.month).toBe(10);
            expect(analysis.structure.birthDate.day).toBe(16);
        });

        test('should validate birth date correctly', () => {
            const analysis = analyzerService.analyzeCccdStructure('001010101678');
            // Valid date: 16/10/1910
            expect(analysis.structure.birthDate.valid).toBe(true);
        });

        test('should reject invalid birth date', () => {
            const analysis = analyzerService.analyzeCccdStructure('001012345678');
            // Invalid date: 23/45/1901
            expect(analysis.valid).toBe(false);
        });

        test('should calculate age correctly', () => {
            const analysis = analyzerService.analyzeCccdStructure('001010101678');
            // Birth date: 16/10/1910
            const currentYear = new Date().getFullYear();
            const expectedAge = currentYear - 1910;
            // Allow for 1 year difference due to birth month/day
            expect(analysis.structure.birthDate.currentAge).toBeGreaterThanOrEqual(expectedAge - 1);
            expect(analysis.structure.birthDate.currentAge).toBeLessThanOrEqual(expectedAge + 1);
        });

        test('should include detailed analysis when requested', () => {
            const analysis = analyzerService.analyzeCccdStructure('001010101678', true, false);
            expect(analysis.detailedAnalysis).toBeDefined();
            expect(analysis.detailedAnalysis.legalBasis).toBeDefined();
            expect(analysis.detailedAnalysis.structureBreakdown).toBeDefined();
        });

        test('should include location info when requested', () => {
            const analysis = analyzerService.analyzeCccdStructure('001010101678', false, true);
            expect(analysis.locationInfo).toBeDefined();
            expect(analysis.locationInfo.provinceCode).toBe('001');
            expect(analysis.locationInfo.provinceName).toBe('Hà Nội');
            expect(analysis.locationInfo.region).toBe('Miền Bắc');
        });
    });

    describe('batchAnalyze', () => {
        test('should analyze multiple CCCDs', () => {
            const cccdList = ['001010101678', '079010101678'];
            const results = analyzerService.batchAnalyze(cccdList);

            expect(results.totalAnalyzed).toBe(2);
            expect(results.results).toHaveLength(2);
            expect(results.validCount).toBeGreaterThanOrEqual(0);
            expect(results.invalidCount).toBeGreaterThanOrEqual(0);
            expect(results.validityRate).toBeGreaterThanOrEqual(0);
            expect(results.validityRate).toBeLessThanOrEqual(100);
        });

        test('should respect input limits', () => {
            const cccdList = Array(100).fill('001010101678');
            const results = analyzerService.batchAnalyze(cccdList);

            expect(results.error).toBeDefined();
            expect(results.error).toContain('vượt quá giới hạn');
        });

        test('should provide summary statistics', () => {
            const cccdList = ['001010101678', '079010101678', '001010101678'];
            const results = analyzerService.batchAnalyze(cccdList);

            expect(results.summary).toBeDefined();
            expect(results.summary.mostCommonProvince).toBeDefined();
            expect(results.summary.ageDistribution).toBeDefined();
            expect(results.summary.genderDistribution).toBeDefined();
        });
    });

    describe('Gender Century Code Logic', () => {
        test('should correctly identify male gender codes (even)', () => {
            const maleCodes = [0, 2, 4, 6, 8];
            maleCodes.forEach(code => {
                const cccd = `001${code}010101678`;
                const analysis = analyzerService.analyzeCccdStructure(cccd);
                if (analysis.valid) {
                    expect(analysis.structure.genderCentury.gender).toBe('Nam');
                }
            });
        });

        test('should correctly identify female gender codes (odd)', () => {
            const femaleCodes = [1, 3, 5, 7, 9];
            femaleCodes.forEach(code => {
                const cccd = `001${code}010101678`;
                const analysis = analyzerService.analyzeCccdStructure(cccd);
                if (analysis.valid) {
                    expect(analysis.structure.genderCentury.gender).toBe('Nữ');
                }
            });
        });

        test('should correctly identify century codes', () => {
            // Century 20 (1900-1999)
            const analysis20 = analyzerService.analyzeCccdStructure('001010101678');
            expect(analysis20.structure.genderCentury.century).toBe(20);

            // Century 21 (2000-2099)
            const analysis21 = analyzerService.analyzeCccdStructure('001210101678');
            expect(analysis21.structure.genderCentury.century).toBe(21);
        });
    });

    describe('Region Mapping', () => {
        test('should correctly identify Northern region', () => {
            const analysis = analyzerService.analyzeCccdStructure('001010101678');
            expect(analysis.locationInfo.region).toBe('Miền Bắc');
        });

        test('should correctly identify Central region', () => {
            const analysis = analyzerService.analyzeCccdStructure('048010101678');
            expect(analysis.locationInfo.region).toBe('Miền Trung');
        });

        test('should correctly identify Southern region', () => {
            const analysis = analyzerService.analyzeCccdStructure('079010101678');
            expect(analysis.locationInfo.region).toBe('Miền Nam');
        });
    });
});
