import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { CameraEventData } from "../types";
import * as xml2js from "xml2js";
import axios from "axios";

// Функция для отправки уведомления о vehicle detection
async function notifyVehicleDetection(
  eventData: CameraEventData
): Promise<void> {
  const gateLink = process.env.GATE_LINK;

  if (!gateLink) {
    logger.warn("GATE_LINK not configured, skipping vehicle notification");
    return;
  }

  try {
    const response = await axios.get(gateLink);

    logger.info({
      message: "Vehicle detection notification sent successfully",
      targetUrl: gateLink,
      responseStatus: response.status,
      eventType: eventData.eventType,
    });
  } catch (error) {
    logger.error({
      message: "Failed to send vehicle detection notification",
      error: error instanceof Error ? error.message : "Unknown error",
      targetUrl: gateLink,
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
  let xmlData = req.body.linedetection;

  // Логируем входящие данные для отладки
  logger.info({
    message: "Received camera data",
    contentType: req.get("Content-Type"),
    bodyKeys: Object.keys(req.body),
    hasLinedetection: !!req.body.linedetection,
    bodyType: typeof req.body,
    bodyContent: JSON.stringify(req.body).substring(0, 500),
    xmlData,
  });

  // Если данных нет в body, пробуем получить из files (multipart)
  if (!xmlData && req.files) {
    const files = req.files as any[];
    const linedetectionFile = files.find(
      (file) => file.fieldname === "linedetection"
    );
    if (linedetectionFile) {
      xmlData = linedetectionFile.buffer.toString("utf8");
    }
  }

  // Если данных нет в body, пробуем получить из raw body
  if (!xmlData && req.body) {
    // Ищем XML в теле запроса
    const bodyStr =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const xmlMatch = bodyStr.match(
      /<EventNotificationAlert[\s\S]*?<\/EventNotificationAlert>/
    );
    if (xmlMatch) {
      xmlData = xmlMatch[0];
    }
  }

  if (!xmlData) {
    res.status(400).json({ error: "No linedetection data provided" });
    return;
  }

  // Парсим XML в JSON
  let parsedData = await parseCameraData(xmlData);

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

    if (vehicleRegion) {
      logger.info({
        message:
          "Vehicle detected in linedetection event, sending notification",
        regionID: vehicleRegion.regionID,
        eventType: parsedData.eventType,
        detectionTarget: vehicleRegion.detectionTarget,
      });

      // Отправляем уведомление о vehicle detection
      await notifyVehicleDetection(parsedData);
    }
  }

  // Отправляем успешный ответ
  res.status(200).json({
    success: true,
    message: "Camera data processed successfully",
    data: {
      receivedAt: new Date().toISOString(),
      eventType: parsedData.eventType,
      eventState: parsedData.eventState,
    },
  });
};
