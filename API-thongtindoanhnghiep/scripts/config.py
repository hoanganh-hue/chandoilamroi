"""
Configuration settings for Hung Yen Province Data Scanner
"""

import os
from pathlib import Path

# API Configuration
API_BASE_URL = "https://thongtindoanhnghiep.co/api"
REQUEST_TIMEOUT = 30  # seconds
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds
RATE_LIMIT_DELAY = 1  # seconds between requests

# Output Configuration
OUTPUT_BASE_DIR = Path("API/hung_yen")
SCAN_RESULTS_FILE = "hung_yen_companies.json"
SUMMARY_FILE = "summary.json"
LOG_FILE = "hung_yen_scan.log"

# Hung Yen specific settings
HUNG_YEN_KEYWORDS = [
    "hưng yên",
    "hung yen",
    "huyện hưng yên",
    "thành phố hưng yên",
    "tỉnh hưng yên"
]

# Search Configuration
COMPANIES_PER_PAGE = 20
MAX_PAGES_PER_DISTRICT = 50  # Safety limit

# Retry configuration for specific HTTP status codes
RETRY_STATUS_CODES = [429, 500, 502, 503, 504]

# Create output directory
OUTPUT_BASE_DIR.mkdir(parents=True, exist_ok=True)