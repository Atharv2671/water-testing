# Taumata Arowai GIS Platform - Frontend Integration Plan (Phase C & D)

This document provides the roadmap for connecting the existing React 19 frontend to the new FastAPI backend, and safely transitioning client-side data into the backend database.

> **CRITICAL RULE**: In accordance with the file protection rules, **no existing frontend files will be modified without separate explicit approval**. This document outlines the proposed changes for review.

---

## 1. Component to Backend API Mapping

| Frontend Component | Current Client-Side Behavior | Proposed Backend Integration | Backend Endpoint |
|---|---|---|---|
| **`Header.tsx`** | Filters in-memory array `VERIFIED_PARCELS` and `AUCKLAND_ZONE_SCHEMES` | Debounced query calling backend address search; falls back to offline cache if network fails | `GET /api/v1/addresses/search?q={query}` |
| **`GisMap.tsx`** | Evaluates client-side Haversine heuristic when clicking the map | Optional coordinate resolution query on map click to retrieve authoritative zone & buffer tier | `POST /api/v1/water-supply/resolve` |
| **`InspectionDrawer.tsx`** | Displays selected parcel/pipe telemetry | Consumes structured `WaterSupplyResolutionResponse` and lineage | `GET /api/v1/addresses/{id}/water-supply` |
| **`CitizenComplaintModal.tsx`** | Stores complaint objects in local React state array `complaintsList` | Submits complaint to backend and loads registered incidents from database | `POST /api/v1/incidents` & `GET /api/v1/incidents` |
| **`LoginModal.tsx`** | Validates against client dictionary `DEV_TEST_ACCOUNTS` | Submits credentials to backend; receives signed JWT access token and user profile | `POST /api/v1/auth/login` |

---

## 2. Reusable Frontend API Client Proposal

A clean, typed client will be proposed under a new file `src/services/apiClient.ts` to keep existing components decoupled and clean:

```typescript
// Proposed: src/services/apiClient.ts (New file, does not overwrite existing files)
import { API_CONFIG } from '../config/apiConfig';
import { ParcelFeature, AuthUser, WaterIncidentComplaint } from '../types/gis';

const BASE_URL = API_CONFIG.baseUrl;

export async function searchAddressesApi(query: string): Promise<ParcelFeature[]> {
  try {
    const res = await fetch(`${BASE_URL}/v1/addresses/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

export async function submitIncidentApi(complaint: WaterIncidentComplaint): Promise<any> {
  const res = await fetch(`${BASE_URL}/v1/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(complaint),
  });
  return res.json();
}
```

---

## 3. Data Decoupling & Frontend Cleanup Plan

Once the API client is connected and verified:

1. **Step 1: Shift Source of Truth**:
   - The standalone database (`backend/app/db/data/water_services.db`) serves all 43 supply zones, schemes, parcels, and physical network assets.
2. **Step 2: Remove Hardcoded Frontend Data**:
   - Cleanly remove large objects from `src/data/nzData.ts` and `src/data/watercareOpenData.ts`.
   - Keep only essential UI type helpers and constants (e.g. `NZ_DEFAULT_CENTER`, `NZ_BOOKMARKS`, `latLngToNZTM2000`).
3. **Step 3: Lightweight Frontend Bundle**:
   - Reduces the public bundle size significantly.
   - Eliminates sensitive asset telemetry from browser bundles.
