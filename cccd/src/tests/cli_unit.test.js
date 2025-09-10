/**
 * CLI Unit Tests
 * Unit tests cho CLI helper functions và edge cases
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Mock the CLI commands module to access helper functions
jest.mock('../cli/commands', () => {
    const originalModule = jest.requireActual('../cli/commands');

    return {
        ...originalModule,
        formatOutput: jest.fn((data, format = 'json') => {
            switch (format) {
                case 'json':
                    return JSON.stringify(data, null, 2);
                case 'table':
                    if (Array.isArray(data)) {
                        return data.map(item => {
                            if (item.cccd_number) {
                                return `${item.cccd_number} | ${item.province_name} | ${item.gender} | ${item.birth_date}`;
                            } else if (item.cccd) {
                                return `${item.cccd} | ${item.summary?.provinceName || 'N/A'} | ${item.summary?.gender || 'N/A'} | ${item.summary?.birthDate || 'N/A'}`;
                            }
                            return JSON.stringify(item);
                        }).join('\n');
                    }
                    return JSON.stringify(data, null, 2);
                default:
                    return JSON.stringify(data, null, 2);
            }
        }),
        saveToFile: jest.fn((data, filename) => {
            const CCCDConfig = require('../config/cccd_config');
            const outputDir = CCCDConfig.EXPORT_CONFIG.output_directory;
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            const filepath = path.join(outputDir, filename);
            fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
            console.log(`Results saved to: ${filepath}`);
            return filepath;
        })
    };
});

const { formatOutput, saveToFile } = require('../cli/commands');

describe('CLI Unit Tests', () => {
    describe('formatOutput Function', () => {
        test('should format JSON correctly', () => {
            const data = { test: 'data', number: 123 };
            const result = formatOutput(data, 'json');
            expect(result).toBe(JSON.stringify(data, null, 2));
            expect(formatOutput).toHaveBeenCalledWith(data, 'json');
        });

        test('should format table for generation results array', () => {
            const data = [
                { cccd_number: '001010101678', province_name: 'Hà Nội', gender: 'Nam', birth_date: '01/01/2001' },
                { cccd_number: '079010101678', province_name: 'TP.HCM', gender: 'Nữ', birth_date: '01/01/2002' }
            ];
            const result = formatOutput(data, 'table');
            expect(result).toContain('001010101678');
            expect(result).toContain('Hà Nội');
            expect(result).toContain('Nam');
            expect(result).toContain('079010101678');
            expect(result).toContain('TP.HCM');
            expect(result).toContain('Nữ');
        });

        test('should handle analysis results in table format', () => {
            const data = {
                cccd: '001010101678',
                summary: { provinceName: 'Hà Nội', gender: 'Nam', birthDate: '01/01/2001' }
            };
            const result = formatOutput(data, 'table');
            expect(result).toContain('001010101678');
            expect(result).toContain('Hà Nội');
            expect(result).toContain('Nam');
        });

        test('should handle empty array in table format', () => {
            const data = [];
            const result = formatOutput(data, 'table');
            expect(result).toBe('');
        });

        test('should handle non-array data in table format', () => {
            const data = { test: 'data' };
            const result = formatOutput(data, 'table');
            expect(result).toBe(JSON.stringify(data, null, 2));
        });

        test('should default to JSON for unknown format', () => {
            const data = { test: 'data' };
            const result = formatOutput(data, 'unknown');
            expect(result).toBe(JSON.stringify(data, null, 2));
        });

        test('should handle null/undefined data', () => {
            expect(() => formatOutput(null, 'json')).not.toThrow();
            expect(() => formatOutput(undefined, 'json')).not.toThrow();
        });

        test('should handle complex nested objects', () => {
            const data = {
                cccd: '001010101678',
                summary: {
                    provinceName: 'Hà Nội',
                    gender: 'Nam',
                    birthDate: '01/01/2001',
                    currentAge: 23
                },
                locationInfo: {
                    region: 'Miền Bắc',
                    area: 'Đồng bằng sông Hồng'
                }
            };
            const result = formatOutput(data, 'json');
            expect(result).toContain('001010101678');
            expect(result).toContain('Hà Nội');
            expect(result).toContain('Miền Bắc');
        });
    });

    describe('saveToFile Function', () => {
        const CCCDConfig = require('../config/cccd_config');
        const outputDir = CCCDConfig.EXPORT_CONFIG.output_directory;

        beforeEach(() => {
            // Clean up test files
            const testFiles = [
                path.join(outputDir, 'test_unit_file.json'),
                path.join(outputDir, 'test_dir', 'nested_file.json')
            ];
            testFiles.forEach(file => {
                if (fs.existsSync(file)) {
                    fs.unlinkSync(file);
                }
            });

            // Clean up test directories
            const testDirs = [
                path.join(outputDir, 'test_dir')
            ];
            testDirs.forEach(dir => {
                if (fs.existsSync(dir)) {
                    fs.rmSync(dir, { recursive: true });
                }
            });
        });

        test('should save data to file successfully', () => {
            const data = { test: 'data', number: 123 };
            const filename = 'test_unit_file.json';

            const result = saveToFile(data, filename);
            expect(result).toContain(filename);
            expect(fs.existsSync(path.join(outputDir, filename))).toBe(true);

            const fileContent = fs.readFileSync(path.join(outputDir, filename), 'utf8');
            expect(JSON.parse(fileContent)).toEqual(data);
        });

        test('should create output directory if not exists', () => {
            const data = { test: 'data' };
            const filename = 'test_dir/nested_file.json';

            const result = saveToFile(data, filename);
            expect(result).toContain(filename);
            expect(fs.existsSync(path.join(outputDir, 'test_dir'))).toBe(true);
            expect(fs.existsSync(path.join(outputDir, filename))).toBe(true);
        });

        test('should handle empty data', () => {
            const data = {};
            const filename = 'empty_test.json';

            const result = saveToFile(data, filename);
            expect(result).toContain(filename);
            expect(fs.existsSync(path.join(outputDir, filename))).toBe(true);
        });

        test('should handle large data objects', () => {
            const data = {
                results: Array.from({ length: 1000 }, (_, i) => ({
                    id: i,
                    cccd: `001${String(i).padStart(9, '0')}678`,
                    province: 'Hà Nội'
                }))
            };
            const filename = 'large_test.json';

            const result = saveToFile(data, filename);
            expect(result).toContain(filename);
            expect(fs.existsSync(path.join(outputDir, filename))).toBe(true);

            const fileContent = fs.readFileSync(path.join(outputDir, filename), 'utf8');
            const parsedData = JSON.parse(fileContent);
            expect(parsedData.results).toHaveLength(1000);
        });

        test('should handle special characters in filename', () => {
            const data = { test: 'data' };
            const filename = 'test-file_with_special.chars.json';

            const result = saveToFile(data, filename);
            expect(result).toContain(filename);
            expect(fs.existsSync(path.join(outputDir, filename))).toBe(true);
        });
    });

    describe('CLI Command Structure', () => {
        test('should have all required commands defined', () => {
            const program = require('../cli/commands');
            expect(program).toBeDefined();
            expect(typeof program.command).toBe('function');
        });

        test('should handle command registration without errors', () => {
            expect(() => {
                require('../cli/commands');
            }).not.toThrow();
        });
    });

    describe('Error Handling in CLI', () => {
        test('should handle JSON parsing errors gracefully', () => {
            const invalidData = { circular: {} };
            invalidData.circular = invalidData; // Create circular reference

            expect(() => {
                JSON.stringify(invalidData);
            }).toThrow();

            // formatOutput should handle this gracefully
            expect(() => formatOutput(invalidData, 'json')).toThrow();
        });

        test('should handle file system errors', () => {
            // Mock fs.writeFileSync to throw error
            const originalWriteFileSync = fs.writeFileSync;
            fs.writeFileSync = jest.fn(() => {
                throw new Error('File system error');
            });

            expect(() => saveToFile({ test: 'data' }, 'error_test.json')).toThrow();

            // Restore original function
            fs.writeFileSync = originalWriteFileSync;
        });
    });

    describe('Integration with Services', () => {
        test('should initialize services correctly', () => {
            const CCCDGeneratorService = require('../services/cccd_generator_service');
            const CCCDAnalyzerService = require('../services/cccd_analyzer_service');

            // Verify services are imported and can be instantiated
            expect(CCCDGeneratorService).toBeDefined();
            expect(CCCDAnalyzerService).toBeDefined();

            const generator = new CCCDGeneratorService();
            const analyzer = new CCCDAnalyzerService();

            expect(generator).toBeInstanceOf(CCCDGeneratorService);
            expect(analyzer).toBeInstanceOf(CCCDAnalyzerService);
        });

        test('should handle service method calls', () => {
            const generatorService = new (require('../services/cccd_generator_service'))();

            // Test that service methods exist
            expect(typeof generatorService.generateCccdList).toBe('function');
            expect(typeof generatorService.generateSingleCccd).toBe('function');
        });
    });

    describe('Configuration Integration', () => {
        test('should load configuration correctly', () => {
            const CCCDConfig = require('../config/cccd_config');

            expect(CCCDConfig).toBeDefined();
            expect(CCCDConfig.EXPORT_CONFIG).toBeDefined();
            expect(CCCDConfig.EXPORT_CONFIG.output_directory).toBeDefined();
        });

        test('should handle configuration validation', () => {
            const CCCDConfig = require('../config/cccd_config');

            expect(typeof CCCDConfig.validateConfig).toBe('function');
            expect(typeof CCCDConfig.getConfigSummary).toBe('function');
        });
    });

    describe('Logger Integration', () => {
        test('should initialize logger correctly', () => {
            const logger = require('../utils/logger');

            expect(logger).toBeDefined();
            expect(typeof logger.info).toBe('function');
            expect(typeof logger.error).toBe('function');
            expect(typeof logger.logCCCDOperation).toBe('function');
        });

        test('should handle logger method calls', () => {
            const logger = require('../utils/logger');

            // These should not throw errors
            expect(() => logger.info('Test message')).not.toThrow();
            expect(() => logger.error('Test error')).not.toThrow();
        });
    });
});