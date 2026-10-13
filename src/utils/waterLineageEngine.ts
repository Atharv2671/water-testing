import { ParcelFeature, PipeAsset, AucklandSupplyZone } from '../types/gis';
import { VERIFIED_PARCELS, VERIFIED_PIPES } from '../data/nzData';
import { ALL_AUCKLAND_ZONES } from './aucklandZonesData';

export interface AucklandZoneScheme {
  zoneId: string;
  zoneName: string;
  supplyId: string;
  supplyName: string;
  popRegist: number;
  popLowDe: number;
  popModDe: number;
  popHighDe: number;
  popMaori: number;
  urbanRural: 'Urban' | 'Rural';
  lat: number;
  lng: number;
  radiusKm: number;
  polygon: [number, number][];
  shapeLength?: number;
  shapeArea?: number;
  complianceStatus?: string;
  supplierName?: string;
  primaryDam?: {
    name: string;
    catchment: string;
    capacityML: number;
    distanceKm: number;
  };
  treatmentPlant?: {
    name: string;
    process: string;
    waterQualityGrade: string;
  };
  reservoir?: {
    name: string;
    capacityM3: number;
    headLevelM: number;
  };
  streetMainTemplate?: {
    nomDiaMm: number;
    material: string;
  };
  dataSource: string;
}

// Authoritative Auckland Supply Zones & Schemes (All 43 official zones from Auckland_Supply_Areas dataset)
export const AUCKLAND_ZONE_SCHEMES: AucklandZoneScheme[] = ALL_AUCKLAND_ZONES;

// Calculate Haversine distance in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find closest verified cadastral parcel within 50 meters
export function findNearestVerifiedParcel(lat: number, lng: number): ParcelFeature | null {
  let closest: ParcelFeature | null = null;
  let minDist = 0.05; // 50m max threshold

  for (const parcel of VERIFIED_PARCELS) {
    const dist = calculateDistanceKm(lat, lng, parcel.center[0], parcel.center[1]);
    if (dist < minDist) {
      minDist = dist;
      closest = parcel;
    }
  }

  return closest;
}

// Resolves which drinking water supply zone encloses or is closest to coordinate
export function resolveDrinkingWaterSupplyZone(lat: number, lng: number): AucklandZoneScheme | null {
  let closestScheme: AucklandZoneScheme | null = null;
  let minDistance = 999999;

  for (const scheme of AUCKLAND_ZONE_SCHEMES) {
    const dist = calculateDistanceKm(lat, lng, scheme.lat, scheme.lng);
    if (dist <= scheme.radiusKm && dist < minDistance) {
      minDistance = dist;
      closestScheme = scheme;
    }
  }

  // If outside all zone radii, return closest if within 15km, else null
  if (!closestScheme) {
    for (const scheme of AUCKLAND_ZONE_SCHEMES) {
      const dist = calculateDistanceKm(lat, lng, scheme.lat, scheme.lng);
      if (dist < minDistance && dist <= 15) {
        minDistance = dist;
        closestScheme = scheme;
      }
    }
  }

  return closestScheme;
}

// Resolves supply buffer tier (matching AklDizzy_Buffers50m to 1500m)
export function resolveSupplyBufferTier(distanceMeters: number): {
  tierName: string;
  bufferLayer: string;
  description: string;
  distanceMeters: number;
} {
  if (distanceMeters <= 50) {
    return {
      tierName: 'Within 50m (Immediate Reticulation Spine)',
      bufferLayer: 'AklDizzy_Buffers50m',
      description: 'Property directly abuts or sits within 50m of primary municipal reticulation.',
      distanceMeters,
    };
  }
  if (distanceMeters <= 100) {
    return {
      tierName: 'Within 100m (Secondary Buffer)',
      bufferLayer: 'AklDizzy_Buffers100m',
      description: 'Property is within 100m of local reticulated water scheme main.',
      distanceMeters,
    };
  }
  if (distanceMeters <= 200) {
    return {
      tierName: 'Within 200m (Catchment Buffer)',
      bufferLayer: 'AklDizzy_Buffers200m',
      description: 'Property is within 200m service envelope of potable water main.',
      distanceMeters,
    };
  }
  if (distanceMeters <= 500) {
    return {
      tierName: 'Within 500m (Collector Corridor)',
      bufferLayer: 'AklDizzy_Buffers500m',
      description: 'Property is within 500m of bulk distribution network.',
      distanceMeters,
    };
  }
  return {
    tierName: 'Within 1500m (Outer Service Envelope)',
    bufferLayer: 'AklDizzy_Buffers1500m',
    description: 'Property is within 1500m outer service envelope of municipal water supply scheme.',
    distanceMeters,
  };
}
