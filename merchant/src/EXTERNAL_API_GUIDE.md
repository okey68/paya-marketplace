# External API Integration Guide

This guide provides detailed instructions for integrating with the Paya External API to onboard organizations and their directors.

---

## Overview

The Paya External API allows external systems to programmatically onboard organizations through a secure, API key-based system. The API supports:

- Creating organization owners
- Creating organizations
- Uploading organization documents
- Adding directors/board members
- Uploading director documents
- Retrieving organization status

**Base URL:** `https://dev.getpaya.com/api/v1/external`

---

## Authentication

### Getting an API Key

**API Key Format:** `pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

⚠️ **Important:**

- API keys are only shown once upon creation. Store them securely!
- Never commit API keys to version control
- Use environment variables to store keys

### Using the API Key

Include the API key in the `X-API-Key` header for all requests:

```bash
X-API-Key: pk_live_your_api_key_here
```

---

## API Endpoints

### 1. Create Organization Owner

Creates a user who will be the owner of the organization.

**Endpoint:** `POST /organizations/owners`

**Request Body:**

```json
{
  "username": "john_doe_corp",
  "email": "john.doe@company.com",
  "phone": "254712345678",
  "firstName": "John",
  "lastName": "Doe",
  "middleName": "Michael",
  "idNumber": "12345678",
  "kraPin": "A001234567Z"
}
```

**Response:**

```json
{
  "userId": "clxxxxxxxxxxxxx",
  "customerId": 12345,
  "username": "john_doe_corp",
  "email": "john.doe@company.com",
  "phone": "254712345678",
  "firstName": "John",
  "lastName": "Doe",
  "position": "OWNER",
  "createdAt": "2025-11-17T10:00:00.000Z"
}
```

**Note:** Save the `userId` - you'll need it for the next step.

---

### 2. Create Organization

Creates the organization and links it to the owner.

**Endpoint:** `POST /organizations`

**Request Body:**

```json
{
  "ownerId": "clxxxxxxxxxxxxx",
  "companyNumber": "PVT-ABCDEF123",
  "name": "Acme Corporation Limited",
  "businessType": "LIMITED_COMPANY",
  "type": "BUSINESS",
  "phone": "254712345678",
  "email": "info@acmecorp.com",
  "taxNumber": "P051234567X",
  "tradingName": "Acme Corp",
  "businessRegistrationDate": "2020-01-15",
  "industrialClassification": "Technology Services",
  "industrialSector": "Information Technology",
  "address": {
    "addressType": "BUSINESS",
    "line1": "123 Main Street, Building A",
    "line2": "Floor 4, Office 401",
    "city": "Nairobi",
    "state": "Nairobi County",
    "country": "Kenya",
    "postalCode": "00100"
  }
}
```

**Field Notes:**

- `type`: Organization type as required by Astra. Allowed values: `OTHER`, `FAMILY`, `BUSINESS`, `CLUB`
- `businessType`: Internal classification. Allowed values: `LIMITED_COMPANY`, `SOLE_PROPRIETORSHIP`, `PARTNERSHIP`, `NGO`, `OTHER`
- `businessRegistrationDate`: Use ISO 8601 date format (YYYY-MM-DD). Example: `2020-01-15`

**Response:**

```json
{
  "organizationId": "clxxxxxxxxxxxxx",
  "astraOrganizationId": 67890,
  "name": "Acme Corporation Limited",
  "companyNumber": "PVT-ABCDEF123",
  "businessType": "LIMITED_COMPANY",
  "type": "BUSINESS",
  "phone": "254712345678",
  "email": "info@acmecorp.com",
  "ownerId": "clxxxxxxxxxxxxx",
  "createdAt": "2025-11-17T10:05:00.000Z"
}
```

**Note:** Save the `organizationId` for subsequent operations.

---

### 3. Upload Organization Documents

Upload required documents for the organization (Certificate of Incorporation, Business License, Tax Certificate).

**Endpoint:** `POST /organizations/:orgId/documents`

**Content-Type:** `multipart/form-data`

**Form Fields:**

- `file` (binary): The document file (PDF, JPG, JPEG, PNG - max 15MB)
- `documentType` (string): Type of document

**Document Types:**

- `CERT_OF_INCORP` - Certificate of Incorporation
- `BUSINESS_LICENSE` - Business License
- `TAX` - Tax Certificate
- `BUSINESS_CERTIFICATE` - Business Certificate

**Example (cURL):**

```bash
curl -X POST \
  https://dev.getpaya.com/api/v1/external/organizations/clxxxxxxxxxxxxx/documents \
  -H "X-API-Key: pk_live_your_api_key_here" \
  -F "file=@/path/to/certificate.pdf" \
  -F "documentType=CERT_OF_INCORP"
```

**Response:**

```json
{
  "documentId": "clxxxxxxxxxxxxx",
  "astraDocumentId": 54321,
  "documentType": "CERT_OF_INCORP",
  "url": "https://bucket.nyc3.digitaloceanspaces.com/paya/organizations/...",
  "uploadStatus": "uploaded",
  "createdAt": "2025-11-17T10:10:00.000Z"
}
```

---

### 4. Add Directors to Organization

Add directors, partners, or other position holders to the organization.

**Endpoint:** `POST /organizations/:orgId/directors`

**Request Body:**

```json
{
  "username": "jane_smith_dir",
  "email": "jane.smith@company.com",
  "phone": "254723456789",
  "firstName": "Jane",
  "lastName": "Smith",
  "middleName": "Elizabeth",
  "idNumber": "23456789",
  "kraPin": "A001234568Z",
  "position": "DIRECTOR"
}
```

**Position Types:**

- `DIRECTOR`
- `PARTNER`
- `PRIMARY_CONTACT`
- `HEAD`
- `MANAGER`

**Response:**

```json
{
  "directorId": "clxxxxxxxxxxxxx",
  "customerId": 12346,
  "username": "jane_smith_dir",
  "email": "jane.smith@company.com",
  "phone": "254723456789",
  "firstName": "Jane",
  "lastName": "Smith",
  "position": "DIRECTOR",
  "organizationId": "clxxxxxxxxxxxxx",
  "createdAt": "2025-11-17T10:15:00.000Z"
}
```

**Note:** Save the `directorId` for uploading director documents.

---

### 5. Upload Director Documents

Upload identity documents for directors (National ID, Passport, Facial Photo).

**Endpoint:** `POST /organizations/:orgId/directors/:directorId/documents`

**Content-Type:** `multipart/form-data`

**Form Fields:**

- `file` (binary): The document file
- `documentType` (string): Type of document

**Document Types:**

- `NATIONAL_IDENTITY` - National ID (front)
- `BACK_OF_NATIONAL_IDENTITY` - National ID (back)
- `FACIAL_PHOTO` - Facial photograph
- `PASSPORT` - Passport

**Example (cURL):**

```bash
curl -X POST \
  https://dev.getpaya.com/api/v1/external/organizations/clxxxxxxxxxxxxx/directors/clyyyyyyyyyyy/documents \
  -H "X-API-Key: pk_live_your_api_key_here" \
  -F "file=@/path/to/national_id.jpg" \
  -F "documentType=NATIONAL_IDENTITY"
```

**Response:**

```json
{
  "documentId": "clxxxxxxxxxxxxx",
  "astraDocumentId": 54322,
  "documentType": "NATIONAL_IDENTITY",
  "url": "https://bucket.nyc3.digitaloceanspaces.com/paya/directors/...",
  "uploadStatus": "uploaded",
  "createdAt": "2025-11-17T10:20:00.000Z"
}
```

---

### 6. Get Organization Status

Retrieve the current status of an organization, including owner, directors, and uploaded documents.

**Endpoint:** `GET /organizations/:orgId`

**Example:**

```bash
curl -X GET \
  https://dev.getpaya.com/api/v1/external/organizations/clxxxxxxxxxxxxx \
  -H "X-API-Key: pk_live_your_api_key_here"
```

**Response:**

```json
{
  "organizationId": "clxxxxxxxxxxxxx",
  "astraOrganizationId": 67890,
  "name": "Acme Corporation Limited",
  "companyNumber": "PVT-ABCDEF123",
  "businessType": "LIMITED_COMPANY",
  "type": "BUSINESS",
  "phone": "254712345678",
  "email": "info@acmecorp.com",
  "owner": {
    "id": "clxxxxxxxxxxxxx",
    "username": "john_doe_corp",
    "email": "john.doe@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "position": "OWNER",
    "isVerified": true,
    "customerId": 12345
  },
  "directors": [
    {
      "id": "clxxxxxxxxxxxxx",
      "username": "jane_smith_dir",
      "firstName": "Jane",
      "lastName": "Smith",
      "position": "DIRECTOR",
      "isVerified": false,
      "customerId": 12346
    }
  ],
  "documents": [
    {
      "id": "clxxxxxxxxxxxxx",
      "name": "CERT_OF_INCORP",
      "url": "https://...",
      "createdAt": "2025-11-17T10:10:00.000Z"
    }
  ],
  "address": {
    "line1": "123 Main Street, Building A",
    "city": "Nairobi",
    "country": "Kenya"
  },
  "createdAt": "2025-11-17T10:05:00.000Z",
  "updatedAt": "2025-11-17T10:20:00.000Z"
}
```
