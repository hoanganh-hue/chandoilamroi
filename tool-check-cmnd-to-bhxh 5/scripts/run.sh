#!/bin/bash

# ===========================================
# Script chạy Tool Check CMND to BHXH
# Phiên bản: 1.0.0
# ===========================================

set -e  # Thoát khi gặp lỗi

# Màu sắc cho output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Hàm in thông báo
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo
echo "=========================================="
echo "    TOOL CHECK CMND TO BHXH (Python)"
echo "=========================================="
echo

# Kiểm tra Python có được cài đặt không
if ! command -v python3 &> /dev/null; then
    print_error "Python3 chưa được cài đặt hoặc không có trong PATH"
    echo "Vui lòng cài đặt Python 3.9+ từ: https://python.org"
    exit 1
fi

# Kiểm tra phiên bản Python
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
REQUIRED_VERSION="3.9"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    print_error "Python $REQUIRED_VERSION+ được yêu cầu. Phiên bản hiện tại: $PYTHON_VERSION"
    exit 1
fi

print_info "Python version: $PYTHON_VERSION"

# Kiểm tra môi trường ảo
if [ ! -d ".venv" ]; then
    print_info "Tạo môi trường ảo Python..."
    python3 -m venv .venv
    if [ $? -ne 0 ]; then
        print_error "Không thể tạo môi trường ảo"
        exit 1
    fi
fi

# Kích hoạt môi trường ảo
print_info "Kích hoạt môi trường ảo..."
source .venv/bin/activate
if [ $? -ne 0 ]; then
    print_error "Không thể kích hoạt môi trường ảo"
    exit 1
fi

# Kiểm tra và cài đặt dependencies
print_info "Kiểm tra dependencies..."
if ! python -c "import pandas" &> /dev/null; then
    print_info "Cài đặt các thư viện cần thiết..."
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        print_error "Không thể cài đặt dependencies"
        exit 1
    fi
fi

# Kiểm tra file cấu hình
if [ ! -f ".env" ]; then
    if [ -f ".env.sample" ]; then
        print_info "Tạo file cấu hình từ mẫu..."
        cp .env.sample .env
        print_warning "Vui lòng chỉnh sửa file .env với API key của bạn"
        echo "Nhấn Enter để tiếp tục hoặc Ctrl+C để thoát..."
        read -r
    else
        print_error "Không tìm thấy file .env.sample"
        exit 1
    fi
fi

# Kiểm tra file Excel đầu vào
if [ ! -f "data-input.xlsx" ]; then
    print_warning "Không tìm thấy file data-input.xlsx"
    echo "Vui lòng đặt file Excel đầu vào với tên data-input.xlsx"
    echo "Nhấn Enter để tiếp tục hoặc Ctrl+C để thoát..."
    read -r
fi

# Chạy ứng dụng
echo
print_info "Bắt đầu chạy ứng dụng..."
echo "=========================================="
echo

python src/main.py

# Kiểm tra kết quả
if [ $? -eq 0 ]; then
    echo
    print_success "Hoàn thành! Kiểm tra file data-output.xlsx để xem kết quả."
else
    echo
    print_error "Ứng dụng gặp lỗi. Kiểm tra file app.log để biết chi tiết."
fi

echo
echo "Nhấn Enter để thoát..."
read -r