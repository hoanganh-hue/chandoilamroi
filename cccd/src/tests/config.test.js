/**
 * Config Tests
 * Unit tests cho CCCDConfig
 */

const CCCDConfig = require('../config/cccd_config');

describe('CCCDConfig', () => {
    describe('Static Properties', () => {
        test('should have correct default quantity limit', () => {
            expect(CCCDConfig.DEFAULT_QUANTITY_LIMIT).toBe(100);
        });

        test('should have correct max quantity limit', () => {
            expect(CCCDConfig.MAX_QUANTITY_LIMIT).toBe(1000);
        });

        test('should have correct birth year range', () => {
            expect(CCCDConfig.MIN_BIRTH_YEAR).toBe(1920);
            expect(CCCDConfig.MAX_BIRTH_YEAR).toBe(2025);
        });
    });

    describe('Configuration Objects', () => {
        test('should have INPUT_LIMITS configuration', () => {
            const limits = CCCDConfig.INPUT_LIMITS;
            expect(limits).toHaveProperty('single_analysis');
            expect(limits).toHaveProperty('batch_analysis');
            expect(limits).toHaveProperty('generation_single');
            expect(limits).toHaveProperty('generation_batch');
        });

        test('should have OUTPUT_LIMITS configuration', () => {
            const limits = CCCDConfig.OUTPUT_LIMITS;
            expect(limits).toHaveProperty('max_results_per_request');
            expect(limits).toHaveProperty('max_export_records');
            expect(limits).toHaveProperty('max_cache_entries');
        });

        test('should have API_ENDPOINTS configuration', () => {
            const endpoints = CCCDConfig.API_ENDPOINTS;
            expect(endpoints).toHaveProperty('analyze');
            expect(endpoints).toHaveProperty('generate');
            expect(endpoints).toHaveProperty('options');
        });

        test('should have VALIDATION_RULES configuration', () => {
            const rules = CCCDConfig.VALIDATION_RULES;
            expect(rules).toHaveProperty('cccd_length');
            expect(rules.cccd_length).toBe(12);
            expect(rules).toHaveProperty('province_code_length');
            expect(rules.province_code_length).toBe(3);
        });

        test('should have EXPORT_CONFIG configuration', () => {
            const config = CCCDConfig.EXPORT_CONFIG;
            expect(config).toHaveProperty('allowed_formats');
            expect(config).toHaveProperty('default_format');
            expect(config).toHaveProperty('max_file_size_mb');
            expect(config).toHaveProperty('output_directory');
        });

        test('should have LOGGING_CONFIG configuration', () => {
            const config = CCCDConfig.LOGGING_CONFIG;
            expect(config).toHaveProperty('log_level');
            expect(config).toHaveProperty('log_file');
            expect(config).toHaveProperty('max_log_size_mb');
            expect(config).toHaveProperty('backup_count');
        });

        test('should have CACHE_CONFIG configuration', () => {
            const config = CCCDConfig.CACHE_CONFIG;
            expect(config).toHaveProperty('enabled');
            expect(config).toHaveProperty('ttl_seconds');
            expect(config).toHaveProperty('max_entries');
        });

        test('should have SECURITY_CONFIG configuration', () => {
            const config = CCCDConfig.SECURITY_CONFIG;
            expect(config).toHaveProperty('rate_limit_per_minute');
            expect(config).toHaveProperty('max_requests_per_hour');
            expect(config).toHaveProperty('allowed_origins');
            expect(config).toHaveProperty('require_auth');
        });

        test('should have DATABASE_CONFIG configuration', () => {
            const config = CCCDConfig.DATABASE_CONFIG;
            expect(config).toHaveProperty('enabled');
            expect(config).toHaveProperty('connection_string');
            expect(config).toHaveProperty('table_name');
            expect(config).toHaveProperty('batch_size');
        });
    });

    describe('Data Methods', () => {
        test('getProvinceCodes should return province mapping', () => {
            const provinces = CCCDConfig.getProvinceCodes();
            expect(provinces).toHaveProperty('001');
            expect(provinces['001']).toBe('Hà Nội');
            expect(provinces).toHaveProperty('079');
            expect(provinces['079']).toBe('Thành phố Hồ Chí Minh');
            expect(Object.keys(provinces).length).toBeGreaterThan(50);
        });

        test('getGenderCenturyCodes should return gender century mapping', () => {
            const codes = CCCDConfig.getGenderCenturyCodes();
            expect(codes).toHaveProperty('0');
            expect(codes['0']).toHaveProperty('gender');
            expect(codes['0']).toHaveProperty('century');
            expect(codes['0'].gender).toBe('Nam');
            expect(codes['0'].century).toBe(20);

            expect(codes).toHaveProperty('1');
            expect(codes['1'].gender).toBe('Nữ');
            expect(codes['1'].century).toBe(20);
        });

        test('getRegionMapping should return region mapping', () => {
            const regions = CCCDConfig.getRegionMapping();
            expect(regions).toHaveProperty('Miền Bắc');
            expect(regions).toHaveProperty('Miền Trung');
            expect(regions).toHaveProperty('Miền Nam');
            expect(Array.isArray(regions['Miền Bắc'])).toBe(true);
            expect(regions['Miền Bắc']).toContain('001');
        });

        test('getLegalBasis should return legal basis info', () => {
            const legal = CCCDConfig.getLegalBasis();
            expect(legal).toHaveProperty('decree');
            expect(legal).toHaveProperty('circular');
            expect(legal).toHaveProperty('description');
            expect(legal).toHaveProperty('effective_date');
            expect(legal.decree).toContain('137/2015/NĐ-CP');
        });

        test('getStructureBreakdown should return structure info', () => {
            const structure = CCCDConfig.getStructureBreakdown();
            expect(structure).toHaveProperty('positions_1_3');
            expect(structure).toHaveProperty('position_4');
            expect(structure).toHaveProperty('positions_5_6');
            expect(structure).toHaveProperty('positions_7_8');
            expect(structure).toHaveProperty('positions_9_10');
            expect(structure).toHaveProperty('positions_11_12');
        });
    });

    describe('Validation Methods', () => {
        test('validateConfig should validate configuration', () => {
            const result = CCCDConfig.validateConfig();
            expect(result).toHaveProperty('valid');
            expect(result).toHaveProperty('errors');
            expect(result).toHaveProperty('warnings');
            expect(Array.isArray(result.errors)).toBe(true);
            expect(Array.isArray(result.warnings)).toBe(true);
        });

        test('getInputLimits should return input limits', () => {
            const limits = CCCDConfig.getInputLimits();
            expect(limits).toHaveProperty('single_analysis');
            expect(limits).toHaveProperty('batch_analysis');
            expect(limits).toHaveProperty('generation_single');
            expect(limits).toHaveProperty('generation_batch');
        });

        test('getOutputLimits should return output limits', () => {
            const limits = CCCDConfig.getOutputLimits();
            expect(limits).toHaveProperty('max_results_per_request');
            expect(limits).toHaveProperty('max_export_records');
            expect(limits).toHaveProperty('max_cache_entries');
        });

        test('validateInputLimit should validate input limits', () => {
            const result = CCCDConfig.validateInputLimit('single_analysis', 1);
            expect(result).toHaveProperty('valid');
            expect(result.valid).toBe(true);
            expect(result).toHaveProperty('maxLimit');
            expect(result).toHaveProperty('requested');
        });

        test('validateInputLimit should reject excessive input', () => {
            const result = CCCDConfig.validateInputLimit('single_analysis', 10);
            expect(result).toHaveProperty('valid');
            expect(result.valid).toBe(false);
            expect(result).toHaveProperty('error');
            expect(result.error).toContain('vượt quá giới hạn');
        });

        test('validateOutputLimit should validate output limits', () => {
            const result = CCCDConfig.validateOutputLimit('max_results_per_request', 100);
            expect(result).toHaveProperty('valid');
            expect(result.valid).toBe(true);
            expect(result).toHaveProperty('maxLimit');
            expect(result).toHaveProperty('requested');
        });

        test('validateOutputLimit should reject excessive output', () => {
            const result = CCCDConfig.validateOutputLimit('max_results_per_request', 2000);
            expect(result).toHaveProperty('valid');
            expect(result.valid).toBe(false);
            expect(result).toHaveProperty('error');
            expect(result.error).toContain('vượt quá giới hạn');
        });
    });

    describe('Summary Methods', () => {
        test('getConfigSummary should return configuration summary', () => {
            const summary = CCCDConfig.getConfigSummary();
            expect(summary).toHaveProperty('module');
            expect(summary).toHaveProperty('version');
            expect(summary).toHaveProperty('totalProvinces');
            expect(summary).toHaveProperty('quantityLimits');
            expect(summary).toHaveProperty('birthYearRange');
            expect(summary).toHaveProperty('inputLimits');
            expect(summary).toHaveProperty('outputLimits');
            expect(summary).toHaveProperty('features');
            expect(summary).toHaveProperty('apiEndpoints');
            expect(summary).toHaveProperty('legalCompliance');

            expect(summary.module).toBe('CCCD Analysis & Generation');
            expect(summary.version).toBe('1.0.0');
            expect(summary.totalProvinces).toBeGreaterThan(50);
        });
    });
});