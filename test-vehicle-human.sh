#!/bin/bash

echo "🧪 Testing vehicle + human detection (DETECTION_TARGETS=vehicle,human)"

# Устанавливаем переменную окружения для этого теста
export DETECTION_TARGETS=vehicle,human

# Тест с vehicle
echo "Testing vehicle detection:"
curl -X POST http://localhost:17777/api/camera/data \
  -F "linedetection=@test-data.xml"

echo -e "\n---\n"

# Тест с human (должен сработать)
echo "Testing human detection (should trigger):"
curl -X POST http://localhost:17777/api/camera/data \
  -F "linedetection=@test-data-human.xml"

echo -e "\n---\n"

# Тест с mixed (оба должны сработать)
echo "Testing mixed detection (both should trigger):"
curl -X POST http://localhost:17777/api/camera/data \
  -F "linedetection=@test-data-mixed.xml" 