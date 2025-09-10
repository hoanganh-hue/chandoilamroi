/**
 * CLI Integration Tests
 * Tests cho CLI commands
 */

const { spawn } = require('child_process');
const path = require('path');

describe('CLI Integration Tests', () => {
    const mainScript = path.join(__dirname, '../main.js');

    const runCLICommand = (args) => {
        return new Promise((resolve, reject) => {
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

    describe('Generate Command', () => {
        test('should generate CCCDs with default parameters', async() => {
            const result = await runCLICommand(['cli', 'generate', '-q', '2']);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
            expect(result.stdout).toContain('📊 Số lượng: 2');
            expect(result.stdout).toContain('cccd_number');
        });

        test('should generate CCCDs with specific parameters', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-p', '001,079',
                '-g', 'Nam',
                '-y', '1990-2000',
                '-q', '3'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
            expect(result.stdout).toContain('📊 Số lượng: 3');

            // Check that all generated CCCDs are male
            const lines = result.stdout.split('\n');
            const cccdLines = lines.filter(line => line.includes('"gender"'));
            expect(cccdLines.length).toBeGreaterThan(0);
            cccdLines.forEach(line => {
                expect(line).toContain('"gender": "Nam"');
            });
        });

        test('should save results to file', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-q', '2',
                '-o', 'test_output.json'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('💾 Đã lưu vào:');
            expect(result.stdout).toContain('test_output.json');
        });

        test('should handle invalid parameters gracefully', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-q', '2000' // Exceeds limit
            ]);

            expect(result.code).toBe(1);
            expect(result.stdout).toContain('❌ Lỗi:') || expect(result.stderr).toContain('❌ Lỗi:');
        });
    });

    describe('Analyze Command', () => {
        test('should analyze valid CCCD', async() => {
            const result = await runCLICommand([
                'cli', 'analyze', '001010101678'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích CCCD thành công!');
            expect(result.stdout).toContain('🆔 CCCD: 001010101678');
            expect(result.stdout).toContain('📍 Tỉnh: Hà Nội');
            expect(result.stdout).toContain('👤 Giới tính: Nam');
        });

        test('should analyze CCCD with detailed info', async() => {
            const result = await runCLICommand([
                'cli', 'analyze', '001010101678',
                '-d', '-l'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích CCCD thành công!');
            expect(result.stdout).toContain('🗺️  Vùng: Miền Bắc');
        });

        test('should save analysis to file', async() => {
            const result = await runCLICommand([
                'cli', 'analyze', '001010101678',
                '-o', 'test_analysis.json'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('💾 Đã lưu vào:');
            expect(result.stdout).toContain('test_analysis.json');
        });

        test('should handle invalid CCCD', async() => {
            const result = await runCLICommand([
                'cli', 'analyze', 'invalid-cccd'
            ]);

            expect(result.code).toBe(1);
            expect(result.stdout).toContain('❌ CCCD không hợp lệ:') || expect(result.stderr).toContain('❌ CCCD không hợp lệ:');
        });
    });

    describe('Batch Analyze Command', () => {
        test('should analyze batch from JSON file', async() => {
            // Create a test file with CCCD list
            const fs = require('fs');
            const testFile = path.join(__dirname, 'test_cccd_list.json');
            const testData = ['001010101678', '079010101678'];

            fs.writeFileSync(testFile, JSON.stringify(testData));

            const result = await runCLICommand([
                'cli', 'batch-analyze', testFile
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích hàng loạt thành công!');
            expect(result.stdout).toContain('📊 Tổng số: 2');

            // Clean up
            fs.unlinkSync(testFile);
        });

        test('should analyze batch from text file', async() => {
            // Create a test file with CCCD list
            const fs = require('fs');
            const testFile = path.join(__dirname, 'test_cccd_list.txt');
            const testData = '001010101678\n079010101678\n';

            fs.writeFileSync(testFile, testData);

            const result = await runCLICommand([
                'cli', 'batch-analyze', testFile
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích hàng loạt thành công!');
            expect(result.stdout).toContain('📊 Tổng số: 2');

            // Clean up
            fs.unlinkSync(testFile);
        });

        test('should handle non-existent file', async() => {
            const result = await runCLICommand([
                'cli', 'batch-analyze', 'nonexistent.json'
            ]);

            expect(result.code).toBe(1);
            expect(result.stdout).toContain('❌ File không tồn tại:') || expect(result.stderr).toContain('❌ File không tồn tại:');
        });
    });

    describe('Config Command', () => {
        test('should display system configuration', async() => {
            const result = await runCLICommand(['cli', 'config']);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('⚙️  Cấu hình hệ thống CCCD:');
            expect(result.stdout).toContain('📦 Module: CCCD Analysis & Generation');
            expect(result.stdout).toContain('🔢 Version: 1.0.0');
            expect(result.stdout).toContain('🏛️  Tổng số tỉnh:');
        });

        test('should display configuration in JSON format', async() => {
            const result = await runCLICommand(['cli', 'config', '-f', 'json']);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('⚙️  Cấu hình hệ thống CCCD:');
            expect(result.stdout).toContain('"module": "CCCD Analysis & Generation"');
        });
    });

    describe('Help Command', () => {
        test('should display help information', async() => {
            const result = await runCLICommand(['cli', 'help']);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('🆔 Hệ thống CCCD Analysis & Generation');
            expect(result.stdout).toContain('📋 Các lệnh có sẵn:');
            expect(result.stdout).toContain('🔧 generate');
            expect(result.stdout).toContain('🔍 analyze');
            expect(result.stdout).toContain('📊 batch-analyze');
        });
    });

    describe('Error Handling', () => {
        test('should handle unknown command', async() => {
            const result = await runCLICommand(['cli', 'unknown-command']);

            expect(result.code).toBe(1);
        });

        test('should handle missing required arguments', async() => {
            const result = await runCLICommand(['cli', 'analyze']);

            expect(result.code).toBe(1);
        });

        test('should handle invalid year range format', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-y', 'invalid-range',
                '-q', '2'
            ]);

            expect(result.code).toBe(0); // Should still work with default year range
        });

        test('should handle invalid quantity format', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-q', 'not-a-number'
            ]);

            expect(result.code).toBe(1);
        });

        test('should handle invalid province codes', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-p', '999,888',
                '-q', '2'
            ]);

            expect(result.code).toBe(1);
            expect(result.stdout).toContain('❌ Lỗi:') || expect(result.stderr).toContain('❌ Lỗi:');
        });

        test('should handle invalid gender', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-g', 'InvalidGender',
                '-q', '2'
            ]);

            expect(result.code).toBe(1);
        });

        test('should handle file write errors', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-q', '2',
                '-o', '/invalid/path/file.json'
            ]);

            // Should still succeed but may have file write issues
            expect(result.code).toBe(0);
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty province codes', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-p', '',
                '-q', '2'
            ]);

            expect(result.code).toBe(1);
        });

        test('should handle very large quantity', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-q', '10000'
            ]);

            expect(result.code).toBe(1);
            expect(result.stdout).toContain('❌ Lỗi:') || expect(result.stderr).toContain('❌ Lỗi:');
        });

        test('should handle zero quantity', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-q', '0'
            ]);

            expect(result.code).toBe(1);
        });

        test('should handle negative quantity', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-q', '-5'
            ]);

            expect(result.code).toBe(1);
        });

        test('should handle empty CCCD input', async() => {
            const result = await runCLICommand([
                'cli', 'analyze', ''
            ]);

            expect(result.code).toBe(1);
        });

        test('should handle CCCD with wrong length', async() => {
            const result = await runCLICommand([
                'cli', 'analyze', '123456789'
            ]);

            expect(result.code).toBe(1);
            expect(result.stdout).toContain('❌ CCCD không hợp lệ:') || expect(result.stderr).toContain('❌ CCCD không hợp lệ:');
        });

        test('should handle CCCD with non-numeric characters', async() => {
            const result = await runCLICommand([
                'cli', 'analyze', '001abc123456'
            ]);

            expect(result.code).toBe(1);
            expect(result.stdout).toContain('❌ CCCD không hợp lệ:') || expect(result.stderr).toContain('❌ CCCD không hợp lệ:');
        });

        test('should handle batch analyze with empty file', async() => {
            const fs = require('fs');
            const testFile = path.join(__dirname, 'empty_test.json');
            fs.writeFileSync(testFile, '[]');

            const result = await runCLICommand([
                'cli', 'batch-analyze', testFile
            ]);

            expect(result.code).toBe(1);
            expect(result.stdout).toContain('❌ File không chứa danh sách CCCD hợp lệ') || expect(result.stderr).toContain('❌ File không chứa danh sách CCCD hợp lệ');

            fs.unlinkSync(testFile);
        });

        test('should handle batch analyze with invalid JSON', async() => {
            const fs = require('fs');
            const testFile = path.join(__dirname, 'invalid_test.txt');
            fs.writeFileSync(testFile, 'invalid json content');

            const result = await runCLICommand([
                'cli', 'batch-analyze', testFile
            ]);

            expect(result.code).toBe(1);
            expect(result.stdout).toContain('❌ File không chứa danh sách CCCD hợp lệ') || expect(result.stderr).toContain('❌ File không chứa danh sách CCCD hợp lệ');

            fs.unlinkSync(testFile);
        });

        test('should handle batch analyze with mixed valid/invalid CCCDs', async() => {
            const fs = require('fs');
            const testFile = path.join(__dirname, 'mixed_test.txt');
            fs.writeFileSync(testFile, '001010101678\ninvalid-cccd\n079010101678\n');

            const result = await runCLICommand([
                'cli', 'batch-analyze', testFile
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích hàng loạt thành công!');
            expect(result.stdout).toContain('📊 Tổng số: 3');

            fs.unlinkSync(testFile);
        });
    });

    describe('Format Options', () => {
        test('should output in table format', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-q', '2',
                '-f', 'table'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
            expect(result.stdout).toContain('|');
        });

        test('should output analysis in table format', async() => {
            const result = await runCLICommand([
                'cli', 'analyze', '001010101678',
                '-f', 'table'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích CCCD thành công!');
        });

        test('should output config in table format', async() => {
            const result = await runCLICommand([
                'cli', 'config',
                '-f', 'table'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('⚙️  Cấu hình hệ thống CCCD:');
        });

        test('should output batch analysis in table format', async() => {
            const fs = require('fs');
            const testFile = path.join(__dirname, 'format_test.json');
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

    describe('File Operations', () => {
        test('should create output directory if not exists', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-q', '2',
                '-o', 'test_output_dir/test_file.json'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('💾 Đã lưu vào:');
        });

        test('should handle file overwrite', async() => {
            const fs = require('fs');
            const testFile = path.join(__dirname, 'overwrite_test.json');
            
            // Create initial file
            fs.writeFileSync(testFile, '{"test": "data"}');

            const result = await runCLICommand([
                'cli', 'generate',
                '-q', '2',
                '-o', 'overwrite_test.json'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('💾 Đã lưu vào:');

            // Verify file was overwritten
            const content = fs.readFileSync(testFile, 'utf8');
            expect(content).not.toContain('{"test": "data"}');

            fs.unlinkSync(testFile);
        });
    });

    describe('Complex Scenarios', () => {
        test('should handle multiple provinces with different genders', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-p', '001,079,024',
                '-g', 'Nữ',
                '-y', '1985-1995',
                '-q', '5'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
            expect(result.stdout).toContain('📊 Số lượng: 5');
        });

        test('should handle analyze with all options', async() => {
            const result = await runCLICommand([
                'cli', 'analyze', '001010101678',
                '-d', '-l',
                '-o', 'full_analysis.json',
                '-f', 'json'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích CCCD thành công!');
            expect(result.stdout).toContain('💾 Đã lưu vào:');
        });

        test('should handle batch analyze with large dataset', async() => {
            const fs = require('fs');
            const testFile = path.join(__dirname, 'large_dataset.json');
            const testData = Array.from({ length: 50 }, (_, i) => 
                `001${String(i).padStart(9, '0')}678`
            );
            fs.writeFileSync(testFile, JSON.stringify(testData));

            const result = await runCLICommand([
                'cli', 'batch-analyze', testFile,
                '-o', 'large_analysis.json'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích hàng loạt thành công!');
            expect(result.stdout).toContain('📊 Tổng số: 50');

            fs.unlinkSync(testFile);
        });
    });
});