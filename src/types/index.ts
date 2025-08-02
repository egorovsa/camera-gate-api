import { Request } from 'express';

// Типы для ответов API
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  details?: string[];
}

// Типы для ошибок
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Типы для XML данных с камеры
export interface RegionCoordinates {
  positionX: number;
  positionY: number;
}

export interface TargetRect {
  X: number;
  Y: number;
  width: number;
  height: number;
}

export interface DetectionRegionEntry {
  regionID: number;
  sensitivityLevel: number;
  RegionCoordinatesList: {
    RegionCoordinates: RegionCoordinates[];
  };
  detectionTarget: string;
  TargetRect: TargetRect;
}

export interface CameraEventData {
  activePostCount: number;
  eventType: string;
  eventState: string;
  eventDescription: string;
  DetectionRegionList: {
    DetectionRegionEntry: DetectionRegionEntry[];
  };
  channelName: string;
  detectionPictureTransType: string;
  detectionPicturesNumber: number;
  isDataRetransmission: boolean;
} 