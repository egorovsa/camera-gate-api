import { logger } from "../utils/logger";

class NotificationService {
  private lastNotificationTime: Date | null = null;
  private readonly MIN_INTERVAL_MS = parseInt(process.env.MIN_INTERVAL_MS || "60000", 10); // 1 минута по умолчанию

  constructor() {
    logger.info({
      message: "NotificationService initialized",
      minIntervalMs: this.MIN_INTERVAL_MS,
    });
  }

  /**
   * Проверяет, можно ли отправить уведомление
   * @returns true если можно отправить, false если нужно пропустить
   */
  private canSendNotification(): boolean {
    if (!this.lastNotificationTime) {
      return true;
    }

    const currentTime = Date.now();
    const timeSinceLastNotification = currentTime - this.lastNotificationTime.getTime();
    
    return timeSinceLastNotification >= this.MIN_INTERVAL_MS;
  }

  /**
   * Обновляет время последнего уведомления
   */
  private updateLastNotificationTime(): void {
    this.lastNotificationTime = new Date();
  }

  /**
   * Отправляет уведомление о vehicle detection с ограничением частоты
   * @param eventData - данные события камеры
   * @param notificationFunction - функция для отправки уведомления
   */
  async sendVehicleDetectionNotification<T>(
    eventData: T,
    notificationFunction: (data: T) => Promise<void>
  ): Promise<void> {
    const currentTime = Date.now();
    
    if (!this.canSendNotification()) {
      logger.info({
        message: "Vehicle detection notification skipped - too frequent",
        lastNotificationTime: this.lastNotificationTime?.toISOString(),
        timeSinceLastNotification: this.lastNotificationTime 
          ? currentTime - this.lastNotificationTime.getTime()
          : 0,
        currentRequestTime: new Date(currentTime).toISOString(),
      });
      return;
    }

    try {
      await notificationFunction(eventData);
      this.updateLastNotificationTime();
      
      logger.info({
        message: "Vehicle detection notification sent successfully",
        notificationTime: this.lastNotificationTime?.toISOString(),
        requestTime: new Date(currentTime).toISOString(),
      });
    } catch (error) {
      logger.error({
        message: "Failed to send vehicle detection notification",
        error: error instanceof Error ? error.message : "Unknown error",
        requestTime: new Date(currentTime).toISOString(),
      });
      // Не обновляем время последнего уведомления при ошибке,
      // чтобы можно было повторить попытку
    }
  }
}

// Экспортируем singleton экземпляр
export const notificationService = new NotificationService(); 