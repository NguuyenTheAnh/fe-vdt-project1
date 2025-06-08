# Disbursement Management API Documentation

## Overview
The Disbursement Management API provides endpoints for managing loan disbursement transactions. This system allows administrators to disburse approved loans in one or more transactions, provides tracking of disbursement history, and automatically sends email notifications to borrowers.

## Loan Application Status Flow
When disbursements are processed, the loan application status is automatically updated:
- **APPROVED** → **PARTIALLY_DISBURSED** (after first partial disbursement)
- **PARTIALLY_DISBURSED** → **FULLY_DISBURSED** (when total disbursed equals requested amount)
- **FULLY_DISBURSED** → **PARTIALLY_DISBURSED** (if a disbursement is deleted and remaining < total)
- **PARTIALLY_DISBURSED** → **APPROVED** (if all disbursements are deleted)

## Base Path
`/api/v1/disbursements`

## Authentication
All endpoints require authentication. Some endpoints require specific roles:
- **ADMIN**: Full access to all disbursement operations
- **USER**: Can view their own disbursement history

## Email Notifications
The system automatically sends email notifications to borrowers when disbursements are processed, including:
- Disbursement amount and transaction details
- Progress tracking with visual indicators
- Remaining balance information
- Professional email template with responsive design

---

## Endpoints

### 1. Create Disbursement Transaction
**POST** `/api/v1/disbursements`

Creates a new disbursement transaction for an approved loan application.

**Authorization:** `ADMIN` role required

**Request Body:**
```json
{
  "applicationId": 1,
  "amount": 50000,
  "transactionDate": "2024-01-15T10:30:00",
  "notes": "First disbursement - 50% of approved amount"
}
```

**Request Fields:**
- `applicationId` (Long, required): ID of the loan application
- `amount` (Long, required): Disbursement amount (must not exceed remaining balance)
- `transactionDate` (LocalDateTime, optional): Transaction date (defaults to current time)
- `notes` (String, optional): Additional notes about the disbursement

**Response:**
```json
{
  "data": {
    "transactionId": 1,
    "applicationId": 1,
    "amount": 50000,
    "transactionDate": "2024-01-15T10:30:00",
    "notes": "First disbursement - 50% of approved amount",
    "createdAt": "2024-01-15T10:30:00",
    "loanApplication": {
      "id": 1,
      "status": "APPROVED",
      "requestedAmount": 100000,
      "userId": 2,
      "userEmail": "user@example.com",
      "productId": 1,
      "productName": "Personal Loan"
    }
  }
}
```

**Error Responses:**
- `400`: Invalid disbursement amount or application not approved
- `404`: Loan application not found
- `403`: Insufficient permissions

---

### 2. Get Disbursement by ID
**GET** `/api/v1/disbursements/{transactionId}`

Retrieves a specific disbursement transaction by its ID.

**Authorization:** `ADMIN` or application owner

**Path Parameters:**
- `transactionId` (Long): ID of the disbursement transaction

**Response:**
```json
{
  "data": {
    "transactionId": 1,
    "applicationId": 1,
    "amount": 50000,
    "transactionDate": "2024-01-15T10:30:00",
    "notes": "First disbursement - 50% of approved amount",
    "createdAt": "2024-01-15T10:30:00",
    "loanApplication": {
      "id": 1,
      "status": "DISBURSED",
      "requestedAmount": 100000,
      "userId": 2,
      "userEmail": "user@example.com",
      "productId": 1,
      "productName": "Personal Loan"
    }
  }
}
```

---

### 3. Get All Disbursements (Admin)
**GET** `/api/v1/disbursements`

Retrieves all disbursement transactions with pagination.

**Authorization:** `ADMIN` role required

**Query Parameters:**
- `page` (int, optional): Page number (default: 0)
- `size` (int, optional): Page size (default: 20)
- `sort` (string, optional): Sort criteria (e.g., "transactionDate,desc")

**Response:**
```json
{
  "data": {
    "content": [
      {
        "transactionId": 1,
        "applicationId": 1,
        "amount": 50000,
        "transactionDate": "2024-01-15T10:30:00",
        "notes": "First disbursement",
        "createdAt": "2024-01-15T10:30:00",
        "loanApplication": { /* loan application details */ }
      }
    ],
    "totalElements": 100,
    "totalPages": 5,
    "size": 20,
    "number": 0
  }
}
```

---

### 4. Get Disbursements by Application
**GET** `/api/v1/disbursements/application/{applicationId}`

Retrieves all disbursement transactions for a specific loan application.

**Authorization:** `ADMIN` or application owner

**Path Parameters:**
- `applicationId` (Long): ID of the loan application

**Query Parameters:**
- `page` (int, optional): Page number (default: 0)
- `size` (int, optional): Page size (default: 20)

**Response:**
```json
{
  "data": {
    "content": [
      {
        "transactionId": 1,
        "applicationId": 1,
        "amount": 50000,
        "transactionDate": "2024-01-15T10:30:00",
        "notes": "First disbursement",
        "createdAt": "2024-01-15T10:30:00"
      },
      {
        "transactionId": 2,
        "applicationId": 1,
        "amount": 50000,
        "transactionDate": "2024-01-20T14:15:00",
        "notes": "Final disbursement",
        "createdAt": "2024-01-20T14:15:00"
      }
    ],
    "totalElements": 2,
    "totalPages": 1,
    "size": 20,
    "number": 0
  }
}
```

---

### 5. Get My Disbursements (Current User)
**GET** `/api/v1/disbursements/my`

Retrieves disbursement transactions for the current user's loan applications.

**Authorization:** Any authenticated user

**Query Parameters:**
- `page` (int, optional): Page number (default: 0)
- `size` (int, optional): Page size (default: 20)

**Response:**
```json
{
  "data": {
    "content": [
      {
        "transactionId": 1,
        "applicationId": 1,
        "amount": 50000,
        "transactionDate": "2024-01-15T10:30:00",
        "notes": "First disbursement",
        "createdAt": "2024-01-15T10:30:00",
        "loanApplication": { /* loan application details */ }
      }
    ],
    "totalElements": 2,
    "totalPages": 1,
    "size": 20,
    "number": 0
  }
}
```

---

### 6. Get Disbursement Summary
**GET** `/api/v1/disbursements/summary/{applicationId}`

Provides a comprehensive summary of disbursements for a loan application.

**Authorization:** `ADMIN` or application owner

**Path Parameters:**
- `applicationId` (Long): ID of the loan application

**Response:**
```json
{
  "data": {
    "applicationId": 1,
    "totalDisbursedAmount": 100000,
    "requestedAmount": 100000,
    "remainingAmount": 0,
    "transactionCount": 2,
    "isFullyDisbursed": true,
    "transactions": [
      {
        "transactionId": 1,
        "applicationId": 1,
        "amount": 50000,
        "transactionDate": "2024-01-15T10:30:00",
        "notes": "First disbursement",
        "createdAt": "2024-01-15T10:30:00"
      },
      {
        "transactionId": 2,
        "applicationId": 1,
        "amount": 50000,
        "transactionDate": "2024-01-20T14:15:00",
        "notes": "Final disbursement",
        "createdAt": "2024-01-20T14:15:00"
      }
    ]
  }
}
```

---

### 7. Delete Disbursement Transaction
**DELETE** `/api/v1/disbursements/{transactionId}`

Deletes a disbursement transaction. If this causes the total disbursed amount to be less than the approved amount, the loan status will be reverted from DISBURSED to APPROVED.

**Authorization:** `ADMIN` role required

**Path Parameters:**
- `transactionId` (Long): ID of the disbursement transaction to delete

**Response:**
```json
{
  "data": null
}
```

**Error Responses:**
- `404`: Disbursement transaction not found
- `403`: Insufficient permissions

---

## Business Rules

### Disbursement Validation
1. **Loan Status**: Only loans with status `APPROVED` can receive disbursements
2. **Amount Limits**: Disbursement amount cannot exceed the remaining balance (approved amount - total disbursed)
3. **Automatic Status Update**: When total disbursed equals approved amount, loan status automatically changes to `DISBURSED`

### Notifications
- Users receive automatic notifications for each disbursement transaction
- Notification indicates whether it's a partial or full disbursement
- Full disbursement notifications include the total amount
- Partial disbursement notifications show the remaining balance

### Security
- All endpoints require authentication
- Sensitive operations (create, delete) require `ADMIN` role
- Users can only view disbursements for their own loan applications
- Admins have full access to all disbursement data

### Data Integrity
- Deleting a disbursement transaction automatically recalculates loan status
- If deleting a transaction causes total disbursed < approved amount, status reverts to `APPROVED`
- All disbursement operations are wrapped in database transactions

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| `LOAN_APPLICATION_NOT_FOUND` | Loan application not found | The specified loan application ID does not exist |
| `LOAN_APPLICATION_NOT_APPROVED` | Loan application is not approved for disbursement | Only approved loans can receive disbursements |
| `DISBURSEMENT_AMOUNT_EXCEEDS_APPROVED` | Disbursement amount exceeds remaining approved amount | Total disbursements would exceed the approved loan amount |
| `DISBURSEMENT_NOT_FOUND` | Disbursement transaction not found | The specified disbursement transaction ID does not exist |
| `INSUFFICIENT_PERMISSIONS` | Insufficient permissions to access this disbursement | User doesn't have permission to access the disbursement |

---

## Usage Examples

### Example 1: Create First Disbursement (50% of loan)
```bash
POST /api/v1/disbursements
{
  "applicationId": 1,
  "amount": 50000,
  "notes": "First disbursement - 50% of approved amount"
}
```

### Example 2: Complete Remaining Disbursement
```bash
POST /api/v1/disbursements
{
  "applicationId": 1,
  "amount": 50000,
  "notes": "Final disbursement - loan fully disbursed"
}
```

### Example 3: Get Disbursement Summary
```bash
GET /api/v1/disbursements/summary/1
```

This will show total disbursed: 100000, remaining: 0, status: DISBURSED
