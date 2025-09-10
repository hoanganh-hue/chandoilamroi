# Tool-Check-CMND-to-BHXH (Python Version)

Công cụ tra cứu thông tin BHXH từ file Excel sử dụng số CMND/CCCD. Đây là phiên bản được chuyển đổi và nâng cấp từ Node.js sang Python với mục tiêu đạt 100% hoàn thiện về tính năng, độ ổn định và khả năng bảo trì.

## 🚀 Tính năng chính

- ✅ **Đọc dữ liệu từ Excel**: Hỗ trợ file `.xlsx` với cấu trúc linh hoạt
- ✅ **Tự động tìm mã tỉnh**: Thông minh nhận diện địa chỉ và tìm mã tỉnh/thành phố tương ứng
- ✅ **Giải Captcha tự động**: Tích hợp dịch vụ 2Captcha để xử lý reCAPTCHA
- ✅ **Tra cứu BHXH**: Gửi yêu cầu đến cổng BHXH và bóc tách dữ liệu chính xác
- ✅ **Xử lý đồng thời**: Hỗ trợ nhiều luồng để tăng tốc độ xử lý
- ✅ **Ghi kết quả**: Xuất dữ liệu (Mã BHXH, Ngày sinh) ra file Excel mới
- ✅ **Xử lý lỗi thông minh**: Tự động retry khi gặp lỗi mạng hoặc API
- ✅ **Logging chi tiết**: Ghi log đầy đủ quá trình hoạt động để debug
- ✅ **Cấu hình linh hoạt**: Tùy chỉnh qua file `.env`

## 📋 Yêu cầu hệ thống

- **Python**: 3.9 trở lên
- **API Key**: Từ dịch vụ [2Captcha](https://2captcha.com/) (miễn phí đăng ký)
- **Dung lượng**: ~50MB cho thư viện và dữ liệu

## 🛠️ Hướng dẫn cài đặt

### Bước 1: Tải mã nguồn
```bash
git clone <URL_CUA_REPO>
cd tool-check-cmnd-to-bhxh
```

### Bước 2: Tạo môi trường ảo
```bash
python -m venv .venv
```

### Bước 3: Kích hoạt môi trường ảo
- **Windows:**
  ```cmd
  .venv\Scripts\activate
  ```
- **macOS/Linux:**
  ```bash
  source .venv/bin/activate
  ```

### Bước 4: Cài đặt thư viện
```bash
pip install -r requirements.txt
```

## ⚙️ Hướng dẫn cấu hình

### Bước 1: Tạo file cấu hình
```bash
cp .env.sample .env
```

### Bước 2: Cấu hình các thông số
Mở file `.env` và điền thông tin:

```env
# API Key từ 2Captcha (BẮT BUỘC)
CAPTCHA_API_KEY=your_2captcha_api_key_here

# Số luồng xử lý đồng thời (khuyến nghị: 3-5)
MAX_WORKERS=3

# File Excel đầu vào
INPUT_FILE=data-input.xlsx

# File Excel kết quả
OUTPUT_FILE=data-output.xlsx
```

### Bước 3: Chuẩn bị file Excel đầu vào
File Excel cần có các cột:
- `CMND`: Số CMND/CCCD
- `DiaChi`: Địa chỉ đầy đủ

## 🎯 Hướng dẫn sử dụng

### Cách 1: Sử dụng script tự động (Khuyến nghị)
- **Windows:**
  ```cmd
  .\scripts\run.bat
  ```
- **macOS/Linux:**
  ```bash
  chmod +x ./scripts/run.sh
  ./scripts/run.sh
  ```

### Cách 2: Chạy trực tiếp với Python
```bash
python src/main.py --input data-input.xlsx --output data-output.xlsx --workers 3
```

### Các tham số dòng lệnh
- `--input`: Đường dẫn file Excel đầu vào
- `--output`: Đường dẫn file Excel kết quả  
- `--workers`: Số luồng xử lý đồng thời (mặc định: 3)

## 📊 Cấu trúc file Excel

### File đầu vào (`data-input.xlsx`)
| CMND | DiaChi |
|------|--------|
| 123456789 | 123 Đường ABC, Phường XYZ, Quận 1, TP.HCM |
| 987654321 | 456 Đường DEF, Xã GHI, Huyện JKL, Tỉnh MNO |

### File kết quả (`data-output.xlsx`)
| CMND | DiaChi | MaTinh | MaBHXH | NgaySinh | TrangThai |
|------|--------|--------|--------|----------|-----------|
| 123456789 | 123 Đường ABC... | 79 | BHXH123456 | 01/01/1990 | Thành công |
| 987654321 | 456 Đường DEF... | 30 | - | - | Không tìm thấy |

## 🔧 Xử lý sự cố

### Lỗi thường gặp

**1. Lỗi "API Key không hợp lệ"**
- Kiểm tra lại `CAPTCHA_API_KEY` trong file `.env`
- Đảm bảo đã đăng ký và có tiền trong tài khoản 2Captcha

**2. Lỗi "Không tìm thấy file Excel"**
- Kiểm tra đường dẫn file trong `INPUT_FILE`
- Đảm bảo file có định dạng `.xlsx`

**3. Lỗi "Kết nối mạng"**
- Kiểm tra kết nối Internet
- Thử giảm `MAX_WORKERS` xuống 1-2

**4. Lỗi "Không tìm thấy mã tỉnh"**
- Kiểm tra định dạng địa chỉ trong file Excel
- Đảm bảo địa chỉ có đầy đủ thông tin tỉnh/thành phố

### Kiểm tra log
Xem file `app.log` để biết chi tiết lỗi:
```bash
tail -f app.log
```

## 🧪 Chạy test

```bash
# Chạy tất cả test
pytest

# Chạy test với coverage
pytest --cov=src

# Chạy test cụ thể
pytest tests/unit/test_excel_handler.py
```

## 📁 Cấu trúc dự án

```
tool-check-cmnd-to-bhxh/
├── src/                    # Mã nguồn chính
│   ├── main.py            # Điểm vào ứng dụng
│   ├── config.py          # Quản lý cấu hình
│   ├── core/              # Logic nghiệp vụ
│   │   ├── excel_handler.py
│   │   ├── province_finder.py
│   │   ├── captcha_solver.py
│   │   └── bhxh_checker.py
│   ├── models/            # Định nghĩa dữ liệu
│   └── utils/             # Tiện ích
├── tests/                 # Test cases
├── data/                  # Dữ liệu mẫu
├── scripts/               # Script chạy
├── requirements.txt       # Thư viện Python
├── .env.sample           # Mẫu cấu hình
└── README.md             # Tài liệu này
```

## 🤝 Đóng góp

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Dự án này được phân phối dưới giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra phần "Xử lý sự cố" ở trên
2. Tạo issue trên GitHub với thông tin chi tiết
3. Đính kèm file log `app.log` nếu có

---
**Phiên bản**: 1.0.0  
**Cập nhật lần cuối**: 2024