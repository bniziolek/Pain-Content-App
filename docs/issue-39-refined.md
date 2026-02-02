# Refined Requirements: Issue #39 - Content Packet Access Codes

## Overview
The goal is to provide patients with an easy way to access digital educational content associated with their printed material. This is achieved through short, memorable access codes generated at the time of PDF packet creation.

## Requirements

### 1. Access Code Generation
- **Prefixes**: Use variety-rich, positive, or health-related prefixes (HEAL, PAIN, MOVE, FLEX, CARE, WELL, FLOW, EASE).
- **Suffix**: 4-character alphanumeric string.
- **Exclusions**: Do not use ambiguous characters (0, O, 1, l, I).
- **Uniqueness**: Codes must be unique. The system should retry up to 10 times on collision.
- **Normalization**: Codes are stored and validated in as upper-case, case-insensitive (normalized for input).

### 2. Database Schema
- **Table**: `packet_access_codes`
- **Fields**:
  - `id`: UUID (Primary Key)
  - `code`: 10-character string (Normalized, Unique)
  - `internal_screening_id`: Optional reference to the screening.
  - `clinician_id`: Required reference to the clinician who generated it.
  - `content_ids`: Array of content item IDs.
  - `access_count`: Integer, incremented on each lookup.
  - `last_accessed_at`: Timestamp of the most recent lookup.
  - `expires_at`: Required expiration timestamp (default 90 days).
  - `is_active`: Boolean flag to manually deactivate codes.

### 3. Public Lookup
- **Endpoint**: `GET /api/public/lookup/:code`
- **Security**: 
  - Rate limiting (e.g., 10 requests per minute per IP).
  - No PHI is exposed; only educational content titles, types, and summaries.
- **Logic**:
  - Validate code existence, expiration, and active status.
  - Return content item details and clinician name.
  - Increment `access_count` and update `last_accessed_at`.

### 4. PDF Integration
- **Visibility**: The access code must be clearly visible on the cover page.
- **QR Code**: Include a QR code that links directly to `/lookup?code=XXXX`.
- **Instructions**: Briefly explain how to use the code.

### 5. Frontend Lookup Page
- **Path**: `/lookup`
- **Features**:
  - Clean, mobile-friendly input field.
  - Automatic uppercase normalization of input.
  - Direct lookup via URL parameter (`?code=XXXX`).
  - Clear error messages for:
    - Code not found
    - Code expired
    - Code inactive
- **View**: Display a list of content cards that open in a modal viewer.

## Refinements to be Implemented
1.  **Variety**: Add more prefixes to the generator.
2.  **Robustness**: Improve collision handling logic (current implementation is good but can be verified with tests).
3.  **Testing**: Add unit tests for the domain logic and integration tests for the public API.
