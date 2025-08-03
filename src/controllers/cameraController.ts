import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { CameraEventData } from "../types";
import * as xml2js from "xml2js";
import axios from "axios";

// Функция для отправки уведомления о vehicle detection
async function notifyVehicleDetection(
  eventData: CameraEventData
): Promise<void> {
  const targetUrl = process.env.GATE_LINK;

  if (!targetUrl) {
    logger.warn("GATE_LINK not configured, skipping vehicle notification");
    return;
  }

  try {
    const response = await axios.get(targetUrl);

    logger.info({
      message: "Vehicle detection notification sent successfully",
      targetUrl,
      responseStatus: response.status,
      eventType: eventData.eventType,
    });
  } catch (error) {
    logger.error({
      message: "Failed to send vehicle detection notification",
      error: error instanceof Error ? error.message : "Unknown error",
      targetUrl: targetUrl,
      eventType: eventData.eventType,
    });
  }
}

async function parseCameraData(rawData: any): Promise<CameraEventData | null> {
  let parsedData: CameraEventData | null = null;

  try {
    if (typeof rawData === "string") {
      // Если данные пришли как строка XML
      const parser = new xml2js.Parser({
        explicitArray: false,
        valueProcessors: [
          xml2js.processors.parseNumbers,
          xml2js.processors.parseBooleans,
        ],
      });
      const result = await parser.parseStringPromise(rawData);

      // Извлекаем данные из EventNotificationAlert
      parsedData = result.EventNotificationAlert as CameraEventData;
    } else if (typeof rawData === "object") {
      // Если данные уже в JSON формате
      parsedData = rawData as CameraEventData;
    } else {
      throw new Error("Unsupported data format");
    }
  } catch (parseError) {
    logger.error({
      message: "Failed to parse XML data",
      error:
        parseError instanceof Error
          ? parseError.message
          : "Unknown parse error",
      receivedData: rawData,
    });
  } finally {
    return parsedData;
  }
}

export const processCameraData = async (
  req: Request,
  res: Response
): Promise<void> => {
  const rawData = req.body;

  if (!rawData) {
    res.status(400).json({ error: "No data provided" });
    return;
  }

  // Парсим XML в JSON
  let parsedData = await parseCameraData(rawData);

  if (!parsedData) {
    res.status(400).json({ error: "Invalid XML format" });
    return;
  }

  // Логируем полученные данные
  logger.info({
    message: "Camera data received and parsed",
    ...parsedData,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Проверяем на vehicle detection при linedetection
  const detectionRegions = parsedData.DetectionRegionList?.DetectionRegionEntry;

  const isLineDetection = parsedData.eventType === "linedetection";

  if (isLineDetection && detectionRegions) {
    const regions = Array.isArray(detectionRegions)
      ? detectionRegions
      : [detectionRegions];

    const vehicleRegion = regions.find((region) => {
      return region.detectionTarget === "vehicle";
    });

    if (!vehicleRegion) {
      return;
    }

    logger.info({
      message: "Vehicle detected in linedetection event, sending notification",
      regionID: vehicleRegion?.regionID,
      eventType: parsedData.eventType,
      detectionTarget: vehicleRegion.detectionTarget,
    });

    // Отправляем уведомление о vehicle detection
    await notifyVehicleDetection(parsedData);
  }

  // Отправляем успешный ответ с распарсенными данными
  res.status(200).json({ success: true });
};
