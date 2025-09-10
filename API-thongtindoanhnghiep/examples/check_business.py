import asyncio
import logging
import sys
import os

# Thêm thư mục src vào path để tìm thấy module client
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from thongtindoanhnghiep import ThongTinDoanhNghiepAPIClient, APIError

# Cấu hình logging cơ bản
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

async def find_businesses(keyword: str, city_name: str) -> None:
    """Tìm kiếm doanh nghiệp theo từ khóa và tên thành phố."""
    print(f"--- Bắt đầu tìm kiếm '{keyword}' tại '{city_name}' ---")
    client = ThongTinDoanhNghiepAPIClient()

    # 1. Tìm slug của thành phố
    city_slug = None
    try:
        # Sử dụng asyncio.to_thread để chạy hàm đồng bộ trong môi trường bất đồng bộ
        cities_response = await asyncio.to_thread(client.get_cities)
        cities = cities_response.get("LtsItems", []) if cities_response else []
        
        for city in cities:
            if city.get('Title') == city_name:
                # API trả về slug trong trường 'Url'
                city_slug = city.get('Url')
                logging.info(f"Đã tìm thấy slug cho {city_name}: '{city_slug}'")
                break
        
        if not city_slug:
            logging.error(f"Không tìm thấy thành phố có tên '{city_name}'.")
            return

    except APIError as e:
        logging.error(f"Lỗi API khi lấy danh sách thành phố: {e}")
        return

    # 2. Tìm kiếm hộ kinh doanh tại thành phố đã chọn
    try:
        search_params = {"k": keyword, "l": city_slug}
        logging.info(f"Đang tìm kiếm với tham số: {search_params}")
        search_response = await asyncio.to_thread(client.search_companies, **search_params)
        
        results = []
        if isinstance(search_response, dict):
            results = search_response.get("data", [])
        elif isinstance(search_response, list):
            results = search_response

        print("--- KẾT QUẢ TÌM KIẾM ---")
        if not results:
            print("Không tìm thấy kết quả nào phù hợp.")
            return

        print(f"Tìm thấy tổng cộng {len(results)} kết quả. Đang hiển thị 5 kết quả đầu tiên:")
        for i, business in enumerate(results[:5]):
            print(f"\n{i+1}. {business.get('Title')}")
            print(f"   Mã số thuế: {business.get('MaSoThue')}")
            print(f"   Địa chỉ: {business.get('DiaChiCongTy')}")

    except APIError as e:
        logging.error(f"Lỗi API khi tìm kiếm doanh nghiệp: {e}")

if __name__ == "__main__":
    # Chạy tác vụ bất đồng bộ
    asyncio.run(find_businesses(keyword="hộ kinh doanh", city_name="Hải Phòng"))