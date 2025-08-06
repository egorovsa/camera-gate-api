# Camera API

## 📋 Требования

- Node.js 18+ (для локальной разработки)
- Docker и Docker Compose (рекомендуемый способ)

## 🛠 Установка и запуск

### Локальная разработка



```bash
# 1. Клонируй репозиторий:
git clone https://github.com/egorovsa/camera-gate-api.git
cd camera-api

# 2. Установите зависимости:
npm install

# 3. Создайте файл .env на основе env.example и измени параметры в .env:
cp env.example .env

# 4. Запустите в режиме разработки:

npm run dev
```

### С Docker Compose



```bash
#1. Создайте .env файл:
cp env.example .env

# 2. Запустите приложение:
docker-compose up -d camera-api

# 3. Просмотр логов:
docker-compose logs -f camera-api

# 4. Остановка:
docker-compose down

# 5. При добавлении новых зависимостей:
docker-compose --profile install run --rm package-install
docker-compose restart camera-api

# 6. При изменении переменных в .env (требует полного перезапуска):
docker-compose up -d camera-api

**Примечание:** Переменные окружения передаются напрямую через docker-compose.yml, .env файл не монтируется в контейнер.
```

## 📡 API Endpoints

### Health Check

- `GET /api/health` - Базовая проверка здоровья
- `GET /api/health/detailed` - Детальная информация о системе

### Camera API

- `GET /api/camera/status` - Статус камеры
- `POST /api/camera/data` - Прием XML данных с камеры

## 📤 Прием данных с камеры

### Vehicle Detection

При обнаружении **linedetection** события с разрешенными типами обнаружения API автоматически отправляет HTTP POST запрос на внешний сервис:

**Условия для отправки уведомления:**

- `eventType` = "linedetection"
- `detectionTarget` соответствует одному из значений в `DETECTION_TARGETS`

**Примеры конфигурации:**

```bash
# Только vehicle (по умолчанию)
DETECTION_TARGETS=vehicle

# Vehicle и human
DETECTION_TARGETS=vehicle,human

# Vehicle, human и animal
DETECTION_TARGETS=vehicle,human,animal

# Только human
DETECTION_TARGETS=human
```

**Endpoint:** `{GATE_LINK}`

**Payload:**

```json
{
  "timestamp": "2025-08-02T20:36:24.995Z",
  "eventType": "linedetection",
  "eventState": "active", 
  "eventDescription": "linedetection alarm",
  "detectionData": { /* полные данные события */ }
}
```

### Пример с curl:

```bash
# Тестовый XML запрос
curl -X POST http://localhost:17777/api/camera/data \
  -F "linedetection=@test-data.xml" \
  -F "lineCrossImage=@test-data.xml" \
  -F "extraField=some extra data" \
  -F "anotherFile=@test-data.xml" 
```

## ⚙️ Конфигурация

Основные переменные окружения:

- `PORT` - Порт сервера (по умолчанию: 17777)
- `NODE_ENV` - Окружение (development/production)
- `CORS_ORIGIN` - Разрешенные источники для CORS
- `GATE_LINK` - URL для отправки уведомлений о vehicle detection
- `MIN_INTERVAL_MS` - Интервал между уведомлениями в миллисекундах (по умолчанию: 12000)
- `DETECTION_TARGETS` - Типы обнаружения для открытия ворот (через запятую, по умолчанию: vehicle)
- `LOG_MAX_SIZE` - Максимальный размер лог файла в байтах (по умолчанию: 104857600 = 100MB)

## 📝 Логирование

Логи сохраняются в файл `logs/app.log` и выводятся в консоль.
- `LOG_LEVEL` - Уровень логирования (по умолчанию: info)
- `LOG_FILE` - Путь к файлу логов (по умолчанию: ./logs/app.log)
- `LOG_MAX_SIZE` - Максимальный размер лог файла в байтах (по умолчанию: 104857600 = 100MB)

## 🔒 Безопасность

- Helmet для защиты заголовков
- CORS настройки
- Валидация XML данных
- Логирование всех запросов
- HTTP уведомления при vehicle detection

## 📄 Лицензия

MIT License
