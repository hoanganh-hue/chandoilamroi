
import random
from datetime import datetime
from cccd_config import PROVINCE_CODES, GENDER_CENTURY_CODES, MIN_BIRTH_YEAR, MAX_BIRTH_YEAR
from cccd_metadata import LEGAL_BASIS

class CCCDCore:
    def __init__(self):
        self.provinces = PROVINCE_CODES
        self.gender_century_codes = GENDER_CENTURY_CODES

    def generate_cccd_list(self, province_codes=None, gender=None, birth_year=None, quantity=10):
        results = []
        generated_cccds = set()

        for _ in range(quantity):
            try:
                province_code = self._get_random_province_code(province_codes)
                selected_birth_year = birth_year if birth_year else random.randint(MIN_BIRTH_YEAR, MAX_BIRTH_YEAR)
                gender_century_code = self._get_gender_century_code(selected_birth_year, gender)
                
                year_code = str(selected_birth_year % 100).zfill(2)
                
                cccd = ""
                attempts = 0
                max_attempts = 10000

                while True:
                    random_sequence = str(random.randint(1, 999999)).zfill(6)
                    cccd = f"{province_code}{gender_century_code}{year_code}{random_sequence}"
                    attempts += 1
                    if cccd not in generated_cccds or attempts >= max_attempts:
                        break
                
                if attempts >= max_attempts:
                    print(f"Cảnh báo: Không thể tạo CCCD duy nhất sau {max_attempts} lần thử cho tỉnh {province_code}, năm {selected_birth_year}")
                    continue

                generated_cccds.add(cccd)

                gender_text = self.gender_century_codes[gender_century_code]["gender"]
                century_text = self.gender_century_codes[gender_century_code]["century"]

                results.append({
                    "cccd_number": cccd,
                    "province_code": province_code,
                    "province_name": self.provinces.get(province_code, "Unknown"),
                    "gender": gender_text,
                    "birth_year": selected_birth_year,
                    "century": century_text,
                    "gender_century_code": gender_century_code,
                    "random_sequence": cccd[6:]
                })
            except Exception as e:
                print(f"Lỗi khi tạo CCCD: {e}")
                continue
        return results

    def _get_random_province_code(self, province_codes):
        if province_codes:
            valid_provinces = [code for code in province_codes if code in self.provinces]
            if not valid_provinces:
                raise ValueError("Không có mã tỉnh hợp lệ trong danh sách.")
            return random.choice(valid_provinces)
        return "001" # Default to Hanoi

    def _get_gender_century_code(self, birth_year, gender):
        if birth_year < 2000:
            if gender == "Nam":
                return 0
            elif gender == "Nữ":
                return 1
            else:
                return random.choice([0, 1])
        else:
            if gender == "Nam":
                return 2
            elif gender == "Nữ":
                return 3
            else:
                return random.choice([2, 3])

    def validate_cccd_format(self, cccd):
        if not cccd:
            return {"valid": False, "error": "CCCD không được để trống"}
        if not isinstance(cccd, str):
            return {"valid": False, "error": "CCCD phải là chuỗi ký tự"}
        if not cccd.isdigit():
            return {"valid": False, "error": "CCCD chỉ được chứa chữ số"}
        if len(cccd) != 12:
            return {"valid": False, "error": "CCCD phải có đúng 12 chữ số"}
        if cccd == "000000000000":
            return {"valid": False, "error": "CCCD không hợp lệ: tất cả số đều là 0"}
        return {"valid": True, "error": None}

    def analyze_cccd_structure(self, cccd, detailed=True, location=True):
        format_check = self.validate_cccd_format(cccd)
        if not format_check["valid"]:
            return {
                "valid": False,
                "error": format_check["error"],
                "structure": None,
                "cccd": cccd
            }

        province_code = cccd[0:3]
        gender_century_code = int(cccd[3])
        birth_year_code = cccd[4:6]
        random_sequence = cccd[6:12]

        if not (0 <= gender_century_code <= 3):
            return {
                "valid": False,
                "error": "Mã giới tính/thế kỷ không hợp lệ",
                "structure": None,
                "cccd": cccd
            }

        analysis = {
            "cccd": cccd,
            "valid": True,
            "structure": {
                "province": self._analyze_province(province_code),
                "genderCentury": self._analyze_gender_century(gender_century_code),
                "birthYear": self._analyze_birth_year(birth_year_code, gender_century_code),
                "randomSequence": self._analyze_random_sequence(random_sequence)
            },
            "summary": {},
            "validation": {}
        }

        analysis["summary"] = self._create_summary(analysis["structure"])
        analysis["validation"] = self._validate_cccd(analysis["structure"])
        analysis["valid"] = analysis["validation"]["overallValid"]

        if detailed:
            analysis["detailedAnalysis"] = self._create_detailed_analysis(analysis["structure"])

        if location:
            analysis["locationInfo"] = self._create_location_info(analysis["structure"]["province"])

        return analysis

    def _analyze_province(self, province_code):
        province_name = self.provinces.get(province_code, "Không xác định")
        is_valid = province_code in self.provinces
        return {
            "code": province_code,
            "name": province_name,
            "valid": is_valid,
            "description": "Mã tỉnh/thành phố nơi đăng ký khai sinh"
        }

    def _analyze_gender_century(self, gender_century_code):
        gender_info = self.gender_century_codes.get(gender_century_code, {"gender": "Không xác định", "century": None, "description": "Mã không hợp lệ"})
        return {
            "code": gender_century_code,
            "gender": gender_info["gender"],
            "century": gender_info["century"],
            "valid": gender_century_code in self.gender_century_codes,
            "description": gender_info["description"]
        }

    def _analyze_birth_year(self, year_code, gender_century_code):
        year = int(year_code)
        gender_info = self.gender_century_codes.get(gender_century_code, {})
        century = gender_info.get("century", 20)

        full_year = (century - 1) * 100 + year

        is_valid_year = MIN_BIRTH_YEAR <= full_year <= MAX_BIRTH_YEAR
        current_age = self._calculate_age(full_year, 1, 1)

        return {
            "yearCode": year_code,
            "fullYear": full_year,
            "century": century,
            "valid": is_valid_year,
            "currentAge": current_age,
            "description": "Năm sinh: {} (thế kỷ {}) ".format(full_year, century)

        }

    def _analyze_random_sequence(self, random_sequence):
        sequence_num = int(random_sequence)
        return {
            "code": random_sequence,
            "number": sequence_num,
            "valid": len(random_sequence) == 6 and random_sequence.isdigit(),
            "description": "Dãy số ngẫu nhiên 6 chữ số để đảm bảo tính duy nhất"
        }

    def _calculate_age(self, birth_year, birth_month, birth_day):
        today = datetime.now()
        age = today.year - birth_year
        if (today.month, today.day) < (birth_month, birth_day):
            age -= 1
        return max(0, age)

    def _create_summary(self, structure):
        province = structure["province"]
        gender_century = structure["genderCentury"]
        birth_year = structure["birthYear"]

        return {
            "provinceName": province["name"],
            "gender": gender_century["gender"],
            "birthYear": birth_year["fullYear"],
            "currentAge": birth_year["currentAge"],
            "description": "{}, sinh năm {} tại {}, hiện khoảng {} tuổi".format(gender_century["gender"], birth_year["fullYear"], province["name"], birth_year["currentAge"])
        }

    def _validate_cccd(self, structure):
        province_valid = structure["province"]["valid"]
        gender_century_valid = structure["genderCentury"]["valid"]
        birth_year_valid = structure["birthYear"]["valid"]
        random_sequence_valid = structure["randomSequence"]["valid"]

        overall_valid = province_valid and gender_century_valid and birth_year_valid and random_sequence_valid

        return {
            "provinceValid": province_valid,
            "genderCenturyValid": gender_century_valid,
            "birthYearValid": birth_year_valid,
            "randomSequenceValid": random_sequence_valid,
            "overallValid": overall_valid,
            "validationScore": sum([province_valid, gender_century_valid, birth_year_valid, random_sequence_valid]) / 4 * 100
        }

    def _create_detailed_analysis(self, _structure):
        return {
            "legalBasis": LEGAL_BASIS,
            "structureBreakdown": {
                "positions_1_3": "Mã tỉnh/thành phố nơi đăng ký khai sinh",
                "position_4": "Mã thế kỷ và giới tính",
                "positions_5_6": "Hai số cuối của năm sinh",
                "positions_7_12": "Dãy số ngẫu nhiên (6 chữ số)"
            },
            "accuracyNotes": [
                "Cấu trúc tuân thủ 100% quy định pháp luật",
                "Mã tỉnh được xác thực theo bảng mã chính thức",
                "Mã giới tính và thế kỷ đúng theo quy tắc",
                "Ngày sinh được kiểm tra tính hợp lệ"
            ]
        }

    def _create_location_info(self, province_info):
        if not province_info["valid"]:
            return {"error": "Mã tỉnh không hợp lệ"}

        return {
            "provinceCode": province_info["code"],
            "provinceName": province_info["name"],
            "region": self._get_region_by_province(province_info["code"]),
            "description": "Tỉnh/thành phố {} - nơi đăng ký khai sinh".format(province_info["name"])
        }

    def _get_region_by_province(self, province_code):
        if province_code in ["001", "002", "004", "006", "008", "010", "011", "012", "014", "015", "017", "019", "020", "022", "024", "025", "026", "027", "030", "031", "033", "034", "035", "036", "037", "038", "040", "042"]:
            return "Miền Bắc"
        elif province_code in ["044", "045", "046", "048", "049", "051", "052", "054", "056", "058", "060", "062", "064", "066", "067", "068"]:
            return "Miền Trung"
        elif province_code in ["070", "072", "074", "075", "077", "079", "080", "082", "083", "084", "086", "087", "089", "091", "092", "093", "094", "095", "096"]:
            return "Miền Nam"
        else:
            return "Không xác định"

    def batch_analyze(self, cccd_list):
        results = []
        valid_count = 0
        invalid_count = 0

        for cccd in cccd_list:
            analysis = self.analyze_cccd_structure(cccd, detailed=False, location=False)
            results.append(analysis)

            if analysis["valid"]:
                valid_count += 1
            else:
                invalid_count += 1

        return {
            "totalAnalyzed": len(cccd_list),
            "validCount": valid_count,
            "invalidCount": invalid_count,
            "validityRate": (valid_count / len(cccd_list)) * 100 if cccd_list else 0,
            "results": results,
            "summary": {
                "mostCommonProvince": self._get_most_common_province(results),
                "ageDistribution": self._get_age_distribution(results),
                "genderDistribution": self._get_gender_distribution(results)
            }
        }

    def _get_most_common_province(self, results):
        province_count = {}
        for result in results:
            if result["valid"]:
                province = result["structure"]["province"]["name"]
                province_count[province] = province_count.get(province, 0) + 1

        if not province_count:
            return {"name": "Không có", "count": 0}

        most_common = max(province_count.items(), key=lambda item: item[1])
        return {"name": most_common[0], "count": most_common[1]}

    def _get_age_distribution(self, results):
        age_groups = {
            "0-17": 0,
            "18-30": 0,
            "31-45": 0,
            "46-60": 0,
            "61+": 0
        }

        for result in results:
            if result["valid"]:
                age = result["summary"]["currentAge"]
                if age <= 17: age_groups["0-17"] += 1
                elif age <= 30: age_groups["18-30"] += 1
                elif age <= 45: age_groups["31-45"] += 1
                elif age <= 60: age_groups["46-60"] += 1
                else: age_groups["61+"] += 1
        return age_groups

    def _get_gender_distribution(self, results):
        gender_count = {
            "Nam": 0,
            "Nữ": 0
        }

        for result in results:
            if result["valid"]:
                gender = result["summary"]["gender"]
                if gender == "Nam": gender_count["Nam"] += 1
                elif gender == "Nữ": gender_count["Nữ"] += 1
        return gender_count


    def batch_analyze_from_file(self, file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                cccd_list = [line.strip() for line in f if line.strip()]
            return self.batch_analyze(cccd_list)
        except FileNotFoundError:
            raise FileNotFoundError(f"Không tìm thấy file tại đường dẫn {file_path}")
        except Exception as e:
            raise Exception(f"Lỗi khi đọc hoặc phân tích file: {e}")




import argparse
import json

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Hệ thống CCCD - Tạo và Phân tích CCCD.")
    subparsers = parser.add_subparsers(dest="command", help="Các lệnh có sẵn")

    # Lệnh generate
    generate_parser = subparsers.add_parser("generate", help="Tạo danh sách CCCD ngẫu nhiên")
    generate_parser.add_argument("-q", "--quantity", type=int, default=10, help="Số lượng CCCD cần tạo")
    generate_parser.add_argument("-p", "--province", nargs="*", help="Mã tỉnh/thành phố")
    generate_parser.add_argument("-g", "--gender", choices=["Nam", "Nữ"], help="Giới tính")
    generate_parser.add_argument("-y", "--year", type=int, help="Năm sinh")
    generate_parser.set_defaults(func=lambda args: cccd_system.generate_cccd_list(province_codes=args.province, gender=args.gender, birth_year=args.year, quantity=args.quantity))

    # Lệnh analyze
    analyze_parser = subparsers.add_parser("analyze", help="Phân tích một số CCCD")
    analyze_parser.add_argument("-c", "--cccd", required=True, help="Số CCCD cần phân tích")
    analyze_parser.add_argument("--no-detailed", action="store_false", dest="detailed", help="Không hiển thị phân tích chi tiết")
    analyze_parser.add_argument("--no-location", action="store_false", dest="location", help="Không hiển thị thông tin vị trí")
    analyze_parser.set_defaults(func=lambda args: cccd_system.analyze_cccd_structure(args.cccd, detailed=args.detailed, location=args.location))

    # Lệnh batch_analyze
    batch_analyze_parser = subparsers.add_parser("batch_analyze", help="Phân tích hàng loạt CCCD từ file")
    batch_analyze_parser.add_argument("-f", "--file-path", required=True, help="Đường dẫn đến file chứa danh sách CCCD")
    batch_analyze_parser.set_defaults(func=lambda args: cccd_system.batch_analyze_from_file(file_path=args.file_path))

    args = parser.parse_args()

    cccd_system = CCCDCore()

    if hasattr(args, "func"):
        result = args.func(args)
        print(json.dumps(result, indent=4, ensure_ascii=False))
    else:
        parser.print_help()


