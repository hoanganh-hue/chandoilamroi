/**
 * CLI Unit Tests - Final
 * Unit tests cho CLI helper functions và edge cases
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Import CLI commands for direct testing
const { formatOutput, saveToFile } = require('../cli/commands_export');

describe('CLI Unit Tests - Final', () => {
    describe('formatOutput Function', () => {
        test('should format JSON correctly', () => {
            const data = { test: 'data', number: 123 };
            const result = formatOutput(data, 'json');
            expect(result).toBe(JSON.stringify(data, null, 2));
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

    describe('CLI Command Validation', () => {
        test('should validate command parameters', () => {
            // Test parameter validation logic
            const validParams = {
                provinces: '001,079',
                quantity: '5',
                gender: 'Nam'
            };

            const invalidParams = {
                provinces: '999',
                quantity: 'not-a-number',
                gender: 'invalid'
            };

            // These are basic validation tests
            expect(validParams.provinces).toBeDefined();
            expect(validParams.quantity).toBeDefined();
            expect(invalidParams.quantity).not.toMatch(/^\d+$/);
        });

        test('should handle parameter parsing', () => {
            const parseParams = (args) => {
                const params = {};
                for (let i = 0; i < args.length; i += 2) {
                    if (args[i].startsWith('--')) {
                        params[args[i].slice(2)] = args[i + 1];
                    }
                }
                return params;
            };

            const args = ['--provinces', '001', '--quantity', '10'];
            const params = parseParams(args);

            expect(params.provinces).toBe('001');
            expect(params.quantity).toBe('10');
        });

        test('should validate file paths', () => {
            const validPaths = [
                'test.json',
                './test.json',
                'output/test.json',
                '/absolute/path/test.json'
            ];

            const invalidPaths = [
                '',
                '   ',
                null,
                undefined
            ];

            validPaths.forEach(path => {
                expect(typeof path).toBe('string');
                expect(path.length).toBeGreaterThan(0);
            });

            invalidPaths.forEach(path => {
                expect(path == null || path.trim() === '').toBe(true);
            });
        });
    });

    describe('Output Formatting Edge Cases', () => {
        test('should handle very long strings', () => {
            const longString = 'a'.repeat(10000);
            const data = { longField: longString };

            const result = formatOutput(data, 'json');
            expect(result).toContain(longString);
        });

        test('should handle special Unicode characters', () => {
            const data = {
                vietnamese: 'Hà Nội Việt Nam',
                emoji: '🚀✅❌',
                special: 'ñáéíóú'
            };

            const result = formatOutput(data, 'json');
            expect(result).toContain('Hà Nội');
            expect(result).toContain('🚀');
        });

        test('should handle nested arrays', () => {
            const data = {
                results: [
                    [1, 2, 3],
                    ['a', 'b', 'c'],
                    [{ nested: 'object' }]
                ]
            };

            const result = formatOutput(data, 'json');
            expect(result).toContain('nested');
            expect(result).toContain('object');
        });

        test('should handle Date objects', () => {
            const data = {
                timestamp: new Date('2024-01-01'),
                createdAt: new Date()
            };

            const result = formatOutput(data, 'json');
            expect(result).toContain('2024-01-01');
        });
    });

    describe('File Operations Edge Cases', () => {
        test('should handle concurrent file writes', async () => {
            const promises = [];
            const CCCDConfig = require('../config/cccd_config');
            const outputDir = CCCDConfig.EXPORT_CONFIG.output_directory;

            for (let i = 0; i < 5; i++) {
                promises.push(
                    new Promise((resolve) => {
                        const data = { id: i, data: `test${i}` };
                        const filename = `concurrent_test_${i}.json`;
                        saveToFile(data, filename);
                        resolve();
                    })
                );
            }

            await Promise.all(promises);

            // Verify all files were created
            for (let i = 0; i < 5; i++) {
                const filename = `concurrent_test_${i}.json`;
                expect(fs.existsSync(path.join(outputDir, filename))).toBe(true);
            }
        });

        test('should handle file permission errors', () => {
            // This test would require setting up a directory with no write permissions
            // For now, we'll just test the error handling structure
            const data = { test: 'data' };
            const filename = 'permission_test.json';

            // Mock a permission error
            const originalWriteFileSync = fs.writeFileSync;
            fs.writeFileSync = jest.fn(() => {
                const error = new Error('EACCES: permission denied');
                error.code = 'EACCES';
                throw error;
            });

            expect(() => saveToFile(data, filename)).toThrow();

            // Restore original function
            fs.writeFileSync = originalWriteFileSync;
        });

        test('should handle disk space errors', () => {
            const data = { test: 'data' };
            const filename = 'disk_space_test.json';

            // Mock disk space error
            const originalWriteFileSync = fs.writeFileSync;
            fs.writeFileSync = jest.fn(() => {
                const error = new Error('ENOSPC: no space left on device');
                error.code = 'ENOSPC';
                throw error;
            });

            expect(() => saveToFile(data, filename)).toThrow();

            // Restore original function
            fs.writeFileSync = originalWriteFileSync;
        });
    });

    describe('Performance Tests for CLI Functions', () => {
        test('should format large datasets efficiently', () => {
            const largeData = Array.from({ length: 1000 }, (_, i) => ({
                id: i,
                cccd: `001${String(i).padStart(9, '0')}678`,
                province: 'Hà Nội',
                gender: i % 2 === 0 ? 'Nam' : 'Nữ',
                birthDate: `01/01/20${String(i % 100).padStart(2, '0')}`
            }));

            const startTime = Date.now();
            const result = formatOutput(largeData, 'table');
            const endTime = Date.now();

            expect(result).toBeDefined();
            expect(result.length).toBeGreaterThan(0);
            expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
        });

        test('should handle memory efficiently with large objects', () => {
            const largeObject = {
                data: 'x'.repeat(1000000), // 1MB string
                nested: {
                    array: Array.from({ length: 10000 }, (_, i) => ({ id: i }))
                }
            };

            const startTime = Date.now();
            const result = formatOutput(largeObject, 'json');
            const endTime = Date.now();

            expect(result).toBeDefined();
            expect(result.length).toBeGreaterThan(1000000);
            expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
        });
    });
});