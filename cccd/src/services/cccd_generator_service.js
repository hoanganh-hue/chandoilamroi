
/**
 * CCCD Generator Service
 * Tạo danh sách CCCD theo quy định pháp luật Việt Nam
 */

const random = require('random');
const CCCDConfig = require('../config/cccd_config');

class CCCDGeneratorService {
    /**
     * CCCD generator service
     */
    constructor() {
        this.provinces = CCCDConfig.getProvinceCodes();
        this.genderCenturyCodes = CCCDConfig.getGenderCenturyCodes();
    }

    generateCccdList(provinceCodes, gender = null, birthYear = null, _genderRatio = null, quantity = 10) {
        try {
            const Config = require('../config/cccd_config');

            // Enhanced input validation
            if (typeof quantity !== 'number' || quantity < 1) {
                return {
                    error: 'Số lượng phải là số nguyên dương',
                    maxLimit: Config.getOutputLimits().generation_single,
                    requested: quantity
                };
            }

            if (provinceCodes && !Array.isArray(provinceCodes)) {
                return {
                    error: 'Mã tỉnh phải là mảng',
                    maxLimit: Config.getOutputLimits().generation_single,
                    requested: quantity
                };
            }

            if (provinceCodes && provinceCodes.length === 0) {
                return {
                    error: 'Danh sách mã tỉnh không được rỗng',
                    maxLimit: Config.getOutputLimits().generation_single,
                    requested: quantity
                };
            }

            if (gender && !['Nam', 'Nữ'].includes(gender)) {
                return {
                    error: 'Giới tính phải là "Nam" hoặc "Nữ"',
                    maxLimit: Config.getOutputLimits().generation_single,
                    requested: quantity
                };
            }

            if (birthYear && (typeof birthYear !== 'number' || birthYear < Config.MIN_BIRTH_YEAR || birthYear > Config.MAX_BIRTH_YEAR)) {
                return {
                    error: `Năm sinh phải là số nguyên trong khoảng ${Config.MIN_BIRTH_YEAR}-${Config.MAX_BIRTH_YEAR}`,
                    maxLimit: Config.getOutputLimits().generation_single,
                    requested: quantity
                };
            }

            const inputValidation = Config.validateInputLimit('generation_single', quantity);
            if (!inputValidation.valid) {
                return {
                    error: inputValidation.error,
                    maxLimit: inputValidation.maxLimit,
                    requested: inputValidation.requested
                };
            }

            const maxQuantity = inputValidation.maxLimit;
            const actualQuantity = Math.min(quantity, maxQuantity);

            const results = [];
            const generatedCCCDS = new Set(); // Để đảm bảo tính duy nhất

            for (let i = 0; i < actualQuantity; i++) {
                try {
                    // Validate province codes if provided
                    let provinceCode;
                    if (provinceCodes) {
                        const validProvinces = provinceCodes.filter(code => code in this.provinces);
                        if (validProvinces.length === 0) {
                            return {
                                error: 'Không có mã tỉnh hợp lệ trong danh sách',
                                maxLimit: Config.getOutputLimits().generation_single,
                                requested: quantity
                            };
                        }
                        provinceCode = validProvinces[Math.floor(Math.random() * validProvinces.length)];
                    } else {
                        provinceCode = '001'; // Default to Hanoi
                    }

                    const selectedBirthYear = birthYear || random.int(CCCDConfig.MIN_BIRTH_YEAR, CCCDConfig.MAX_BIRTH_YEAR);

                    let genderCenturyCode;
                    if (selectedBirthYear < 2000) {
                        if (gender === 'Nam') {
                            genderCenturyCode = 0; // Nam thế kỷ 20
                        } else if (gender === 'Nữ') {
                            genderCenturyCode = 1; // Nữ thế kỷ 20
                        } else {
                            genderCenturyCode = Math.random() < 0.5 ? 0 : 1;
                        }
                    } else {
                        if (gender === 'Nam') {
                            genderCenturyCode = 2; // Nam thế kỷ 21
                        } else if (gender === 'Nữ') {
                            genderCenturyCode = 3; // Nữ thế kỷ 21
                        } else {
                            genderCenturyCode = Math.random() < 0.5 ? 2 : 3;
                        }
                    }

                    const yearCode = String(selectedBirthYear % 100).padStart(2, '0');
                    const randomSequence = String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0');

                    let cccd;
                    let attempts = 0;
                    const maxAttempts = 10000; // Tránh vòng lặp vô hạn

                    do {
                        const randomSequence = String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0');
                        cccd = `${provinceCode}${genderCenturyCode}${yearCode}${randomSequence}`;
                        attempts++;
                    } while (generatedCCCDS.has(cccd) && attempts < maxAttempts);

                    if (attempts >= maxAttempts) {
                        console.warn(`Không thể tạo CCCD duy nhất sau ${maxAttempts} lần thử cho tỉnh ${provinceCode}, năm ${selectedBirthYear}`);
                        continue; // Bỏ qua và tiếp tục với CCCD tiếp theo
                    }

                    generatedCCCDS.add(cccd);

                    const genderText = [0, 2, 4, 6, 8].includes(genderCenturyCode) ? 'Nam' : 'Nữ';
                    const centuryText = [0, 1].includes(genderCenturyCode) ? '20' : '21';

                    results.push({
                        cccd_number: cccd,
                        province_code: provinceCode,
                        province_name: this.provinces[provinceCode] || 'Unknown',
                        gender: genderText,
                        birth_year: selectedBirthYear,
                        century: centuryText,
                        gender_century_code: genderCenturyCode,
                        random_sequence: cccd.substring(6) // 6 chữ số cuối
                    });
                } catch (error) {
                    // Log error but continue with other CCCDs
                    console.warn(`Error generating CCCD ${i + 1}:`, error.message);
                    continue;
                }
            }

            const outputValidation = Config.validateOutputLimit('max_results_per_request', results.length);
            if (!outputValidation.valid) {
                results.length = outputValidation.maxLimit;
            }

            if (results.length > 0) {
                results[0]._metadata = {
                    input_limit: inputValidation.maxLimit,
                    output_limit: outputValidation.maxLimit,
                    requested_quantity: quantity,
                    actual_quantity: results.length,
                    truncated: quantity > inputValidation.maxLimit || results.length > outputValidation.maxLimit
                };
            }

            return results;
        } catch (error) {
            return {
                error: `Lỗi hệ thống khi tạo CCCD: ${error.message}`,
                maxLimit: Config.getOutputLimits().generation_single,
                requested: quantity
            };
        }
    }

    _isLeapYear(year) {
        return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }

    saveToFile(results, filename) {
        // Mock implementation
        console.log(`Saving ${results.length} results to ${filename}`);
    }
}

module.exports = CCCDGeneratorService;

