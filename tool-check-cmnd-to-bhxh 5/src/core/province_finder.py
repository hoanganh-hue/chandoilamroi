import json
from pathlib import Path
from typing import List, Dict, Optional, Any

# Define a type hint for the province data for better readability and maintenance
ProvinceData = Dict[str, Any]
ProvincesList = List[ProvinceData]

_provinces: Optional[ProvincesList] = None
_province_map: Optional[Dict[str, ProvinceData]] = None

def _load_provinces_data(file_path: Path) -> ProvincesList:
    """Loads province data from the specified JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        # In a real-world app, you might want to log this error
        print(f"Error loading province data: {e}")
        return []

def get_provinces() -> ProvincesList:
    """
    Loads and caches the province data from the JSON file.

    Returns:
        A list of province dictionaries.
    """
    global _provinces
    if _provinces is None:
        # Assume the JSON file is in the 'data' directory relative to the project root
        project_root = Path(__file__).resolve().parents[2]
        json_path = project_root / 'data' / 'tinh-thanh.json'
        _provinces = _load_provinces_data(json_path)
    return _provinces

def get_province_map() -> Dict[str, ProvinceData]:
    """
    Creates and caches a mapping from province names/slugs to province data.

    This improves lookup performance by avoiding repeated iteration over the list.

    Returns:
        A dictionary for quick province lookups.
    """
    global _province_map
    if _province_map is None:
        provinces = get_provinces()
        _province_map = {}
        for province in provinces:
            # Allow lookup by name (e.g., "Thành phố Hà Nội") and slug (e.g., "ha-noi")
            _province_map[province['name'].lower()] = province
            _province_map[province['slug'].lower()] = province
            # Add variations without "Tỉnh" or "Thành phố"
            cleaned_name = province['name'].replace('Tỉnh ', '').replace('Thành phố ', '').lower()
            if cleaned_name not in _province_map:
                _province_map[cleaned_name] = province
    return _province_map


def find_province_code(address: str) -> Optional[str]:
    """
    Finds the province code from a given address string.

    The function performs a case-insensitive search to find a matching province name
    at the end of the address string.

    Args:
        address: The address string to search within.

    Returns:
        The province code (e.g., "01") if found, otherwise None.
    """
    if not address or not isinstance(address, str):
        return None

    province_map = get_province_map()
    address_lower = address.strip().lower()

    # Sort keys by length in descending order to match longer names first
    # e.g., "Bà Rịa - Vũng Tàu" before "Vũng Tàu"
    sorted_province_keys = sorted(province_map.keys(), key=len, reverse=True)
    
    for key in sorted_province_keys:
        if address_lower.endswith(key):
            return province_map[key].get('code')

    return None
