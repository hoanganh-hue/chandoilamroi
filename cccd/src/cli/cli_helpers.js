/**
 * CLI Helper Functions
 * Helper functions for CLI commands
 */

const fs = require('fs');
const path = require('path');
const CCCDConfig = require('../config/cccd_config');
const logger = require('../utils/logger');

/**
 * Format output data
 */
function formatOutput(data, format = 'json') {
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
}

/**
 * Save data to file
 */
function saveToFile(data, filename) {
    const outputDir = CCCDConfig.EXPORT_CONFIG.output_directory;
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    logger.info(`Results saved to: ${filepath}`);
    return filepath;
}

module.exports = {
    formatOutput,
    saveToFile
};