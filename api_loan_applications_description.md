# API Loan Applications Description

This document provides a detailed description of the APIs available in the `LoanApplicationController`.

## Base Path: `/loan-applications`

---

### 1. Create Loan Application
- **Endpoint:** `POST /`
- **Description:** Creates a new loan application.
- **Permissions Required:** `POST_LOAN_APPLICATIONS_CREATE` or `ADMIN` role.
- **Request Body:** `LoanApplicationRequest`
  ```json
  {
    "productId": Long, // ID of the loan product being applied for (Required)
    "requestedAmount": Long, // Amount requested by the user (Required, Min: 1)
    "requestedTerm": Integer, // Loan term in months (Required, Min: 1)    "personalInfo": "String", // Personal information of the applicant (Required, Min length: 10)
    "status": "NEW", // Optional: Initial status of the application (e.g., NEW, PENDING). Defaults to NEW if not provided.
                     // Possible values: NEW, PENDING, REQUIRE_MORE_INFO, APPROVED, REJECTED, DISBURSED
    "internalNotes": "String" // Optional: Internal notes for the application
  }
  ```
- **Response:** `ApiResponse<LoanApplicationResponse>`
  ```json
  {
    "code": 1000,
    "message": null,
    "data": {
      "id": Long,
      "requestedAmount": Long,
      "requestedTerm": Integer,      "personalInfo": "String",
      "status": "String", // e.g., NEW, PENDING
      "internalNotes": "String",
      "createdAt": "LocalDateTime", // (ISO 8601 format)
      "updatedAt": "LocalDateTime", // (ISO 8601 format)
      "loanProduct": { // Details of the associated loan product
        "id": Long,
        "name": "String",
        "description": "String",
        "interestRate": Double,
        "minAmount": Long,
        "maxAmount": Long,
        "minTerm": Integer,
        "maxTerm": Integer,
        "status": "String", // e.g., ACTIVE, INACTIVE
        "requiredDocuments": "String", // Space-separated list of required document types
        "createdAt": "LocalDateTime",
        "updatedAt": "LocalDateTime"
      },
      "user": { // Details of the user who created the application
        "id": Long,
        "email": "String",
        "fullName": "String",
        "phoneNumber": "String",
        "address": "String",
        "accountStatus": "String", // e.g., ACTIVE, INACTIVE
        "createdAt": "LocalDateTime",
        "updatedAt": "LocalDateTime",
        "role": {
          "name": "String",
          "description": "String",
          "permissions": [
            {
              "name": "String",
              "description": "String"
            }
          ]
        }
      }
    }
  }
  ```

---

### 2. Get All Loan Applications
- **Endpoint:** `GET /`
- **Description:** Retrieves a paginated list of all loan applications.
- **Permissions Required:** `GET_LOAN_APPLICATIONS_ALL` or `ADMIN` role.
- **Query Parameters:**
    - `page`: Integer (optional) - Page number (0-indexed).
    - `size`: Integer (optional) - Number of items per page.
    - `sort`: String (optional) - Sorting criteria (e.g., `createdAt,desc`).
- **Response:** `ApiResponse<Page<LoanApplicationResponse>>`
  - The `data` field will contain a paginated list of `LoanApplicationResponse` objects (see structure in API 1).

---

### 3. Get Required Documents for a Loan Product (related to an Application)
- **Endpoint:** `GET /required-documents/{id}`
- **Description:** Fetches the list of required documents for a specific loan product associated with a loan application. The response is a map where keys are document types and values are the filenames of uploaded documents (or null if not yet uploaded).
- **Permissions Required:** `GET_REQUIRED_DOCUMENTS_BY_LOAN_PRODUCT_ID` or `ADMIN` role.
- **Path Variable:**
    - `id`: Long - The ID of the Loan Application (which is linked to a Loan Product).
- **Response:** `ApiResponse<Map<String, Object>>`
  ```json
  {
    "code": 1000,
    "message": null,
    "data": {
      "ID_PROOF": "id_document.pdf", // Example: Document type "ID_PROOF" with uploaded file "id_document.pdf"
      "INCOME_PROOF": null,        // Example: Document type "INCOME_PROOF" not yet uploaded
      "ADDRESS_PROOF": "address.png"
      // ... other required documents
    }
  }
  ```

---

### 4. Get Loan Applications for Current User
- **Endpoint:** `GET /user`
- **Description:** Retrieves a paginated list of loan applications submitted by the currently authenticated user.
- **Permissions Required:** `GET_LOAN_APPLICATIONS_CURRENT_USER_ALL` or `ADMIN` role.
- **Query Parameters:**
    - `page`: Integer (optional) - Page number (0-indexed).
    - `size`: Integer (optional) - Number of items per page.
    - `sort`: String (optional) - Sorting criteria (e.g., `createdAt,desc`).
- **Response:** `ApiResponse<Page<LoanApplicationResponse>>`
  - The `data` field will contain a paginated list of `LoanApplicationResponse` objects (see structure in API 1).

---

### 5. Get Loan Application by ID
- **Endpoint:** `GET /{id}`
- **Description:** Retrieves a specific loan application by its ID.
- **Permissions Required:** `GET_LOAN_APPLICATIONS_BY_ID` or `ADMIN` role.
- **Path Variable:**
    - `id`: Long - The ID of the loan application.
- **Response:** `ApiResponse<LoanApplicationResponse>` (see structure in API 1).

---

### 6. Update Loan Application
- **Endpoint:** `PATCH /{id}`
- **Description:** Updates an existing loan application.
- **Permissions Required:** `PATCH_LOAN_APPLICATIONS_UPDATE_BY_ID` or `ADMIN` role.
- **Path Variable:**
    - `id`: Long - The ID of the loan application to update.
- **Request Body:** `LoanApplicationRequest` (see structure in API 1, fields are optional for update)
- **Response:** `ApiResponse<LoanApplicationResponse>` (see structure in API 1 with updated fields).

---

### 7. Update Loan Application Status
- **Endpoint:** `PATCH /{id}/status`
- **Description:** Updates the status of a specific loan application.
- **Permissions Required:** `PATCH_LOAN_APPLICATIONS_UPDATE_STATUS_BY_ID` or `ADMIN` role.
- **Path Variable:**
    - `id`: Long - The ID of the loan application.
- **Query Parameter:**
    - `status`: String (Required) - The new status for the loan application.
      Possible values: `NEW`, `PENDING`, `REQUIRE_MORE_INFO`, `APPROVED`, `REJECTED`, `PARTIALLY_DISBURSED`, `FULLY_DISBURSED`.
- **Response:** `ApiResponse<LoanApplicationResponse>` (see structure in API 1 with updated status).

---

### 8. Admin Update Loan Application Status with Management Features
- **Endpoint:** `PATCH /{id}/status/manage`
- **Description:** Admin-only endpoint to update loan application status with internal notes and automatic notifications. This endpoint sends both web notifications and email notifications to the applicant.
- **Permissions Required:** `PATCH_LOAN_APPLICATIONS_STATUS_FOR_MANAGE` or `ADMIN` role.
- **Path Variable:**
    - `id`: Long - The ID of the loan application.
- **Query Parameters:**
    - `status`: String (Required) - The new status for the loan application.
      Possible values: `NEW`, `PENDING`, `REQUIRE_MORE_INFO`, `APPROVED`, `REJECTED`, `PARTIALLY_DISBURSED`, `FULLY_DISBURSED`.
    - `internal_notes`: String (Optional) - Internal notes for the status change that will be included in notifications.
- **Response:** `ApiResponse<LoanApplicationResponse>` (see structure in API 1 with updated status).
- **Additional Features:**
    - **Web Notifications**: Automatically creates a notification record in the database for the applicant
    - **Email Notifications**: Sends a formatted email using the `application-result-template.html` template
    - **Internal Notes**: Optional notes are included in both notification types if provided
    - **Status-based Notification Types**: 
      - `APPROVED` status → `LOAN_APPROVAL` notification type
      - `REJECTED` status → `LOAN_REJECTION` notification type
      - Other statuses → `SYSTEM` notification type
    - **Vietnamese Localization**: All messages are in Vietnamese
    - **Error Handling**: If notification/email sending fails, the status update still succeeds but errors are logged
- **Business Rules:**
    - Cannot change status from `REJECTED` to any other status except `REJECTED` (throws `LOAN_APPLICATION_ALREADY_REJECTED` error)
    - Status validation is performed before any updates
- **Email Content Includes:**
    - Applicant's full name
    - Application ID and status
    - Loan product name and requested amount
    - Internal notes (if provided)
    - Status-specific styling and messaging

---

### 9. Delete Loan Application by ID
- **Endpoint:** `DELETE /{id}`
- **Description:** Deletes a specific loan application by its ID.
- **Permissions Required:** `DELETE_LOAN_APPLICATIONS_BY_ID` or `ADMIN` role.
- **Path Variable:**
    - `id`: Long - The ID of the loan application to delete.
- **Response:** `ApiResponse<Void>`
  ```json
  {
    "code": 1000,
    "message": null, // Or a success message
    "data": null
  }
  ```

---

## Common Response Wrapper `ApiResponse<T>`

All API responses are wrapped in an `ApiResponse` object:

```json
{
  "code": Integer, // Status code (e.g., 1000 for success, other codes for errors)
  "message": "String", // Optional message, usually for errors
  "data": T // The actual response data, type varies by endpoint
}
```

## Enum: `LoanApplicationStatus`
Used in `LoanApplicationRequest` (optional for creation, used in status update) and `LoanApplicationResponse`.
- `NEW` - Đơn vay mới
- `PENDING` - Đang chờ xử lý
- `REQUIRE_MORE_INFO` - Yêu cầu bổ sung thông tin
- `APPROVED` - Đã phê duyệt
- `REJECTED` - Đã từ chối
- `PARTIALLY_DISBURSED` - Giải ngân một phần
- `FULLY_DISBURSED` - Đã giải ngân hoàn tất

## Enum: `NotificationType`
Used for categorizing notifications sent to users.
- `DOCUMENT_REQUEST` - Yêu cầu tài liệu
- `REVIEWING` - Đang xem xét
- `LOAN_APPROVAL` - Phê duyệt khoản vay
- `LOAN_REJECTION` - Từ chối khoản vay
- `SYSTEM` - Thông báo hệ thống

## Email Templates
The system uses the following email templates for notifications:
- `application-result-template.html` - Used for loan application status updates
- `disburse-template.html` - Used for disbursement notifications
- `email-template.html` - Used for account verification emails

### Application Result Email Features:
- Dynamic styling based on status (APPROVED=green, REJECTED=red, REQUIRE_MORE_INFO=yellow, PENDING=blue)
- Responsive design for mobile and desktop
- Status-specific icons and messages
- Support for internal notes display
- Application details section with formatted amounts
- Vietnamese localization

## Implementation Notes

### Admin Status Management Workflow:
1. Admin calls `PATCH /{id}/status/manage` with new status and optional internal notes
2. System validates the status change (cannot change from REJECTED to other statuses)
3. Application status is updated in the database
4. Web notification is created and sent to the applicant's notification center
5. Email notification is sent using the appropriate template
6. Both notifications include any internal notes provided by the admin
7. Response returns the updated loan application data

### Example Usage:

**Update to APPROVED with notes:**
```bash
PATCH /loan-applications/123/status/manage?status=APPROVED&internal_notes=Hồ sơ đã được phê duyệt. Vui lòng chờ liên hệ từ phòng tài chính.
```

**Update to REJECTED:**
```bash
PATCH /loan-applications/123/status/manage?status=REJECTED&internal_notes=Thu nhập không đủ điều kiện vay theo chính sách hiện tại.
```

**Update without notes:**
```bash
PATCH /loan-applications/123/status/manage?status=PENDING
```

### Error Responses:
- `LOAN_APPLICATION_NOT_FOUND` - Application ID does not exist
- `LOAN_APPLICATION_ALREADY_REJECTED` - Cannot change status from REJECTED
- `INVALID_STATUS` - Invalid status value provided
- Standard validation errors for missing required parameters
