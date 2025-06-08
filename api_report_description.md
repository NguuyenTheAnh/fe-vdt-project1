# Reports & Statistics API Documentation

## Overview
The Reports & Statistics API provides comprehensive endpoints for generating statistical reports and charts for the loan management system. This API is designed specifically for administrative dashboard functionality and data visualization.

## Main Features
- **Status Statistics**: Application count by status for Bar charts
- **Product Statistics**: Application count by loan product for Bar charts  
- **Approval Ratio**: Approval/rejection ratio for Pie charts
- **Time-based Reports**: Approved loan amounts over time for Line charts
- **Dashboard Summary**: Combined statistics for administrative overview

## Base Path
`/api/v1/reports`

## Authentication & Authorization
All endpoints require authentication and **ADMIN** role authorization. Users with insufficient permissions will receive a `403 Forbidden` response.

## Response Format
All endpoints return responses in the standard `ApiResponse` format:
```json
{
  "code": 1000,
  "message": "Success message",
  "data": {...}
}
```

---

## Endpoints

### 1. Get Application Statistics by Status
**GET** `/api/v1/reports/applications/by-status`

Retrieves application count statistics grouped by status. Suitable for Bar chart visualization.

**Authorization:** `ADMIN` role required

**Request:**
- **Method:** GET
- **URL:** `/api/v1/reports/applications/by-status`
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Parameters:** None

**Response:**
```json
{
  "code": 1000,
  "message": "Application statistics by status retrieved successfully",
  "data": [
    {
      "status": "NEW",
      "statusText": "Hồ sơ mới",
      "count": 25,
      "color": "#3B82F6"
    },
    {
      "status": "PENDING",
      "statusText": "Đang xử lý",
      "count": 18,
      "color": "#F59E0B"
    },
    {
      "status": "REQUIRE_MORE_INFO",
      "statusText": "Yêu cầu bổ sung",
      "count": 8,
      "color": "#8B5CF6"
    },
    {
      "status": "APPROVED",
      "statusText": "Đã duyệt",
      "count": 42,
      "color": "#10B981"
    },
    {
      "status": "REJECTED",
      "statusText": "Từ chối",
      "count": 15,
      "color": "#EF4444"
    },
    {
      "status": "PARTIALLY_DISBURSED",
      "statusText": "Giải ngân một phần",
      "count": 12,
      "color": "#06B6D4"
    },
    {
      "status": "FULLY_DISBURSED",
      "statusText": "Đã giải ngân đầy đủ",
      "count": 28,
      "color": "#84CC16"
    }
  ]
}
```

**Response Fields:**
- `status` (String): Application status enum value
- `statusText` (String): Vietnamese display text for the status
- `count` (Long): Number of applications with this status
- `color` (String): Hex color code for chart visualization

**Usage Examples:**
- Create Bar charts showing distribution of loan applications by status
- Dashboard widgets displaying current application pipeline
- Administrative reporting for workflow analysis

---

### 2. Get Application Statistics by Product
**GET** `/api/v1/reports/applications/by-product`

Retrieves application count statistics grouped by loan product. Suitable for Bar chart visualization.

**Authorization:** `ADMIN` role required

**Request:**
- **Method:** GET
- **URL:** `/api/v1/reports/applications/by-product`
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Parameters:** None

**Response:**
```json
{
  "code": 1000,
  "message": "Application statistics by product retrieved successfully",
  "data": [
    {
      "productName": "Vay tiêu dùng cá nhân",
      "count": 45,
      "color": "#FF6B6B"
    },
    {
      "productName": "Vay mua nhà",
      "count": 32,
      "color": "#4ECDC4"
    },
    {
      "productName": "Vay kinh doanh",
      "count": 28,
      "color": "#45B7D1"
    },
    {
      "productName": "Vay mua xe",
      "count": 23,
      "color": "#96CEB4"
    }
  ]
}
```

**Response Fields:**
- `productName` (String): Name of the loan product
- `count` (Long): Number of applications for this product
- `color` (String): Random hex color code for chart visualization

**Usage Examples:**
- Bar charts showing popularity of different loan products
- Product performance analysis
- Marketing insights for product demand

---

### 3. Get Approval Ratio Statistics
**GET** `/api/v1/reports/applications/approval-ratio`

Retrieves approval and rejection ratio statistics. Suitable for Pie chart visualization.

**Authorization:** `ADMIN` role required

**Request:**
- **Method:** GET
- **URL:** `/api/v1/reports/applications/approval-ratio`
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Parameters:** None

**Response:**
```json
{
  "code": 1000,
  "message": "Approval ratio statistics retrieved successfully",
  "data": {
    "approvedCount": 82,
    "rejectedCount": 15,
    "totalCount": 97,
    "approvalRate": 84.54,
    "rejectionRate": 15.46
  }
}
```

**Response Fields:**
- `approvedCount` (Long): Total number of approved applications (includes APPROVED, PARTIALLY_DISBURSED, FULLY_DISBURSED)
- `rejectedCount` (Long): Total number of rejected applications
- `totalCount` (Long): Total number of processed applications (approved + rejected)
- `approvalRate` (Double): Approval rate as percentage (0-100)
- `rejectionRate` (Double): Rejection rate as percentage (0-100)

**Business Logic:**
- Approved applications include: `APPROVED`, `PARTIALLY_DISBURSED`, `FULLY_DISBURSED`
- Rejected applications include: `REJECTED`
- Pending applications (`NEW`, `PENDING`, `REQUIRE_MORE_INFO`) are excluded from ratio calculations

**Usage Examples:**
- Pie charts showing approval vs rejection ratios
- KPI dashboards for loan processing performance
- Management reporting for decision-making metrics

---

### 4. Get Approved Amount by Time
**GET** `/api/v1/reports/applications/approved-amount-by-time`

Retrieves total approved loan amounts over a specified time period. Suitable for Line chart visualization.

**Authorization:** `ADMIN` role required

**Request:**
- **Method:** GET
- **URL:** `/api/v1/reports/applications/approved-amount-by-time?startDate=2024-01-01&endDate=2024-12-31`
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Query Parameters:**
  - `startDate` (String, required): Start date in ISO date format (YYYY-MM-DD)
  - `endDate` (String, required): End date in ISO date format (YYYY-MM-DD)

**Parameter Details:**
- `startDate`: Beginning of the date range (inclusive)
- `endDate`: End of the date range (inclusive) 
- Date format: ISO 8601 date format (YYYY-MM-DD)
- Time zone: System default timezone
- The API automatically converts dates to full day ranges (00:00:00 to 23:59:59)

**Response:**
```json
{
  "code": 1000,
  "message": "Approved amount by time statistics retrieved successfully",
  "data": [
    {
      "date": "2024-01-15",
      "totalApprovedAmount": 2500000,
      "applicationCount": 5
    },
    {
      "date": "2024-01-22",
      "totalApprovedAmount": 1800000,
      "applicationCount": 3
    },
    {
      "date": "2024-01-30",
      "totalApprovedAmount": 3200000,
      "applicationCount": 7
    }
  ]
}
```

**Response Fields:**
- `date` (LocalDate): Date of approval (ISO date format)
- `totalApprovedAmount` (Long): Total amount approved on this date (in VND)
- `applicationCount` (Integer): Number of applications approved on this date

**Usage Examples:**
- Line charts showing loan approval trends over time
- Financial reporting for approved loan volumes
- Trend analysis for business growth monitoring

**Error Responses:**
- `400 Bad Request`: Invalid date format or end date before start date
- `403 Forbidden`: Insufficient permissions

---

### 5. Get Dashboard Summary
**GET** `/api/v1/reports/dashboard/summary`

Retrieves comprehensive summary statistics for administrative dashboard overview.

**Authorization:** `ADMIN` role required

**Request:**
- **Method:** GET
- **URL:** `/api/v1/reports/dashboard/summary`
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Parameters:** None

**Response:**
```json
{
  "code": 1000,
  "message": "Dashboard summary retrieved successfully",
  "data": {
    "totalApplications": 148,
    "approvedCount": 82,
    "rejectedCount": 15,
    "approvalRate": 84.54,
    "rejectionRate": 15.46,
    "statusBreakdown": [
      {
        "status": "NEW",
        "statusText": "Hồ sơ mới",
        "count": 25,
        "color": "#3B82F6"
      },
      {
        "status": "PENDING",
        "statusText": "Đang xử lý",
        "count": 18,
        "color": "#F59E0B"
      },
      {
        "status": "REQUIRE_MORE_INFO",
        "statusText": "Yêu cầu bổ sung",
        "count": 8,
        "color": "#8B5CF6"
      },
      {
        "status": "APPROVED",
        "statusText": "Đã duyệt",
        "count": 42,
        "color": "#10B981"
      },
      {
        "status": "REJECTED",
        "statusText": "Từ chối",
        "count": 15,
        "color": "#EF4444"
      },
      {
        "status": "PARTIALLY_DISBURSED",
        "statusText": "Giải ngân một phần",
        "count": 12,
        "color": "#06B6D4"
      },
      {
        "status": "FULLY_DISBURSED",
        "statusText": "Đã giải ngân đầy đủ",
        "count": 28,
        "color": "#84CC16"
      }
    ]
  }
}
```

**Response Fields:**
- `totalApplications` (Long): Total number of all loan applications
- `approvedCount` (Long): Total number of approved applications
- `rejectedCount` (Long): Total number of rejected applications  
- `approvalRate` (Double): Overall approval rate percentage
- `rejectionRate` (Double): Overall rejection rate percentage
- `statusBreakdown` (Array): Detailed breakdown by status (same as endpoint #1)

**Business Logic:**
- Combines data from multiple statistical endpoints
- Provides comprehensive overview for dashboard widgets
- Includes both summary metrics and detailed breakdowns

**Usage Examples:**
- Main administrative dashboard overview
- Executive summary reports
- Combined KPI displays with multiple chart types

---

## Error Handling

### Common Error Responses

**403 Forbidden - Insufficient Permissions:**
```json
{
  "code": 1009,
  "message": "You do not have permission",
  "data": null
}
```

**400 Bad Request - Invalid Parameters:**
```json
{
  "code": 1003,
  "message": "Invalid date format. Please use YYYY-MM-DD format",
  "data": null
}
```

**500 Internal Server Error:**
```json
{
  "code": 9999,
  "message": "Internal server error occurred",
  "data": null
}
```

---

## Data Visualization Guidelines

### Chart Types & Recommended Usage

**Bar Charts (Endpoints #1 & #2):**
- Use `count` values for bar heights
- Use `color` field for bar colors
- Use `statusText` or `productName` for labels

**Pie Charts (Endpoint #3):**
- Use `approvalRate` and `rejectionRate` for pie segments
- Recommended colors: Green for approved, Red for rejected

**Line Charts (Endpoint #4):**
- X-axis: `date` values
- Y-axis: `totalApprovedAmount` values
- Optional: Use `applicationCount` for secondary Y-axis

### Color Coding System
- **Blue (#3B82F6)**: New applications
- **Yellow (#F59E0B)**: Pending applications  
- **Purple (#8B5CF6)**: Require more info
- **Green (#10B981)**: Approved applications
- **Red (#EF4444)**: Rejected applications
- **Cyan (#06B6D4)**: Partially disbursed
- **Lime (#84CC16)**: Fully disbursed

---

## Performance Considerations

- All endpoints implement efficient database queries with proper indexing
- Statistics are calculated in real-time from the database
- For high-volume systems, consider implementing caching mechanisms
- Date range queries are optimized for performance

---

## Security Notes

- All endpoints require valid JWT authentication
- ADMIN role authorization is mandatory for all operations
- Input validation is performed on all date parameters
- No sensitive financial data is exposed in statistics

---

## Integration Examples

### Frontend Chart Integration
```javascript
// Example: Fetching status statistics for Chart.js
fetch('/api/v1/reports/applications/by-status', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  const chartData = {
    labels: data.data.map(item => item.statusText),
    datasets: [{
      data: data.data.map(item => item.count),
      backgroundColor: data.data.map(item => item.color)
    }]
  };
  // Render chart with chartData
});
```

### Date Range Query Example
```javascript
// Example: Fetching approved amounts for specific period
const startDate = '2024-01-01';
const endDate = '2024-12-31';
const url = `/api/v1/reports/applications/approved-amount-by-time?startDate=${startDate}&endDate=${endDate}`;

fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  // Process time series data for line chart
});
```

---

## Change Log

### Version 1.0.0
- Initial implementation of all reports endpoints
- Support for status, product, approval ratio, and time-based statistics
- Dashboard summary endpoint with combined data
- Comprehensive error handling and validation
- Color coding system for chart visualization
