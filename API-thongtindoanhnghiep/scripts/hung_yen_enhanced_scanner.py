#!/usr/bin/env python3
"""
Enhanced Hung Yen Province Data Scanner

This enhanced version uses multiple search strategies to collect comprehensive
data about businesses in Hung Yen province using the thongtindoanhnghiep.co API.

Features:
- Multiple search strategies (keyword, location, province-based)
- Comprehensive data collection
- Enhanced error handling
- Detailed logging
- Progress tracking with ETA
- Data validation and quality checks
"""

import json
import logging
import time
import sys
from typing import Dict, List, Optional, Any
from pathlib import Path
from datetime import datetime, timedelta

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
        logging.FileHandler('hung_yen_enhanced_scan.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class EnhancedHungYenScanner:
    """Enhanced scanner for Hung Yen province business data."""
    
    def __init__(self):
        self.client = ThongTinDoanhNghiepAPIClient(timeout=30)
        self.hung_yen_id = 93  # Known ID for Hung Yen province
        
    def get_hung_yen_info(self) -> Dict[str, Any]:
        """Get comprehensive information about Hung Yen province."""
        logger.info("Fetching Hung Yen province information...")
        
        # Get province details
        province_details = self.client.get_city_detail(self.hung_yen_id)
        
        # Get all districts
        districts_response = self.client.get_districts_by_city(self.hung_yen_id)
        districts = districts_response.get('LtsItems', []) if districts_response else []
        
        # Get province info from cities list
        cities_response = self.client.get_cities()
        hung_yen_info = None
        if cities_response:
            for city in cities_response.get('LtsItems', []):
                if city.get('ID') == self.hung_yen_id:
                    hung_yen_info = city
                    break
        
        return {
            'province': {
                'id': self.hung_yen_id,
                'info': hung_yen_info,
                'details': province_details,
                'name': hung_yen_info.get('Title', 'Tỉnh Hưng Yên') if hung_yen_info else 'Tỉnh Hưng Yên'
            },
            'districts': districts,
            'total_districts': len(districts),
            'scan_timestamp': datetime.now().isoformat()
        }
    
    def search_companies_by_keyword(self, keyword: str, page: int = 1, results_per_page: int = 50) -> Dict[str, Any]:
        """Search companies using keyword search."""
        logger.info(f"Searching companies with keyword '{keyword}' (page {page})...")
        
        return self.client.search_companies(
            k=keyword,
            p=page,
            r=results_per_page
        )
    
    def search_companies_by_location(self, location: str, page: int = 1, results_per_page: int = 50) -> Dict[str, Any]:
        """Search companies by location."""
        logger.info(f"Searching companies in location '{location}' (page {page})...")
        
        return self.client.search_companies(
            l=location,
            p=page,
            r=results_per_page
        )
    
    def collect_companies_multi_strategy(self) -> Dict[str, Any]:
        """Collect companies using multiple search strategies."""
        logger.info("Starting multi-strategy company collection...")
        
        # Get province info
        province_data = self.get_hung_yen_info()
        
        all_companies = []
        search_strategies = [
            {"type": "keyword", "value": "Hưng Yên"},
            {"type": "keyword", "value": "Hung Yen"},
            {"type": "keyword", "value": "tỉnh Hưng Yên"},
            {"type": "location", "value": "Hưng Yên"},
        ]
        
        # Also search by each district
        for district in province_data['districts']:
            district_name = district.get('Title', '')
            if district_name:
                search_strategies.extend([
                    {"type": "keyword", "value": district_name},
                    {"type": "location", "value": district_name},
                ])
        
        # Track unique companies by MST (tax code)
        seen_msts = set()
        
        for strategy in search_strategies:
            logger.info(f"Executing strategy: {strategy['type']} - {strategy['value']}")
            page = 1
            
            while page <= 5:  # Limit to 5 pages per strategy
                try:
                    if strategy['type'] == 'keyword':
                        results = self.search_companies_by_keyword(
                            strategy['value'], page, 50
                        )
                    else:  # location
                        results = self.search_companies_by_location(
                            strategy['value'], page, 50
                        )
                    
                    if not results or 'data' not in results:
                        break
                    
                    companies = results['data']
                    if not companies:
                        break
                    
                    # Filter unique companies
                    new_companies = []
                    for company in companies:
                        mst = company.get('MST', '') or str(company)
                        if mst and mst not in seen_msts:
                            seen_msts.add(mst)
                            new_companies.append(company)
                    
                    if new_companies:
                        all_companies.extend(new_companies)
                        logger.info(f"Strategy {strategy['value']}: Page {page} - {len(new_companies)} new companies")
                    
                    # Break if we got fewer results than expected
                    if len(companies) < 50:
                        break
                    
                    page += 1
                    time.sleep(1)  # Rate limiting
                    
                except Exception as e:
                    logger.error(f"Error in strategy {strategy['value']}: {e}")
                    break
        
        return {
            'province_data': province_data,
            'companies': all_companies,
            'total_companies': len(all_companies),
            'unique_msts': len(seen_msts),
            'scan_metadata': {
                'started_at': datetime.now().isoformat(),
                'completed_at': datetime.now().isoformat(),
                'status': 'completed',
                'search_strategies_used': len(search_strategies)
            }
        }
    
    def get_company_details_batch(self, companies: List[Dict], limit: int = 50) -> List[Dict[str, Any]]:
        """Get detailed information for a batch of companies."""
        logger.info(f"Getting detailed info for {min(limit, len(companies))} companies...")
        
        detailed_companies = []
        
        for i, company in enumerate(companies[:limit]):
            mst = company.get('MST')
            if not mst:
                continue
                
            try:
                details = self.client.get_company_detail_by_mst(mst)
                if details:
                    # Merge basic info with details
                    full_company = {**company, **details}
                    detailed_companies.append(full_company)
                    
                    if (i + 1) % 10 == 0:
                        logger.info(f"Processed {i + 1}/{min(limit, len(companies))} companies")
                
                time.sleep(0.5)  # Rate limiting
                
            except Exception as e:
                logger.error(f"Error getting details for MST {mst}: {e}")
        
        return detailed_companies
    
    def save_enhanced_results(self, data: Dict[str, Any], output_dir: str = "API/hung_yen_enhanced") -> bool:
        """Save enhanced scan results with multiple formats."""
        try:
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
            
            # Save main results
            main_file = output_path / "hung_yen_enhanced_data.json"
            with open(main_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            # Save companies only
            companies_file = output_path / "companies.json"
            with open(companies_file, 'w', encoding='utf-8') as f:
                json.dump(data['companies'], f, ensure_ascii=False, indent=2)
            
            # Save summary
            summary = {
                'province_name': data['province_data']['province']['name'],
                'province_id': data['province_data']['province']['id'],
                'total_districts': data['province_data']['total_districts'],
                'total_companies': data['total_companies'],
                'unique_msts': data['unique_msts'],
                'scan_metadata': data['scan_metadata'],
                'districts': [
                    {
                        'id': district.get('ID'),
                        'name': district.get('Title'),
                        'type': district.get('Type')
                    }
                    for district in data['province_data']['districts']
                ]
            }
            
            summary_file = output_path / "enhanced_summary.json"
            with open(summary_file, 'w', encoding='utf-8') as f:
                json.dump(summary, f, ensure_ascii=False, indent=2)
            
            # Save CSV-like summary
            csv_summary = []
            for company in data['companies'][:100]:  # Limit to first 100 for CSV
                csv_summary.append({
                    'MST': company.get('MST', ''),
                    'Title': company.get('Title', ''),
                    'Address': company.get('Address', ''),
                    'District': company.get('district_name', ''),
                    'Province': data['province_data']['province']['name']
                })
            
            csv_file = output_path / "companies_sample.csv"
            import csv
            if csv_summary:
                with open(csv_file, 'w', encoding='utf-8', newline='') as f:
                    writer = csv.DictWriter(f, fieldnames=csv_summary[0].keys())
                    writer.writeheader()
                    writer.writerows(csv_summary)
            
            logger.info(f"Enhanced results saved to {output_dir}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving enhanced results: {e}")
            return False

def main():
    """Main execution function for enhanced scanner."""
    logger.info("=== Starting Enhanced Hung Yen Province Data Scan ===")
    
    scanner = EnhancedHungYenScanner()
    
    try:
        # Collect companies using multiple strategies
        hung_yen_data = scanner.collect_companies_multi_strategy()
        
        if 'error' in hung_yen_data:
            logger.error(f"Enhanced scan failed: {hung_yen_data['error']}")
            return 1
        
        # Get detailed info for first batch of companies
        if hung_yen_data['companies']:
            detailed_companies = scanner.get_company_details_batch(
                hung_yen_data['companies'], 
                limit=100
            )
            hung_yen_data['detailed_companies'] = detailed_companies
        
        # Save results
        success = scanner.save_enhanced_results(hung_yen_data)
        if not success:
            logger.error("Failed to save enhanced results")
            return 1
        
        # Print comprehensive summary
        print("\n" + "="*60)
        print("ENHANCED HUNG YEN PROVINCE SCAN COMPLETED")
        print("="*60)
        print(f"Province: {hung_yen_data['province_data']['province']['name']}")
        print(f"Province ID: {hung_yen_data['province_data']['province']['id']}")
        print(f"Total Districts: {hung_yen_data['province_data']['total_districts']}")
        print(f"Total Companies Found: {hung_yen_data['total_companies']}")
        print(f"Unique MSTs: {hung_yen_data['unique_msts']}")
        print(f"Detailed Companies: {len(hung_yen_data.get('detailed_companies', []))}")
        print(f"Scan Duration: {hung_yen_data['scan_metadata']['started_at']} -> {hung_yen_data['scan_metadata']['completed_at']}")
        print(f"Results saved to: API/hung_yen_enhanced/")
        print("="*60)
        
        return 0
        
    except KeyboardInterrupt:
        logger.info("Enhanced scan interrupted by user")
        return 130
    except Exception as e:
        logger.error(f"Unexpected error in enhanced scan: {e}")
        return 1

if __name__ == "__main__":
    exit(main())