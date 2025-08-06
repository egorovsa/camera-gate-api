#!/bin/bash

echo "🧪 Testing vehicle-only detection (DETECTION_TARGETS=vehicle)"

# Тест с vehicle
echo "Testing vehicle detection:"
curl -X POST http://localhost:17777/api/camera/data \
  -F "linedetection=@test-data.xml"

echo -e "\n---\n"

# Тест с human (должен быть проигнорирован)
echo "Testing human detection (should be ignored):"
curl -X POST http://localhost:17777/api/camera/data \
  -F "linedetection=@test-data-human.xml" 