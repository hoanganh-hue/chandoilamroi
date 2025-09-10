import json
from datetime import datetime
from typing import Any, Dict, List, Optional

IN_FILE = 'company_details_search.json'
OUT_FILE = 'company_normalized.json'


def parse_date(v: Optional[str]) -> Optional[str]:
    if not v:
        return None
    for fmt in ('%Y-%m-%dT%H:%M:%SZ', '%Y-%m-%d'):
        try:
            return datetime.strptime(v, fmt).date().isoformat()
        except Exception:
            continue
    return v


def normalize_company(raw: Dict[str, Any]) -> Dict[str, Any]:
    # canonical contract
    out: Dict[str, Any] = {}
    out['id'] = raw.get('ID')
    out['tax_id'] = raw.get('MaSoThue')
    out['name'] = raw.get('Title')
    out['name_en'] = raw.get('TitleEn') or None
    out['slug'] = raw.get('SolrID')

    # Address fields
    out['address_raw'] = raw.get('DiaChiCongTy') or raw.get('DiaChi') or raw.get('DiaChiNhanThongBaoThue') or None
    out['city'] = raw.get('TinhThanhTitle') or None
    out['city_id'] = raw.get('TinhThanhID') or None
    out['district'] = raw.get('QuanHuyenTitle') or None
    out['district_id'] = raw.get('QuanHuyenID') or None
    out['ward'] = raw.get('PhuongXaTitle') or None
    out['ward_id'] = raw.get('PhuongXaID') or None

    # Status and dates
    out['status'] = 'deleted' if raw.get('IsDelete') else ('active' if not raw.get('NgayDongMST') else 'closed')
    out['registered_date'] = parse_date(raw.get('NgayCap') or raw.get('QuyetDinhThanhLap_NgayCap'))
    out['start_date'] = parse_date(raw.get('NgayBatDauHopDong') or raw.get('NgayNhanToKhai'))
    out['closed_date'] = parse_date(raw.get('NgayDongMST'))

    # Numbers
    # Safe integer parse for employee count
    emp_val = raw.get('TongSoLaoDong')
    # Safe int parsing
    def safe_int(x: Any) -> Optional[int]:
        if x in (None, ''):
            return None
        try:
            return int(x)
        except Exception:
            try:
                return int(float(x))
            except Exception:
                return None

    out['employees'] = safe_int(emp_val)

    # Industry
    out['industry'] = raw.get('NganhNgheTitle') or None
    out['industry_ids'] = raw.get('DSNganhNgheKinhDoanhID') or raw.get('DSNganhNgheKinhDoanh') or []
    out['industry_codes'] = raw.get('DSMaNganhNgheKinhDoanh') or []

    # Contacts / org
    out['owner'] = raw.get('ChuSoHuu') or None
    out['director'] = raw.get('GiamDoc') or None
    out['accountant'] = raw.get('KeToanTruong') or None
    out['bank_accounts'] = raw.get('DSNganHang') or []

    # Branches / subsidiaries
    branches = []
    for b in raw.get('LtsDoanhNghiepTrucThuoc') or []:
        branches.append({
            'title': b.get('Title'),
            'tax_id': b.get('MaSoThue'),
            'address': b.get('DiaChi') or b.get('DiaChiCongTy') or None,
            'relation': b.get('QuanHe')
        })
    out['branches'] = branches

    # Tags and metadata
    out['tags'] = raw.get('DSTags') or []
    out['source_id'] = raw.get('SourceID') or None
    out['raw'] = raw  # keep raw for traceability
    return out


if __name__ == '__main__':
    with open(IN_FILE, encoding='utf-8') as f:
        data = json.load(f)

    # Pick the most relevant entry: look for 0200136914 or first non-empty detail
    target = None
    for k, v in data.items():
        if not v:
            continue
        if '0200136914' in (v.get('MaSoThue') or '') or k == '0200136914' or 'Công ty kinh doanh vận chuyển hành khách' in (v.get('Title') or ''):
            target = v
            break
    if not target:
        # fallback: first non-null
        for v in data.values():
            if v:
                target = v
                break

    if not target:
        print('No company record found in', IN_FILE)
        raise SystemExit(1)

    normalized = normalize_company(target)
    with open(OUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(normalized, f, ensure_ascii=False, indent=2)

    print('Wrote normalized record to', OUT_FILE)
    print('Preview:')
    import pprint
    pprint.pprint({k: normalized[k] for k in ('tax_id','name','address_raw','city','district','status','registered_date','start_date','closed_date','employees','industry')})
