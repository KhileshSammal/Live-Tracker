
export interface Coordinate {
  lat: number;
  lng: number;
}

export type VehicleType = 'Cycle' | 'EBike' | 'SupportCar' | 'Escort';
export type RidePace = 'Social' | 'Tempo' | 'Race' | 'Recovery';
export type UnitSystem = 'Metric' | 'Imperial';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja';

export interface EcoStats {
  carbonSavedKg: number;
  tokensEarned: number;
  treesEquivalent: number;
}

export interface InsuranceData {
  safetyScore: number; // 0-100
  currentPremium: number;
  dynamicDiscount: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface NavigationInstruction {
  text: string;
  distanceMeters: number;
  maneuver: 'turn-left' | 'turn-right' | 'straight' | 'u-turn' | 'arrival';
}

export interface RideStats {
  distanceMeters: number;
  startTime: number | null;
  durationSeconds: number;
  nextInstruction?: NavigationInstruction;
}

export interface EntityState {
  id: string;
  type: VehicleType;
  name: string;
  initial: string;
  color: string;
  location: Coordinate;
  heading: number;
  speed: number;
  battery: number;
  lastSeen: number;
  isSOS: boolean;
  isHost: boolean;
  history: Coordinate[];
  hasSignedWaiver: boolean;
  privacyRadius: number;
  telemetrySource: 'ANT+' | 'BLE' | 'OBD-II' | 'GPS';
  ecoStats: EcoStats;
  insurance: InsuranceData;
  bikeSpecs?: {
    type: string;
    brand: string;
    year: number;
  };
  recentStats?: {
    totalKm: number;
    avgSpeed: number;
    elevationGain: number;
  };
}

export interface SafetyAlert {
  id: string;
  type: 'proximity' | 'blindspot' | 'hazard' | 'crash';
  severity: 'low' | 'high' | 'critical';
  message: string;
  timestamp: number;
}

export interface Hazard {
  type: 'pothole' | 'oil' | 'debris' | 'construction' | 'accident';
  location: Coordinate;
}

export interface AppConfig {
  sunlightMode: boolean;
  heatmapMode: boolean;
  activeEntityId: string | null;
  currentUserEntityId: string;
  isRiding: boolean;
  followMeMode: boolean; 
  units: UnitSystem;
  currency: Currency;
  language: Language;
  subscriptionTier: 'Free' | 'Pro' | 'Enterprise';
  destination?: string;
  dynamicRoute?: Coordinate[];
  isVoiceNavEnabled: boolean;
}
