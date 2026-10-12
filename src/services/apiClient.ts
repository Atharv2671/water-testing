/**
 * Centralized API Client Service
 * Bridges React 19 Frontend with FastAPI Spatial Backend
 * Provides resilient network fetching with seamless offline fallbacks.
 */

import { API_CONFIG } from '../config/apiConfig';
import { 
  ParcelFeature, 
  AuthUser, 
  WaterIncidentComplaint, 
  UserRole 
} from '../types/gis';
import { VERIFIED_PARCELS } from '../data/nzData';

const BASE_URL = API_CONFIG.baseUrl.replace(/\/$/, '');
const TOKEN_STORAGE_KEY = 'nz_water_access_token';

// Helper to retrieve saved JWT token
export function getSavedAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

// Helper to save JWT token
export function saveAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (err) {
    console.warn('[API Client] Unable to persist auth token:', err);
  }
}

// Helper to clear saved token
export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {}
}

function getAuthHeaders(): HeadersInit {
  const token = getSavedAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Health probe: Check if FastAPI backend is responsive
 */
export async function checkBackendHealth(): Promise<{ online: boolean; version?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: data.status === 'healthy', version: data.version };
  } catch {
    return { online: false };
  }
}

/**
 * Search registered LINZ cadastral parcels
 * Calls GET /api/v1/addresses/search?q={query}
 * Falls back to local VERIFIED_PARCELS array if backend is unreachable
 */
export async function searchAddressesApi(query: string, limit = 10): Promise<ParcelFeature[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const res = await fetch(
      `${BASE_URL}/v1/addresses/search?q=${encodeURIComponent(q)}&limit=${limit}`,
      { headers: getAuthHeaders(), signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        return data.results;
      }
    }
  } catch (err) {
    // Graceful offline fallback
    console.debug('[API Client] Backend search unreachable, using local fallback:', err);
  }

  // Local fallback
  return VERIFIED_PARCELS.filter(p => 
    p.fullAddress.toLowerCase().includes(q.toLowerCase()) ||
    p.streetName.toLowerCase().includes(q.toLowerCase()) ||
    p.streetNumber.toLowerCase().includes(q.toLowerCase()) ||
    p.lotNumber.toLowerCase().includes(q.toLowerCase())
  ).slice(0, limit);
}

/**
 * Retrieve parcel feature by ID
 */
export async function getParcelByIdApi(parcelId: string): Promise<ParcelFeature | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/addresses/${encodeURIComponent(parcelId)}`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.debug('[API Client] Backend parcel lookup failed, using local:', err);
  }
  return VERIFIED_PARCELS.find(p => p.id === parcelId) || null;
}

/**
 * 7-Step Authoritative Water Supply Resolution
 * POST /api/v1/water-supply/resolve
 */
export async function resolveWaterSupplyApi(req: {
  address?: string;
  coordinates?: [number, number];
  address_id?: string;
}): Promise<any> {
  try {
    const res = await fetch(`${BASE_URL}/v1/water-supply/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[API Client] Water supply resolution query error:', err);
  }
  return null;
}

/**
 * Authenticate with backend: POST /api/v1/auth/login
 */
export async function loginApi(email: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      const token = data.accessToken;
      saveAuthToken(token);

      const user: AuthUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role as UserRole,
        title: data.user.title || 'User',
        organization: data.user.organization || 'Taumata Arowai',
        lastLogin: new Date().toISOString(),
      };
      return { user, token };
    }
  } catch (err) {
    console.warn('[API Client] Backend login request failed:', err);
  }
  return null;
}

/**
 * Fetch profile of currently authenticated user: GET /api/v1/auth/me
 */
export async function getCurrentUserApi(): Promise<AuthUser | null> {
  const token = getSavedAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${BASE_URL}/v1/auth/me`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      return await res.json();
    }
    // If token invalid/expired, clear it
    if (res.status === 401) {
      clearAuthToken();
    }
  } catch {
    // Network offline
  }
  return null;
}

/**
 * Submit water incident complaint: POST /api/v1/incidents
 */
export async function submitIncidentApi(complaint: Partial<WaterIncidentComplaint>): Promise<WaterIncidentComplaint | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/incidents`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(complaint),
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[API Client] Backend incident submission failed:', err);
  }
  return null;
}

/**
 * Fetch registered incidents: GET /api/v1/incidents
 */
export async function fetchIncidentsApi(statusFilter?: string): Promise<WaterIncidentComplaint[]> {
  try {
    const url = statusFilter 
      ? `${BASE_URL}/v1/incidents?status=${encodeURIComponent(statusFilter)}`
      : `${BASE_URL}/v1/incidents`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.debug('[API Client] Fetch incidents failed:', err);
  }
  return [];
}

/**
 * Update incident investigation status (Officials/Admins): PATCH /api/v1/incidents/{id}
 */
export async function updateIncidentStatusApi(
  incidentId: string, 
  updates: { status?: string; officerNotes?: string; boilWaterAdvised?: boolean }
): Promise<WaterIncidentComplaint | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/incidents/${encodeURIComponent(incidentId)}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[API Client] Incident status update failed:', err);
  }
  return null;
}
