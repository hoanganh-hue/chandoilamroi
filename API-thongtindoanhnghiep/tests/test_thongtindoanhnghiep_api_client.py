import pytest
import responses
import requests
import json
import sys
import os

# Thêm thư mục src vào path để tìm thấy module client
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from thongtindoanhnghiep import ThongTinDoanhNghiepAPIClient, APIError


class TestThongTinDoanhNghiepAPIClient:
    
    def setup_method(self):
        """Setup cho mỗi test method."""
        self.client = ThongTinDoanhNghiepAPIClient()
        self.base_url = "https://thongtindoanhnghiep.co"
    
    @responses.activate
    def test_get_cities_success(self):
        """Test get_cities với dữ liệu hợp lệ."""
        data = {"LtsItem": [{"ID": 1, "Title": "Hà Nội", "Url": "ha-noi"}]}
        responses.add(
            responses.GET,
            f"{self.base_url}/api/city",
            json=data,
            status=200
        )
        
        result = self.client.get_cities()
        
        assert result is not None
        assert "LtsItems" in result
        assert len(result["LtsItems"]) == 1
        assert result["LtsItems"][0]["Title"] == "Hà Nội"
    
    @responses.activate
    def test_get_cities_with_ltsitems_key(self):
        """Test get_cities với key LtsItems (fallback)."""
        data = {"LtsItems": [{"ID": 1, "Title": "Hà Nội", "Url": "ha-noi"}]}
        responses.add(
            responses.GET,
            f"{self.base_url}/api/city",
            json=data,
            status=200
        )
        
        result = self.client.get_cities()
        
        assert result is not None
        assert "LtsItems" in result
        assert len(result["LtsItems"]) == 1
        assert result["LtsItems"][0]["Title"] == "Hà Nội"
    
    @responses.activate
    def test_get_cities_empty_response(self):
        """Test get_cities với response rỗng."""
        data = {}
        responses.add(
            responses.GET,
            f"{self.base_url}/api/city",
            json=data,
            status=200
        )
        
        result = self.client.get_cities()
        
        # Khi response rỗng, _extract_items trả về [] và get_cities trả về None
        assert result is None
    
    @responses.activate
    def test_get_cities_api_error(self):
        """Test get_cities với lỗi API."""
        responses.add(
            responses.GET,
            f"{self.base_url}/api/city",
            status=500
        )
        
        result = self.client.get_cities()
        
        assert result is None
    
    @responses.activate
    def test_get_districts_by_city_success(self):
        """Test get_districts_by_city với dữ liệu hợp lệ."""
        data = {"LtsItem": [{"ID": 1, "Title": "Quận Ba Đình", "Url": "ba-dinh"}]}
        responses.add(
            responses.GET,
            f"{self.base_url}/api/city/1/district",
            json=data,
            status=200
        )
        
        result = self.client.get_districts_by_city(1)
        
        assert result is not None
        assert "LtsItems" in result
        assert len(result["LtsItems"]) == 1
        assert result["LtsItems"][0]["Title"] == "Quận Ba Đình"
    
    @responses.activate
    def test_get_wards_by_district_success(self):
        """Test get_wards_by_district với dữ liệu hợp lệ."""
        data = {"LtsItem": [{"ID": 1, "Title": "Phường Phúc Xá", "Url": "phuc-xa"}]}
        responses.add(
            responses.GET,
            f"{self.base_url}/api/district/1/ward",
            json=data,
            status=200
        )
        
        result = self.client.get_wards_by_district(1)
        
        assert result is not None
        assert "LtsItems" in result
        assert len(result["LtsItems"]) == 1
        assert result["LtsItems"][0]["Title"] == "Phường Phúc Xá"
    
    @responses.activate
    def test_get_industries_success(self):
        """Test get_industries với dữ liệu hợp lệ."""
        data = {"LtsItem": [{"ID": 1, "Title": "Bán lẻ", "Url": "ban-le"}]}
        responses.add(
            responses.GET,
            f"{self.base_url}/api/industry",
            json=data,
            status=200
        )
        
        result = self.client.get_industries()
        
        assert result is not None
        assert "LtsItems" in result
        assert len(result["LtsItems"]) == 1
        assert result["LtsItems"][0]["Title"] == "Bán lẻ"
    
    @responses.activate
    def test_search_companies_success(self):
        """Test search_companies với dữ liệu hợp lệ."""
        # API thực tế trả về format này
        data = {
            "LtsItems": [{"Title": "Công ty ABC", "MaSoThue": "0123456789"}]
        }
        responses.add(
            responses.GET,
            f"{self.base_url}/api/company",
            json=data,
            status=200
        )
        
        result = self.client.search_companies(k="ABC", p=1)
        
        assert result is not None
        assert result["Total"] == 1
        assert len(result["data"]) == 1
        assert result["data"][0]["Title"] == "Công ty ABC"
    
    @responses.activate
    def test_get_company_detail_by_mst_success(self):
        """Test get_company_detail_by_mst với MST hợp lệ."""
        data = {"Title": "Công ty ABC", "MaSoThue": "0123456789"}
        responses.add(
            responses.GET,
            f"{self.base_url}/api/company/0123456789",
            json=data,
            status=200
        )
        
        result = self.client.get_company_detail_by_mst("0123456789")
        
        assert result is not None
        assert result["Title"] == "Công ty ABC"
        assert result["MaSoThue"] == "0123456789"
    
    @responses.activate
    def test_get_company_detail_by_mst_not_found(self):
        """Test get_company_detail_by_mst với MST không tồn tại."""
        data = {}  # Response rỗng khi MST không tồn tại
        responses.add(
            responses.GET,
            f"{self.base_url}/api/company/9999999999",
            json=data,
            status=200
        )
        
        result = self.client.get_company_detail_by_mst("9999999999")
        
        # Khi response rỗng (không có Title), trả về None
        assert result is None
    
    @responses.activate
    def test_iter_companies_success(self):
        """Test iter_companies với pagination."""
        # Page 1
        data1 = {
            "LtsItems": [
                {"Title": "Công ty A", "MaSoThue": "001"},
                {"Title": "Công ty B", "MaSoThue": "002"}
            ]
        }
        responses.add(
            responses.GET,
            f"{self.base_url}/api/company?p=1&r=20",
            json=data1,
            status=200
        )
        
        # Page 2
        data2 = {
            "LtsItems": [
                {"Title": "Công ty C", "MaSoThue": "003"}
            ]
        }
        responses.add(
            responses.GET,
            f"{self.base_url}/api/company?p=2&r=20",
            json=data2,
            status=200
        )
        
        # Page 3 (empty)
        data3 = {"LtsItems": []}
        responses.add(
            responses.GET,
            f"{self.base_url}/api/company?p=3&r=20",
            json=data3,
            status=200
        )
        
        companies = list(self.client.iter_companies())
        
        assert len(companies) == 1  # Only 1 page with data (page 2 returns empty)
        assert len(companies[0]) == 2  # First page has 2 companies
        assert companies[0][0]["Title"] == "Công ty A"
        assert companies[0][1]["Title"] == "Công ty B"


if __name__ == "__main__":
    pytest.main([__file__])