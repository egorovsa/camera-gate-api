#!/bin/bash

# Тест multipart/form-data для камеры
curl -X POST http://localhost:17777/api/camera/data \
  -F "linedetection=@test-data.xml" 