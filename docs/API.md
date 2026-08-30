# API Documentation — Beauty Express Backend

Base URL (local development): `http://localhost:4000/api`

All responses are JSON. All error responses follow the same structure (see Error Handling below).

---

## Health Check

### GET /health

Confirms the server is running.

**Response 200 OK:**

{
"status": "ok",
"message": "Beauty Express backend is running"
}


---

## Customers

### POST /customers/register

Registers a new customer, or returns the existing customer if the phone number is already registered (idempotent by phone number).

**Request body:**

{
"full_name": "Jane Doe",
"phone_number": "0712345678"
}


| Field | Type | Required | Notes |
|---|---|---|---|
| full_name | string | yes | Minimum 2 characters |
| phone_number | string | yes | Kenyan format: 0712345678, 254712345678, or +254712345678 |

**Success response 201 Created (new customer):**

{
"success": true,
"message": "Registration successful.",
"customer": {
"id": "uuid",
"full_name": "Jane Doe",
"phone_number": "0712345678",
"loyalty_points": 0,
"is_active": true,
"created_at": "2026-08-30T03:04:34.871Z",
"updated_at": "2026-08-30T03:04:34.871Z"
}
}


**Error responses:**

| Status | Error code | Cause |
|---|---|---|
| 400 | INVALID_NAME | full_name missing or under 2 characters |
| 400 | MISSING_PHONE | phone_number missing |
| 400 | INVALID_PHONE_FORMAT | phone_number doesn't match Kenyan phone format |
| 409 | DUPLICATE_PHONE | Phone number is already registered |

Example error response:

{
"success": false,
"error": {
"code": "DUPLICATE_PHONE",
"message": "This phone number is already registered. Please log in instead."
}
}


---

## Error Handling

Every error follows this exact shape:

{
"success": false,
"error": {
"code": "MACHINE_READABLE_CODE",
"message": "Human-readable explanation safe to show the user."
}
}


**Standard status codes used:**

| Status | Meaning |
|---|---|
| 400 | Bad request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict |
| 500 | Internal server error |

## Employees

### POST /employees/register

Registers a new employee account.

**Request body:**

{
"full_name": "Grace Wanjiru",
"phone_number": "0722334455",
"password": "securepass123"
}


| Field | Type | Required | Notes |
|---|---|---|---|
| full_name | string | yes | Minimum 2 characters |
| phone_number | string | yes | Must be unique |
| password | string | yes | Minimum 6 characters, stored as a bcrypt hash |

**Success response 201 Created:**

{
"success": true,
"message": "Employee registered successfully.",
"employee": {
"id": "uuid",
"full_name": "Grace Wanjiru",
"phone_number": "0722334455",
"status": "offline",
"created_at": "2026-08-30T03:40:39.015Z"
}
}


**Error responses:**

| Status | Error code | Cause |
|---|---|---|
| 400 | INVALID_NAME | full_name missing or under 2 characters |
| 400 | MISSING_PHONE | phone_number missing |
| 400 | WEAK_PASSWORD | password under 6 characters |
| 409 | DUPLICATE_PHONE | Phone number already registered |

---

### POST /employees/login

Logs in an employee and returns a JWT token, valid for 12 hours.

**Request body:**

{
"phone_number": "0722334455",
"password": "securepass123"
}


**Success response 200 OK:**

{
"success": true,
"message": "Login successful.",
"token": "eyJhbGciOi...",
"employee": {
"id": "uuid",
"full_name": "Grace Wanjiru",
"phone_number": "0722334455",
"status": "offline"
}
}


Include the token on future requests as: `Authorization: Bearer <token>`

### GET /employees/me

**Protected route** — requires a valid JWT.

**Headers:**

Authorization: Bearer <token>


**Success response 200 OK:**

{
"success": true,
"employee": {
"id": "uuid",
"full_name": "Grace Wanjiru",
"phone_number": "0722334455",
"status": "offline",
"created_at": "2026-08-30T03:40:39.015Z"
}
}


**Error responses:**

| Status | Error code | Cause |
|---|---|---|
| 401 | NO_TOKEN | No Authorization header provided |
| 401 | TOKEN_EXPIRED | Token has expired (tokens last 12 hours) |
| 401 | INVALID_TOKEN | Token is malformed or was signed with a different secret |
**Error responses:**

| Status | Error code | Cause |
|---|---|---|
| 400 | MISSING_CREDENTIALS | phone_number or password missing |
| 401 | INVALID_CREDENTIALS | Wrong phone number or password (intentionally vague for security) |
| 403 | ACCOUNT_DEACTIVATED | Employee account has been deactivated by admin |
---

## Changelog

| Date | Change |
|---|---|
| 2026-08-30 | Added customer registration endpoint with validation and structured error handling |
