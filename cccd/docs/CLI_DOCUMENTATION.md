# CLI Documentation - CCCD Analysis & Generation System

## Overview

The Command Line Interface (CLI) provides a powerful way to interact with the CCCD Analysis & Generation System directly from the terminal.

## Installation

Make sure you have Node.js installed (version 14.0.0 or higher), then install dependencies:

```bash
npm install
```

## Basic Usage

```bash
node src/main.js cli <command> [options]
```

## Available Commands

### 1. Generate CCCD

Generates a list of valid CCCD numbers.

#### Syntax
```bash
node src/main.js cli generate [options]
```

#### Options
- `-p, --provinces <codes>` - Province codes (comma-separated)
- `-g, --gender <gender>` - Gender (Nam/Nữ)
- `-y, --year-range <range>` - Birth year range (e.g., 1990-2000)
- `-q, --quantity <number>` - Number of CCCDs to generate (default: 10)
- `-o, --output <file>` - Save results to file
- `-f, --format <format>` - Output format (json/table, default: json)

#### Examples

**Generate 10 CCCDs with default settings:**
```bash
node src/main.js cli generate
```

**Generate 5 CCCDs for Hanoi, Male, born in 1990s:**
```bash
node src/main.js cli generate -p "001" -g "Nam" -y "1990-2000" -q 5
```

**Generate CCCDs for multiple provinces:**
```bash
node src/main.js cli generate -p "001,079,024" -q 15
```

**Generate CCCDs and save to file:**
```bash
node src/main.js cli generate -q 20 -o "cccd_results.json"
```

**Generate CCCDs in table format:**
```bash
node src/main.js cli generate -q 5 -f table
```

#### Output Example

**JSON Format:**
```json
✅ Tạo CCCD thành công!
📊 Số lượng: 5

📄 Kết quả:
[
  {
    "cccd_number": "001010101678",
    "province_code": "001",
    "province_name": "Hà Nội",
    "gender": "Nam",
    "birth_year": 2001,
    "birth_month": 1,
    "birth_day": 1,
    "birth_date": "01/01/2001",
    "century": "21",
    "gender_century_code": 2,
    "sequence_number": "78"
  }
]
```

**Table Format:**
```
✅ Tạo CCCD thành công!
📊 Số lượng: 5

📄 Kết quả:
001010101678 | Hà Nội | Nam | 01/01/2001
079010101678 | Hồ Chí Minh | Nữ | 01/01/2001
```

---

### 2. Analyze CCCD

Analyzes a single CCCD number and returns detailed information.

#### Syntax
```bash
node src/main.js cli analyze <cccd> [options]
```

#### Arguments
- `<cccd>` - 12-digit CCCD number to analyze

#### Options
- `-d, --detailed` - Include detailed analysis (default: true)
- `-l, --location` - Include location information (default: true)
- `-o, --output <file>` - Save results to file
- `-f, --format <format>` - Output format (json/table, default: json)

#### Examples

**Analyze a CCCD:**
```bash
node src/main.js cli analyze 001010101678
```

**Analyze with detailed information:**
```bash
node src/main.js cli analyze 001010101678 -d -l
```

**Analyze and save to file:**
```bash
node src/main.js cli analyze 001010101678 -o "analysis_result.json"
```

**Analyze in table format:**
```bash
node src/main.js cli analyze 001010101678 -f table
```

#### Output Example

```
✅ Phân tích CCCD thành công!
🆔 CCCD: 001010101678
📍 Tỉnh: Hà Nội
👤 Giới tính: Nam
📅 Ngày sinh: 01/01/2001
🎂 Tuổi hiện tại: 23
🗺️  Vùng: Miền Bắc

📄 Kết quả chi tiết:
{
  "cccd": "001010101678",
  "valid": true,
  "structure": {
    "province": {
      "code": "001",
      "name": "Hà Nội",
      "valid": true
    },
    "genderCentury": {
      "code": 2,
      "gender": "Nam",
      "century": "21"
    }
  },
  "summary": {
    "provinceName": "Hà Nội",
    "gender": "Nam",
    "birthDate": "01/01/2001",
    "currentAge": 23
  }
}
```

---

### 3. Batch Analyze

Analyzes multiple CCCD numbers from a file.

#### Syntax
```bash
node src/main.js cli batch-analyze <file> [options]
```

#### Arguments
- `<file>` - Path to file containing CCCD numbers

#### Options
- `-o, --output <file>` - Save results to file
- `-f, --format <format>` - Output format (json/table, default: json)

#### Supported File Formats

**JSON Format:**
```json
[
  "001010101678",
  "079010101678",
  "024010101678"
]
```

**Text Format (one CCCD per line):**
```
001010101678
079010101678
024010101678
```

#### Examples

**Analyze from JSON file:**
```bash
node src/main.js cli batch-analyze cccd_list.json
```

**Analyze from text file:**
```bash
node src/main.js cli batch-analyze cccd_list.txt
```

**Analyze and save results:**
```bash
node src/main.js cli batch-analyze cccd_list.json -o "batch_results.json"
```

**Analyze in table format:**
```bash
node src/main.js cli batch-analyze cccd_list.json -f table
```

#### Output Example

```
✅ Phân tích hàng loạt thành công!
📊 Tổng số: 3
✅ Hợp lệ: 3
❌ Không hợp lệ: 0
📈 Tỷ lệ hợp lệ: 100.00%

📋 Thống kê:
📍 Tỉnh phổ biến: Hà Nội (1)
👥 Phân bố giới tính: {"Nam": 2, "Nữ": 1}
🎂 Phân bố tuổi: {"20-30": 3}

📄 Kết quả chi tiết:
{
  "totalAnalyzed": 3,
  "validCount": 3,
  "invalidCount": 0,
  "validityRate": 100.00,
  "results": [...]
}
```

---

### 4. Configuration

Displays system configuration and settings.

#### Syntax
```bash
node src/main.js cli config [options]
```

#### Options
- `-f, --format <format>` - Output format (json/table, default: json)

#### Examples

**Show configuration:**
```bash
node src/main.js cli config
```

**Show configuration in table format:**
```bash
node src/main.js cli config -f table
```

#### Output Example

```
⚙️  Cấu hình hệ thống CCCD:
📦 Module: CCCD Analysis & Generation
🔢 Version: 1.0.0
🏛️  Tổng số tỉnh: 63
📊 Giới hạn số lượng: 10 - 1000
📅 Khoảng năm sinh: 1920 - 2025

🔧 Tính năng:
  ✅ generation: true
  ✅ analysis: true
  ✅ batchAnalysis: true
  ✅ validation: true

📋 Validation:
  ✅ Cấu hình: Hợp lệ
```

---

### 5. Help

Displays help information and usage examples.

#### Syntax
```bash
node src/main.js cli help
```

#### Output Example

```
🆔 Hệ thống CCCD Analysis & Generation
=====================================

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
```

---

## Error Handling

### Common Error Messages

**Invalid CCCD format:**
```
❌ CCCD không hợp lệ: CCCD phải có đúng 12 chữ số
```

**File not found:**
```
❌ File không tồn tại: cccd_list.json
```

**Invalid parameters:**
```
❌ Lỗi: Số lượng phải là số nguyên dương
```

**System error:**
```
❌ Lỗi hệ thống: Detailed error message
```

### Exit Codes

- `0` - Success
- `1` - Error (invalid input, file not found, etc.)

---

## File Output

### Output Directory

By default, output files are saved to the `output/` directory. The directory is created automatically if it doesn't exist.

### File Formats

**JSON Format:**
- Human-readable JSON with proper indentation
- Includes all data fields and metadata
- Suitable for programmatic processing

**Table Format:**
- Human-readable table format
- Shows key information in columns
- Suitable for quick viewing

---

## Province Codes

Common province codes used with the `-p` option:

| Code | Province/City |
|------|---------------|
| 001  | Hà Nội |
| 079  | Hồ Chí Minh |
| 024  | Quảng Ninh |
| 031  | Hải Phòng |
| 048  | Đà Nẵng |
| 056  | Cần Thơ |
| 064  | Bình Dương |
| 072  | Đồng Nai |
| 080  | Long An |
| 088  | Tiền Giang |

For a complete list, use:
```bash
node src/main.js cli config
```

---

## Performance Tips

1. **Use appropriate quantity limits**: For large datasets, consider using batch analysis instead of individual analysis.

2. **File I/O**: When processing large files, ensure sufficient disk space and I/O permissions.

3. **Memory usage**: Large batch operations may consume significant memory. Monitor system resources.

4. **Output format**: Use table format for quick viewing, JSON format for data processing.

---

## Legal Compliance

This CLI tool complies with Vietnamese legal regulations:

- **Nghị định số 137/2015/NĐ-CP** về số định danh cá nhân
- **Thông tư số 07/2016/TT-BCA** về cấu trúc CCCD

The generated CCCD numbers are for educational and testing purposes only and should not be used for any illegal activities.

---

## Troubleshooting

### Common Issues

**Permission denied:**
```bash
# Make sure you have write permissions to the output directory
chmod 755 output/
```

**File not found:**
```bash
# Check if the file exists and path is correct
ls -la cccd_list.json
```

**Invalid CCCD format:**
```bash
# Ensure CCCD numbers are exactly 12 digits
echo "001010101678" | wc -c  # Should output 13 (including newline)
```

**Memory issues:**
```bash
# For large datasets, process in smaller batches
node src/main.js cli generate -q 100  # Instead of 1000
```

### Getting Help

For additional support:
1. Check the help command: `node src/main.js cli help`
2. Review the configuration: `node src/main.js cli config`
3. Check system logs in the `logs/` directory
4. Ensure all dependencies are installed: `npm install`