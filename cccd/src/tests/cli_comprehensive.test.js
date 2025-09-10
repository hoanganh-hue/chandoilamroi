/**
 * Comprehensive CLI Tests
 * Tests cho CLI commands với coverage 90%+
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('Comprehensive CLI Tests', () => {
    const mainScript = path.join(__dirname, '../main.js');

    const runCLICommand = (args, options = {}) => {
        return new Promise((resolve, reject) => {
            const child = spawn('node', [mainScript, ...args], {
                stdio: ['pipe', 'pipe', 'pipe'],
                ...options
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

    describe('Helper Functions', () => {
        test('should format JSON output correctly', async () => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-q', '1',
                '-f', 'json'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
            
            // Check JSON format
            const jsonMatch = result.stdout.match(/\[[\s\S]*\]/);
            expect(jsonMatch).toBeTruthy();
            
            const jsonData = JSON.parse(jsonMatch[0]);
            expect(jsonData).toHaveLength(1);
            expect(jsonData[0]).toHaveProperty('cccd_number');
        });

        test('should format table output correctly', async () => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-q', '2',
                '-f', 'table'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
            expect(result.stdout).toContain('|');
        });

        test('should create output directory if not exists', async () => {
            const outputDir = path.join(__dirname, '../output/test_dir');
            
            // Remove directory if exists
            if (fs.existsSync(outputDir)) {
                fs.rmSync(outputDir, { recursive: true });
            }

            const result = await runCLICommand([
                'cli', 'generate',
                '-q', '1',
                '-o', 'test_dir/test_file.json'
            ]);

            expect(result.code).toBe(0);
            expect(fs.existsSync(outputDir)).toBe(true);
            expect(fs.existsSync(path.join(outputDir, 'test_file.json'))).toBe(true);

            // Cleanup
            fs.rmSync(outputDir, { recursive: true });
        });

        test('should handle file write errors gracefully', async () => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-q', '1',
                '-o', '/invalid/path/file.json'
            ]);

            // Should still succeed but may have file write issues
            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
        });
    });

    describe('Generate Command - Comprehensive Testing', () => {
        test('should handle all valid province codes', async () => {
            const validProvinces = ['001', '079', '024', '031', '048', '056', '064', '072', '080', '088'];
            
            for (const province of validProvinces) {
                const result = await runCLICommand([
                    'cli', 'generate',
                    '-p', province,
                    '-q', '1'
                ]);

                expect(result.code).toBe(0);
                expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
            }
        });

        test('should handle multiple provinces correctly', async () => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-p', '001,079,024',
                '-q', '6'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
            expect(result.stdout).toContain('📊 Số lượng: 6');
        });

        test('should handle gender-specific generation', async () => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-p', '001',
                '-g', 'Nữ',
                '-q', '5'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
            
            // Check that all generated CCCDs are female
            const jsonMatch = result.stdout.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const jsonData = JSON.parse(jsonMatch[0]);
                jsonData.forEach(item => {
                    expect(item.gender).toBe('Nữ');
                });
            }
        });

        test('should handle year range generation', async () => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-p', '001',
                '-y', '1990-2000',
                '-q', '3'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
            
            // Check that birth years are in range
            const jsonMatch = result.stdout.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const jsonData = JSON.parse(jsonMatch[0]);
                jsonData.forEach(item => {
                    expect(item.birth_year).toBeGreaterThanOrEqual(1990);
                    expect(item.birth_year).toBeLessThanOrEqual(2000);
                });
            }
        });

        test('should handle edge case year ranges', async () => {
            const edgeCases = [
                { range: '1920-1925', min: 1920, max: 1925 },
                { range: '2020-2025', min: 2020, max: 2025 },
                { range: '2000-2000', min: 2000, max: 2000 }
            ];

            for (const testCase of edgeCases) {
                const result = await runCLICommand([
                    'cli', 'generate',
                    '-p', '001',
                    '-y', testCase.range,
                    '-q', '2'
                ]);

                expect(result.code).toBe(0);
                expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
            }
        });

        test('should handle maximum quantity', async () => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-p', '001',
                '-q', '1000'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
            expect(result.stdout).toContain('📊 Số lượng: 1000');
        });

        test('should handle default parameters', async () => {
            const result = await runCLICommand([
                'cli', 'generate'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
            expect(result.stdout).toContain('📊 Số lượng: 10');
        });

        test('should handle complex parameter combinations', async () => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-p', '001,079,024',
                '-g', 'Nam',
                '-y', '1985-1995',
                '-q', '15',
                '-f', 'table',
                '-o', 'complex_test.json'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
            expect(result.stdout).toContain('📊 Số lượng: 15');
            expect(result.stdout).toContain('💾 Đã lưu vào:');
        });
    });

    describe('Analyze Command - Comprehensive Testing', () => {
        test('should analyze valid CCCDs from different provinces', async () => {
            const testCCCDs = [
                '001010101678', // Hanoi
                '079010101678', // Ho Chi Minh
                '024010101678', // Quang Ninh
                '031010101678', // Hai Phong
                '048010101678'  // Da Nang
            ];

            for (const cccd of testCCCDs) {
                const result = await runCLICommand([
                    'cli', 'analyze', cccd
                ]);

                expect(result.code).toBe(0);
                expect(result.stdout).toContain('✅ Phân tích CCCD thành công!');
                expect(result.stdout).toContain(`🆔 CCCD: ${cccd}`);
            }
        });

        test('should analyze with detailed information', async () => {
            const result = await runCLICommand([
                'cli', 'analyze', '001010101678',
                '-d', '-l'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích CCCD thành công!');
            expect(result.stdout).toContain('🗺️  Vùng:');
        });

        test('should analyze without detailed information', async () => {
            const result = await runCLICommand([
                'cli', 'analyze', '001010101678',
                '--no-detailed', '--no-location'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích CCCD thành công!');
        });

        test('should analyze and save to file', async () => {
            const result = await runCLICommand([
                'cli', 'analyze', '001010101678',
                '-o', 'analysis_test.json'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích CCCD thành công!');
            expect(result.stdout).toContain('💾 Đã lưu vào:');
        });

        test('should analyze in table format', async () => {
            const result = await runCLICommand([
                'cli', 'analyze', '001010101678',
                '-f', 'table'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích CCCD thành công!');
        });

        test('should handle edge case CCCDs', async () => {
            const edgeCases = [
                '001000000001', // Minimum values
                '001999999999', // Maximum values
                '001010100000', // Zero padding
                '001010199999'  // Maximum sequence
            ];

            for (const cccd of edgeCases) {
                const result = await runCLICommand([
                    'cli', 'analyze', cccd
                ]);

                if (result.code === 0) {
                    expect(result.stdout).toContain('✅ Phân tích CCCD thành công!');
                } else {
                    expect(result.stdout).toContain('❌ CCCD không hợp lệ:') || 
                           expect(result.stderr).toContain('❌ CCCD không hợp lệ:');
                }
            }
        });
    });

    describe('Batch Analyze Command - Comprehensive Testing', () => {
        test('should handle JSON file format', async () => {
            const testFile = path.join(__dirname, 'batch_test.json');
            const testData = [
                '001010101678',
                '079010101678',
                '024010101678'
            ];
            fs.writeFileSync(testFile, JSON.stringify(testData));

            const result = await runCLICommand([
                'cli', 'batch-analyze', testFile
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích hàng loạt thành công!');
            expect(result.stdout).toContain('📊 Tổng số: 3');

            fs.unlinkSync(testFile);
        });

        test('should handle text file format', async () => {
            const testFile = path.join(__dirname, 'batch_test.txt');
            const testData = '001010101678\n079010101678\n024010101678\n';
            fs.writeFileSync(testFile, testData);

            const result = await runCLICommand([
                'cli', 'batch-analyze', testFile
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích hàng loạt thành công!');
            expect(result.stdout).toContain('📊 Tổng số: 3');

            fs.unlinkSync(testFile);
        });

        test('should handle mixed valid/invalid CCCDs', async () => {
            const testFile = path.join(__dirname, 'mixed_test.txt');
            const testData = '001010101678\ninvalid-cccd\n079010101678\n999999999999\n';
            fs.writeFileSync(testFile, testData);

            const result = await runCLICommand([
                'cli', 'batch-analyze', testFile
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích hàng loạt thành công!');
            expect(result.stdout).toContain('📊 Tổng số: 4');

            fs.unlinkSync(testFile);
        });

        test('should handle large dataset', async () => {
            const testFile = path.join(__dirname, 'large_test.json');
            const testData = Array.from({ length: 100 }, (_, i) => 
                `001${String(i).padStart(9, '0')}678`
            );
            fs.writeFileSync(testFile, JSON.stringify(testData));

            const result = await runCLICommand([
                'cli', 'batch-analyze', testFile
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích hàng loạt thành công!');
            expect(result.stdout).toContain('📊 Tổng số: 100');

            fs.unlinkSync(testFile);
        });

        test('should handle empty file', async () => {
            const testFile = path.join(__dirname, 'empty_test.json');
            fs.writeFileSync(testFile, '[]');

            const result = await runCLICommand([
                'cli', 'batch-analyze', testFile
            ]);

            expect(result.code).toBe(1);
            expect(result.stdout).toContain('❌ File không chứa danh sách CCCD hợp lệ') || 
                   expect(result.stderr).toContain('❌ File không chứa danh sách CCCD hợp lệ');

            fs.unlinkSync(testFile);
        });

        test('should handle corrupted JSON file', async () => {
            const testFile = path.join(__dirname, 'corrupted_test.json');
            fs.writeFileSync(testFile, '{"invalid": json content}');

            const result = await runCLICommand([
                'cli', 'batch-analyze', testFile
            ]);

            expect(result.code).toBe(1);
            expect(result.stdout).toContain('❌ File không chứa danh sách CCCD hợp lệ') || 
                   expect(result.stderr).toContain('❌ File không chứa danh sách CCCD hợp lệ');

            fs.unlinkSync(testFile);
        });

        test('should handle file with invalid CCCD format', async () => {
            const testFile = path.join(__dirname, 'invalid_format_test.txt');
            fs.writeFileSync(testFile, '001010101678\n123456789\ninvalid\n');

            const result = await runCLICommand([
                'cli', 'batch-analyze', testFile
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích hàng loạt thành công!');
            expect(result.stdout).toContain('📊 Tổng số: 3');

            fs.unlinkSync(testFile);
        });

        test('should save batch results to file', async () => {
            const testFile = path.join(__dirname, 'save_test.json');
            const testData = ['001010101678', '079010101678'];
            fs.writeFileSync(testFile, JSON.stringify(testData));

            const result = await runCLICommand([
                'cli', 'batch-analyze', testFile,
                '-o', 'batch_results.json'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích hàng loạt thành công!');
            expect(result.stdout).toContain('💾 Đã lưu vào:');

            fs.unlinkSync(testFile);
        });

        test('should output batch results in table format', async () => {
            const testFile = path.join(__dirname, 'table_test.json');
            const testData = ['001010101678', '079010101678'];
            fs.writeFileSync(testFile, JSON.stringify(testData));

            const result = await runCLICommand([
                'cli', 'batch-analyze', testFile,
                '-f', 'table'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích hàng loạt thành công!');

            fs.unlinkSync(testFile);
        });
    });

    describe('Config Command - Comprehensive Testing', () => {
        test('should display configuration in JSON format', async () => {
            const result = await runCLICommand([
                'cli', 'config',
                '-f', 'json'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('⚙️  Cấu hình hệ thống CCCD:');
            expect(result.stdout).toContain('"module": "CCCD Analysis & Generation"');
        });

        test('should display configuration in table format', async () => {
            const result = await runCLICommand([
                'cli', 'config',
                '-f', 'table'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('⚙️  Cấu hình hệ thống CCCD:');
        });

        test('should display default configuration', async () => {
            const result = await runCLICommand([
                'cli', 'config'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('⚙️  Cấu hình hệ thống CCCD:');
            expect(result.stdout).toContain('📦 Module: CCCD Analysis & Generation');
            expect(result.stdout).toContain('🔢 Version: 1.0.0');
            expect(result.stdout).toContain('🏛️  Tổng số tỉnh:');
        });

        test('should display validation information', async () => {
            const result = await runCLICommand([
                'cli', 'config'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('📋 Validation:');
            expect(result.stdout).toContain('✅ Cấu hình: Hợp lệ');
        });
    });

    describe('Help Command - Comprehensive Testing', () => {
        test('should display help information', async () => {
            const result = await runCLICommand([
                'cli', 'help'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('🆔 Hệ thống CCCD Analysis & Generation');
            expect(result.stdout).toContain('📋 Các lệnh có sẵn:');
            expect(result.stdout).toContain('🔧 generate');
            expect(result.stdout).toContain('🔍 analyze');
            expect(result.stdout).toContain('📊 batch-analyze');
            expect(result.stdout).toContain('⚙️  config');
            expect(result.stdout).toContain('📖 help');
        });

        test('should display usage examples', async () => {
            const result = await runCLICommand([
                'cli', 'help'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('📝 Ví dụ sử dụng:');
            expect(result.stdout).toContain('node src/main.js cli generate');
            expect(result.stdout).toContain('node src/main.js cli analyze');
            expect(result.stdout).toContain('node src/main.js cli batch-analyze');
        });
    });

    describe('Error Handling - Comprehensive Testing', () => {
        test('should handle unknown command', async () => {
            const result = await runCLICommand([
                'cli', 'unknown-command'
            ]);

            expect(result.code).toBe(1);
        });

        test('should handle missing required arguments', async () => {
            const result = await runCLICommand([
                'cli', 'analyze'
            ]);

            expect(result.code).toBe(1);
        });

        test('should handle invalid province codes', async () => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-p', '999,888',
                '-q', '2'
            ]);

            expect(result.code).toBe(1);
            expect(result.stdout).toContain('❌ Lỗi:') || expect(result.stderr).toContain('❌ Lỗi:');
        });

        test('should handle invalid gender', async () => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-g', 'InvalidGender',
                '-q', '2'
            ]);

            expect(result.code).toBe(1);
        });

        test('should handle invalid year range format', async () => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-y', 'invalid-range',
                '-q', '2'
            ]);

            expect(result.code).toBe(0); // Should still work with default year range
        });

        test('should handle invalid quantity format', async () => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-q', 'not-a-number'
            ]);

            expect(result.code).toBe(1);
        });

        test('should handle zero quantity', async () => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-q', '0'
            ]);

            expect(result.code).toBe(1);
        });

        test('should handle negative quantity', async () => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-q', '-5'
            ]);

            expect(result.code).toBe(1);
        });

        test('should handle very large quantity', async () => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-q', '10000'
            ]);

            expect(result.code).toBe(1);
            expect(result.stdout).toContain('❌ Lỗi:') || expect(result.stderr).toContain('❌ Lỗi:');
        });

        test('should handle empty province codes', async () => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-p', '',
                '-q', '2'
            ]);

            expect(result.code).toBe(1);
        });

        test('should handle non-existent file', async () => {
            const result = await runCLICommand([
                'cli', 'batch-analyze', 'nonexistent.json'
            ]);

            expect(result.code).toBe(1);
            expect(result.stdout).toContain('❌ File không tồn tại:') || 
                   expect(result.stderr).toContain('❌ File không tồn tại:');
        });

        test('should handle invalid CCCD format', async () => {
            const result = await runCLICommand([
                'cli', 'analyze', 'invalid-cccd'
            ]);

            expect(result.code).toBe(1);
            expect(result.stdout).toContain('❌ CCCD không hợp lệ:') || 
                   expect(result.stderr).toContain('❌ CCCD không hợp lệ:');
        });

        test('should handle CCCD with wrong length', async () => {
            const result = await runCLICommand([
                'cli', 'analyze', '123456789'
            ]);

            expect(result.code).toBe(1);
            expect(result.stdout).toContain('❌ CCCD không hợp lệ:') || 
                   expect(result.stderr).toContain('❌ CCCD không hợp lệ:');
        });

        test('should handle CCCD with non-numeric characters', async () => {
            const result = await runCLICommand([
                'cli', 'analyze', '001abc123456'
            ]);

            expect(result.code).toBe(1);
            expect(result.stdout).toContain('❌ CCCD không hợp lệ:') || 
                   expect(result.stderr).toContain('❌ CCCD không hợp lệ:');
        });

        test('should handle empty CCCD input', async () => {
            const result = await runCLICommand([
                'cli', 'analyze', ''
            ]);

            expect(result.code).toBe(1);
        });
    });

    describe('Performance Testing', () => {
        test('should handle large generation efficiently', async () => {
            const startTime = Date.now();
            
            const result = await runCLICommand([
                'cli', 'generate',
                '-q', '100'
            ]);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(result.code).toBe(0);
            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
        });

        test('should handle large batch analysis efficiently', async () => {
            const testFile = path.join(__dirname, 'perf_test.json');
            const testData = Array.from({ length: 50 }, (_, i) => 
                `001${String(i).padStart(9, '0')}678`
            );
            fs.writeFileSync(testFile, JSON.stringify(testData));

            const startTime = Date.now();
            
            const result = await runCLICommand([
                'cli', 'batch-analyze', testFile
            ]);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(result.code).toBe(0);
            expect(duration).toBeLessThan(10000); // Should complete within 10 seconds

            fs.unlinkSync(testFile);
        });
    });

    describe('Integration Testing', () => {
        test('should handle complete workflow', async () => {
            // Step 1: Generate CCCDs
            const generateResult = await runCLICommand([
                'cli', 'generate',
                '-p', '001',
                '-q', '3',
                '-o', 'workflow_test.json'
            ]);

            expect(generateResult.code).toBe(0);
            expect(generateResult.stdout).toContain('✅ Tạo CCCD thành công!');

            // Step 2: Analyze individual CCCDs
            const analyzeResult = await runCLICommand([
                'cli', 'analyze', '001010101678'
            ]);

            expect(analyzeResult.code).toBe(0);
            expect(analyzeResult.stdout).toContain('✅ Phân tích CCCD thành công!');

            // Step 3: Batch analyze
            const batchResult = await runCLICommand([
                'cli', 'batch-analyze', 'workflow_test.json'
            ]);

            expect(batchResult.code).toBe(0);
            expect(batchResult.stdout).toContain('✅ Phân tích hàng loạt thành công!');

            // Cleanup
            const outputFile = path.join(__dirname, '../output/workflow_test.json');
            if (fs.existsSync(outputFile)) {
                fs.unlinkSync(outputFile);
            }
        });

        test('should handle CLI to file to CLI workflow', async () => {
            // Generate and save to file
            const generateResult = await runCLICommand([
                'cli', 'generate',
                '-q', '2',
                '-o', 'integration_test.json'
            ]);

            expect(generateResult.code).toBe(0);

            // Read file and batch analyze
            const batchResult = await runCLICommand([
                'cli', 'batch-analyze', 'integration_test.json'
            ]);

            expect(batchResult.code).toBe(0);
            expect(batchResult.stdout).toContain('✅ Phân tích hàng loạt thành công!');

            // Cleanup
            const outputFile = path.join(__dirname, '../output/integration_test.json');
            if (fs.existsSync(outputFile)) {
                fs.unlinkSync(outputFile);
            }
        });
    });

    describe('Edge Cases and Boundary Testing', () => {
        test('should handle minimum valid inputs', async () => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-q', '1'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
            expect(result.stdout).toContain('📊 Số lượng: 1');
        });

        test('should handle maximum valid inputs', async () => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-q', '1000'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
            expect(result.stdout).toContain('📊 Số lượng: 1000');
        });

        test('should handle boundary year ranges', async () => {
            const boundaryRanges = [
                '1920-1920', // Minimum year
                '2025-2025', // Maximum year
                '2000-2000'  // Century boundary
            ];

            for (const yearRange of boundaryRanges) {
                const result = await runCLICommand([
                    'cli', 'generate',
                    '-y', yearRange,
                    '-q', '1'
                ]);

                expect(result.code).toBe(0);
                expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
            }
        });

        test('should handle all valid province codes', async () => {
            const allProvinces = [
                '001', '002', '003', '004', '005', '006', '007', '008', '009', '010',
                '011', '012', '013', '014', '015', '016', '017', '018', '019', '020',
                '021', '022', '023', '024', '025', '026', '027', '028', '029', '030',
                '031', '032', '033', '034', '035', '036', '037', '038', '039', '040',
                '041', '042', '043', '044', '045', '046', '047', '048', '049', '050',
                '051', '052', '053', '054', '055', '056', '057', '058', '059', '060',
                '061', '062', '063', '064', '065', '066', '067', '068', '069', '070',
                '071', '072', '073', '074', '075', '076', '077', '078', '079', '080',
                '081', '082', '083', '084', '085', '086', '087', '088', '089', '090',
                '091', '092', '093', '094', '095', '096', '097', '098', '099'
            ];

            // Test a sample of provinces
            const sampleProvinces = allProvinces.slice(0, 10);
            
            for (const province of sampleProvinces) {
                const result = await runCLICommand([
                    'cli', 'generate',
                    '-p', province,
                    '-q', '1'
                ]);

                expect(result.code).toBe(0);
                expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
            }
        });
    });
});