# Camera API

API для приема данных с камеры, построенный на Node.js с TypeScript и Docker.

## 📋 Требования

- Node.js 18+
- Docker и Docker Compose
- npm или yarn

## 🛠 Установка и запуск

### Локальная разработка

1. Клонируй репозиторий:

```bash
git clone <repository-url>
cd camera-api
```

2. Установите зависимости:

```bash
npm install
```

3. Создайте файл .env на основе env.example:

```bash
cp env.example .env
```

4. Запустите в режиме разработки:

```bash
npm run dev
```

### С Docker

1. Соберите образ:

```bash
docker build -t camera-api .
```

2. Запустите контейнер:

```bash
docker run -p 17777:17777 camera-api
```

3. Для запуска в фоновом режиме:

```bash
docker run -d -p 17777:17777 camera-api
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

При обнаружении **linedetection** события с `<detectionTarget>vehicle</detectionTarget>` API автоматически отправляет HTTP POST запрос на внешний сервис:

**Условия для отправки уведомления:**

- `eventType` = "linedetection"
- `detectionTarget` = "vehicle"

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
# Простой XML запрос
curl -X POST \
  http://localhost:17777/api/camera/data \
  -H 'Content-Type: text/xml' \
  -d '<EventNotificationAlert>
    <activePostCount>1</activePostCount>
    <eventType>linedetection</eventType>
    <eventState>active</eventState>
    <eventDescription>linedetection alarm</eventDescription>
    <DetectionRegionList>
      <DetectionRegionEntry>
        <regionID>2</regionID>
        <sensitivityLevel>50</sensitivityLevel>
        <RegionCoordinatesList>
          <RegionCoordinates>
            <positionX>917</positionX>
            <positionY>34</positionY>
          </RegionCoordinates>
          <RegionCoordinates>
            <positionX>238</positionX>
            <positionY>795</positionY>
          </RegionCoordinates>
        </RegionCoordinatesList>
        <detectionTarget>vehicle</detectionTarget>
        <TargetRect>
          <X>0.297</X>
          <Y>0.640</Y>
          <width>0.045</width>
          <height>0.211</height>
        </TargetRect>
      </DetectionRegionEntry>
    </DetectionRegionList>
    <channelName></channelName>
    <detectionPictureTransType>binary</detectionPictureTransType>
    <detectionPicturesNumber>1</detectionPicturesNumber>
    <isDataRetransmission>false</isDataRetransmission>
  </EventNotificationAlert>'

# Multipart/form-data запрос (как отправляет камера)
curl -X POST \
  http://localhost:17777/api/camera/data \
  -F "linedetection=@camera-data.xml"
```

### Пример с JavaScript:

```javascript
const xmlData = `<EventNotificationAlert>
  <activePostCount>1</activePostCount>
  <eventType>linedetection</eventType>
  <eventState>active</eventState>
  <eventDescription>linedetection alarm</eventDescription>
  <DetectionRegionList>
    <DetectionRegionEntry>
      <regionID>2</regionID>
      <sensitivityLevel>50</sensitivityLevel>
      <RegionCoordinatesList>
        <RegionCoordinates>
          <positionX>917</positionX>
          <positionY>34</positionY>
        </RegionCoordinates>
        <RegionCoordinates>
          <positionX>238</positionX>
          <positionY>795</positionY>
        </RegionCoordinates>
      </RegionCoordinatesList>
      <detectionTarget>vehicle</detectionTarget>
      <TargetRect>
        <X>0.297</X>
        <Y>0.640</Y>
        <width>0.045</width>
        <height>0.211</height>
      </TargetRect>
    </DetectionRegionEntry>
  </DetectionRegionList>
  <channelName></channelName>
  <detectionPictureTransType>binary</detectionPictureTransType>
  <detectionPicturesNumber>1</detectionPicturesNumber>
  <isDataRetransmission>false</isDataRetransmission>
</EventNotificationAlert>`;

fetch('http://localhost:17777/api/camera/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'text/xml'
  },
  body: xmlData
})
.then(response => response.json())
.then(data => console.log(data));
```

## ⚙️ Конфигурация

Основные переменные окружения:

- `PORT` - Порт сервера (по умолчанию: 17777)
- `NODE_ENV` - Окружение (development/production)
- `CORS_ORIGIN` - Разрешенные источники для CORS
- `GATE_LINK` - URL для отправки уведомлений о vehicle detection

## 📁 Структура проекта

```
camera-api/
├── src/
│   ├── controllers/     # Контроллеры
│   ├── middleware/      # Middleware
│   ├── routes/          # Маршруты
│   ├── types/           # TypeScript типы
│   ├── utils/           # Утилиты
│   └── index.ts         # Главный файл
├── uploads/             # Загруженные файлы
├── logs/                # Логи
├── Dockerfile           # Docker образ
├── docker-compose.yml   # Docker Compose
└── package.json         # Зависимости
```

## 🧪 Линтинг

```bash
# Линтинг
npm run lint

# Исправление ошибок линтера
npm run lint:fix
```

## 🐳 Docker команды

```bash
# Сборка образа
docker build -t camera-api .

# Запуск контейнера
docker run -p 17777:17777 camera-api

# Просмотр логов
docker logs <container_id>

# Остановка контейнера
docker stop <container_id>

# Полезные команды:
# Посмотреть все запущенные контейнеры
docker ps

# Посмотреть все контейнеры (включая остановленные)
docker ps -a

# Получить container_id по имени образа
docker ps --filter ancestor=camera-api
```

## 📝 Логирование

Логи сохраняются в файл `logs/app.log` и выводятся в консоль.
Уровни логирования настраиваются через переменную `LOG_LEVEL`.

## 🔒 Безопасность

- Helmet для защиты заголовков
- CORS настройки
- Валидация XML данных
- Логирование всех запросов
- HTTP уведомления при vehicle detection

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📄 Лицензия

MIT License
