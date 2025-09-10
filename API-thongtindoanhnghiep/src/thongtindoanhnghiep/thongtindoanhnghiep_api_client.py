import requests
import logging
import os
from functools import lru_cache
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from typing import Optional, Dict, Any, List, Generator

# Import BASE_URL with proper fallback
try:
    from .config import BASE_URL
except ImportError:
    try:
        from config import BASE_URL
    except ImportError:
        # Fallback to environment variable or default
        BASE_URL = os.getenv("TTDN_BASE_URL", "https://thongtindoanhnghiep.co")

# Cấu hình logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Định nghĩa custom exception
class APIError(Exception):
    """Custom exception cho các lỗi từ API."""
    def __init__(self, message: str, status_code: Optional[int] = None) -> None:
        super().__init__(message)
        self.status_code: Optional[int] = status_code

class ThongTinDoanhNghiepAPIClient:
    def __init__(self, timeout: int = 10) -> None:
        self.base_url: str = BASE_URL
        self.timeout: int = timeout

    def _extract_items(self, response_json: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Utility: trả về danh sách items cho các endpoint trả về LtsItem/LtsItems."""
        # một số endpoint dùng LtsItem (singular), một số dùng LtsItems
        return response_json.get("LtsItem") or response_json.get("LtsItems") or []

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((requests.exceptions.ConnectionError, requests.exceptions.Timeout, requests.exceptions.HTTPError))
    )
    def _make_request(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}{endpoint}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json'
        }
        try:
            response = requests.get(url, params=params, headers=headers, verify=True, timeout=self.timeout)
            response.raise_for_status()
            logging.info(f"Request successful for {endpoint}")
            json_response = response.json()
            return json_response
        except requests.exceptions.HTTPError as http_err:
            # Không retry cho 4xx errors (trừ 429 - Too Many Requests)
            if http_err.response.status_code == 429:
                raise  # Retry cho 429
            logging.error(f"HTTP error occurred: {http_err} for URL: {url}")
            raise APIError(f"HTTP error: {http_err}", status_code=http_err.response.status_code) from http_err
        except requests.exceptions.RequestException as req_err:
            logging.error(f"An unexpected error occurred: {req_err} for URL: {url}")
            raise APIError(f"Request error: {req_err}") from req_err

    @lru_cache(maxsize=1)
    def get_cities(self) -> Optional[Dict[str, List[Dict[str, Any]]]]:
        """Lấy về toàn bộ danh mục Tỉnh/Thành phố (có cache)."""
        logging.info("Fetching all cities...")
        try:
            resp = self._make_request("/api/city")
            if resp:
                items = self._extract_items(resp)
                if items:  # Chỉ trả về kết quả nếu có items
                    return {"LtsItems": items}
            return None
        except APIError:
            return None

    @lru_cache(maxsize=64)
    def get_city_detail(self, city_id: int) -> Optional[Dict[str, Any]]:
        """Lấy về chi tiết một Tỉnh/Thành phố (có cache)."""
        logging.info(f"Fetching detail for city ID: {city_id}...")
        try:
            return self._make_request(f"/api/city/{city_id}")
        except APIError as e:
            if e.status_code == 404:
                return None
            raise

    @lru_cache(maxsize=64)
    def get_districts_by_city(self, city_id: int) -> Optional[Dict[str, List[Dict[str, Any]]]]:
        """Lấy về toàn bộ Quận/Huyện theo Tỉnh/Thành phố (có cache)."""
        logging.info(f"Fetching districts for city ID: {city_id}...")
        try:
            resp = self._make_request(f"/api/city/{city_id}/district")
            if resp:
                # Districts endpoint trả về list trực tiếp
                if isinstance(resp, list) and resp:
                    return {"LtsItems": resp}
                # Fallback cho trường hợp trả về dict
                items = self._extract_items(resp)
                if items:
                    return {"LtsItems": items}
            return None
        except APIError:
            return None

    @lru_cache(maxsize=128)
    def get_district_detail(self, district_id: int) -> Optional[Dict[str, Any]]:
        """Lấy về chi tiết một Quận/Huyện (có cache)."""
        logging.info(f"Fetching detail for district ID: {district_id}...")
        try:
            return self._make_request(f"/api/district/{district_id}")
        except APIError as e:
            if e.status_code == 404:
                return None
            raise

    @lru_cache(maxsize=128)
    def get_wards_by_district(self, district_id: int) -> Optional[Dict[str, List[Dict[str, Any]]]]:
        """Lấy về toàn bộ phường, xã & thị trấn thuộc Quận/Huyện (có cache)."""
        logging.info(f"Fetching wards for district ID: {district_id}...")
        try:
            resp = self._make_request(f"/api/district/{district_id}/ward")
            if resp:
                # Wards endpoint trả về list trực tiếp
                if isinstance(resp, list) and resp:
                    return {"LtsItems": resp}
                # Fallback cho trường hợp trả về dict
                items = self._extract_items(resp)
                if items:
                    return {"LtsItems": items}
            return None
        except APIError:
            return None
            
    @lru_cache(maxsize=256)
    def get_ward_detail(self, ward_id: int) -> Optional[Dict[str, Any]]:
        """Lấy về chi tiết phường, xã, thị trấn (có cache)."""
        logging.info(f"Fetching detail for ward ID: {ward_id}...")
        try:
            return self._make_request(f"/api/ward/{ward_id}")
        except APIError as e:
            if e.status_code == 404:
                return None
            raise

    @lru_cache(maxsize=1)
    def get_industries(self) -> Optional[Dict[str, List[Dict[str, Any]]]]:
        """Lấy về toàn bộ danh mục ngành nghề kinh doanh (có cache)."""
        logging.info("Fetching all industries...")
        try:
            resp = self._make_request("/api/industry")
            if resp:
                items = self._extract_items(resp)
                if items:
                    return {"LtsItems": items}
            return None
        except APIError:
            return None

    def search_companies(self, k: Optional[str] = None, l: Optional[str] = None, 
                        i: Optional[str] = None, r: Optional[int] = None, 
                        p: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """Lọc danh sách doanh nghiệp theo các tiêu chí khác nhau.

        Trả về một dictionary chứa danh sách các công ty trên trang hiện tại và số lượng công ty đó.
        Lưu ý: Trường 'CountOnPage' chỉ phản ánh số lượng công ty trên trang hiện tại, không phải tổng số lượng
        công ty trên tất cả các trang. Để duyệt qua tất cả các kết quả, hãy sử dụng phương thức `iter_companies()`.
        """
        logging.info(f"Searching companies with params: k={k}, l={l}, i={i}, r={r}, p={p}...")
        params = {}
        if k: params["k"] = k
        if l: params["l"] = l
        if i: params["i"] = i
        if r: params["r"] = r
        if p: params["p"] = p
        try:
            resp = self._make_request("/api/company", params=params)
            if resp and isinstance(resp, dict):
                # Chuẩn hóa response format
                companies = resp.get("LtsItems", [])
                total = len(companies)  # Ước tính total từ số items
                
                return {
                    "CountOnPage": total,
                    "data": companies
                }
            return None
        except APIError:
            return None

    def get_company_detail_by_mst(self, mst: str) -> Optional[Dict[str, Any]]:
        """Lấy về chi tiết doanh nghiệp theo mã số thuế."""
        logging.info(f"Fetching detail for company MST: {mst}...")
        try:
            resp = self._make_request(f"/api/company/{mst}")
            # Kiểm tra nếu response rỗng hoặc không có trường Title (MST không tồn tại)
            if not resp or not resp.get('Title'):
                return None
            return resp
        except APIError as e:
            if e.status_code == 404:
                return None
            raise

    def iter_companies(self, l: Optional[str] = None, k: Optional[str] = None, 
                      i: Optional[str] = None, r: int = 20) -> Generator[List[Dict[str, Any]], None, None]:
        """Pagination helper: tự động lặp qua tất cả các trang của kết quả tìm kiếm công ty."""
        page = 1
        total_companies = 0
        
        while True:
            logging.info(f"Fetching page {page} of companies...")
            result = self.search_companies(k=k, l=l, i=i, r=r, p=page)
            
            if not result or not result.get('data'):
                break
                
            companies = result.get('data', [])
            if not companies:
                break
                
            total_companies += len(companies)
            yield companies
            
            # Kiểm tra nếu đã lấy hết dữ liệu
            total_available = result.get('Total', 0)
            if total_companies >= total_available:
                break
                
            page += 1
            
        logging.info(f"Completed pagination. Total companies fetched: {total_companies}")
