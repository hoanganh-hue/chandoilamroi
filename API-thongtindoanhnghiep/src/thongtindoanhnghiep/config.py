
import os
from dotenv import load_dotenv

def load_environment():
    """Tải các biến môi trường từ file .env."""
    # Tìm file .env trong thư mục hiện tại hoặc các thư mục cha
    dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(dotenv_path):
        load_dotenv(dotenv_path=dotenv_path)
    else:
        # Nếu không có .env, thử tìm .env.template để lấy giá trị mặc định
        template_path = dotenv_path.replace('.env', '.env.template')
        if os.path.exists(template_path):
            load_dotenv(dotenv_path=template_path)

# Tải môi trường ngay khi module được import
load_environment()

# Lấy các giá trị cấu hình
BASE_URL = os.getenv("TTDN_BASE_URL", "https://thongtindoanhnghiep.co")
