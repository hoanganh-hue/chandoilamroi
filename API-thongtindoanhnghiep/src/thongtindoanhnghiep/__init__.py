"""
ThongTinDoanhNghiep API Client

A comprehensive Python client for interacting with thongtindoanhnghiep.co API.
Provides access to business information, locations, and industries data.

Version: 1.0.0
Author: API Development Team
License: MIT
"""

from .thongtindoanhnghiep_api_client import ThongTinDoanhNghiepAPIClient, APIError
from .config import BASE_URL

__version__ = "1.0.0"
__author__ = "API Development Team"
__email__ = "dev@example.com"
__license__ = "MIT"

__all__ = [
    "ThongTinDoanhNghiepAPIClient",
    "APIError", 
    "BASE_URL",
    "__version__",
    "__author__",
    "__email__",
    "__license__"
]