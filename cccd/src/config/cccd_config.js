
/**
 * CCCD Module Configuration
 * Cấu hình cho module phân tích và tạo CCCD
 */

const fs = require('fs');
const path = require('path');

class CCCDConfig {
    /**
     * Cấu hình cho module CCCD
     */

    // Cấu hình cơ bản
    static get DEFAULT_QUANTITY_LIMIT() { return 100; }
    static get MAX_QUANTITY_LIMIT() { return 1000; }
    static get MIN_BIRTH_YEAR() { return 1920; }
    static get MAX_BIRTH_YEAR() { return 2025; }

    // Cấu hình giới hạn số lượng CCCD
    static get INPUT_LIMITS() {
        return {
            'single_analysis': 1,           // Phân tích đơn lẻ
            'batch_analysis': 50,           // Phân tích hàng loạt
            'generation_single': 100,       // Tạo đơn lẻ
            'generation_batch': 500,        // Tạo hàng loạt
            'verification_single': 1,       // Xác minh đơn lẻ
            'verification_batch': 20        // Xác minh hàng loạt
        };
    }

    static get OUTPUT_LIMITS() {
        return {
            'max_results_per_request': 1000,    // Tối đa kết quả trả về
            'max_export_records': 10000,        // Tối đa bản ghi xuất file
            'max_cache_entries': 1000,          // Tối đa bản ghi cache
            'max_log_entries': 5000             // Tối đa bản ghi log
        };
    }

    // Cấu hình API
    static get API_ENDPOINTS() {
        return {
            'analyze': '/api/analyze-cccd',
            'generate': '/api/generate-cccd',
            'generate_legacy': '/api/generate/cccd',
            'options': '/api/generate/cccd/interactive'
        };
    }

    // Cấu hình validation
    static get VALIDATION_RULES() {
        return {
            'cccd_length': 12,
            'province_code_length': 3,
            'gender_century_code_length': 1,
            'birth_year_code_length': 2,
            'random_sequence_length': 6
        };
    }

    // Cấu hình file export
    static get EXPORT_CONFIG() {
        return {
            'allowed_formats': ['json', 'csv', 'xlsx', 'txt'],
            'default_format': 'json',
            'max_file_size_mb': 10,
            'output_directory': 'output/cccd'
        };
    }

    // Cấu hình logging
    static get LOGGING_CONFIG() {
        return {
            'log_level': 'INFO',
            'log_file': 'logs/cccd_analysis.log',
            'max_log_size_mb': 10,
            'backup_count': 5
        };
    }

    // Cấu hình cache
    static get CACHE_CONFIG() {
        return {
            'enabled': true,
            'ttl_seconds': 3600,  // 1 hour
            'max_entries': 1000
        };
    }

    // Cấu hình bảo mật
    static get SECURITY_CONFIG() {
        return {
            'rate_limit_per_minute': 60,
            'max_requests_per_hour': 1000,
            'allowed_origins': ['*'],
            'require_auth': true
        };
    }

    // Cấu hình database (nếu có)
    static get DATABASE_CONFIG() {
        return {
            'enabled': false,
            'connection_string': '',
            'table_name': 'cccd_analysis_log',
            'batch_size': 100
        };
    }

    static getProvinceCodes() {
        /**
         * Lấy danh sách mã tỉnh thành
         */
        return {
            '001': 'Hà Nội', '002': 'Hà Giang', '004': 'Cao Bằng', '006': 'Bắc Kạn',
            '008': 'Tuyên Quang', '010': 'Lào Cai', '011': 'Điện Biên', '012': 'Lai Châu',
            '014': 'Sơn La', '015': 'Yên Bái', '017': 'Hoà Bình', '019': 'Thái Nguyên',
            '020': 'Lạng Sơn', '022': 'Quảng Ninh', '024': 'Bắc Giang', '025': 'Phú Thọ',
            '026': 'Vĩnh Phúc', '027': 'Bắc Ninh', '030': 'Hải Dương', '031': 'Hải Phòng',
            '033': 'Hưng Yên', '034': 'Thái Bình', '035': 'Hà Nam', '036': 'Nam Định',
            '037': 'Ninh Bình', '038': 'Thanh Hóa', '040': 'Nghệ An', '042': 'Hà Tĩnh',
            '044': 'Quảng Bình', '045': 'Quảng Trị', '046': 'Thừa Thiên Huế',
            '048': 'Đà Nẵng', '049': 'Quảng Nam', '051': 'Quảng Ngãi', '052': 'Bình Định',
            '054': 'Phú Yên', '056': 'Khánh Hòa', '058': 'Ninh Thuận', '060': 'Bình Thuận',
            '062': 'Kon Tum', '064': 'Gia Lai', '066': 'Đắk Lắk', '067': 'Đắk Nông',
            '068': 'Lâm Đồng', '070': 'Bình Phước', '072': 'Tây Ninh', '074': 'Bình Dương',
            '075': 'Đồng Nai', '077': 'Bà Rịa - Vũng Tàu', '079': 'Thành phố Hồ Chí Minh',
            '080': 'Long An', '082': 'Tiền Giang', '083': 'Bến Tre', '084': 'Trà Vinh',
            '086': 'Vĩnh Long', '087': 'Đồng Tháp', '089': 'An Giang', '091': 'Kiên Giang',
            '092': 'Cần Thơ', '093': 'Hậu Giang', '094': 'Sóc Trăng', '095': 'Bạc Liêu',
            '096': 'Cà Mau'
        };
    }

    static getGenderCenturyCodes() {
        /**
         * Lấy mã giới tính và thế kỷ
         * QUY TẮC CHUẨN: Nam = Chẵn (0,2,4,6,8), Nữ = Lẻ (1,3,5,7,9)
         */
        return {
            0: { gender: 'Nam', century: 20, description: 'Nam, sinh thế kỷ 20 (1900-1999)' },
            1: { gender: 'Nữ', century: 20, description: 'Nữ, sinh thế kỷ 20 (1900-1999)' },
            2: { gender: 'Nam', century: 21, description: 'Nam, sinh thế kỷ 21 (2000-2099)' },
            3: { gender: 'Nữ', century: 21, description: 'Nữ, sinh thế kỷ 21 (2000-2099)' },
            4: { gender: 'Nam', century: 22, description: 'Nam, sinh thế kỷ 22 (2100-2199)' },
            5: { gender: 'Nữ', century: 22, description: 'Nữ, sinh thế kỷ 22 (2100-2199)' },
            6: { gender: 'Nam', century: 23, description: 'Nam, sinh thế kỷ 23 (2200-2299)' },
            7: { gender: 'Nữ', century: 23, description: 'Nữ, sinh thế kỷ 23 (2200-2299)' },
            8: { gender: 'Nam', century: 24, description: 'Nam, sinh thế kỷ 24 (2300-2399)' },
            9: { gender: 'Nữ', century: 24, description: 'Nữ, sinh thế kỷ 24 (2300-2399)' }
        };
    }

    static getRegionMapping() {
        /**
         * Lấy mapping vùng miền theo mã tỉnh
         */
        return {
            'Miền Bắc': [
                '001', '002', '004', '006', '008', '010', '011', '012', '014', '015',
                '017', '019', '020', '022', '024', '025', '026', '027', '030', '031',
                '033', '034', '035', '036', '037', '038', '040', '042'
            ],
            'Miền Trung': [
                '044', '045', '046', '048', '049', '051', '052', '054', '056', '058',
                '060', '062', '064', '066', '067', '068'
            ],
            'Miền Nam': [
                '070', '072', '074', '075', '077', '079', '080', '082', '083', '084',
                '086', '087', '089', '091', '092', '093', '094', '095', '096'
            ]
        };
    }

    static getLegalBasis() {
        /**
         * Lấy cơ sở pháp lý
         */
        return {
            'decree': 'Nghị định số 137/2015/NĐ-CP',
            'circular': 'Thông tư số 07/2016/TT-BCA',
            'description': 'Quy định về số định danh cá nhân và cấu trúc CCCD',
            'effective_date': '01/01/2016'
        };
    }

    static getStructureBreakdown() {
        /**
         * Lấy mô tả cấu trúc CCCD
         */
        return {
            'positions_1_3': 'Mã tỉnh/thành phố nơi đăng ký khai sinh',
            'position_4': 'Mã thế kỷ và giới tính',
            'positions_5_6': 'Hai số cuối của năm sinh',
            'positions_7_12': 'Dãy số ngẫu nhiên (6 chữ số)'
        };
    }

    static validateConfig() {
        /**
         * Validate cấu hình
         */
        const validationResult = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Kiểm tra output directory
        const outputDir = CCCDConfig.EXPORT_CONFIG.output_directory;
        if (!fs.existsSync(outputDir)) {
            try {
                fs.mkdirSync(outputDir, { recursive: true });
                validationResult.warnings.push(`Created output directory: ${outputDir}`);
            } catch (e) {
                validationResult.valid = false;
                validationResult.errors.push(`Cannot create output directory: ${e.message}`);
            }
        }

        // Kiểm tra log directory
        const logFile = CCCDConfig.LOGGING_CONFIG.log_file;
        const logDir = path.dirname(logFile);
        if (!fs.existsSync(logDir)) {
            try {
                fs.mkdirSync(logDir, { recursive: true });
                validationResult.warnings.push(`Created log directory: ${logDir}`);
            } catch (e) {
                validationResult.valid = false;
                validationResult.errors.push(`Cannot create log directory: ${e.message}`);
            }
        }

        // Kiểm tra giới hạn
        if (CCCDConfig.DEFAULT_QUANTITY_LIMIT > CCCDConfig.MAX_QUANTITY_LIMIT) {
            validationResult.valid = false;
            validationResult.errors.push('Default quantity limit cannot be greater than max limit');
        }

        if (CCCDConfig.MIN_BIRTH_YEAR >= CCCDConfig.MAX_BIRTH_YEAR) {
            validationResult.valid = false;
            validationResult.errors.push('Min birth year must be less than max birth year');
        }

        return validationResult;
    }

    static getInputLimits() {
        /**
         * Lấy giới hạn đầu vào
         */
        return { ...CCCDConfig.INPUT_LIMITS };
    }

    static getOutputLimits() {
        /**
         * Lấy giới hạn đầu ra
         */
        return { ...CCCDConfig.OUTPUT_LIMITS };
    }

    static validateInputLimit(operationType, count) {
        /**
         * Validate giới hạn đầu vào
         */
        const limits = CCCDConfig.getInputLimits();
        const maxLimit = limits[operationType] !== undefined ? limits[operationType] : 1;

        if (count > maxLimit) {
            return {
                valid: false,
                error: `Số lượng vượt quá giới hạn cho phép. Tối đa: ${maxLimit}`,
                maxLimit: maxLimit,
                requested: count
            };
        }

        return {
            valid: true,
            maxLimit: maxLimit,
            requested: count
        };
    }

    static validateOutputLimit(outputType, count) {
        /**
         * Validate giới hạn đầu ra
         */
        const limits = CCCDConfig.getOutputLimits();
        const maxLimit = limits[outputType] !== undefined ? limits[outputType] : 1000;

        if (count > maxLimit) {
            return {
                valid: false,
                error: `Số lượng kết quả vượt quá giới hạn. Tối đa: ${maxLimit}`,
                maxLimit: maxLimit,
                requested: count
            };
        }

        return {
            valid: true,
            maxLimit: maxLimit,
            requested: count
        };
    }

    static getConfigSummary() {
        /**
         * Lấy tóm tắt cấu hình
         */
        return {
            module: 'CCCD Analysis & Generation',
            version: '1.0.0',
            totalProvinces: Object.keys(CCCDConfig.getProvinceCodes()).length,
            quantityLimits: {
                default: CCCDConfig.DEFAULT_QUANTITY_LIMIT,
                max: CCCDConfig.MAX_QUANTITY_LIMIT
            },
            birthYearRange: {
                min: CCCDConfig.MIN_BIRTH_YEAR,
                max: CCCDConfig.MAX_BIRTH_YEAR
            },
            inputLimits: CCCDConfig.getInputLimits(),
            outputLimits: CCCDConfig.getOutputLimits(),
            features: {
                analysis: true,
                generation: true,
                validation: true,
                export: true,
                caching: CCCDConfig.CACHE_CONFIG.enabled,
                database: CCCDConfig.DATABASE_CONFIG.enabled
            },
            apiEndpoints: Object.values(CCCDConfig.API_ENDPOINTS),
            legalCompliance: CCCDConfig.getLegalBasis()
        };
    }
}

module.exports = CCCDConfig;

