# Backend API Requirements
## Local Service Delivery & Inclusive Governance System

> **Base URL**: `http://<host>/api/v1`  
> **Auth**: Bearer token in `Authorization` header for all protected routes.  
> **Naming note**: Terms like "assembly", "district officer", "navigator" are placeholders — swap for confirmed names without changing the contract. "Assembly" could be community, area, ward, town, city, etc.

---

## Data Models

### User
```ts
{
  id: string
  email: string
  fullName: string
  role: "staff_officer" | "admin" | "field_agent"   // rename as needed
  assemblyId: string | null   // which assembly/area this user belongs to (null for admins)
}
```

### Case (Report/Complaint)
```ts
{
  id: string
  code: string                  // e.g. "GGA-A-001" — auto-generated, unique
  // Citizen info (optional — not always collected)
  fullName?: string
  phoneNumber: string           // required
  // Classification
  category: CategoryEnum        // see enum below
  otherCategory?: string        // free text when category = "other"
  description?: string
  // Location
  assemblyId: string            // which assembly/area this case belongs to
  community?: string            // neighbourhood / locality
  landmark?: string
  // Workflow
  status: StatusEnum            // see enum below
  assignedToId?: string         // User.id of the staff officer handling it
  createdById?: string          // User.id of whoever submitted (field agent or null for public)
  channel: "ussd" | "web" | "portal"   // how it was submitted
  // Timestamps
  createdAt: string             // ISO 8601
  updatedAt: string
  respondedAt?: string          // when first assigned / actioned
  expectedResolutionDate?: string
  resolvedAt?: string
  closedAt?: string
  closureReason?: string        // required when status = "closed_with_reasons"
  // Escalation
  escalatedAt?: string
  escalationReason?: string
  // Relations (populated on fetch)
  assignedTo?: User
  createdBy?: User
  attachmentUrl?: string        // optional photo upload
}
```

### CategoryEnum
```
roads_infrastructure | water_sanitation | electricity_energy |
waste_management | healthcare_services | education_services |
public_safety | market_commerce | environmental_issues |
documentation_services | transportation | other
```

### StatusEnum
```
received | assigned | in_progress | resolved | closed_with_reasons | escalated
```

> **Note**: The frontend currently uses `pending` for `received` and `rejected` for `closed_with_reasons`. Please confirm the preferred set and the frontend will be updated to match.

---

## 1. Authentication

### `POST /auth/login`
**Public**

Request:
```json
{ "email": "string", "password": "string" }
```
Response `200`:
```json
{ "user": { ...User }, "accessToken": "string" }
```
Error: `401` invalid credentials.

---

### `POST /auth/register`
**Public or Admin-only** — TBD based on whether self-registration is allowed

Request:
```json
{
  "email": "string",
  "password": "string",
  "fullName": "string",
  "role": "staff_officer | admin | field_agent",
  "assemblyId": "string | null"
}
```
Response `201`: `{ "user": { ...User }, "accessToken": "string" }`

---

### `GET /auth/profile`
**Protected**

Response `200`: `{ ...User }`

---

## 2. Cases (Core Resource)

### `GET /cases`
**Protected** — returns cases the caller is authorised to see.

| Query param | Type | Description |
|---|---|---|
| `assemblyId` | string | Filter by assembly/area |
| `status` | StatusEnum | Filter by status |
| `category` | CategoryEnum | Filter by category |
| `assignedToId` | string | Filter by assigned officer |
| `page` | number | Default `1` |
| `pageSize` | number | Default `10` |
| `search` | string | Free-text on code / description / citizen name |

Response `200`:
```json
{ "rows": [ { ...Case } ], "total": 120, "page": 1, "pageSize": 10 }
```

**Role behaviour**:
- `admin` → all cases (optionally filtered by assembly)
- `staff_officer` → only cases in their assembly
- `field_agent` → only cases they created

---

### `GET /cases/:id`
**Protected**

Response `200`: `{ ...Case }` (with `assignedTo` and `createdBy` populated)  
Error: `404`

---

### `POST /cases`
**Public** — citizen web dashboard submission

Request:
```json
{
  "phoneNumber": "string",
  "assemblyId": "string",
  "category": "CategoryEnum",
  "otherCategory": "string?",
  "description": "string?",
  "community": "string?",
  "landmark": "string?",
  "channel": "web"
}
```
Response `201`: `{ "code": "GGA-A-042" }`

> The ticket code is returned immediately so the citizen can track their report.

---

### `POST /cases/field`
**Protected** — field agent / portal submission

Request:
```json
{
  "fullName": "string?",
  "phoneNumber": "string",
  "assemblyId": "string",
  "category": "CategoryEnum",
  "otherCategory": "string?",
  "description": "string?",
  "community": "string?",
  "landmark": "string?",
  "channel": "portal | ussd"
}
```
Response `201`: `{ "code": "string" }`

---

### `PATCH /cases/:id/assign`
**Protected** — admin or staff officer

Request:
```json
{
  "assignedToId": "string",
  "expectedResolutionDate": "ISO string?"
}
```
Response `200`: `{ ...Case }`  
Side effect: status → `assigned`, `respondedAt` is set.

---

### `PATCH /cases/:id/status`
**Protected**

Request:
```json
{
  "status": "in_progress | resolved | closed_with_reasons",
  "closureReason": "string?",   // required when status = closed_with_reasons
  "actionNote": "string?"
}
```
Response `200`: `{ ...Case }`

---

### `PATCH /cases/:id/escalate`
**Protected**

Request:
```json
{
  "assignedToId": "string",
  "escalationReason": "string"
}
```
Response `200`: `{ ...Case }`  
Side effect: status → `escalated`, `escalatedAt` set.

---

### `POST /cases/:id/attachment`
**Protected** — multipart/form-data, field: `file` (image)

Response `200`: `{ "attachmentUrl": "string" }`

---

## 3. Public Ticket Tracking

### `GET /cases/track/:code`
**Public** — citizen looks up their ticket by code (e.g. `GGA-A-042`)

Response `200`:
```json
{
  "code": "GGA-A-042",
  "category": "roads_infrastructure",
  "status": "in_progress",
  "assemblyId": "string",
  "createdAt": "ISO string",
  "updatedAt": "ISO string",
  "respondedAt": "ISO string?",
  "expectedResolutionDate": "ISO string?"
}
```
> **Privacy**: do NOT return citizen name, phone number, or officer details on this public endpoint.

Error: `404` if code not found.

---

## 4. Public Community Stats

### `GET /public/stats`
**Public** — aggregated data for the public dashboard

| Query param | Type | Description |
|---|---|---|
| `assemblyId` | string? | Filter to one assembly/area |

Response `200`:
```json
{
  "totalCases": 120,
  "resolved": 80,
  "inProgress": 25,
  "pending": 15,
  "byCategory": [
    { "category": "roads_infrastructure", "count": 30 }
  ]
}
```

---

## 5. Assemblies / Areas

### `GET /assemblies`
**Public** — used in dropdowns on the public dashboard and portal

Response `200`:
```json
{ "rows": [ { "id": "string", "name": "string", "region": "string?" } ] }
```

---

## 6. Users / Staff Management

### `GET /users`
**Protected** — admin only

| Query param | Type | Description |
|---|---|---|
| `role` | string | Filter by role |
| `assemblyId` | string | Filter by assembly |

Response `200`: `{ "rows": [ { ...User } ] }`

---

### `GET /users/staff-officers`
**Protected** — used when assigning a case

| Query param | Type |
|---|---|
| `assemblyId` | string? |

Response `200`: `{ "rows": [ { ...User } ] }`

---

### `GET /users/field-agents`
**Protected**

Response `200`: `{ "rows": [ { ...User } ] }`

---

### `GET /users/admins`
**Protected**

Response `200`: `{ "rows": [ { ...User } ] }`

---

## 7. Analytics & Reporting

All analytics endpoints are **Protected** (admin / staff officer).  
All accept an optional `?assemblyId=` query param to scope to one assembly.

---

### `GET /analytics/stats`
KPI summary cards.

Response `200`:
```json
{
  "activeCases": 45,
  "avgResponseHours": 18.4,
  "resolutionRate": 72.5,
  "overdueCases": 8,
  "activeCasesChange": 3,
  "avgResponseHoursChange": -2.1,
  "resolutionRateChange": 4.2,
  "overdueCasesChange": -1
}
```
> `*Change` = difference vs. previous 7-day window.

---

### `GET /analytics/cases-by-assembly`
**Admin only**

Response `200`:
```json
[{ "assembly": "Assembly A", "total": 45, "pending": 10, "inProgress": 15, "resolved": 18, "rejected": 2 }]
```

---

### `GET /analytics/cases-by-category`
Response `200`: `[ { "category": "Roads & Infrastructure", "count": 30 } ]`

---

### `GET /analytics/cases-by-status`
Response `200`: `[ { "status": "In Progress", "count": 25, "percentage": 21 } ]`

---

### `GET /analytics/cases-trend`
30-day daily trend.

| Query param | Type |
|---|---|
| `assemblyId` | string? |
| `days` | number? (default 30) |

Response `200`: `[ { "date": "Feb 1", "submitted": 5, "resolved": 3 } ]`

---

### `GET /analytics/assembly-performance`
**Admin only**

Response `200`:
```json
[{ "assembly": "Assembly A", "resolutionRate": 78, "avgResponseHours": 14.2, "activeCases": 22 }]
```

---

### `GET /analytics/response-time-distribution`
Response `200`: `[ { "bucket": "0-6h", "count": 12 } ]`

Buckets: `0-6h`, `6-12h`, `12-24h`, `1-3d`, `3-7d`, `7d+`

---

### `GET /analytics/resolution-time-by-category`
Response `200`: `[ { "category": "Roads & Infrastructure", "avgDays": 6.2, "count": 18 } ]`

---

### `GET /analytics/officer-performance`
**Admin only**

Response `200`:
```json
[{ "name": "John Officer", "totalCases": 20, "resolved": 15, "avgResponseHours": 10.5, "resolutionRate": 75 }]
```

---

### `GET /analytics/weekly-activity`
Response `200`: `[ { "day": "Mon", "submitted": 18, "resolved": 12 } ]`

---

### `GET /analytics/escalations`
Response `200`:
```json
{
  "totalEscalated": 12,
  "escalationRate": 10,
  "avgDaysBeforeEscalation": 5.3,
  "byCategory": [ { "category": "Water & Sanitation", "count": 5, "percentage": 42 } ]
}
```

---

### `GET /analytics/overdue-cases`
Returns full case list for overdue cases (pending/in-progress > 7 days).

Response `200`: `[ { ...Case } ]`

---

### `GET /analytics/recent-activity`
Recent status changes — used in the field agent activity feed.

| Query param | Type |
|---|---|
| `assemblyId` | string? |
| `pageSize` | number? (default 10) |

Response `200`:
```json
[{
  "id": "string",
  "caseId": "string",
  "caseCode": "GGA-A-001",
  "agentName": "Alice Field",
  "agentEmail": "alice@gga.org",
  "oldStatus": "received",
  "newStatus": "in_progress",
  "updatedAt": "ISO string"
}]
```

---

## 8. Error Response Shape

```json
{ "message": "Human-readable error", "statusCode": 404 }
```

---

## Endpoint Summary

| Method | Path | Auth | Who |
|---|---|---|---|
| POST | `/auth/login` | Public | All |
| POST | `/auth/register` | Public / Admin | TBD |
| GET | `/auth/profile` | Bearer | All |
| GET | `/cases` | Bearer | Role-scoped |
| GET | `/cases/:id` | Bearer | Role-scoped |
| POST | `/cases` | Public | Citizens |
| POST | `/cases/field` | Bearer | Field agents |
| PATCH | `/cases/:id/assign` | Bearer | Admin / Officer |
| PATCH | `/cases/:id/status` | Bearer | Officer |
| PATCH | `/cases/:id/escalate` | Bearer | Officer |
| POST | `/cases/:id/attachment` | Bearer | Officer |
| GET | `/cases/track/:code` | Public | Citizens |
| GET | `/public/stats` | Public | Citizens |
| GET | `/assemblies` | Public | All |
| GET | `/users` | Bearer | Admin |
| GET | `/users/staff-officers` | Bearer | Admin / Officer |
| GET | `/users/field-agents` | Bearer | Admin |
| GET | `/users/admins` | Bearer | Admin |
| GET | `/analytics/stats` | Bearer | Admin / Officer |
| GET | `/analytics/cases-by-assembly` | Bearer | Admin |
| GET | `/analytics/cases-by-category` | Bearer | Admin / Officer |
| GET | `/analytics/cases-by-status` | Bearer | Admin / Officer |
| GET | `/analytics/cases-trend` | Bearer | Admin / Officer |
| GET | `/analytics/assembly-performance` | Bearer | Admin |
| GET | `/analytics/response-time-distribution` | Bearer | Admin / Officer |
| GET | `/analytics/resolution-time-by-category` | Bearer | Admin / Officer |
| GET | `/analytics/officer-performance` | Bearer | Admin |
| GET | `/analytics/weekly-activity` | Bearer | Admin / Officer |
| GET | `/analytics/escalations` | Bearer | Admin / Officer |
| GET | `/analytics/overdue-cases` | Bearer | Admin / Officer |
| GET | `/analytics/recent-activity` | Bearer | Admin / Officer |
