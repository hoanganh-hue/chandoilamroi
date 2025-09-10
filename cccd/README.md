# Hệ thống CCCD Analysis & Generation

Hệ thống phân tích và tạo Căn cước Công dân (CCCD) theo quy định pháp luật Việt Nam.

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Cài đặt](#cài-đặt)
- [Sử dụng](#sử-dụng)
- [API Documentation](#api-documentation)
- [CLI Commands](#cli-commands)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Testing](#testing)
- [Cấu hình](#cấu-hình)
- [Đóng góp](#đóng-góp)
- [License](#license)

## 🎯 Tổng quan

Hệ thống này cung cấp:

- ✅ **Phân tích CCCD**: Phân tích cấu trúc và thông tin từ số CCCD
- ✅ **Tạo CCCD**: Tạo danh sách CCCD hợp lệ theo quy định
- ✅ **Validation**: Kiểm tra tính hợp lệ của CCCD
- ✅ **API REST**: Giao diện API để tích hợp với hệ thống khác
- ✅ **CLI**: Command line interface để sử dụng trực tiếp
- ✅ **Logging**: Hệ thống logging đầy đủ
- ✅ **Security**: Rate limiting và security middleware
- ✅ **Testing**: Unit tests và integration tests

### Cơ sở pháp lý

Tuân thủ theo:
- **Nghị định số 137/2015/NĐ-CP** về số định danh cá nhân
- **Thông tư số 07/2016/TT-BCA** về cấu trúc CCCD

## 🚀 Cài đặt

### Yêu cầu hệ thống

- Node.js >= 14.0.0
- npm >= 6.0.0

### Cài đặt dependencies

```bash
npm install
```

### Cài đặt development dependencies

```bash
npm install --dev
```

## 📖 Sử dụng

### 1. API Server

Khởi động API server:

```bash
npm start api
# hoặc
node src/main.js api
```

Server sẽ chạy tại `http://localhost:3000`

### 2. CLI Commands

#### Tạo CCCD

```bash
# Tạo 10 CCCD mặc định
node src/main.js cli generate

# Tạo CCCD với tham số cụ thể
node src/main.js cli generate -p "001,079" -g "Nam" -q 5

# Tạo CCCD với khoảng năm sinh
node src/main.js cli generate -p "001" -y "1990-2000" -q 10

# Lưu kết quả vào file
node src/main.js cli generate -q 20 -o "cccd_results.json"
```

#### Phân tích CCCD

```bash
# Phân tích một CCCD
node src/main.js cli analyze 001012345678

# Phân tích với thông tin chi tiết
node src/main.js cli analyze 001012345678 -d -l

# Lưu kết quả phân tích
node src/main.js cli analyze 001012345678 -o "analysis_result.json"
```

#### Phân tích hàng loạt

```bash
# Phân tích từ file JSON
node src/main.js cli batch-analyze cccd_list.json

# Phân tích từ file text (mỗi dòng một CCCD)
node src/main.js cli batch-analyze cccd_list.txt
```

#### Xem cấu hình

```bash
node src/main.js cli config
```

### 3. Programmatic Usage

```javascript
const CCCDGeneratorService = require('./src/services/cccd_generator_service');
const CCCDAnalyzerService = require('./src/services/cccd_analyzer_service');

// Tạo CCCD
const generator = new CCCDGeneratorService();
const cccdList = generator.generateCccdList(['001'], 'Nam', [1990, 2000], null, 5);

// Phân tích CCCD
const analyzer = new CCCDAnalyzerService();
const analysis = analyzer.analyzeCccdStructure('001012345678');
```

## 🔌 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Endpoints

#### 1. Health Check

```http
GET /health
```

#### 2. Generate CCCD

```http
POST /api/generate-cccd
Content-Type: application/json

{
  "provinceCodes": ["001", "079"],
  "gender": "Nam",
  "birthYearRange": [1990, 2000],
  "quantity": 10
}
```

#### 3. Analyze CCCD

```http
POST /api/analyze-cccd
Content-Type: application/json

{
  "cccd": "001012345678",
  "detailed": true,
  "location": true
}
```

#### 4. Batch Analyze

```http
POST /api/analyze-cccd/batch
Content-Type: application/json

{
  "cccdList": ["001012345678", "079012345678"]
}
```

#### 5. Get Options

```http
GET /api/generate-cccd/options
```

#### 6. Get Structure Info

```http
GET /api/analyze-cccd/structure
```

### Response Format

Tất cả API responses đều có format:

```json
{
  "success": true,
  "data": { ... },
  "metadata": { ... },
  "config": { ... }
}
```

## 🖥️ CLI Commands

### Generate Command

```bash
node src/main.js cli generate [options]

Options:
  -p, --provinces <codes>    Mã tỉnh (phân cách bằng dấu phẩy)
  -g, --gender <gender>      Giới tính (Nam/Nữ)
  -y, --year-range <range>   Khoảng năm sinh (ví dụ: 1990-2000)
  -q, --quantity <number>    Số lượng CCCD cần tạo
  -o, --output <file>       Lưu kết quả vào file
  -f, --format <format>     Định dạng output (json/table)
```

### Analyze Command

```bash
node src/main.js cli analyze <cccd> [options]

Options:
  -d, --detailed            Phân tích chi tiết
  -l, --location           Hiển thị thông tin địa lý
  -o, --output <file>      Lưu kết quả vào file
  -f, --format <format>    Định dạng output (json/table)
```

### Batch Analyze Command

```bash
node src/main.js cli batch-analyze <file> [options]

Options:
  -o, --output <file>      Lưu kết quả vào file
  -f, --format <format>    Định dạng output (json/table)
```

## 📁 Cấu trúc dự án

```
cccd-analysis-system/
├── src/
│   ├── config/
│   │   └── cccd_config.js          # Cấu hình hệ thống
│   ├── services/
│   │   ├── cccd_generator_service.js  # Service tạo CCCD
│   │   └── cccd_analyzer_service.js   # Service phân tích CCCD
│   ├── api/
│   │   └── routes/
│   │       ├── generator.js        # API routes cho generator
│   │       └── analyzer.js         # API routes cho analyzer
│   ├── cli/
│   │   └── commands.js            # CLI commands
│   ├── utils/
│   │   └── logger.js              # Logging utility
│   ├── tests/
│   │   ├── generator.test.js      # Tests cho generator
│   │   ├── analyzer.test.js       # Tests cho analyzer
│   │   └── setup.js              # Test setup
│   └── main.js                   # Entry point
├── logs/                         # Log files
├── output/                       # Output files
├── coverage/                     # Test coverage reports
├── package.json                  # Dependencies và scripts
├── jest.config.js               # Jest configuration
└── README.md                    # Documentation
```

## 🧪 Testing

### Chạy tests

```bash
# Chạy tất cả tests
npm test

# Chạy tests với watch mode
npm run test:watch

# Chạy tests với coverage
npm run test:coverage

# Chạy tests cụ thể
npm test -- --testPathPattern="api.test.js"
npm test -- --testPathPattern="cli.test.js"
```

### Test Coverage

Hệ thống hiện tại đạt **54.62%** coverage tổng thể:

- **Services**: 86.86% (Generator: 94.23%, Analyzer: 84.24%)
- **Config**: 75.43%
- **Utils**: 95.65%
- **API Routes**: 44.59%
- **CLI**: 10.12%

### Test Types

1. **Unit Tests**: Tests cho từng module riêng lẻ
2. **Integration Tests**: Tests cho API endpoints
3. **CLI Tests**: Tests cho command line interface
4. **Coverage Tests**: Đảm bảo code coverage

### CI/CD Pipeline

Hệ thống sử dụng GitHub Actions với pipeline tự động:

```yaml
# .github/workflows/ci.yml
- Test trên Node.js 14.x, 16.x, 18.x
- Linting với ESLint
- Security audit với npm audit
- Coverage reporting với Codecov
- Docker build và test
- Deployment tự động (nếu cần)
```

### Quality Gates

- ✅ Tất cả tests phải pass
- ✅ Coverage ≥ 40% (hiện tại: 54.62%)
- ✅ Linting không có lỗi
- ✅ Security audit clean
- ✅ Docker build thành công

## ⚙️ Cấu hình

### Environment Variables

```bash
NODE_ENV=production          # Environment (development/production/test)
LOG_LEVEL=info              # Log level (error/warn/info/debug)
PORT=3000                   # API server port
HOST=localhost              # API server host
```

### Configuration File

Cấu hình chính trong `src/config/cccd_config.js`:

- **Input Limits**: Giới hạn số lượng đầu vào
- **Output Limits**: Giới hạn số lượng đầu ra
- **Security Config**: Cấu hình bảo mật
- **Logging Config**: Cấu hình logging
- **Export Config**: Cấu hình export

### Customization

Bạn có thể customize:

1. **Province Codes**: Thêm/sửa mã tỉnh trong `getProvinceCodes()`
2. **Gender Century Codes**: Sửa logic giới tính/thế kỷ
3. **Limits**: Điều chỉnh giới hạn input/output
4. **Security**: Cấu hình rate limiting và CORS

## 🔒 Security

### Rate Limiting

- **60 requests/minute** per IP
- **1000 requests/hour** per IP
- Configurable trong `SECURITY_CONFIG`

### Security Headers

- **Helmet.js** cho security headers
- **CORS** configuration
- **Input validation** với Joi

### Logging

- **Request logging** với response time
- **Error logging** với stack traces
- **Security event logging**

## 📊 Monitoring

### Health Check

```http
GET /health
```

Response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "config": { ... }
}
```

### Logs

Logs được lưu trong thư mục `logs/`:

- `cccd_analysis.log`: General logs
- `cccd_error.log`: Error logs
- `cccd_exceptions.log`: Uncaught exceptions
- `cccd_rejections.log`: Unhandled rejections

## 🚀 Deployment

### Production

```bash
# Set production environment
export NODE_ENV=production

# Start API server
npm start api
```

### Docker Deployment

#### Using Docker Compose (Recommended)

```bash
# Start production environment
docker-compose up -d cccd-api

# Start development environment
docker-compose up -d cccd-dev

# View logs
docker-compose logs -f cccd-api

# Stop services
docker-compose down
```

#### Using Docker directly

```bash
# Build image
docker build -t cccd-analysis-system .

# Run container
docker run -d \
  --name cccd-api \
  -p 3000:3000 \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/output:/app/output \
  -e NODE_ENV=production \
  cccd-analysis-system

# Check health
curl http://localhost:3000/health
```

### Environment Variables

```bash
NODE_ENV=production          # Environment (development/production/test)
LOG_LEVEL=info              # Log level (error/warn/info/debug)
PORT=3000                   # API server port
HOST=0.0.0.0               # API server host
```

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

### Development Setup

```bash
# Clone repository
git clone https://github.com/your-org/cccd-analysis-system.git

# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run dev
```

## 📝 Changelog

### v1.0.0 (2024-01-01)

- ✅ Initial release
- ✅ CCCD generation and analysis
- ✅ REST API
- ✅ CLI interface
- ✅ Comprehensive testing
- ✅ Security features
- ✅ Logging system

## 🐛 Bug Reports

Nếu bạn tìm thấy bug, vui lòng tạo issue với:

1. **Mô tả bug**
2. **Steps to reproduce**
3. **Expected behavior**
4. **Actual behavior**
5. **Environment info**

## 📄 License

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/your-org/cccd-analysis-system/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-org/cccd-analysis-system/issues)
- **Email**: support@cccd-system.com

---

**⚠️ Lưu ý**: Hệ thống này chỉ dành cho mục đích học tập và nghiên cứu. Không sử dụng để tạo CCCD thật hoặc vi phạm pháp luật.