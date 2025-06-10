# API Documentation: Disbursed Amount Statistics

## Overview
API này cung cấp thống kê về số tiền đã được giải ngân theo thời gian, giúp admin có thể theo dõi và phân tích xu hướng giải ngân của hệ thống quản lý khoản vay.

## Endpoint Details

### GET /reports/applications/disbursed-amount-by-time

**Mô tả**: Lấy thống kê tổng số tiền đã giải ngân và số lượng giao dịch giải ngân theo từng ngày trong khoảng thời gian chỉ định.

**Phương thức**: `GET`

**URL**: `/reports/applications/disbursed-amount-by-time`

**Authentication**: Yêu cầu JWT token với role `ADMIN`

---

## Request Parameters

| Parameter | Type | Required | Format | Description |
|-----------|------|----------|---------|-------------|
| `startDate` | LocalDate | ✅ | `YYYY-MM-DD` | Ngày bắt đầu thống kê (ISO 8601 date format) |
| `endDate` | LocalDate | ✅ | `YYYY-MM-DD` | Ngày kết thúc thống kê (ISO 8601 date format) |

### Parameter Details

- **startDate**: 
  - Ngày bắt đầu của khoảng thời gian cần thống kê
  - Sẽ được convert thành `startDate 00:00:00` để bao gồm toàn bộ ngày
  - Ví dụ: `2024-01-01`

- **endDate**: 
  - Ngày kết thúc của khoảng thời gian cần thống kê  
  - Sẽ được convert thành `endDate 23:59:59` để bao gồm toàn bộ ngày
  - Ví dụ: `2024-01-31`

---

## Request Example

### HTTP Request
```http
GET /reports/applications/disbursed-amount-by-time?startDate=2024-01-01&endDate=2024-01-31
Host: localhost:8080
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiI...
Content-Type: application/json
```

### cURL Example
```bash
curl -X GET "http://localhost:8080/reports/applications/disbursed-amount-by-time?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### JavaScript Fetch Example
```javascript
const response = await fetch('/reports/applications/disbursed-amount-by-time?startDate=2024-01-01&endDate=2024-01-31', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```

---

## Response Format

### Success Response (200 OK)

```json
{
  "code": 1000,
  "message": "Disbursed amount by time statistics retrieved successfully",
  "data": [
    {
      "date": "2024-01-15",
      "totalDisbursedAmount": 150000000,
      "disbursedCount": 5
    },
    {
      "date": "2024-01-16",
      "totalDisbursedAmount": 200000000,
      "disbursedCount": 3
    },
    {
      "date": "2024-01-17",
      "totalDisbursedAmount": 100000000,
      "disbursedCount": 2
    }
  ]
}
```

### Response Schema

```json
{
  "type": "object",
  "properties": {
    "code": {
      "type": "integer",
      "description": "Mã phản hồi (1000 = thành công)"
    },
    "message": {
      "type": "string",
      "description": "Thông báo kết quả"
    },
    "data": {
      "type": "array",
      "description": "Danh sách thống kê theo ngày",
      "items": {
        "type": "object",
        "properties": {
          "date": {
            "type": "string",
            "format": "date",
            "description": "Ngày thống kê (YYYY-MM-DD)",
            "example": "2024-01-15"
          },
          "totalDisbursedAmount": {
            "type": "integer",
            "description": "Tổng số tiền đã giải ngân trong ngày (VND)",
            "example": 150000000
          },
          "disbursedCount": {
            "type": "integer",
            "description": "Số lượng giao dịch giải ngân trong ngày",
            "example": 5
          }
        },
        "required": ["date", "totalDisbursedAmount", "disbursedCount"]
      }
    }
  }
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "code": 1004,
  "message": "Unauthenticated",
  "data": null
}
```

### 403 Forbidden
```json
{
  "code": 1005,
  "message": "You do not have permission to access this resource",
  "data": null
}
```

### 400 Bad Request (Invalid Date Format)
```json
{
  "code": 1003,
  "message": "Invalid date format. Please use YYYY-MM-DD format",
  "data": null
}
```

### 400 Bad Request (Start Date After End Date)
```json
{
  "code": 1003,
  "message": "Start date must be before or equal to end date",
  "data": null
}
```

---

## Business Logic

### Data Source
- **Primary Table**: `disbursement_transactions`
- **Join**: Tự động join với `loan_applications` thông qua `application_id`
- **Filter**: Lọc theo `transaction_date` trong khoảng thời gian chỉ định

### Calculation Logic
1. **Grouping**: Nhóm các giao dịch theo ngày (`DATE(transaction_date)`)
2. **Aggregation**: 
   - `SUM(amount)`: Tổng số tiền giải ngân trong ngày
   - `COUNT(*)`: Số lượng giao dịch giải ngân trong ngày
3. **Ordering**: Sắp xếp theo ngày tăng dần

### SQL Query Behind the Scene
```sql
SELECT DATE(dt.transaction_date) as date, 
       SUM(dt.amount) as totalAmount, 
       COUNT(dt) as count 
FROM disbursement_transactions dt 
WHERE dt.transaction_date >= :startDate 
  AND dt.transaction_date <= :endDate 
GROUP BY DATE(dt.transaction_date) 
ORDER BY DATE(dt.transaction_date)
```

---

## Use Cases

### 1. Dashboard Analytics
```javascript
// Lấy thống kê giải ngân 30 ngày qua
const last30Days = new Date();
last30Days.setDate(last30Days.getDate() - 30);

const response = await getDisbursedStats(
  last30Days.toISOString().split('T')[0],
  new Date().toISOString().split('T')[0]
);

// Vẽ biểu đồ line chart
drawLineChart(response.data);
```

### 2. Monthly Report
```javascript
// Báo cáo giải ngân tháng 1/2024
const response = await getDisbursedStats('2024-01-01', '2024-01-31');

const totalDisbursed = response.data.reduce((sum, day) => sum + day.totalDisbursedAmount, 0);
const totalTransactions = response.data.reduce((sum, day) => sum + day.disbursedCount, 0);

console.log(`Tổng giải ngân tháng 1: ${totalDisbursed.toLocaleString()} VND`);
console.log(`Tổng số giao dịch: ${totalTransactions}`);
```

### 3. Trend Analysis
```javascript
// So sánh xu hướng giải ngân giữa 2 tháng
const jan2024 = await getDisbursedStats('2024-01-01', '2024-01-31');
const feb2024 = await getDisbursedStats('2024-02-01', '2024-02-29');

// Tính average daily disbursement
const janAvg = jan2024.data.reduce((sum, day) => sum + day.totalDisbursedAmount, 0) / jan2024.data.length;
const febAvg = feb2024.data.reduce((sum, day) => sum + day.totalDisbursedAmount, 0) / feb2024.data.length;

const growthRate = ((febAvg - janAvg) / janAvg * 100).toFixed(2);
console.log(`Tăng trưởng giải ngân: ${growthRate}%`);
```

---

## Performance Considerations

### Database Indexing
Để tối ưu hiệu suất, nên tạo index trên:
```sql
CREATE INDEX idx_disbursement_transaction_date ON disbursement_transactions(transaction_date);
CREATE INDEX idx_disbursement_application_id ON disbursement_transactions(application_id);
```

### Query Optimization
- Query được tối ưu với GROUP BY và ORDER BY
- Sử dụng DATE function để group theo ngày
- Limit khoảng thời gian query để tránh scan toàn bộ table

### Caching Strategy
- Có thể cache kết quả cho các khoảng thời gian đã qua (historical data)
- Cache key: `disbursed_stats_{startDate}_{endDate}`
- TTL: 1 ngày cho historical data, 1 giờ cho current day data

---

## Data Visualization Examples

### Line Chart (Recommended)
```javascript
// Chart.js configuration
const chartConfig = {
  type: 'line',
  data: {
    labels: response.data.map(item => item.date),
    datasets: [{
      label: 'Số tiền giải ngân (VND)',
      data: response.data.map(item => item.totalDisbursedAmount),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  },
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value.toLocaleString() + ' VND';
          }
        }
      }
    }
  }
};
```

### Bar Chart Alternative
```javascript
const barChartConfig = {
  type: 'bar',
  data: {
    labels: response.data.map(item => item.date),
    datasets: [
      {
        label: 'Số tiền (VND)',
        data: response.data.map(item => item.totalDisbursedAmount),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        yAxisID: 'y'
      },
      {
        label: 'Số giao dịch',
        data: response.data.map(item => item.disbursedCount),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'y1'
      }
    ]
  },
  options: {
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      }
    }
  }
};
```

---

## Testing Examples

### Unit Test (JUnit)
```java
@Test
void testGetDisbursedAmountByTime() {
    // Given
    LocalDateTime startDate = LocalDate.of(2024, 1, 1).atStartOfDay();
    LocalDateTime endDate = LocalDate.of(2024, 1, 31).atTime(23, 59, 59);
    
    // Mock repository response
    List<Object[]> mockResults = Arrays.asList(
        new Object[]{Date.valueOf("2024-01-15"), 150000000L, 5L},
        new Object[]{Date.valueOf("2024-01-16"), 200000000L, 3L}
    );
    
    when(disbursementTransactionRepository.getDisbursedAmountByDateRange(startDate, endDate))
        .thenReturn(mockResults);
    
    // When
    List<DisbursedAmountByTimeResponse> result = loanApplicationService.getDisbursedAmountByTime(startDate, endDate);
    
    // Then
    assertThat(result).hasSize(2);
    assertThat(result.get(0).getTotalDisbursedAmount()).isEqualTo(150000000L);
    assertThat(result.get(0).getDisbursedCount()).isEqualTo(5L);
}
```

### Integration Test
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class DisbursedAmountApiIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    void testGetDisbursedAmountByTimeEndpoint() {
        // Given
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth("valid_admin_token");
        HttpEntity<String> entity = new HttpEntity<>(headers);
        
        // When
        ResponseEntity<ApiResponse> response = restTemplate.exchange(
            "/reports/applications/disbursed-amount-by-time?startDate=2024-01-01&endDate=2024-01-31",
            HttpMethod.GET,
            entity,
            ApiResponse.class
        );
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getCode()).isEqualTo(1000);
    }
}
```

---

## Related APIs

### Compare with Approved Amount API
```javascript
// So sánh số tiền được duyệt vs đã giải ngân
const [approvedData, disbursedData] = await Promise.all([
  fetch('/reports/applications/approved-amount-by-time?startDate=2024-01-01&endDate=2024-01-31'),
  fetch('/reports/applications/disbursed-amount-by-time?startDate=2024-01-01&endDate=2024-01-31')
]);

// Tính tỷ lệ giải ngân
const disbursementRatio = disbursedData.data.reduce((sum, day) => sum + day.totalDisbursedAmount, 0) / 
                         approvedData.data.reduce((sum, day) => sum + day.totalApprovedAmount, 0) * 100;

console.log(`Tỷ lệ giải ngân: ${disbursementRatio.toFixed(2)}%`);
```

---

## Security Notes

1. **Authorization**: Chỉ user có role `ADMIN` mới có thể truy cập API này
2. **Data Sensitivity**: API trả về thông tin tài chính nhạy cảm, cần bảo mật JWT token
3. **Rate Limiting**: Nên implement rate limiting để tránh abuse
4. **Audit Log**: Nên log các truy cập vào API này để audit

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12-10 | Initial implementation |

---

## Support

Nếu có vấn đề với API này, vui lòng liên hệ:
- **Technical Issues**: Check application logs tại `/logs/application.log`
- **Data Issues**: Verify disbursement_transactions table
- **Performance**: Monitor database query performance
