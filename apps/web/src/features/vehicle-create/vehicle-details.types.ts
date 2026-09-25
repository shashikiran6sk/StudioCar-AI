export interface VehicleDetailsValues {
  brand: string;
  model: string;
  name: string;
  notes: string;
  stockId: string;
  variant: string;
  year: string;
}

export type VehicleDetailsField = keyof VehicleDetailsValues;
