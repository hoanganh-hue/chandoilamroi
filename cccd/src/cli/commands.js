/**
 * CLI Commands - Updated
 * Command line interface cho hệ thống CCCD
 */

const { Command } = require('commander');
const CCCDGeneratorService = require('../services/cccd_generator_service');
const CCCDAnalyzerService = require('../services/cccd_analyzer_service');
const CCCDConfig = require('../config/cccd_config');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const { formatOutput, saveToFile } = require('./cli_helpers');

const program = new Command('cli');

// Initialize services
const generatorService = new CCCDGeneratorService();
const analyzerService = new CCCDAnalyzerService();

// Generate command
program
    .command('generate')
    .description('Tạo danh sách CCCD')
    .option('-p, --provinces <codes>', 'Mã tỉnh (phân cách bằng dấu phẩy)', '001')
    .option('-g, --gender <gender>', 'Giới tính (Nam/Nữ)')
    .option('-y, --year-range <range>', 'Khoảng năm sinh (ví dụ: 1990-2000)')
    .option('-q, --quantity <number>', 'Số lượng CCCD cần tạo', '10')
    .option('-o, --output <file>', 'Lưu kết quả vào file')
    .option('-f, --format <format>', 'Định dạng output (json/table)', 'json')
    .action(async(options) => {
        try {
            logger.info('CLI Generate command started', options);

            // Parse provinces
            const provinceCodes = options.provinces.split(',').map(code => code.trim());

            // Parse year range
            let birthYearRange = null;
            if (options.yearRange) {
                const [start, end] = options.yearRange.split('-').map(y => parseInt(y.trim(), 10));
                if (start && end) {
                    birthYearRange = [start, end];
                }
            }

            const quantity = parseInt(options.quantity, 10);

            logger.logCCCDOperation('CLI Generation', {
                provinceCodes,
                gender: options.gender,
                birthYearRange,
                quantity
            });

            const results = generatorService.generateCccdList(
                provinceCodes,
                options.gender,
                birthYearRange,
                null,
                quantity
            );

            if (results.error) {
                console.error('❌ Lỗi:', results.error);
                logger.error('CLI Generation failed', { error: results.error });
                process.exit(1);
            }

            console.log('✅ Tạo CCCD thành công!');
            console.log(`📊 Số lượng: ${results.length}`);

            if (results[0]?._metadata) {
                console.log('📋 Metadata:', results[0]._metadata);
            }

            const formattedOutput = formatOutput(results, options.format);
            console.log('\n📄 Kết quả:');
            console.log(formattedOutput);

            if (options.output) {
                const filepath = saveToFile(results, options.output);
                console.log(`💾 Đã lưu vào: ${filepath}`);
            }

            logger.logCCCDOperation('CLI Generation Success', {
                generatedCount: results.length,
                savedToFile: !!options.output
            });

        } catch (error) {
            console.error('❌ Lỗi hệ thống:', error.message);
            logger.logError(error, { command: 'generate' });
            process.exit(1);
        }
    });

// Analyze command
program
    .command('analyze <cccd>')
    .description('Phân tích một CCCD')
    .option('-d, --detailed', 'Phân tích chi tiết', true)
    .option('-l, --location', 'Hiển thị thông tin địa lý', true)
    .option('-o, --output <file>', 'Lưu kết quả vào file')
    .option('-f, --format <format>', 'Định dạng output (json/table)', 'json')
    .action(async(cccd, options) => {
        try {
            logger.info('CLI Analyze command started', { cccd, options });

            logger.logCCCDOperation('CLI Analysis', { cccd });

            const analysis = analyzerService.analyzeCccdStructure(
                cccd,
                options.detailed,
                options.location
            );

            if (!analysis.valid) {
                console.error('❌ CCCD không hợp lệ:', analysis.error);
                logger.warn('CLI Analysis failed', { cccd, error: analysis.error });
                process.exit(1);
            }

            console.log('✅ Phân tích CCCD thành công!');
            console.log(`🆔 CCCD: ${analysis.cccd}`);
            console.log(`📍 Tỉnh: ${analysis.summary.provinceName}`);
            console.log(`👤 Giới tính: ${analysis.summary.gender}`);
            console.log(`📅 Ngày sinh: ${analysis.summary.birthDate}`);
            console.log(`🎂 Tuổi hiện tại: ${analysis.summary.currentAge}`);

            if (analysis.locationInfo) {
                console.log(`🗺️  Vùng: ${analysis.locationInfo.region}`);
            }

            const formattedOutput = formatOutput(analysis, options.format);
            console.log('\n📄 Kết quả chi tiết:');
            console.log(formattedOutput);

            if (options.output) {
                const filepath = saveToFile(analysis, options.output);
                console.log(`💾 Đã lưu vào: ${filepath}`);
            }

            logger.logCCCDOperation('CLI Analysis Success', {
                cccd,
                valid: analysis.valid,
                province: analysis.summary.provinceName
            });

        } catch (error) {
            console.error('❌ Lỗi hệ thống:', error.message);
            logger.logError(error, { command: 'analyze', cccd });
            process.exit(1);
        }
    });

// Batch analyze command
program
    .command('batch-analyze <file>')
    .description('Phân tích hàng loạt CCCD từ file')
    .option('-o, --output <file>', 'Lưu kết quả vào file')
    .option('-f, --format <format>', 'Định dạng output (json/table)', 'json')
    .action(async(file, options) => {
        try {
            logger.info('CLI Batch Analyze command started', { file, options });

            if (!fs.existsSync(file)) {
                console.error('❌ File không tồn tại:', file);
                process.exit(1);
            }

            const fileContent = fs.readFileSync(file, 'utf8');
            let cccdList;

            try {
                cccdList = JSON.parse(fileContent);
            } catch (e) {
                // Try to parse as line-separated text
                cccdList = fileContent.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length === 12 && /^\d+$/.test(line));
            }

            if (!Array.isArray(cccdList) || cccdList.length === 0) {
                console.error('❌ File không chứa danh sách CCCD hợp lệ');
                process.exit(1);
            }

            logger.logCCCDOperation('CLI Batch Analysis', {
                cccdCount: cccdList.length,
                sourceFile: file
            });

            const results = analyzerService.batchAnalyze(cccdList);

            if (results.error) {
                console.error('❌ Lỗi:', results.error);
                logger.error('CLI Batch Analysis failed', { error: results.error });
                process.exit(1);
            }

            console.log('✅ Phân tích hàng loạt thành công!');
            console.log(`📊 Tổng số: ${results.totalAnalyzed}`);
            console.log(`✅ Hợp lệ: ${results.validCount}`);
            console.log(`❌ Không hợp lệ: ${results.invalidCount}`);
            console.log(`📈 Tỷ lệ hợp lệ: ${results.validityRate.toFixed(2)}%`);

            if (results.summary) {
                console.log('\n📋 Thống kê:');
                console.log(`📍 Tỉnh phổ biến: ${results.summary.mostCommonProvince.name} (${results.summary.mostCommonProvince.count})`);
                console.log('👥 Phân bố giới tính:', results.summary.genderDistribution);
                console.log('🎂 Phân bố tuổi:', results.summary.ageDistribution);
            }

            const formattedOutput = formatOutput(results, options.format);
            console.log('\n📄 Kết quả chi tiết:');
            console.log(formattedOutput);

            if (options.output) {
                const filepath = saveToFile(results, options.output);
                console.log(`💾 Đã lưu vào: ${filepath}`);
            }

            logger.logCCCDOperation('CLI Batch Analysis Success', {
                totalAnalyzed: results.totalAnalyzed,
                validityRate: results.validityRate
            });

        } catch (error) {
            console.error('❌ Lỗi hệ thống:', error.message);
            logger.logError(error, { command: 'batch-analyze', file });
            process.exit(1);
        }
    });

// Config command
program
    .command('config')
    .description('Hiển thị cấu hình hệ thống')
    .option('-f, --format <format>', 'Định dạng output (json/table)', 'json')
    .action(async(options) => {
        try {
            logger.info('CLI Config command started');

            const config = CCCDConfig.getConfigSummary();
            const validation = CCCDConfig.validateConfig();

            console.log('⚙️  Cấu hình hệ thống CCCD:');
            console.log(`📦 Module: ${config.module}`);
            console.log(`🔢 Version: ${config.version}`);
            console.log(`🏛️  Tổng số tỉnh: ${config.totalProvinces}`);
            console.log(`📊 Giới hạn số lượng: ${config.quantityLimits.default} - ${config.quantityLimits.max}`);
            console.log(`📅 Khoảng năm sinh: ${config.birthYearRange.min} - ${config.birthYearRange.max}`);

            console.log('\n🔧 Tính năng:');
            Object.entries(config.features).forEach(([key, value]) => {
                console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
            });

            console.log('\n📋 Validation:');
            console.log(`  ${validation.valid ? '✅' : '❌'} Cấu hình: ${validation.valid ? 'Hợp lệ' : 'Có lỗi'}`);
            if (validation.errors.length > 0) {
                console.log('  ❌ Lỗi:', validation.errors);
            }
            if (validation.warnings.length > 0) {
                console.log('  ⚠️  Cảnh báo:', validation.warnings);
            }

            const formattedOutput = formatOutput({ config, validation }, options.format);
            console.log('\n📄 Chi tiết:');
            console.log(formattedOutput);

            logger.info('CLI Config command completed');

        } catch (error) {
            console.error('❌ Lỗi hệ thống:', error.message);
            logger.logError(error, { command: 'config' });
            process.exit(1);
        }
    });

// Help command
program
    .command('help')
    .description('Hiển thị hướng dẫn sử dụng')
    .action(() => {
        console.log(`
🆔 Hệ thống CCCD Analysis & Generation
====================================

📋 Các lệnh có sẵn:

🔧 generate          Tạo danh sách CCCD
   -p, --provinces    Mã tỉnh (phân cách bằng dấu phẩy)
   -g, --gender       Giới tính (Nam/Nữ)
   -y, --year-range   Khoảng năm sinh (ví dụ: 1990-2000)
   -q, --quantity     Số lượng CCCD cần tạo
   -o, --output       Lưu kết quả vào file
   -f, --format       Định dạng output (json/table)

🔍 analyze <cccd>     Phân tích một CCCD
   -d, --detailed     Phân tích chi tiết
   -l, --location     Hiển thị thông tin địa lý
   -o, --output       Lưu kết quả vào file
   -f, --format       Định dạng output (json/table)

📊 batch-analyze <file>  Phân tích hàng loạt CCCD từ file
   -o, --output       Lưu kết quả vào file
   -f, --format       Định dạng output (json/table)

⚙️  config            Hiển thị cấu hình hệ thống
   -f, --format       Định dạng output (json/table)

📖 help              Hiển thị hướng dẫn này

📝 Ví dụ sử dụng:
   node src/main.js cli generate -p "001,079" -g "Nam" -q 5
   node src/main.js cli analyze 001012345678
   node src/main.js cli batch-analyze cccd_list.txt
   node src/main.js cli config

📚 Tài liệu: https://github.com/your-org/cccd-analysis-system
        `);
    });

module.exports = program;