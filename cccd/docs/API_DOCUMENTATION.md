# API Documentation - CCCD Analysis & Generation System

## Overview

The CCCD Analysis & Generation System provides RESTful APIs for generating and analyzing Vietnamese Citizen ID cards (CCCD) according to legal regulations.

## Base URL

```
http://localhost:3000
```

## Authentication

Currently, no authentication is required. Rate limiting is applied per IP address.

## Rate Limiting

- **60 requests/minute** per IP
- **1000 requests/hour** per IP
- Rate limit headers are included in responses

## Common Response Format

All API responses follow this format:

```json
{
  "success": boolean,
  "data": object | array,
  "metadata": object | null,
  "config": object | null,
  "error": string | null
}
```

## Endpoints

### 1. Health Check

#### GET /health

Returns the health status of the system.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "config": {
    "module": "CCCD Analysis & Generation",
    "version": "1.0.0",
    "totalProvinces": 63,
    "quantityLimits": {
      "default": 10,
      "max": 1000
    },
    "birthYearRange": {
      "min": 1920,
      "max": 2025
    },
    "features": {
      "generation": true,
      "analysis": true,
      "batchAnalysis": true,
      "validation": true
    }
  }
}
```

**Status Codes:**
- `200` - System is healthy
- `503` - System is unhealthy

---

### 2. System Information

#### GET /

Returns general system information and available endpoints.

**Response:**
```json
{
  "success": true,
  "message": "CCCD Analysis & Generation System",
  "version": "1.0.0",
  "endpoints": {
    "health": "GET /health",
    "generate": "POST /api/generate-cccd",
    "analyze": "POST /api/analyze-cccd",
    "batchAnalyze": "POST /api/analyze-cccd/batch",
    "options": "GET /api/generate-cccd/options",
    "structure": "GET /api/analyze-cccd/structure"
  },
  "legalBasis": {
    "decree": "Nghị định số 137/2015/NĐ-CP",
    "circular": "Thông tư số 07/2016/TT-BCA"
  }
}
```

---

### 3. Generate CCCD

#### POST /api/generate-cccd

Generates a list of valid CCCD numbers according to specified parameters.

**Request Body:**
```json
{
  "provinceCodes": ["001", "079"], // Optional: Array of province codes
  "gender": "Nam",                 // Optional: "Nam" or "Nữ"
  "birthYearRange": [1990, 2000],  // Optional: Array of [startYear, endYear]
  "quantity": 10                   // Required: Number of CCCDs to generate (1-1000)
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "cccd_number": "001010101678",
      "province_code": "001",
      "province_name": "Hà Nội",
      "gender": "Nam",
      "birth_year": 2001,
      "birth_month": 1,
      "birth_day": 1,
      "birth_date": "01/01/2001",
      "century": "21",
      "gender_century_code": 2,
      "sequence_number": "78"
    }
  ],
  "metadata": {
    "input_limit": 1000,
    "output_limit": 1000,
    "requested_quantity": 10,
    "actual_quantity": 10,
    "truncated": false
  },
  "config": {
    "module": "CCCD Analysis & Generation",
    "version": "1.0.0"
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request parameters
- `500` - Internal server error

**Error Response:**
```json
{
  "success": false,
  "error": "Số lượng phải là số nguyên dương",
  "maxLimit": 1000,
  "requested": -5
}
```

---

### 4. Analyze CCCD

#### POST /api/analyze-cccd

Analyzes a single CCCD number and returns detailed information.

**Request Body:**
```json
{
  "cccd": "001010101678", // Required: 12-digit CCCD number
  "detailed": true,       // Optional: Include detailed analysis (default: true)
  "location": true         // Optional: Include location information (default: true)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cccd": "001010101678",
    "valid": true,
    "structure": {
      "province": {
        "code": "001",
        "name": "Hà Nội",
        "valid": true,
        "description": "Mã tỉnh/thành phố nơi đăng ký khai sinh"
      },
      "genderCentury": {
        "code": 2,
        "gender": "Nam",
        "century": "21",
        "description": "Nam, thế kỷ 21"
      },
      "birthDate": {
        "year": 2001,
        "month": 1,
        "day": 1,
        "date": "01/01/2001",
        "valid": true,
        "description": "Ngày sinh"
      },
      "sequence": {
        "code": "78",
        "number": 78,
        "valid": true,
        "description": "Số thứ tự trong ngày"
      }
    },
    "summary": {
      "provinceName": "Hà Nội",
      "gender": "Nam",
      "birthDate": "01/01/2001",
      "currentAge": 23,
      "century": "21"
    },
    "validation": {
      "formatValid": true,
      "provinceValid": true,
      "dateValid": true,
      "overallValid": true
    },
    "detailedAnalysis": {
      "provinceInfo": {
        "region": "Miền Bắc",
        "population": "8.2 triệu",
        "area": "3,358.6 km²"
      },
      "demographics": {
        "ageGroup": "Thanh niên",
        "generation": "Gen Z"
      }
    },
    "locationInfo": {
      "region": "Miền Bắc",
      "coordinates": {
        "latitude": 21.0285,
        "longitude": 105.8542
      },
      "timezone": "UTC+7"
    }
  },
  "config": {
    "module": "CCCD Analysis & Generation",
    "version": "1.0.0"
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid CCCD format
- `500` - Internal server error

---

### 5. Batch Analyze CCCD

#### POST /api/analyze-cccd/batch

Analyzes multiple CCCD numbers in a single request.

**Request Body:**
```json
{
  "cccdList": [
    "001010101678",
    "079010101678",
    "024010101678"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAnalyzed": 3,
    "validCount": 3,
    "invalidCount": 0,
    "validityRate": 100.00,
    "results": [
      {
        "cccd": "001010101678",
        "valid": true,
        "summary": {
          "provinceName": "Hà Nội",
          "gender": "Nam",
          "birthDate": "01/01/2001"
        }
      }
    ],
    "summary": {
      "mostCommonProvince": {
        "name": "Hà Nội",
        "count": 1
      },
      "genderDistribution": {
        "Nam": 1,
        "Nữ": 0
      },
      "ageDistribution": {
        "20-30": 1,
        "30-40": 0
      }
    }
  },
  "config": {
    "module": "CCCD Analysis & Generation",
    "version": "1.0.0"
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request format
- `500` - Internal server error

---

### 6. Get Generation Options

#### GET /api/generate-cccd/options

Returns available options for CCCD generation.

**Response:**
```json
{
  "success": true,
  "data": {
    "provinces": {
      "001": "Hà Nội",
      "079": "Hồ Chí Minh",
      "024": "Quảng Ninh"
    },
    "genderCenturyCodes": {
      "0": {
        "gender": "Nam",
        "century": "20",
        "description": "Nam, thế kỷ 20"
      },
      "1": {
        "gender": "Nữ",
        "century": "20",
        "description": "Nữ, thế kỷ 20"
      },
      "2": {
        "gender": "Nam",
        "century": "21",
        "description": "Nam, thế kỷ 21"
      },
      "3": {
        "gender": "Nữ",
        "century": "21",
        "description": "Nữ, thế kỷ 21"
      }
    },
    "limits": {
      "input": {
        "generation_single": 1000,
        "batch_analysis": 1000
      },
      "output": {
        "max_results_per_request": 1000
      }
    },
    "legalBasis": {
      "decree": "Nghị định số 137/2015/NĐ-CP",
      "circular": "Thông tư số 07/2016/TT-BCA"
    }
  }
}
```

---

### 7. Get Structure Information

#### GET /api/analyze-cccd/structure

Returns information about CCCD structure and validation rules.

**Response:**
```json
{
  "success": true,
  "data": {
    "legalBasis": {
      "decree": "Nghị định số 137/2015/NĐ-CP",
      "circular": "Thông tư số 07/2016/TT-BCA"
    },
    "structureBreakdown": {
      "totalLength": 12,
      "components": [
        {
          "position": "1-3",
          "name": "Mã tỉnh",
          "description": "Mã tỉnh/thành phố nơi đăng ký khai sinh",
          "length": 3,
          "example": "001"
        },
        {
          "position": "4",
          "name": "Mã giới tính/thế kỷ",
          "description": "Mã giới tính và thế kỷ sinh",
          "length": 1,
          "values": {
            "0": "Nam, thế kỷ 20",
            "1": "Nữ, thế kỷ 20",
            "2": "Nam, thế kỷ 21",
            "3": "Nữ, thế kỷ 21"
          }
        },
        {
          "position": "5-6",
          "name": "Năm sinh",
          "description": "Hai chữ số cuối của năm sinh",
          "length": 2,
          "example": "01"
        },
        {
          "position": "7-8",
          "name": "Tháng sinh",
          "description": "Tháng sinh (01-12)",
          "length": 2,
          "example": "01"
        },
        {
          "position": "9-10",
          "name": "Ngày sinh",
          "description": "Ngày sinh (01-31)",
          "length": 2,
          "example": "01"
        },
        {
          "position": "11-12",
          "name": "Số thứ tự",
          "description": "Số thứ tự trong ngày (01-99)",
          "length": 2,
          "example": "78"
        }
      ]
    },
    "provinceCodes": {
      "001": "Hà Nội",
      "079": "Hồ Chí Minh"
    },
    "genderCenturyCodes": {
      "0": "Nam, thế kỷ 20",
      "1": "Nữ, thế kỷ 20",
      "2": "Nam, thế kỷ 21",
      "3": "Nữ, thế kỷ 21"
    }
  }
}
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Dữ liệu đầu vào không hợp lệ",
  "details": ["Số lượng phải là số nguyên dương"]
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Endpoint không tồn tại"
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Quá nhiều requests. Vui lòng thử lại sau."
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Lỗi hệ thống",
  "message": "Detailed error message"
}
```

---

## Rate Limiting Headers

When rate limiting is applied, the following headers are included:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
Retry-After: 15
```

---

## Examples

### Generate 5 CCCDs for Hanoi, Male, born in 1990s

```bash
curl -X POST http://localhost:3000/api/generate-cccd \
  -H "Content-Type: application/json" \
  -d '{
    "provinceCodes": ["001"],
    "gender": "Nam",
    "birthYearRange": [1990, 1999],
    "quantity": 5
  }'
```

### Analyze a CCCD

```bash
curl -X POST http://localhost:3000/api/analyze-cccd \
  -H "Content-Type: application/json" \
  -d '{
    "cccd": "001010101678",
    "detailed": true,
    "location": true
  }'
```

### Batch analyze multiple CCCDs

```bash
curl -X POST http://localhost:3000/api/analyze-cccd/batch \
  -H "Content-Type: application/json" \
  -d '{
    "cccdList": [
      "001010101678",
      "079010101678",
      "024010101678"
    ]
  }'
```

---

## Legal Compliance

This system complies with Vietnamese legal regulations:

- **Nghị định số 137/2015/NĐ-CP** về số định danh cá nhân
- **Thông tư số 07/2016/TT-BCA** về cấu trúc CCCD

The generated CCCD numbers are for educational and testing purposes only and should not be used for any illegal activities.