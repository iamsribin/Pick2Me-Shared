export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface LocationCoordinates {
    address:string;
    latitude: number;
    longitude: number;
}

export interface OnlineDriverDetails {
  driverId: string;
  driverNumber: string;
  name: string;
  cancelledRides: number;
  rating: number;
  vehicleModel: string;
  driverPhoto: string;
  vehicleNumber: string;
  stripeId?: string;
  stripeLinkUrl?: string;
  sessionStart?: number; 
  lastSeen?: number;
}

export interface NearbyDriver {
  driverId: string;
  distanceKm: number;
  latitude: number;
  longitude: number;
}

export interface OnlineDriverPreview {
  driverId: string;
  lat: number;
  lng: number;
  vehicleModel?: string;
   distanceKm: number;
  name?: string;
}

export type IRole = "User"|"Admin"| "Driver"