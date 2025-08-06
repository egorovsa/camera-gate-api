import winston from "winston";
import path from "path";

const logLevel = process.env.LOG_LEVEL || "info";
const logFile = process.env.LOG_FILE || "./logs/app.log";

// Создаем директорию для логов если её нет
const logDir = path.dirname(logFile);

// Функция для безопасного логирования (фильтрует бинарные данные)
const safeStringify = (obj: any): string => {
  try {
    // Если это строка, проверяем на бинарные данные
    if (typeof obj === "string") {
      // Если строка содержит много непечатаемых символов, обрезаем её
      const printableChars = obj.replace(/[^\x20-\x7E]/g, "").length;
      const totalChars = obj.length;
      if (totalChars > 0 && printableChars / totalChars < 0.7) {
        return `[Binary data, length: ${obj.length}]`;
      }
      // Ограничиваем длину строки
      return obj.length > 1000 ? obj.substring(0, 1000) + "..." : obj;
    }

    // Для объектов используем JSON.stringify с ограничением
    return JSON.stringify(
      obj,
      (key, value) => {
        if (typeof value === "string" && value.length > 1000) {
          return value.substring(0, 1000) + "...";
        }
        return value;
      },
      2
    );
  } catch (error) {
    return "[Unable to stringify object]";
  }
};

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    // winston.format.json()
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      // Безопасно обрабатываем метаданные
      const safeMeta = Object.keys(meta).reduce((acc, key) => {
        acc[key] =
          typeof meta[key] === "string" ? safeStringify(meta[key]) : meta[key];
        return acc;
      }, {} as any);

      return JSON.stringify({
        timestamp,
        level,
        message,
        ...safeMeta,
      });
    })
  ),
  defaultMeta: { service: "camera-api" },
  transports: [
    new winston.transports.File({
      filename: logFile,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

export { logger };
