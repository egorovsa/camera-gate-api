import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { CameraEventData } from "../types";
import * as xml2js from "xml2js";
import axios from "axios";
import { notificationService } from "../services/notificationService";

// Функция для отправки уведомления о vehicle detection
async function notifyVehicleDetection(
  eventData: CameraEventData
): Promise<void> {
  const gateLink = process.env.GATE_LINK;

  if (!gateLink) {
    logger.warn("❌ GATE_LINK not configured, skipping vehicle notification");
    return;
  }

  try {
    const response = await axios.get(gateLink);

    logger.info({
      message: "✅ Vehicle detection notification sent successfully",
      targetUrl: gateLink,
      responseStatus: response.status,
      eventType: eventData.eventType,
    });
  } catch (error) {
    logger.error({
      message: "❌ Failed to send vehicle detection notification",
      error: error instanceof Error ? error.message : "Unknown error",
      targetUrl: gateLink,
      eventType: eventData.eventType,
    });
  }
}

async function checkAndHandleVehicleDetection(
  parsedData: CameraEventData
): Promise<void> {
  // Получаем список типов обнаружения из конфигурации
  const detectionTargetsConfig = process.env.DETECTION_TARGETS || "vehicle";
  const allowedTargets = detectionTargetsConfig
    .split(",")
    .map((target) => target.trim().toLowerCase())
    .filter((target) => target.length > 0);

  // Проверяем на разрешенные типы обнаружения при linedetection
  const detectionRegions = parsedData.DetectionRegionList?.DetectionRegionEntry;
  const isLineDetection = parsedData.eventType === "linedetection";

  if (isLineDetection && detectionRegions) {
    const regions = Array.isArray(detectionRegions)
      ? detectionRegions
      : [detectionRegions];

    // Ищем регионы с разрешенными типами обнаружения
    const matchingRegions = regions.filter((region) => {
      return allowedTargets.includes(region.detectionTarget.toLowerCase());
    });

    if (matchingRegions.length > 0) {
      const detectedTargets = matchingRegions.map(
        (region) => region.detectionTarget
      );

      logger.info({
        message: `🚗 ${detectedTargets.join(
          ", "
        )} detected in linedetection event`,
        regionIDs: matchingRegions.map((region) => region.regionID),
        detectionTargets: detectedTargets,
        allowedTargets: allowedTargets,
      });

      // Отправляем уведомление о detection с ограничением частоты
      await notificationService.sendVehicleDetectionNotification(
        parsedData,
        notifyVehicleDetection
      );

      return;
    }

    const otherTargets = regions.map((region) => region.detectionTarget);

    if (otherTargets.length > 0) {
      logger.info({
        message: "❓ Other targets detected in linedetection event",
        targets: otherTargets.join(", "),
      });
    }
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
      message: "❌ Failed to parse XML data",
      error:
        parseError instanceof Error
          ? parseError.message
          : "Unknown parse error",
      receivedDataType: typeof rawData,
      receivedDataLength: rawData
        ? typeof rawData === "string"
          ? rawData.length
          : "object"
        : "null",
      receivedDataPreview:
        typeof rawData === "string"
          ? rawData.substring(0, 200) + "..."
          : "not a string",
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
    message: "🔵 Received camera data",
    ip: req.ip,
    userAgent: req.get("User-Agent"),
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
    logger.error({
      message: "❌ Camera data not parsed",
      ip: req.ip,
      xmlDataLength: xmlData ? xmlData.length : 0,
      xmlDataPreview: xmlData ? xmlData.substring(0, 200) + "..." : "null",
    });
    res.status(400).json({ error: "Invalid XML format" });
    return;
  }

  await checkAndHandleVehicleDetection(parsedData);

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
