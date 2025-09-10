@echo off
REM ===========================================
REM Script chạy Tool Check CMND to BHXH
REM Phiên bản: 1.0.0
REM ===========================================

echo.
echo ==========================================
echo    TOOL CHECK CMND TO BHXH (Python)
echo ==========================================
echo.

REM Kiểm tra Python có được cài đặt không
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python chưa được cài đặt hoặc không có trong PATH
    echo Vui lòng cài đặt Python 3.9+ từ: https://python.org
    pause
    exit /b 1
)

REM Kiểm tra môi trường ảo
if not exist ".venv" (
    echo [INFO] Tạo môi trường ảo Python...
    python -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Không thể tạo môi trường ảo
        pause
        exit /b 1
    )
)

REM Kích hoạt môi trường ảo
echo [INFO] Kích hoạt môi trường ảo...
call .venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Không thể kích hoạt môi trường ảo
    pause
    exit /b 1
)

REM Kiểm tra và cài đặt dependencies
echo [INFO] Kiểm tra dependencies...
pip show pandas >nul 2>&1
if errorlevel 1 (
    echo [INFO] Cài đặt các thư viện cần thiết...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Không thể cài đặt dependencies
        pause
        exit /b 1
    )
)

REM Kiểm tra file cấu hình
if not exist ".env" (
    if exist ".env.sample" (
        echo [INFO] Tạo file cấu hình từ mẫu...
        copy .env.sample .env >nul
        echo [WARNING] Vui lòng chỉnh sửa file .env với API key của bạn
        echo Nhấn Enter để tiếp tục hoặc Ctrl+C để thoát...
        pause
    ) else (
        echo [ERROR] Không tìm thấy file .env.sample
        pause
        exit /b 1
    )
)

REM Kiểm tra file Excel đầu vào
if not exist "data-input.xlsx" (
    echo [WARNING] Không tìm thấy file data-input.xlsx
    echo Vui lòng đặt file Excel đầu vào với tên data-input.xlsx
    echo Nhấn Enter để tiếp tục hoặc Ctrl+C để thoát...
    pause
)

REM Chạy ứng dụng
echo.
echo [INFO] Bắt đầu chạy ứng dụng...
echo ==========================================
echo.

python src/main.py

REM Kiểm tra kết quả
if errorlevel 1 (
    echo.
    echo [ERROR] Ứng dụng gặp lỗi. Kiểm tra file app.log để biết chi tiết.
) else (
    echo.
    echo [SUCCESS] Hoàn thành! Kiểm tra file data-output.xlsx để xem kết quả.
)

echo.
echo Nhấn Enter để thoát...
pause