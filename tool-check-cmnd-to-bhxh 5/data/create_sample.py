#!/usr/bin/env python3
import pandas as pd

# Dữ liệu mẫu
data = [
    {"CMND": "123456789", "DiaChi": "123 Đường ABC, Phường XYZ, Quận 1, TP.HCM"},
    {"CMND": "987654321", "DiaChi": "456 Đường DEF, Xã GHI, Huyện JKL, Tỉnh Bình Dương"},
    {"CMND": "555666777", "DiaChi": "789 Đường MNO, Phường PQR, Quận Thanh Xuân, Hà Nội"},
]

df = pd.DataFrame(data)
df.to_excel("data-input-sample.xlsx", index=False)
print("✅ Tạo file Excel mẫu thành công!")