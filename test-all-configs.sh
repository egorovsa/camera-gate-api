#!/bin/bash

echo "🧪 Testing all detection configurations"
echo "======================================"

# Тест 1: Только vehicle (по умолчанию)
echo "1️⃣ Testing vehicle-only detection:"
curl -X POST http://localhost:17777/api/camera/data \
  -F "linedetection=@test-data.xml" \
  -s | jq '.data.eventType, .data.eventState' 2>/dev/null || echo "Response received"
echo -e "\n"

# Тест 2: Только human
echo "2️⃣ Testing human-only detection:"
curl -X POST http://localhost:17777/api/camera/data \
  -F "linedetection=@test-data-human.xml" \
  -s | jq '.data.eventType, .data.eventState' 2>/dev/null || echo "Response received"
echo -e "\n"

# Тест 3: Mixed detection
echo "3️⃣ Testing mixed detection:"
curl -X POST http://localhost:17777/api/camera/data \
  -F "linedetection=@test-data-mixed.xml" \
  -s | jq '.data.eventType, .data.eventState' 2>/dev/null || echo "Response received"
echo -e "\n"

echo "✅ All tests completed!"
echo "Check logs for detailed detection information." 