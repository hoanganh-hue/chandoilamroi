import pytest
from src.core.province_finder import find_province_code

# Test cases for find_province_code function
# Each tuple contains: (test_name, input_address, expected_output)
test_data = [
    ("full_name_hanoi", "123 Đường ABC, Quận Ba Đình, Thành phố Hà Nội", "01"),
    ("full_name_hcm", "456 Đường XYZ, Quận 1, Thành phố Hồ Chí Minh", "79"),
    ("short_name_danang", "789 Đường LMN, Quận Hải Châu, Đà Nẵng", "48"),
    ("province_name_bacninh", "Khu công nghiệp VSIP, Tỉnh Bắc Ninh", "27"),
    ("name_without_province_prefix", "Thị trấn Chờ, huyện Yên Phong, Bắc Ninh", "27"),
    ("case_insensitivity", "10 Downing Street, thành phố hà nội", "01"),
    ("extra_whitespace", "  123 Main St, An Giang  ", "89"),
    ("complex_name_brvt", "Số 1, đường 2, thành phố Vũng Tàu, Tỉnh Bà Rịa - Vũng Tàu", "77"),
    ("partial_match_should_fail", "Thành phố Bà Rịa", "77"), # Should match the full name
    ("no_match", "123 Nowhere Land", None),
    ("empty_string", "", None),
    ("not_a_string", 12345, None),
    ("foreign_address", "221B Baker Street, London", None),
    ("slug_name", "Thị trấn Cần Thơ", "92"),
]

@pytest.mark.parametrize("test_name, input_address, expected_output", test_data)
def test_find_province_code(test_name, input_address, expected_output):
    """
    Tests the find_province_code function with various address formats.
    """
    # Arrange (already done in parametrize)

    # Act
    result = find_province_code(input_address)

    # Assert
    assert result == expected_output, f"Test '{test_name}' failed: Got {result}, expected {expected_output}"

def test_province_data_loading():
    """
    Ensures that the province data is loaded and accessible.
    A simple check to see if a known province can be found.
    """
    # Act
    result = find_province_code("Hà Nội")

    # Assert
    assert result is not None
    assert result == "01"
