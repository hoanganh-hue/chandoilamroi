"""Module quản lý cấu hình cho ứng dụng.

Sử dụng Pydantic's BaseSettings để đọc cấu hình từ các biến môi trường
(và file .env). Cung cấp một đối tượng `settings` duy nhất để sử dụng
trong toàn bộ ứng dụng.
"""

from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Định nghĩa và quản lý tất cả các cấu hình của ứng dụng.
    """
    # Cấu hình cho 2Captcha API
    captcha_api_key: str = Field(..., env="CAPTCHA_API_KEY", description="API Key cho dịch vụ 2Captcha.")
    captcha_api_url: str = Field("https://2captcha.com", env="CAPTCHA_API_URL", description="URL của API 2Captcha.")

    # Cấu hình cho trang BHXH
    bhxh_url: str = Field(
        "https://baohiemxahoi.gov.vn/tracuu/Pages/tra-cuu-ho-ngheo.aspx",
        env="BHXH_URL",
        description="URL của trang tra cứu BHXH."
    )

    # Cấu hình xử lý đồng thời và network
    max_workers: int = Field(3, env="MAX_WORKERS", description="Số luồng xử lý đồng thời.")
    request_timeout: int = Field(30, env="REQUEST_TIMEOUT", description="Thời gian timeout cho mỗi request (giây).")
    max_retries: int = Field(3, env="MAX_RETRIES", description="Số lần thử lại tối đa khi gặp lỗi.")
    retry_delay: int = Field(2, env="RETRY_DELAY", description="Thời gian chờ giữa các lần thử lại (giây).")

    # Cấu hình file I/O
    input_file: str = Field("data-input.xlsx", env="INPUT_FILE", description="Đường dẫn file Excel đầu vào.")
    output_file: str = Field("data-output.xlsx", env="OUTPUT_FILE", description="Đường dẫn file Excel đầu ra.")

    # Cấu hình logging
    log_level: str = Field("INFO", env="LOG_LEVEL", description="Cấp độ log (DEBUG, INFO, WARNING, ERROR).")
    log_file: str = Field("app.log", env="LOG_FILE", description="Tên file để ghi log.")

    # Cấu hình khác
    user_agent: str = Field(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        env="USER_AGENT",
        description="User Agent cho HTTP requests."
    )

    # Cấu hình Proxy (tùy chọn)
    proxy_url: Optional[str] = Field(None, env="PROXY_URL", description="URL của proxy (ví dụ: http://user:pass@host:port).")

    # Pydantic settings configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


@lru_cache
def get_settings() -> Settings:
    """
    Tạo và trả về một instance duy nhất của Settings class.

    Sử dụng lru_cache để đảm bảo rằng file .env chỉ được đọc một lần.
    """
    return Settings()


# Tạo một instance duy nhất để import và sử dụng trong các module khác
settings = get_settings()
