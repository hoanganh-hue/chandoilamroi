import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

import pandas as pd
import os
from thongtindoanhnghiep.thongtindoanhnghiep_api_client import ThongTinDoanhNghiepAPIClient
import logging

# Cấu hình logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

INPUT_DIR = "input"
OUTPUT_DIR = "output"
INPUT_FILENAME = "mst_sample.xlsx"
OUTPUT_FILENAME = "company_details_output.xlsx"
MST_COLUMN_NAME = "Mã số thuế"

def process_mst_excel():
    """
    Đọc danh sách MST từ file Excel, truy vấn thông tin công ty từ API
    và ghi kết quả ra file Excel mới.
    """
    input_filepath = os.path.join(INPUT_DIR, INPUT_FILENAME)
    output_filepath = os.path.join(OUTPUT_DIR, OUTPUT_FILENAME)

    if not os.path.exists(input_filepath):
        logging.error(f"File đầu vào không tồn tại: {input_filepath}")
        logging.info(f"Vui lòng tạo file '{INPUT_FILENAME}' trong thư mục '{INPUT_DIR}' với một cột '{MST_COLUMN_NAME}'.")
        return

    try:
        df_input = pd.read_excel(input_filepath)
    except Exception as e:
        logging.error(f"Không thể đọc file Excel đầu vào: {e}")
        return

    if MST_COLUMN_NAME not in df_input.columns:
        logging.error(f"File Excel đầu vào phải có một cột tên là '{MST_COLUMN_NAME}'.")
        return

    # Bổ sung logic: Loại bỏ các MST trùng lặp
    initial_mst_count = len(df_input)
    df_input.drop_duplicates(subset=[MST_COLUMN_NAME], inplace=True)
    if len(df_input) < initial_mst_count:
        logging.info(f"Đã loại bỏ {initial_mst_count - len(df_input)} MST trùng lặp.")

    client = ThongTinDoanhNghiepAPIClient()
    all_company_data = []

    logging.info(f"Bắt đầu xử lý {len(df_input)} mã số thuế...")

    for index, row in df_input.iterrows():
        mst = str(row[MST_COLUMN_NAME]).strip()
        if not mst:
            logging.warning(f"Bỏ qua hàng {index + 2}: Mã số thuế trống.")
            continue

        logging.info(f"Truy vấn thông tin cho MST: {mst}")
        company_detail = client.get_company_detail_by_mst(mst)

        if company_detail:
            # Chuẩn hóa và làm phẳng dữ liệu
            flattened_data = {
                "MST": mst,
                "Tên Công Ty": company_detail.get("Title"),
                "Tên Công Ty Tiếng Anh": company_detail.get("TitleEn"),
                "Địa Chỉ Công Ty": company_detail.get("DiaChiCongTy"),
                "Ngày Cấp": company_detail.get("NgayCap"),
                "Ngày Đóng MST": company_detail.get("NgayDongMST"),
                "Tổng Số Lao Động": company_detail.get("TongSoLaoDong"),
                "Chủ Sở Hữu": company_detail.get("ChuSoHuu"),
                "Địa Chỉ Chủ Sở Hữu": company_detail.get("ChuSoHuu_DiaChi"),
                "Giám Đốc": company_detail.get("GiamDoc"),
                "Địa Chỉ Giám Đốc": company_detail.get("GiamDoc_DiaChi"),
                "Kế Toán Trưởng": company_detail.get("KeToanTruong"),
                "Địa Chỉ Kế Toán Trưởng": company_detail.get("KeToanTruong_DiaChi"),
                "Tỉnh Thành": company_detail.get("TinhThanhTitle"),
                "Quận Huyện": company_detail.get("QuanHuyenTitle"),
                "Phường Xã": company_detail.get("PhuongXaTitle"),
                "Cơ Quan Quản Lý": company_detail.get("NoiDangKyQuanLy_CoQuanTitle"),
                "Điện Thoại Cơ Quan Quản Lý": company_detail.get("NoiDangKyQuanLy_DienThoai"),
                "Ngành Nghề Chính": company_detail.get("NganhNgheTitle"),
                "Danh Sách Ngành Nghề Kinh Doanh": ", ".join(company_detail.get("DSNganhNgheKinhDoanh", [])),
                "Danh Sách Thuế Phải Nộp": ", ".join([item.split('|')[2] for item in company_detail.get("DSThuePhaiNop", []) if len(item.split('|')) > 2]),
                # Thêm các trường khác nếu cần
            }
            all_company_data.append(flattened_data)
        else:
            logging.warning(f"Không tìm thấy thông tin cho MST: {mst}")
            all_company_data.append({"MST": mst, "Tên Công Ty": "Không tìm thấy thông tin"})

    if all_company_data:
        df_output = pd.DataFrame(all_company_data)
        try:
            df_output.to_excel(output_filepath, index=False)
            logging.info(f"Đã ghi kết quả vào file: {output_filepath}")
        except Exception as e:
            logging.error(f"Không thể ghi file Excel đầu ra: {e}")
    else:
        logging.info("Không có dữ liệu để ghi ra file Excel.")

if __name__ == "__main__":
    process_mst_excel()
