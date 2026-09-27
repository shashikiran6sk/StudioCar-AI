export interface SubjectBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface VehicleAlpha {
  pixels: Uint8Array;
  width: number;
  height: number;
  subject: SubjectBox | null;
}

export interface ShadowLayer {
  opacity: number;
  blurRatio: number;
  horizontalSpread: number;
  verticalCompression: number;
  verticalOffset: number;
  groundBlend: number;
}
