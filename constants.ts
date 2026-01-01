
import { EntityState, Coordinate } from './types';

export const PLANNED_ROUTE: Coordinate[] = [
  { lat: 45.523062, lng: -122.676482 },
  { lat: 45.524500, lng: -122.680000 },
  { lat: 45.526000, lng: -122.682000 },
  { lat: 45.528000, lng: -122.685000 }
];

export const DEFAULT_ENTITIES: EntityState[] = [
  { 
    id: '1', type: 'Cycle', name: 'Alice', initial: 'A', color: '#EF4444', 
    location: PLANNED_ROUTE[0], heading: 0, speed: 0, battery: 95, lastSeen: Date.now(), 
    isSOS: false, isHost: true, history: [], hasSignedWaiver: true, privacyRadius: 200,
    telemetrySource: 'ANT+', ecoStats: { carbonSavedKg: 12.5, tokensEarned: 120, treesEquivalent: 2 },
    insurance: { safetyScore: 98, currentPremium: 12.00, dynamicDiscount: 15 },
    bikeSpecs: { type: 'Road', brand: 'Specialized S-Works', year: 2023 },
    recentStats: { totalKm: 1420, avgSpeed: 31.2, elevationGain: 12500 }
  },
  { 
    id: 'V1', type: 'SupportCar', name: 'Team Van 1', initial: 'V', color: '#3B82F6', 
    location: { lat: 45.522062, lng: -122.675482 }, heading: 0, speed: 0, battery: 80, lastSeen: Date.now(), 
    isSOS: false, isHost: false, history: [], hasSignedWaiver: true, privacyRadius: 0,
    telemetrySource: 'OBD-II', ecoStats: { carbonSavedKg: 0, tokensEarned: 0, treesEquivalent: 0 },
    insurance: { safetyScore: 85, currentPremium: 85.00, dynamicDiscount: 5 },
    bikeSpecs: { type: 'Support', brand: 'Ford Transit', year: 2022 }
  },
  { 
    id: 'E1', type: 'EBike', name: 'Bob', initial: 'B', color: '#10B981', 
    location: { lat: 45.524062, lng: -122.677482 }, heading: 45, speed: 0, battery: 45, lastSeen: Date.now(), 
    isSOS: false, isHost: false, history: [], hasSignedWaiver: true, privacyRadius: 100,
    telemetrySource: 'BLE', ecoStats: { carbonSavedKg: 8.2, tokensEarned: 80, treesEquivalent: 1 },
    insurance: { safetyScore: 92, currentPremium: 15.50, dynamicDiscount: 10 },
    bikeSpecs: { type: 'Gravel', brand: 'Canyon Grizl:ON', year: 2024 },
    recentStats: { totalKm: 850, avgSpeed: 24.5, elevationGain: 6200 }
  }
];

export const MAP_TILES = {
  STANDARD: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
  SUNLIGHT: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
};

export const CARBON_FACTORS = {
  Cycle: 0.21, // kg saved per km vs avg car
  EBike: 0.18,
  SupportCar: 0.0
};
