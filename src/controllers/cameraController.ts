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
    const payload = {
      timestamp: new Date().toISOString(),
      eventType: eventData.eventType,
      eventState: eventData.eventState,
      eventDescription: eventData.eventDescription,
      detectionData: eventData,
    };

    const response = await axios.post(targetUrl, payload, {
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
      },
    });

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

export const processCameraData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const rawData = req.body;

    if (!rawData) {
      res.status(400).json({ error: "No data provided" });
      return;
    }

    // Парсим XML в JSON
    let parsedData: CameraEventData;

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

      res.status(400).json({
        error: "Invalid XML format",
        message: "Failed to parse camera data",
      });
      return;
    }

    // Проверяем на vehicle detection при linedetection
    const detectionRegions =
      parsedData.DetectionRegionList?.DetectionRegionEntry;
    if (parsedData.eventType === "linedetection" && detectionRegions) {
      const regions = Array.isArray(detectionRegions)
        ? detectionRegions
        : [detectionRegions];

      for (const region of regions) {
        if (region.detectionTarget === "vehicle") {
          logger.info({
            message:
              "Vehicle detected in linedetection event, sending notification",
            regionID: region.regionID,
            eventType: parsedData.eventType,
            detectionTarget: region.detectionTarget,
          });

          // Отправляем уведомление о vehicle detection
          await notifyVehicleDetection(parsedData);
          break; // Отправляем только одно уведомление
        }
      }
    }

    // Логируем полученные данные
    logger.info({
      message: "Camera data received and parsed",
      eventType: parsedData.eventType,
      eventState: parsedData.eventState,
      eventDescription: parsedData.eventDescription,
      detectionRegions: Array.isArray(
        parsedData.DetectionRegionList?.DetectionRegionEntry
      )
        ? parsedData.DetectionRegionList.DetectionRegionEntry.length
        : parsedData.DetectionRegionList?.DetectionRegionEntry
        ? 1
        : 0,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    // Отправляем успешный ответ с распарсенными данными
    res.status(200).json({
      success: true,
      message: "Camera data processed successfully",
      data: {
        receivedAt: new Date().toISOString(),
        parsedData: parsedData,
        summary: {
          eventType: parsedData.eventType,
          eventState: parsedData.eventState,
          detectionRegionsCount: Array.isArray(
            parsedData.DetectionRegionList?.DetectionRegionEntry
          )
            ? parsedData.DetectionRegionList.DetectionRegionEntry.length
            : parsedData.DetectionRegionList?.DetectionRegionEntry
            ? 1
            : 0,
          activePostCount: parsedData.activePostCount,
        },
      },
    });
  } catch (error) {
    logger.error({
      message: "Error processing camera data",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    res.status(500).json({
      error: "Failed to process camera data",
      message: "Internal server error",
    });
  }
};
