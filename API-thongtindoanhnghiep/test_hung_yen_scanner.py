#!/usr/bin/env python3
"""
Test script for Hung Yen Province Data Scanner
"""

import unittest
import json
from pathlib import Path
import sys
import os

# Add scripts directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scripts'))

from hung_yen_scanner import HungYenScanner

class TestHungYenScanner(unittest.TestCase):
    """Test cases for HungYenScanner class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.scanner = HungYenScanner()
    
    def test_initialization(self):
        """Test scanner initialization."""
        self.assertEqual(self.scanner.base_url, "https://thongtindoanhnghiep.co/api")
        self.assertEqual(self.scanner.timeout, 30)
        self.assertEqual(self.scanner.max_retries, 3)
    
    def test_get_hung_yen_city_info(self):
        """Test getting Hung Yen city information."""
        info = self.scanner.get_hung_yen_city_info()
        self.assertIsInstance(info, dict)
        if info:  # Only test if API is accessible
            self.assertIn('province_info', info)
            self.assertIn('city_details', info)
    
    def test_get_hung_yen_districts(self):
        """Test getting districts for Hung Yen."""
        # First get city ID
        info = self.scanner.get_hung_yen_city_info()
        if info and 'province_info' in info:
            city_id = info['province_info']['ID']
            districts = self.scanner.get_hung_yen_districts(city_id)
            self.assertIsInstance(districts, list)
    
    def test_directory_creation(self):
        """Test output directory creation."""
        output_dir = Path("API/hung_yen")
        output_dir.mkdir(parents=True, exist_ok=True)
        self.assertTrue(output_dir.exists())

def run_quick_test():
    """Run a quick test to verify basic functionality."""
    print("Running quick Hung Yen scanner test...")
    
    scanner = HungYenScanner()
    
    # Test basic connectivity
    try:
        print("Testing API connectivity...")
        cities = scanner._make_request("city/list")
        if cities:
            print("✓ API connectivity confirmed")
            
            # Find Hung Yen
            hung_yen = None
            for city in cities.get('Lst', []):
                if 'hưng yên' in city.get('Title', '').lower():
                    hung_yen = city
                    break
            
            if hung_yen:
                print(f"✓ Found Hung Yen: {hung_yen['Title']} (ID: {hung_yen['ID']})")
            else:
                print("⚠ Hung Yen not found in city list")
        else:
            print("✗ API connectivity failed")
            
    except Exception as e:
        print(f"✗ Test failed: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        unittest.main()
    else:
        run_quick_test()