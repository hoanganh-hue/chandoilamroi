# API

*   [Trang chủ]()
*   API

# Danh sách REST API được cung cấp

Chúng tôi sẵn sàng chia sẻ & mở CSDL về thông tin doanh nghiệp cho các đơn vị, nhà phát triển phần mềm nhằm. Dưới đây là các API mà chúng tôi hỗ trợ

| End point | Param | Mô tả | Test |
| --- | --- | --- | --- |
| /api/city | none | Lấy về toàn bộ danh mục Tỉnh/Thành phố | [Link]() |
| /api/city/{id:int} | none | Lấy về chi tiết một Tỉnh/Thành phố | [Link]() |
| /api/city/{id:int}/district | none | Lấy về toàn bộ Quận/Huyện theo Tỉnh/Thành phố | [Link]() |
| /api/district/{int:id} | none | Lấy về chi tiết một Quận/Huyện | [Link]() |
| /api/disitrct/{int:id}/ward | none | Lấy về toàn bộ phường, xã & thị trấn thuộc Quận/Huyện | [Link]() |
| /api/ward/{int:id} | none | Lấy về chi tiết phường, xã, thị trấn | [Link]() |
| /api/industry | none | Lấy về toàn bộ danh mục ngành nghề kinh doanh | [Link]() |
| /api/company | l | 

Lọc danh sách doanh nghiệp theo vùng 

 | [Link]() [Link]() [Link]() |
| /api/company | k | Lọc danh sách doanh nghiệp theo kết quả tìm kiếm | [Link]() |
| /api/company | i | Lọc danh sách doanh nghiệp theo ngành nghề kinh doanh | [Link]() |
| /api/company | r | Số lượng row cần lấy trên 1 trang | [Link]() |
| /api/company | p | Trang cần lấy | [Link]() |
| /api/company/{string:mst} | none | Lấy về chi tiết doanh nghiệp theo mã số thuế | [Link]() |

Chú ý: Đối với API: /api/company?queryValues có thể kết hợp nhiều parram 1 lúc.  
Ví dụ: [/api/company?**k**\=Cong Ty Co phan Cong Nghe&**l**\=ha-noi&**p**\=2]()

Cơ sở dữ liệu Thông tin doanh nghiệp là trang web cung cấp, tra cứu miễn phí thông tin doanh nghiệp.

## Contact Us

Mọi thông tin chi tiết xin vui lòng liên hệ đến với chúng tôi qua địa chỉ email: [contact@thongtindoanhnghiep.co]().

2015 © thongtindoanhnghiep.co All Rights Reserved.

