import os
import time
import json
import csv
from typing import Dict, Any, List, Set

from thongtindoanhnghiep import ThongTinDoanhNghiepAPIClient  # type: ignore[import]

CLIENT = ThongTinDoanhNghiepAPIClient(timeout=15)

OUT_JSON = 'hai_phong_companies_full.json'
OUT_CSV = 'hai_phong_companies.csv'
CHECKPOINT = 'details_checkpoint.json'
SEARCH_CACHE = 'search_items_cache.json'

# config
KEYWORD = 'hộ kinh doanh'
CITY_SLUG = 'hai-phong'
PER_PAGE = 50
MAX_PAGES = 100   # safety cap
SLEEP_BETWEEN_DETAIL = 0.05
SAVE_EVERY = 50


def fetch_search_pages() -> List[Dict[str, Any]]:
    if os.path.exists(SEARCH_CACHE):
        print('Loading search cache from', SEARCH_CACHE)
        with open(SEARCH_CACHE, encoding='utf-8') as f:
            return json.load(f)

    all_items: List[Dict[str, Any]] = []
    p = 1
    try:
        while p <= MAX_PAGES:
            print(f'Fetching search page {p}...')
            try:
                res = CLIENT.search_companies(k=KEYWORD, l=CITY_SLUG, r=PER_PAGE, p=p)
            except Exception as e:
                # transient network error: backoff and retry a few times
                print(f'  Warning: error fetching page {p}: {e} -- backing off 3s and retrying')
                time.sleep(3)
                try:
                    res = CLIENT.search_companies(k=KEYWORD, l=CITY_SLUG, r=PER_PAGE, p=p)
                except Exception as e2:
                    print(f'  Failed again fetching page {p}: {e2} -- saving progress and returning')
                    break

            if not res or not res.get('data'):
                print('No more data at page', p)
                break
            data = res.get('data')
            print(f'  got {len(data)} items')
            all_items.extend(data)
            if len(data) < PER_PAGE:
                break
            p += 1
            time.sleep(0.15)
    except KeyboardInterrupt:
        print('\nInterrupted by user during search; saving partial search cache...')
    # persist whatever we've collected so far
    try:
        with open(SEARCH_CACHE, 'w', encoding='utf-8') as f:
            json.dump(all_items, f, ensure_ascii=False, indent=2)
        print('Saved search cache to', SEARCH_CACHE)
    except Exception as e:
        print('Error saving search cache:', e)
    return all_items


def load_checkpoint() -> Dict[str, Any]:
    if os.path.exists(CHECKPOINT):
        with open(CHECKPOINT, encoding='utf-8') as f:
            return json.load(f)
    return {}


def save_checkpoint(details: Dict[str, Any]):
    with open(CHECKPOINT + '.tmp', 'w', encoding='utf-8') as f:
        json.dump(details, f, ensure_ascii=False, indent=2)
    os.replace(CHECKPOINT + '.tmp', CHECKPOINT)


def fetch_details(msts: List[str], resume: bool = True) -> Dict[str, Any]:
    # allow None values for failed fetches
    details: Dict[str, Any] = load_checkpoint()
    fetched = set(details.keys())
    remaining = [mst for mst in msts if mst not in fetched]
    print('To fetch:', len(remaining), 'remaining MSTs (already fetched:', len(fetched), ')')
    total_new = len(remaining)
    try:
        for idx, mst in enumerate(remaining, start=1):
            print(f'[{idx}/{total_new}] Fetching detail for MST: {mst}...')
            try:
                d = CLIENT.get_company_detail_by_mst(mst)
                details[mst] = d
            except Exception as e:
                print('  ERROR fetching', mst, e)
                details[mst] = None
            if idx % SAVE_EVERY == 0:
                print('Saving checkpoint...')
                save_checkpoint(details)
            time.sleep(SLEEP_BETWEEN_DETAIL)
    except KeyboardInterrupt:
        print('\nInterrupted by user during detail fetch; saving checkpoint...')
        save_checkpoint(details)
        raise
    # final save
    save_checkpoint(details)
    return details


def write_outputs(details: Dict[str, Any]):
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
    print('Start resume-safe collection for', KEYWORD, 'in', CITY_SLUG)
    try:
        search_items = fetch_search_pages()
    except KeyboardInterrupt:
        print('Search interrupted; exiting.')
        raise

    print('Total search items:', len(search_items))
    msts: List[str] = []
    for it in search_items:
        mst = it.get('MaSoThue')
        if mst:
            msts.append(mst)
    # dedupe while preserving order
    seen = set()
    msts_unique = []
    for m in msts:
        if m not in seen:
            seen.add(m)
            msts_unique.append(m)
    print('Unique MSTs to process:', len(msts_unique))

    try:
        details = fetch_details(msts_unique)
    except KeyboardInterrupt:
        print('Fetching details interrupted by user. Partial checkpoint saved.')
        details = load_checkpoint()

    write_outputs(details)
    print('Done.')
