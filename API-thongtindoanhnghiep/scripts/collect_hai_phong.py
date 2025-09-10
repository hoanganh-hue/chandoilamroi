import os
import time
import json
import csv
from typing import Dict, Any, List, Set

from thongtindoanhnghiep import ThongTinDoanhNghiepAPIClient  # type: ignore[import]

CLIENT = ThongTinDoanhNghiepAPIClient(timeout=15)

OUT_JSON = 'hai_phong_companies_full.json'
OUT_CSV = 'hai_phong_companies.csv'

# config
KEYWORD = 'hộ kinh doanh'
CITY_SLUG = 'hai-phong'
PER_PAGE = 50
MAX_PAGES = 50   # safety cap -> up to 2500 items
SLEEP_BETWEEN_DETAIL = 0.08


def fetch_search_pages() -> List[Dict[str, Any]]:
    all_items: List[Dict[str, Any]] = []
    for p in range(1, MAX_PAGES + 1):
        print(f'Fetching search page {p}...')
        res = CLIENT.search_companies(k=KEYWORD, l=CITY_SLUG, r=PER_PAGE, p=p)
        if not res or not res.get('data'):
            print('No more data at page', p)
            break
        data = res.get('data')
        print(f'  got {len(data)} items')
        all_items.extend(data)
        # safety: if fewer than requested per page, likely last page
        if len(data) < PER_PAGE:
            break
        # small pause to be nice
        time.sleep(0.2)
    return all_items


def fetch_details(msts: Set[str]) -> Dict[str, Any]:
    # Values may be None when a fetch fails, so allow Optional values.
    details: Dict[str, Any] = {}
    count = 0
    total = len(msts)
    for mst in sorted(msts):
        count += 1
        print(f'[{count}/{total}] Fetching detail for MST: {mst}...')
        try:
            d = CLIENT.get_company_detail_by_mst(mst)
            if d:
                details[mst] = d
            else:
                details[mst] = None
        except Exception as e:
            print('  ERROR fetching', mst, e)
            details[mst] = None
        time.sleep(SLEEP_BETWEEN_DETAIL)
    return details


def write_outputs(details: Dict[str, Dict[str, Any]]):
    # write JSON
    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(details, f, ensure_ascii=False, indent=2)
    print('Wrote', OUT_JSON)

    # write CSV with selected columns
    keys = ['MaSoThue','Title','TitleEn','DiaChiCongTy','TinhThanhTitle','QuanHuyenTitle','PhuongXaTitle','NganhNgheTitle','TongSoLaoDong','NgayCap','NgayDongMST']
    with open(OUT_CSV, 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f)
        w.writerow(keys)
        for mst, d in details.items():
            if not d:
                w.writerow([mst] + [''] * (len(keys)-1))
                continue
            row = [d.get(k) for k in keys]
            w.writerow(row)
    print('Wrote', OUT_CSV)


if __name__ == '__main__':
    print('Starting collection for', KEYWORD, 'in', CITY_SLUG)
    search_items = fetch_search_pages()
    print('Total search items collected:', len(search_items))
    msts: Set[str] = set()
    for it in search_items:
        mst = it.get('MaSoThue')
        if mst:
            msts.add(mst)
    print('Unique MSTs found in search results:', len(msts))

    details = fetch_details(msts)
    write_outputs(details)
    print('Done.')
