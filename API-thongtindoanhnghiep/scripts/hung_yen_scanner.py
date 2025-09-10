#!/usr/bin/env python3
"""
Hung Yen Province Data Scanner

This module provides functionality to scan and collect comprehensive data
about businesses in Hung Yen province using the thongtindoanhnghiep.co API.

Features:
- Complete data collection for Hung Yen province
- Error handling and retry mechanisms
- Structured JSON output
- Comprehensive logging
- Timeout handling
- Progress tracking
"""

import json
import logging
import time
import sys
from typing import Dict, List, Optional, Any
from pathlib import Path
from datetime import datetime

# Add src directory to path for importing
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

try:
    from thongtindoanhnghiep.thongtindoanhnghiep_api_client import ThongTinDoanhNghiepAPIClient
except ImportError as e:
    print(f"Error importing API client: {e}")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('hung_yen_scan.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class HungYenScanner:
    """Scanner for Hung Yen province business data."""
    
    def __init__(self):
        self.client = ThongTinDoanhNghiepAPIClient(timeout=30)
        
    def get_hung_yen_city_info(self) -> Dict[str, Any]:
        """Get basic information about Hung Yen province."""
        logger.info("Fetching Hung Yen province information...")
        
        # Get city list to find Hung Yen
        cities_response = self.client.get_cities()
        if not cities_response:
            logger.warning("Could not retrieve cities list")
            return {}
            
        cities = cities_response.get('LtsItems', [])
        hung_yen = None
        
        for city in cities:
            title = city.get('Title', '').lower()
            if 'hưng yên' in title or 'hung yen' in title:
                hung_yen = city
                break
        
        if not hung_yen:
            # Try to find by ID - Hung Yen is typically ID 93
            logger.warning("Hung Yen not found by name, trying known ID 93...")
            hung_yen_detail = self.client.get_city_detail(93)
            if hung_yen_detail:
                hung_yen = {'ID': 93, 'Title': 'Tỉnh Hưng Yên'}
            else:
                logger.error("Hung Yen province not found")
                return {}
        
        city_id = hung_yen.get('ID')
        city_details = self.client.get_city_detail(city_id)
        
        return {
            'province_info': hung_yen,
            'city_details': city_details,
            'scan_timestamp': datetime.now().isoformat()
        }
    
    def get_hung_yen_districts(self, city_id: int) -> List[Dict[str, Any]]:
        """Get all districts in Hung Yen province."""
        logger.info(f"Fetching districts for city ID {city_id}...")
        
        districts_response = self.client.get_districts_by_city(city_id)
        if not districts_response:
            logger.warning(f"Could not retrieve districts for city {city_id}")
            return []
            
        district_list = districts_response.get('LtsItems', [])
        logger.info(f"Found {len(district_list)} districts")
        return district_list
    
    def get_wards_by_district(self, district_id: int) -> List[Dict[str, Any]]:
        """Get all wards in a specific district."""
        logger.info(f"Fetching wards for district ID {district_id}...")
        
        wards_response = self.client.get_wards_by_district(district_id)
        if not wards_response:
            logger.warning(f"Could not retrieve wards for district {district_id}")
            return []
            
        ward_list = wards_response.get('LtsItems', [])
        logger.info(f"Found {len(ward_list)} wards")
        return ward_list
    
    def search_companies_in_location(self, location: str, page: int = 1, results_per_page: int = 20) -> Dict[str, Any]:
        """Search companies in a specific location."""
        logger.info(f"Searching companies in {location} (page {page})...")
        
        return self.client.search_companies(
            l=location,
            p=page,
            r=results_per_page
        )
    
    def collect_hung_yen_companies(self) -> Dict[str, Any]:
        """Collect all companies in Hung Yen province."""
        logger.info("Starting comprehensive Hung Yen company collection...")
        
        # Get province info
        province_info = self.get_hung_yen_city_info()
        if not province_info:
            return {'error': 'Could not retrieve Hung Yen province information'}
        
        city_id = province_info['province_info']['ID']
        city_name = province_info['province_info']['Title']
        
        # Get districts
        districts = self.get_hung_yen_districts(city_id)
        
        # Collect data structure
        hung_yen_data = {
            'province': {
                'id': city_id,
                'name': city_name,
                'info': province_info
            },
            'districts': {},
            'total_companies': 0,
            'companies': [],
            'scan_metadata': {
                'started_at': datetime.now().isoformat(),
                'status': 'in_progress'
            }
        }
        
        # Process each district
        for district in districts:
            district_id = district['ID']
            district_name = district['Title']
            logger.info(f"Processing district: {district_name}")
            
            # Get wards for this district
            wards = self.get_wards_by_district(district_id)
            
            # Search companies in district
            district_companies = []
            page = 1
            max_pages = 10  # Safety limit to prevent excessive requests
            
            while page <= max_pages:
                search_results = self.search_companies_in_location(
                    f"{district_name}, {city_name}", 
                    page,
                    results_per_page=20
                )
                
                if not search_results or 'data' not in search_results:
                    break
                
                companies = search_results['data']
                if not companies:
                    break
                
                # Add district and province info to each company
                for company in companies:
                    company['district_id'] = district_id
                    company['district_name'] = district_name
                    company['province_id'] = city_id
                    company['province_name'] = city_name
                
                district_companies.extend(companies)
                hung_yen_data['companies'].extend(companies)
                
                # Log progress
                logger.info(f"District {district_name}: Page {page} - {len(companies)} companies")
                
                # Check if we should continue
                if len(companies) < 20:  # Last page
                    break
                
                page += 1
                time.sleep(1)  # Rate limiting
            
            # Store district data
            hung_yen_data['districts'][district_id] = {
                'name': district_name,
                'wards': wards,
                'companies': district_companies,
                'company_count': len(district_companies)
            }
            
            hung_yen_data['total_companies'] += len(district_companies)
            logger.info(f"District {district_name}: Total {len(district_companies)} companies")
        
        # Update metadata
        hung_yen_data['scan_metadata'].update({
            'completed_at': datetime.now().isoformat(),
            'status': 'completed',
            'total_districts': len(districts),
            'total_companies': hung_yen_data['total_companies']
        })
        
        return hung_yen_data
    
    def save_results(self, data: Dict[str, Any], output_dir: str = "API/hung_yen") -> bool:
        """Save scan results to JSON files."""
        try:
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
            
            # Save main results
            main_file = output_path / "hung_yen_companies.json"
            with open(main_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            # Save summary
            summary = {
                'province_name': data['province']['name'],
                'total_companies': data['total_companies'],
                'total_districts': len(data['districts']),
                'scan_metadata': data['scan_metadata'],
                'district_summary': [
                    {
                        'district_id': did,
                        'name': dinfo['name'],
                        'company_count': dinfo['company_count']
                    }
                    for did, dinfo in data['districts'].items()
                ]
            }
            
            summary_file = output_path / "summary.json"
            with open(summary_file, 'w', encoding='utf-8') as f:
                json.dump(summary, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Results saved to {output_dir}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving results: {e}")
            return False

def main():
    """Main execution function."""
    logger.info("=== Starting Hung Yen Province Data Scan ===")
    
    scanner = HungYenScanner()
    
    try:
        # Collect all Hung Yen companies
        hung_yen_data = scanner.collect_hung_yen_companies()
        
        if 'error' in hung_yen_data:
            logger.error(f"Scan failed: {hung_yen_data['error']}")
            return 1
        
        # Save results
        success = scanner.save_results(hung_yen_data)
        if not success:
            logger.error("Failed to save results")
            return 1
        
        # Print summary
        print("\n" + "="*50)
        print("HUNG YEN PROVINCE SCAN COMPLETED")
        print("="*50)
        print(f"Province: {hung_yen_data['province']['name']}")
        print(f"Total Districts: {len(hung_yen_data['districts'])}")
        print(f"Total Companies: {hung_yen_data['total_companies']}")
        print(f"Scan Duration: {hung_yen_data['scan_metadata']['started_at']} -> {hung_yen_data['scan_metadata']['completed_at']}")
        print(f"Results saved to: API/hung_yen/")
        print("="*50)
        
        return 0
        
    except KeyboardInterrupt:
        logger.info("Scan interrupted by user")
        return 130
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    exit(main())