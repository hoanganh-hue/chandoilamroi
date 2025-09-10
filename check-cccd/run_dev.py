# -*- coding: utf-8 -*-

import json
import logging
import pandas as pd
import os
from dotenv import load_dotenv
from src.modules.core.module_2_check_cccd_enhanced_v3 import Module2CheckCCCDEnhancedV3

# Cấu hình logging cơ bản
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def main():
    """Hàm chính để chạy quy trình tra cứu từ file Excel."""
    # Tải các biến môi trường từ file .env (quan trọng để load proxy)
    logging.info("Đang tải cấu hình từ file .env...")
    load_dotenv()

    # --- 1. ĐỌC DỮ LIỆU ĐẦU VÀO TỪ FILE EXCEL ---
    input_file = "input/danh_sach_cccd.xlsx"
    if not os.path.exists(input_file):
        logging.error(f"Lỗi: Không tìm thấy file đầu vào '{input_file}'. Vui lòng tạo file và thử lại.")
        return

    try:
        logging.info(f"Đang đọc dữ liệu từ file: {input_file}")
        df_input = pd.read_excel(input_file)
        if 'cccd' not in df_input.columns:
            logging.error(f"Lỗi: File Excel '{input_file}' phải có cột tên là 'cccd'.")
            return
        
        # Lấy danh sách cccd, loại bỏ giá trị rỗng và trùng lặp
        cccd_list_to_check = df_input['cccd'].dropna().astype(str).unique().tolist()
        if not cccd_list_to_check:
            logging.warning("Không có CCCD nào hợp lệ trong file đầu vào để tra cứu.")
            return

    except Exception as e:
        logging.error(f"Lỗi khi đọc file Excel: {e}")
        return

    # --- 2. KHỞI TẠO VÀ CHẠY MODULE TRA CỨU ---
    logging.info("🚀 Khởi tạo module tra cứu...")
    # Truyền một config rỗng; module sẽ tự động fallback về env vars cho proxy
    checker = Module2CheckCCCDEnhancedV3({})

    logging.info(f"🔎 Chuẩn bị tra cứu cho {len(cccd_list_to_check)} CCCD duy nhất.")
    results = checker.batch_check(cccd_list_to_check)

    # --- 3. LƯU KẾT QUẢ RA FILE EXCEL ---
    if results:
        output_filename = "ket_qua_tra_cuu.xlsx"
        checker.save_results_to_excel(results, output_filename)
    else:
        logging.warning("Không có kết quả nào được trả về từ quá trình tra cứu.")

    logging.info("✅ Hoàn tất.")

if __name__ == "__main__":
    main()