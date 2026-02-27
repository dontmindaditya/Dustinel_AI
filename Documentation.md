# 🛡️ SafeGuard AI
## Worker Safety & Health Monitoring System
### Complete Technical Architecture & Implementation Plan
**Microsoft Imagine Cup 2025 | Built on Microsoft Azure | AI-Powered | Real-Time | Scalable**

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Detailed Data Flow](#2-detailed-data-flow)
3. [Frontend Folder Structure](#3-frontend-folder-structure)
4. [Backend Folder Structure](#4-backend-folder-structure)
5. [API Design](#5-api-design)
6. [Database Schema (Cosmos DB)](#6-database-schema-cosmos-db)
7. [AI/ML Model Design](#7-aiml-model-design)
8. [Azure Integration Details](#8-azure-integration-details)
9. [Authentication Strategy](#9-authentication-strategy)
10. [Notification System Design](#10-notification-system-design)
11. [Deployment Strategy (CI/CD)](#11-deployment-strategy-cicd)
12. [Scalability Considerations](#12-scalability-considerations)
13. [Security Best Practices](#13-security-best-practices)
14. [MVP Plan](#14-mvp-plan)
15. [Future Improvements](#15-future-improvements)
16. [Appendix: Azure Naming & Cost Estimate](#appendix-azure-resource-names--cost-estimate)

---

## 1. System Architecture

### 1.1 High-Level Architecture Overview

SafeGuard AI follows a **cloud-native, microservices-inspired architecture** built entirely on Microsoft Azure. The system is divided into five logical tiers:

| Tier | Description |
|------|-------------|
| **Presentation Tier** | Next.js frontend (Web + Mobile PWA) |
| **API Gateway Tier** | Azure API Management or Azure Functions |
| **Application Tier** | Node.js/Express backend on Azure App Service |
| **AI/ML Tier** | Azure AI Vision + Azure Machine Learning |
| **Data Tier** | Azure Cosmos DB + Azure Blob Storage |

### 1.2 Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        SAFEGUARD AI SYSTEM                           │
│                                                                      │
│  ┌─────────────────┐   ┌─────────────────┐   ┌───────────────────┐  │
│  │  WORKER PORTAL  │   │ ADMIN DASHBOARD │   │  MOBILE APP (PWA) │  │
│  │   (Next.js)     │   │   (Next.js)     │   │    (Next.js)      │  │
│  └────────┬────────┘   └────────┬────────┘   └────────┬──────────┘  │
│           └────────────────────┼─────────────────────┘              │
│                                │                                     │
│                ┌───────────────▼──────────────────┐                 │
│                │  Azure Front Door (CDN + WAF)     │                 │
│                │  Azure API Management (Gateway)   │                 │
│                └───────────────┬──────────────────┘                 │
│                                │                                     │
│                ┌───────────────▼──────────────────┐                 │
│                │     Node.js Backend               │                 │
│                │     (Azure App Service)           │                 │
│                └──────┬─────────┬────────┬────────┘                 │
│                       │         │        │                           │
│            ┌──────────▼──┐  ┌───▼────┐  ┌▼──────────────────────┐  │
│            │ Azure Blob  │  │Cosmos  │  │   AI Services Layer   │  │
│            │  Storage    │  │   DB   │  │  ┌────────────────┐   │  │
│            │  (Images)   │  │ (Data) │  │  │ Azure AI Vision│   │  │
│            └─────────────┘  └────────┘  │  └────────────────┘   │  │
│                                         │  ┌────────────────┐   │  │
│                                         │  │  Azure ML      │   │  │
│                                         │  │  Studio        │   │  │
│                                         │  └────────────────┘   │  │
│                                         └───────────────────────┘  │
│                                                                      │
│  ┌──────────────────────┐        ┌───────────────────────────────┐  │
│  │ Azure Notification   │        │  Azure Monitor + App Insights │  │
│  │ Hubs  (Alerts/Push)  │        │  (Logging, Metrics, Alerts)   │  │
│  └──────────────────────┘        └───────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.3 Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| **Next.js Frontend** | Worker check-in UI, admin dashboard, real-time risk display |
| **Azure App Service** | REST API hosting, business logic, orchestration |
| **Azure AI Vision** | Image analysis: helmet, mask, fatigue detection, PPE compliance |
| **Azure Machine Learning** | Custom health risk scoring model (0–100) |
| **Azure Cosmos DB** | Worker profiles, health history, alerts, admin data |
| **Azure Blob Storage** | Storing worker face images and environment photos |
| **Azure Notification Hubs** | Push notifications and SMS alerts to workers/admins |
| **Azure AD B2C** | Authentication for workers and admins |
| **Azure Monitor** | System health, API latency, error tracking |

---

## 2. Detailed Data Flow

### 2.1 Worker Check-In Flow (Step-by-Step)

1. Worker opens the app and authenticates via **Azure AD B2C** (email/OTP)
2. Worker captures **face image** using device camera
3. Worker captures **environment image** (work area, surroundings)
4. Frontend uploads both images to **Azure Blob Storage** via a pre-signed SAS URL from the backend
5. Frontend sends `POST /api/checkin` request with Blob URLs, worker ID, and timestamp
6. Backend receives the request and calls **Azure AI Vision** for both images simultaneously
7. Azure AI Vision returns: PPE compliance (helmet, mask), fatigue indicators, environment hazards (dust, fire, poor lighting)
8. Backend sends Vision results + historical data to the **Azure ML model** endpoint
9. Azure ML returns a **Health Risk Score (0–100)** and Risk Category (Low / Medium / High / Critical)
10. Backend generates **personalized safety recommendations** based on score and detected hazards
11. Results are saved to **Azure Cosmos DB** under the worker's health history
12. If Risk Level >= High → **Azure Notification Hubs** sends immediate push/SMS alert to worker and admin
13. Backend returns the full response (score, category, recommendations, alerts) to the frontend
14. Frontend displays the **real-time risk dashboard** to the worker

### 2.2 Admin Dashboard Flow

1. Admin logs in via Azure AD B2C with admin role claim
2. Dashboard loads aggregate data: all worker check-ins, risk distributions, alerts
3. Admin can view individual worker health timelines from Cosmos DB
4. Predictive analytics (optional) surface workers trending toward high risk
5. Admin can manually trigger alerts or flag workers for medical review

### 2.3 Data Flow Diagram

```
Worker App
    │
    ├─[1] Authenticate ──────────────────────► Azure AD B2C
    │
    ├─[2] Upload Images ─────────────────────► Azure Blob Storage
    │                                               │
    │                                          (SAS URL stored)
    │
    ├─[3] POST /api/checkin ─────────────────► Backend (App Service)
    │                                               │
    │                               ┌──────────────┼──────────────┐
    │                               ▼              ▼              ▼
    │                          Azure AI       Azure ML        Cosmos DB
    │                           Vision         Studio         (history)
    │                               │              │
    │                               └──────┬───────┘
    │                                      │
    │                              Score + Risk Level
    │                                      │
    │         If HIGH/CRITICAL ────────────┼──────► Notification Hubs
    │                                      │                │
    │                                      │         Push + SMS Alert
    │                                      │
    ├─[4] Response ◄───────────────────────┘
    │     (score, riskLevel, recommendations, alertSent)
    │
    └─[5] Display Dashboard to Worker
```

---

## 3. Frontend Folder Structure

**Tech Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS

```
safeguard-frontend/
│
├── app/                                  ← Next.js App Router root
│   │
│   ├── (auth)/                           ← Auth route group (no layout)
│   │   ├── login/
│   │   │   └── page.tsx                  ← Login page (Azure AD B2C)
│   │   └── register/
│   │       └── page.tsx                  ← Worker self-registration
│   │
│   ├── (worker)/                         ← Worker route group
│   │   ├── layout.tsx                    ← Worker layout (navbar, bottom nav)
│   │   ├── checkin/
│   │   │   └── page.tsx                  ← 📷 Camera capture + check-in flow
│   │   ├── dashboard/
│   │   │   └── page.tsx                  ← 📊 Personal health dashboard
│   │   └── history/
│   │       └── page.tsx                  ← 📅 Health history timeline
│   │
│   ├── (admin)/                          ← Admin route group
│   │   ├── layout.tsx                    ← Admin layout (sidebar)
│   │   ├── dashboard/
│   │   │   └── page.tsx                  ← 🖥️ Analytics overview
│   │   ├── workers/
│   │   │   ├── page.tsx                  ← 👷 All workers list + search
│   │   │   └── [id]/
│   │   │       └── page.tsx              ← Individual worker detail view
│   │   └── alerts/
│   │       └── page.tsx                  ← 🚨 Alert management center
│   │
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts              ← NextAuth.js + Azure AD B2C handler
│   │
│   ├── globals.css                       ← Global styles + Tailwind imports
│   ├── layout.tsx                        ← Root layout (fonts, providers)
│   └── page.tsx                          ← Landing page / smart redirect
│
├── components/
│   │
│   ├── ui/                               ← Reusable base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx                     ← Risk badge (🟢 Low / 🟡 Med / 🔴 High)
│   │   ├── Modal.tsx
│   │   └── Spinner.tsx
│   │
│   ├── camera/                           ← Image capture components
│   │   ├── CameraCapture.tsx             ← Face image capture (MediaStream API)
│   │   └── EnvironmentCapture.tsx        ← Environment photo capture
│   │
│   ├── dashboard/                        ← Worker dashboard widgets
│   │   ├── RiskScoreGauge.tsx            ← Animated 0–100 gauge chart
│   │   ├── HealthTimeline.tsx            ← Historical risk trend (Recharts)
│   │   ├── SafetyRecommendations.tsx     ← AI-generated tips list
│   │   ├── AlertBanner.tsx               ← Real-time alert display
│   │   └── WorkerCard.tsx                ← Worker status summary card
│   │
│   ├── admin/                            ← Admin-only components
│   │   ├── WorkerTable.tsx               ← Sortable/filterable worker list
│   │   ├── RiskDistributionChart.tsx     ← Pie/bar chart of risk levels
│   │   ├── AlertFeed.tsx                 ← Live alert stream (SSE/WebSocket)
│   │   └── HeatmapWidget.tsx             ← Site risk heatmap
│   │
│   └── layout/
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
│
├── lib/
│   ├── api.ts                            ← Typed Axios/fetch API client
│   ├── auth.ts                           ← Auth helper functions
│   ├── utils.ts                          ← Shared utility functions
│   └── constants.ts                      ← Risk thresholds, config values
│
├── hooks/
│   ├── useCheckin.ts                     ← Check-in mutation + loading state
│   ├── useWorkerHistory.ts               ← Fetch + cache health history
│   └── useRealTimeAlerts.ts              ← WebSocket / SSE alert subscription
│
├── types/
│   ├── worker.ts                         ← Worker type definitions
│   ├── health.ts                         ← Health record types
│   └── api.ts                            ← API request/response types
│
├── public/
│   ├── icons/                            ← PWA icons (192x192, 512x512)
│   └── images/                           ← Static assets
│
├── middleware.ts                         ← Route protection (auth guard)
├── next.config.ts                        ← Next.js config (env, rewrites)
├── tailwind.config.ts                    ← Tailwind theme + custom colors
└── package.json
```

---

## 4. Backend Folder Structure

**Tech Stack:** Node.js · Express · TypeScript · Azure SDKs

```
safeguard-backend/
│
├── src/
│   │
│   ├── app.ts                            ← Express app setup (middleware, routes)
│   ├── server.ts                         ← HTTP server entry point
│   │
│   ├── routes/                           ← Route definitions (thin layer)
│   │   ├── auth.routes.ts                ← /auth/* endpoints
│   │   ├── checkin.routes.ts             ← /checkin endpoints
│   │   ├── worker.routes.ts              ← /workers/* CRUD
│   │   ├── admin.routes.ts               ← /admin/* analytics
│   │   └── health.routes.ts              ← /health/* records
│   │
│   ├── controllers/                      ← Request handlers
│   │   ├── auth.controller.ts
│   │   ├── checkin.controller.ts         ← Orchestrates the full check-in flow
│   │   ├── worker.controller.ts
│   │   ├── admin.controller.ts
│   │   └── health.controller.ts
│   │
│   ├── services/                         ← Business logic + external integrations
│   │   ├── vision.service.ts             ← Azure AI Vision API calls
│   │   ├── ml.service.ts                 ← Azure ML managed endpoint calls
│   │   ├── blob.service.ts               ← Azure Blob Storage (upload + SAS URL gen)
│   │   ├── cosmos.service.ts             ← Cosmos DB data access layer
│   │   ├── notification.service.ts       ← Azure Notification Hubs integration
│   │   ├── risk.service.ts               ← Health score calculation logic
│   │   └── recommendation.service.ts    ← AI safety recommendation generator
│   │
│   ├── middleware/                       ← Express middleware chain
│   │   ├── auth.middleware.ts            ← JWT validation (Azure AD B2C JWKS)
│   │   ├── role.middleware.ts            ← RBAC enforcement (worker / admin)
│   │   ├── upload.middleware.ts          ← Multer config for image uploads
│   │   ├── rateLimit.middleware.ts       ← Rate limiting per IP / per user
│   │   └── error.middleware.ts           ← Global error handler
│   │
│   ├── models/                           ← TypeScript interfaces / data shapes
│   │   ├── worker.model.ts
│   │   ├── healthRecord.model.ts
│   │   └── alert.model.ts
│   │
│   ├── utils/
│   │   ├── logger.ts                     ← Winston structured logger
│   │   ├── asyncHandler.ts               ← Async error wrapper
│   │   └── validators.ts                 ← Zod input validation schemas
│   │
│   └── config/
│       ├── azure.config.ts               ← Azure SDK clients (Vision, Blob, Cosmos...)
│       ├── cors.config.ts                ← CORS allowed origins
│       └── env.ts                        ← Zod-validated environment variables
│
├── tests/
│   ├── unit/
│   │   ├── risk.service.test.ts
│   │   └── vision.service.test.ts
│   └── integration/
│       └── checkin.test.ts
│
├── .env.example                          ← Environment variable template
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## 5. API Design

### 5.1 Base URL

| Environment | URL |
|-------------|-----|
| Production | `https://api.safeguardai.azure.com/v1` |
| Development | `http://localhost:5000/v1` |

> All endpoints require `Authorization: Bearer <jwt>` unless noted otherwise.

---

### 5.2 Authentication Endpoints

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `POST` | `/auth/login` | Login via Azure AD B2C token | JWT access token |
| `POST` | `/auth/refresh` | Refresh expired token | New access token |
| `POST` | `/auth/logout` | Invalidate session | `204 No Content` |
| `GET` | `/auth/me` | Get current user profile | User object |

---

### 5.3 Check-In Endpoint

**Request**
```http
POST /checkin
Authorization: Bearer <jwt>
Content-Type: application/json
```

```json
{
  "workerId": "worker_001",
  "faceImageUrl": "https://storageaccount.blob.core.windows.net/.../face_001.jpg",
  "envImageUrl": "https://storageaccount.blob.core.windows.net/.../env_001.jpg",
  "location": { "lat": 28.6139, "lng": 77.2090 },
  "shiftType": "morning"
}
```

**Response `200 OK`**
```json
{
  "checkinId": "chk_abc123",
  "workerId": "worker_001",
  "timestamp": "2025-03-15T08:30:00Z",
  "healthScore": 72,
  "riskLevel": "MEDIUM",
  "riskFactors": [
    { "type": "NO_MASK", "severity": "HIGH", "confidence": 0.94 },
    { "type": "DUST_LEVEL_ELEVATED", "severity": "MEDIUM", "confidence": 0.81 }
  ],
  "recommendations": [
    "Wear N95 mask immediately — dust level is elevated",
    "Report to safety officer before entering work zone",
    "Hydrate every 30 minutes during shift"
  ],
  "alertSent": true,
  "nextCheckinDue": "2025-03-15T14:30:00Z"
}
```

---

### 5.4 Blob Storage SAS URL Endpoint

**Request**
```http
GET /upload/sas?type=face&workerId=worker_001
Authorization: Bearer <jwt>
```

**Response**
```json
{
  "sasUrl": "https://storageacct.blob.core.windows.net/images/worker_001/face_ts.jpg?sv=...&sig=...",
  "expiresAt": "2025-03-15T09:00:00Z",
  "blobUrl": "https://storageacct.blob.core.windows.net/images/worker_001/face_ts.jpg"
}
```

---

### 5.5 Worker Endpoints

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/workers` | List all workers (admin only) | Array of workers + risk status |
| `GET` | `/workers/:id` | Get worker profile | Worker object |
| `GET` | `/workers/:id/history` | Health history (paginated) | Array of health records |
| `GET` | `/workers/:id/stats` | Aggregate stats (avg score, alert count) | Stats object |
| `PUT` | `/workers/:id` | Update worker profile | Updated worker |
| `POST` | `/workers` | Register new worker (admin) | New worker object |

---

### 5.6 Admin Endpoints

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/admin/dashboard` | System stats: total workers, avg risk, today's alerts | Dashboard summary |
| `GET` | `/admin/alerts` | All alerts with filters (date, severity, worker) | Paginated alerts |
| `POST` | `/admin/alerts/:id/resolve` | Mark alert as resolved | Updated alert |
| `GET` | `/admin/analytics/risk-trend` | Risk score trends over time | Time-series data |
| `GET` | `/admin/analytics/compliance` | PPE compliance rates by department | Compliance data |

---

## 6. Database Schema (Cosmos DB)

### 6.1 Database Strategy

- **API:** Azure Cosmos DB Core (NoSQL)
- **Consistency:** Session level
- **Throughput:** Serverless for MVP → Provisioned RU for production
- **Principle:** Separate containers per entity, partition keys for even data distribution

---

### 6.2 Container: `workers`

**Partition Key:** `/organizationId`

```json
{
  "id": "worker_001",
  "workerId": "worker_001",
  "organizationId": "org_minecorp",
  "name": "Rajesh Kumar",
  "email": "rajesh@minecorp.com",
  "phone": "+91-9876543210",
  "role": "worker",
  "department": "Drilling",
  "site": "Mine Site A",
  "shift": "morning",
  "azureUserId": "aad_b2c_user_id",
  "deviceTokens": ["fcm_token_1"],
  "healthProfile": {
    "baselineScore": 85,
    "conditions": ["asthma"],
    "lastCheckin": "2025-03-15T08:30:00Z",
    "currentRiskLevel": "MEDIUM",
    "streakDaysLowRisk": 12
  },
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-03-15T08:30:00Z"
}
```

---

### 6.3 Container: `healthRecords`

**Partition Key:** `/workerId`

```json
{
  "id": "chk_abc123",
  "workerId": "worker_001",
  "organizationId": "org_minecorp",
  "timestamp": "2025-03-15T08:30:00Z",
  "shiftType": "morning",
  "location": { "lat": 28.6139, "lng": 77.2090, "site": "Mine Site A" },
  "images": {
    "faceUrl": "https://blob.../face_001.jpg",
    "envUrl": "https://blob.../env_001.jpg"
  },
  "visionAnalysis": {
    "face": {
      "hasMask": false,
      "hasHelmet": true,
      "fatigueScore": 0.3,
      "estimatedAge": 34,
      "confidence": 0.92
    },
    "environment": {
      "dustLevel": "HIGH",
      "lightingLevel": "LOW",
      "detectedHazards": ["dust_cloud", "wet_floor"],
      "safetyEquipmentVisible": true
    }
  },
  "mlAnalysis": {
    "healthScore": 72,
    "riskLevel": "MEDIUM",
    "riskFactors": [
      { "type": "NO_MASK", "severity": "HIGH", "weight": 0.35 }
    ],
    "modelVersion": "v2.1.0"
  },
  "recommendations": [
    "Wear N95 mask — dust level critical",
    "Hydrate every 30 minutes"
  ],
  "alertSent": true,
  "alertId": "alert_xyz",
  "ttl": 63072000
}
```

---

### 6.4 Container: `alerts`

**Partition Key:** `/organizationId`

```json
{
  "id": "alert_xyz",
  "organizationId": "org_minecorp",
  "workerId": "worker_001",
  "checkinId": "chk_abc123",
  "timestamp": "2025-03-15T08:30:05Z",
  "severity": "HIGH",
  "type": "HEALTH_RISK",
  "message": "Worker Rajesh Kumar: No mask detected in high-dust environment",
  "riskFactors": ["NO_MASK", "DUST_LEVEL_ELEVATED"],
  "status": "OPEN",
  "resolvedBy": null,
  "resolvedAt": null,
  "notificationsSent": ["push", "sms"],
  "site": "Mine Site A"
}
```

---

### 6.5 Container: `organizations`

**Partition Key:** `/id`

```json
{
  "id": "org_minecorp",
  "name": "Mine Corp Ltd",
  "industry": "mining",
  "sites": ["Mine Site A", "Mine Site B"],
  "adminIds": ["admin_001"],
  "subscription": "enterprise",
  "settings": {
    "alertThreshold": 60,
    "mandatoryPPE": ["helmet", "mask"],
    "checkinFrequencyHours": 6,
    "notificationChannels": ["push", "sms"]
  }
}
```

---

## 7. AI/ML Model Design

### 7.1 Two-Layer AI Architecture

```
┌────────────────────────────────────────────────────────────┐
│  LAYER 1 — Azure AI Vision (Pre-built)                     │
│                                                            │
│  Face Image ──►  • Helmet / mask detection                 │
│                  • Fatigue indicators (eyes, posture)      │
│                  • Estimated age                           │
│                                                            │
│  Env Image  ──►  • Dust / smoke level                      │
│                  • Lighting quality                        │
│                  • Hazard detection (fire, water, debris)  │
└─────────────────────────────┬──────────────────────────────┘
                              │
                    (structured feature vector)
                              │
┌─────────────────────────────▼──────────────────────────────┐
│  LAYER 2 — Azure Machine Learning (Custom XGBoost Model)   │
│                                                            │
│  Inputs: Vision results + worker profile + history         │
│  Output: Health Risk Score (0–100) + Risk Category         │
│          + Top contributing risk factors                   │
└────────────────────────────────────────────────────────────┘
```

---

### 7.2 ML Model Inputs (Feature Vector)

| Feature | Type | Source |
|---------|------|--------|
| `hasMask` | Boolean (0/1) | Azure AI Vision |
| `hasHelmet` | Boolean (0/1) | Azure AI Vision |
| `fatigueScore` | Float [0–1] | Vision facial analysis |
| `dustLevel` | Integer [0–3] | 0=None, 1=Low, 2=High, 3=Extreme |
| `lightingLevel` | Integer [0–2] | 0=Poor, 1=OK, 2=Good |
| `hazardCount` | Integer | Count of detected hazards |
| `workerAge` | Integer | Worker profile |
| `shiftHoursWorked` | Float | Shift start time calculation |
| `previousRiskScore` | Float [0–100] | Last check-in record |
| `avgScoreLast7Days` | Float [0–100] | 7-day rolling average |
| `industry` | Categorical (OHE) | mining / construction / factory |
| `hasChronicCondition` | Boolean | Health profile |
| `dayOfWeek` | Integer [0–6] | Fatigue pattern feature |
| `shiftType` | Categorical | morning / afternoon / night |

---

### 7.3 ML Model Output

```json
{
  "healthScore": 72,
  "riskLevel": "MEDIUM",
  "topRiskFactors": [
    { "feature": "hasMask", "impact": -18.5, "direction": "negative" },
    { "feature": "dustLevel", "impact": -9.2, "direction": "negative" }
  ],
  "confidence": 0.89
}
```

**Risk Level Mapping:**

| Score Range | Risk Level | Action |
|-------------|------------|--------|
| 80 – 100 | 🟢 LOW | No alert, log to dashboard |
| 60 – 79 | 🟡 MEDIUM | In-app notification |
| 40 – 59 | 🟠 HIGH | Push alert to worker + supervisor |
| 0 – 39 | 🔴 CRITICAL | Immediate push + SMS + site restriction flag |

---

### 7.4 Training Data Strategy

| Phase | Action |
|-------|--------|
| **Phase 1 (MVP)** | Rule-based scoring — no training data needed |
| **Phase 2** | Collect real check-in data with occupational health expert labels |
| **Phase 3** | Train XGBoost on Azure ML Studio (80/10/10 split) |
| **Phase 4** | Deploy to Azure ML Managed Online Endpoint, A/B test vs rules |

---

### 7.5 Rule-Based Scoring Engine (MVP Fallback)

```
Base Score: 100

Deductions:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PPE Violations:
  No mask detected            → -30 pts  (if mask is mandatory)
  No helmet detected          → -25 pts  (if helmet is mandatory)

Environment Hazards:
  Dust level: EXTREME         → -20 pts
  Dust level: HIGH            → -10 pts
  Poor lighting               → -10 pts
  Any detected hazard         →  -5 pts each (max -20)

Worker Condition:
  Fatigue score > 0.7         → -15 pts
  Fatigue score > 0.5         →  -8 pts
  Night shift                 →  -5 pts
  Previous score < 60         →  -5 pts
  Has chronic condition       →  -5 pts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Final Score = max(0, 100 − Total Deductions)
```

---

## 8. Azure Integration Details

### 8.1 Azure AI Vision

```
Service:   Azure AI Vision (Cognitive Services)
API:       Computer Vision REST API v3.2

Face Image:
  POST https://{endpoint}/vision/v3.2/analyze
       ?visualFeatures=Categories,Objects,Faces,Adult
       &details=Faces

Environment Image:
  POST https://{endpoint}/vision/v3.2/analyze
       ?visualFeatures=Categories,Objects,Tags,Description

Optional: Train Custom Vision classifier for PPE:
  Classes: helmet_on | helmet_off | mask_on | mask_off | vest_on | vest_off
  Minimum: ~200 labeled images per class
```

---

### 8.2 Azure Blob Storage

**Container Structure:**
```
safeguard-images/
├── face/{organizationId}/{workerId}/{timestamp}.jpg
└── environment/{organizationId}/{siteId}/{timestamp}.jpg
```

**Key Decisions:**
- Generate SAS URLs server-side with **5-minute expiry** — client uploads directly, no image data passes through backend
- Lifecycle policy: Cool tier after 30 days → Archive after 1 year

```javascript
const { BlobServiceClient, generateBlobSASQueryParameters } = require('@azure/storage-blob');
```

---

### 8.3 Azure Cosmos DB

```
Account Type:  Core (NoSQL) API
Consistency:   Session
Throughput:    Serverless (MVP) → Provisioned RU (production)
Multi-region:  Enable geo-redundancy for production
```

```javascript
const { CosmosClient } = require('@azure/cosmos');
const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY
});
```

---

### 8.4 Azure Machine Learning

```
Workspace:  Azure ML Studio
Compute:    Azure ML Managed Online Endpoint (real-time inference)
Registry:   Register model versions for rollback
```

```http
POST https://{endpoint}.{region}.inference.ml.azure.com/score
Authorization: Bearer {api_key}
Content-Type: application/json

{
  "input_data": {
    "columns": ["hasMask", "hasHelmet", "fatigueScore", "..."],
    "data": [[0, 1, 0.3, 2, 1, 1, 34, 4.5, 78, 80, 0, 1, 2, 0]]
  }
}
```

---

### 8.5 Azure Notification Hubs

```
Hub:       safeguard-notifications
Platforms: FCM (Android) | APNs (iOS) | WNS (Windows)
```

```javascript
const { NotificationHubsClient, createFcmLegacyNotification } = require('@azure/notification-hubs');

const client = new NotificationHubsClient(connectionString, hubName);

await client.sendNotification(
  createFcmLegacyNotification({
    notification: {
      title: "⚠️ Safety Alert",
      body: "High risk detected — No mask in dusty environment"
    },
    data: { workerId, alertId, riskLevel }
  }),
  { tagExpression: `workerId:${workerId}` }
);
```

---

### 8.6 Azure AD B2C

```
Tenant:        safeguardai.b2clogin.com
User Flow:     B2C_1_signupsignin (combined sign-up/sign-in)
Custom Claims: organizationId, role (worker | admin | supervisor)

Frontend:  @azure/msal-react
Backend:   jwks-rsa + azure-ad-verify-token

Scopes:
  api://safeguard-api/checkin.write
  api://safeguard-api/admin.read
```

---

## 9. Authentication Strategy

### 9.1 Authentication Flow

```
1.  User clicks Login on Next.js frontend
         │
         ▼
2.  MSAL redirects to Azure AD B2C sign-in page
         │
         ▼
3.  User authenticates (email + password or OTP)
         │
         ▼
4.  B2C returns: ID Token + Access Token (JWT)
         │
         ▼
5.  Frontend stores tokens in httpOnly cookies (NextAuth.js)
         │
         ▼
6.  Every API request: Authorization: Bearer <access_token>
         │
         ▼
7.  Backend validates token via Azure AD B2C JWKS endpoint
         │
         ▼
8.  Middleware extracts claims: userId, organizationId, role
         │
         ▼
9.  Role middleware gates admin-only endpoints
```

---

### 9.2 Role-Based Access Control (RBAC)

| Role | Permissions | Scope |
|------|-------------|-------|
| **Worker** | `POST /checkin`, `GET /workers/:own_id`, view own history | Own data only |
| **Supervisor** | All worker endpoints + `GET /admin/dashboard` (own site) | Site-scoped |
| **Admin** | All endpoints including `POST /workers`, full analytics | Full organization |

---

## 10. Notification System Design

### 10.1 Alert Triggers

| Risk Level | Action | SLA |
|------------|--------|-----|
| 🔴 **CRITICAL** (`< 40`) | Push + SMS to worker + admin + supervisor. Set site access restriction flag. | < 5 seconds |
| 🟠 **HIGH** (`40–59`) | Push to worker + email to supervisor | < 10 seconds |
| 🟡 **MEDIUM** (`60–79`) | In-app notification to worker only | < 30 seconds |
| 🟢 **LOW** (`80–100`) | No alert — log to dashboard | N/A |

---

### 10.2 Notification Channels

| Channel | Technology | Use Case |
|---------|-----------|----------|
| **Push** | FCM via Azure Notification Hubs | Real-time worker/admin alerts |
| **SMS** | Azure Communication Services | Workers without smartphones |
| **Email** | Azure Communication Services | Daily admin summaries |
| **In-App** | WebSocket / Server-Sent Events | Live dashboard updates |
| **Daily Report** | Azure Function (scheduled) | 6 PM admin digest email |

---

### 10.3 Notification Deduplication

Use a **30-minute cooldown** per worker per alert type:
1. On alert trigger, check Cosmos DB for `lastAlertTime` of same type for this worker
2. If `lastAlertTime` < 30 minutes ago → suppress push notification
3. Always log to database regardless of cooldown

---

## 11. Deployment Strategy (CI/CD)

### 11.1 Azure DevOps Pipeline

```
┌──────────┐     ┌──────────┐     ┌────────────┐     ┌──────────────┐
│  Build   │────►│   Test   │────►│  Staging   │────►│  Production  │
└──────────┘     └──────────┘     └────────────┘     └──────────────┘

Build Stage:
  ✓ npm install + npm run build (Next.js)
  ✓ Docker build for backend (Node.js)
  ✓ Push image to Azure Container Registry (ACR)

Test Stage:
  ✓ Unit tests (Jest)
  ✓ Integration tests
  ✓ OWASP security scan
  ✓ Lighthouse performance check

Staging Stage:
  ✓ Deploy to staging slot of Azure App Service
  ✓ Run smoke tests against staging URL
  ✓ Manual approval gate before production

Production Stage:
  ✓ Swap staging slot → production (zero downtime)
  ✓ Tag Docker image with git SHA
  ✓ Notify Slack channel on success/failure
```

---

### 11.2 Infrastructure as Code (Bicep)

```
Azure Resources provisioned by Bicep:
  ├── Azure App Service Plan + App Service      ← backend
  ├── Azure Static Web Apps                     ← Next.js frontend
  ├── Azure Cosmos DB account + containers      ← database
  ├── Azure Blob Storage account                ← images
  ├── Azure Cognitive Services (AI Vision)      ← image analysis
  ├── Azure ML Workspace                        ← custom model
  ├── Azure Notification Hubs namespace         ← alerts
  ├── Azure AD B2C tenant config                ← auth
  ├── Azure Key Vault                           ← secrets
  ├── Azure Application Insights               ← monitoring
  └── Azure CDN / Front Door                   ← global delivery + WAF
```

---

### 11.3 Environment Strategy

| Environment | Infrastructure | Purpose |
|-------------|---------------|---------|
| **Development** | Local Docker Compose + Azure Dev subscription | Feature development |
| **Staging** | Full Azure (same as prod, smaller scale) | Pre-production validation |
| **Production** | Azure App Service + Static Web Apps + all services | Live traffic |

---

## 12. Scalability Considerations

### 12.1 Horizontal Scaling

- **Azure App Service:** Auto-scale on CPU > 70% or request queue depth > 100
- **Azure Functions:** Serverless, event-driven scale for notifications and async tasks
- **Cosmos DB:** Serverless mode for variable loads → Provisioned RU for enterprise workloads
- **Azure Front Door + CDN:** Cache static assets globally, route to nearest region

---

### 12.2 Async Processing Pattern

```
Fast path (< 8 seconds):
  POST /checkin  ──────────────────────────────►  Full result response

Slow path (> 8 seconds — AI takes longer):
  POST /checkin  ──────────────────────────────►  { jobId, status: "processing" }
  GET  /checkin/{jobId}  (poll every 2s)  ──────►  { status: "complete", result: {...} }
```

This prevents API gateway timeouts when AI services are under load.

---

### 12.3 Caching Strategy

| Cache | TTL | Data |
|-------|-----|------|
| Azure Redis — admin dashboard aggregates | 5 minutes | Risk stats, alert counts |
| Azure Redis — worker profiles | 1 hour | Worker data |
| Cosmos DB indexes | — | `workerId`, `organizationId`, `timestamp`, `riskLevel` |
| Azure CDN | 24 hours | Static images, frontend assets |

---

### 12.4 Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Check-in API response | < 8 seconds | P95, includes AI processing |
| Dashboard load time | < 2 seconds | Served from cache |
| CRITICAL alert delivery | < 5 seconds | Via Notification Hubs |
| Concurrent workers | 10,000+ | With App Service autoscaling |
| Data retention | 2 years | Cosmos DB TTL + Archive tier |

---

## 13. Security Best Practices

### 13.1 Data Security

| Practice | Implementation |
|----------|---------------|
| **Secrets Management** | Azure Key Vault — no secrets in code or .env files |
| **Encryption at rest** | Cosmos DB + Blob Storage (AES-256) |
| **Encryption in transit** | HTTPS only, TLS 1.3 |
| **Image Privacy** | Face images deleted after 90 days. Never used for surveillance. |
| **GDPR Compliance** | Workers can request full data export or deletion via admin API |

---

### 13.2 API Security

| Layer | Implementation |
|-------|---------------|
| **Authentication** | JWT validated against Azure AD B2C JWKS on every request |
| **Rate Limiting** | 10 check-ins/worker/hour · 100 req/min/IP |
| **Input Validation** | All request bodies validated with Zod schemas |
| **CORS** | Strict origin allowlist — only the frontend domain |
| **WAF** | OWASP Top 10 protection via Azure WAF on Front Door |
| **Dependency Scanning** | GitHub Dependabot + Snyk in CI pipeline |

---

### 13.3 Image Security

- SAS URLs expire in **5 minutes** — cannot be reused after upload window
- Workers can only access their own images (Cosmos DB partition key enforcement)
- Azure AI Vision Content Moderator validates images before analysis

---

## 14. MVP Plan

### 14.1 MVP Goal

> Build a working end-to-end demo: **worker check-in → AI image analysis → health score → safety recommendations → alert**. Everything else is polish.

---

### Week 1 — Foundation

- [ ] Provision Azure resources: Blob Storage, Cosmos DB, AI Vision, App Service, Static Web Apps
- [ ] Backend: `POST /upload/sas`, `POST /checkin`, `GET /workers/:id/history`
- [ ] Integrate Azure AI Vision (detect mask, helmet, dust level)
- [ ] Build rule-based health scoring engine (no ML training needed)
- [ ] Set up Azure AD B2C authentication + worker login flow

---

### Week 2 — Frontend & Core Features

- [ ] Worker check-in UI (camera capture → upload → result display)
- [ ] Health score gauge (animated 0–100) + risk level badge
- [ ] Safety recommendations list component
- [ ] Admin dashboard (worker list + risk overview)
- [ ] Wire up Notification Hubs for HIGH/CRITICAL push alerts

---

### Week 3 — Polish & Demo

- [ ] Historical health timeline chart (Recharts.js)
- [ ] Mobile-responsive UI + smooth animations
- [ ] CI/CD pipeline: GitHub Actions → Azure
- [ ] Demo video + Imagine Cup presentation
- [ ] (Optional) Swap rule-based engine for Azure ML endpoint

---

### 14.2 MVP Tech Decisions

| Feature | MVP Approach | Future Plan |
|---------|-------------|-------------|
| **ML Model** | Rule-based scoring (no training data needed) | Azure ML XGBoost model |
| **Auth** | Azure AD B2C, skip complex RBAC initially | Full RBAC in v2 |
| **Notifications** | In-app display first, push alerts in week 3 | Push can be simulated in demo |
| **Database** | Cosmos DB serverless — no capacity planning | Provisioned RU for production |
| **Mobile** | PWA via Next.js — no native app | React Native in v2 |

---

## 15. Future Improvements

### 15.1 AI/ML Enhancements

- **Predictive Risk:** LSTM model trained on health history to predict high-risk days before they happen
- **Real-time Video:** Azure Video Analyzer for continuous shift monitoring
- **Voice Check-in:** Azure Cognitive Speech + Hindi language model for workers without smartphones
- **Emotion/Stress:** Azure Face API emotion recognition to detect distress
- **Anomaly Detection:** Azure Cognitive Services Anomaly Detector on health score time series

---

### 15.2 IoT Integration

- **Azure IoT Hub:** Connect dust sensors, temperature sensors, gas detectors at work sites
- **Continuous Monitoring:** Sensor readings feed into risk model between check-ins
- **Geofencing:** Azure Maps to track worker location vs. high-hazard zones
- **Wearables:** Smartwatch integration for real-time heart rate and SpO2 data

---

### 15.3 Platform Expansion

- **React Native:** Native iOS/Android app for better camera access and offline capability
- **Offline Mode:** Service Worker + IndexedDB for check-in without connectivity, sync on reconnect
- **Multi-language:** Hindi, Bengali, Tamil, Telugu (Azure Cognitive Translator)
- **Compliance Reports:** Auto-generated OSHA / India labor law PDF reports
- **Insurance API:** Anonymized risk data sharing with insurers for premium optimization

---

### 15.4 Business Features

- **Multi-tenant SaaS:** Organization onboarding, billing, subscription tiers
- **Plugin Marketplace:** Industry-specific hazard models (mining vs. construction vs. chemical)
- **Microsoft Teams:** Post alerts directly to Teams channels
- **Power BI:** Connect Cosmos DB to Power BI for executive-level reporting

---

## Appendix: Azure Resource Names & Cost Estimate

### A. Recommended Azure Naming Convention

| Resource | Pattern | Production Example |
|----------|---------|-------------------|
| Resource Group | `rg-safeguard-{env}` | `rg-safeguard-prod` |
| App Service | `app-safeguard-api-{env}` | `app-safeguard-api-prod` |
| Static Web App | `stapp-safeguard-{env}` | `stapp-safeguard-prod` |
| Cosmos DB | `cosmos-safeguard-{env}` | `cosmos-safeguard-prod` |
| Blob Storage | `stsafeguard{env}` | `stsafeguardprod` |
| AI Vision | `cog-vision-safeguard-{env}` | `cog-vision-safeguard-prod` |
| ML Workspace | `mlw-safeguard-{env}` | `mlw-safeguard-prod` |
| Key Vault | `kv-safeguard-{env}` | `kv-safeguard-prod` |
| Notification Hub | `ntfns-safeguard-{env}` | `ntfns-safeguard-prod` |

---

### B. Estimated Monthly Cost (MVP / Small Scale)

| Service | Tier | Cost |
|---------|------|------|
| Azure App Service | B1 Basic | ~$13/month |
| Azure Cosmos DB | Serverless (low volume) | ~$5–15/month |
| Azure Blob Storage | LRS, 50 GB | ~$1/month |
| Azure AI Vision | Free tier (1,000 transactions/month) | $0 |
| Azure ML | Managed endpoint (minimal) | ~$30/month |
| Azure AD B2C | Free tier (50,000 MAU) | $0 |
| Azure Notification Hubs | Free tier (1M pushes) | $0 |
| Azure Static Web Apps | Free tier | $0 |
| **Total** | | **~$50–70/month** |

> 💡 **Imagine Cup participants** receive **$100–$150 in Azure credits** via Azure for Students or the Imagine Cup Azure grant — more than enough to run the full MVP.

---

*SafeGuard AI — Protecting Workers, Powered by Azure*
*Microsoft Imagine Cup 2025*