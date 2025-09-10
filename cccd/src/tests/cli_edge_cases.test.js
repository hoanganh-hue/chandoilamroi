/**
 * CLI Edge Cases Tests
 * Additional test cases for CLI edge cases and error scenarios
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('CLI Edge Cases Tests', () => {
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

    describe('Year Range Edge Cases', () => {
        test('should handle generate with year range 1920-1925', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-y', '1920-1925',
                '-q', '2'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
        });

        test('should handle generate with year range 2000-2000', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-y', '2000-2000',
                '-q', '2'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
        });

        test('should handle generate with year range 2020-2025', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-y', '2020-2025',
                '-q', '2'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
        });
    });

    describe('Province Coverage', () => {
        test('should handle analyze with different province codes', async() => {
            const provinces = ['001', '079', '024', '031', '048'];

            for (const province of provinces) {
                const result = await runCLICommand([
                    'cli', 'analyze', `${province}010101678`
                ]);

                expect(result.code).toBe(0);
                expect(result.stdout).toContain('✅ Phân tích CCCD thành công!');
            }
        });
    });

    describe('Duplicate Data Handling', () => {
        test('should handle batch analyze with duplicate CCCDs', async() => {
            const testFile = path.join(__dirname, 'duplicate_test.json');
            const testData = ['001010101678', '001010101678', '079010101678'];
            fs.writeFileSync(testFile, JSON.stringify(testData));

            const result = await runCLICommand([
                'cli', 'batch-analyze', testFile
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích hàng loạt thành công!');
            expect(result.stdout).toContain('📊 Tổng số: 3');

            fs.unlinkSync(testFile);
        });
    });

    describe('Configuration Validation', () => {
        test('should display all configuration sections', async() => {
            const result = await runCLICommand(['cli', 'config']);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('⚙️  Cấu hình hệ thống CCCD:');
            expect(result.stdout).toContain('📦 Module: CCCD Analysis & Generation');
            expect(result.stdout).toContain('🔢 Version: 1.0.0');
            expect(result.stdout).toContain('🏛️  Tổng số tỉnh:');
            expect(result.stdout).toContain('📋 Validation:');
            expect(result.stdout).toContain('🔧 Tính năng:');
        });
    });

    describe('Help Command Completeness', () => {
        test('should display all help sections', async() => {
            const result = await runCLICommand(['cli', 'help']);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('🆔 Hệ thống CCCD Analysis & Generation');
            expect(result.stdout).toContain('📋 Các lệnh có sẵn:');
            expect(result.stdout).toContain('🔧 generate');
            expect(result.stdout).toContain('🔍 analyze');
            expect(result.stdout).toContain('📊 batch-analyze');
            expect(result.stdout).toContain('⚙️  config');
            expect(result.stdout).toContain('📖 help');
            expect(result.stdout).toContain('📝 Ví dụ sử dụng:');
        });
    });

    describe('Performance Testing', () => {
        test('should handle generate with high quantity', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-q', '100'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
        });

        test('should handle large batch analysis', async() => {
            const testFile = path.join(__dirname, 'large_batch_test.json');
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
    });

    describe('Security Testing', () => {
        test('should handle SQL injection attempts', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-p', "001'; DROP TABLE users; --",
                '-q', '2'
            ]);

            expect([0, 1]).toContain(result.code);
        });

        test('should handle XSS attempts', async() => {
            const result = await runCLICommand([
                'cli', 'analyze', '001<script>alert("xss")</script>123456'
            ]);

            expect(result.code).toBe(1);
        });

        test('should handle path traversal attempts', async() => {
            const result = await runCLICommand([
                'cli', 'batch-analyze', '../../../etc/passwd'
            ]);

            expect(result.code).toBe(1);
        });
    });

    describe('Concurrent Operations', () => {
        test('should handle multiple generate commands', async() => {
            const promises = [
                runCLICommand(['cli', 'generate', '-q', '3', '-o', 'concurrent1.json']),
                runCLICommand(['cli', 'generate', '-q', '3', '-o', 'concurrent2.json'])
            ];

            const results = await Promise.all(promises);

            results.forEach(result => {
                expect(result.code).toBe(0);
                expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
            });
        });
    });

    describe('Resource Management', () => {
        test('should handle memory-intensive operations', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-q', '50',
                '-p', '001,079,024'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
        });
    });

    describe('Cross-platform Compatibility', () => {
        test('should handle Unicode characters', async() => {
            const result = await runCLICommand([
                'cli', 'analyze', '001010101678'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('Hà Nội');
        });
    });

    describe('Gender Options', () => {
        test('should handle all gender options', async() => {
            const genders = ['Nam', 'Nữ'];

            for (const gender of genders) {
                const result = await runCLICommand([
                    'cli', 'generate',
                    '-g', gender,
                    '-q', '2'
                ]);

                expect(result.code).toBe(0);
                expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
            }
        });
    });

    describe('Location Data Integration', () => {
        test('should handle analyze with location data', async() => {
            const result = await runCLICommand([
                'cli', 'analyze', '001010101678',
                '-d', '-l'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích CCCD thành công!');
            expect(result.stdout).toContain('🗺️  Vùng:');
        });
    });

    describe('File I/O Operations', () => {
        test('should handle complex file operations', async() => {
            const testFile = path.join(__dirname, 'complex_io_test.json');
            const largeData = Array.from({ length: 50 }, (_, i) => ({
                id: i,
                cccd: `001${String(i).padStart(9, '0')}678`
            }));
            fs.writeFileSync(testFile, JSON.stringify(largeData));

            const result = await runCLICommand([
                'cli', 'batch-analyze', testFile,
                '-o', 'complex_result.json'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Phân tích hàng loạt thành công!');

            fs.unlinkSync(testFile);
        });
    });

    describe('Error Recovery', () => {
        test('should handle network-like errors gracefully', async() => {
            // Test with invalid file that might cause read errors
            const result = await runCLICommand([
                'cli', 'batch-analyze', '/dev/null/invalid'
            ]);

            expect(result.code).toBe(1);
        });

        test('should handle malformed JSON in batch files', async() => {
            const testFile = path.join(__dirname, 'malformed_test.json');
            fs.writeFileSync(testFile, '{"invalid": json content}');

            const result = await runCLICommand([
                'cli', 'batch-analyze', testFile
            ]);

            expect(result.code).toBe(1);

            fs.unlinkSync(testFile);
        });
    });

    describe('Boundary Conditions', () => {
        test('should handle minimum valid inputs', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-q', '1'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
            expect(result.stdout).toContain('📊 Số lượng: 1');
        });

        test('should handle maximum valid province combinations', async() => {
            const result = await runCLICommand([
                'cli', 'generate',
                '-p', '001,079,024,031,048,056',
                '-q', '10'
            ]);

            expect(result.code).toBe(0);
            expect(result.stdout).toContain('✅ Tạo CCCD thành công!');
        });
    });
});