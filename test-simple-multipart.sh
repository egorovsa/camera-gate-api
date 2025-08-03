#!/bin/bash

# Простой тест multipart с curl
curl -X POST http://localhost:17777/api/camera/data \
  -F "linedetection=@test-data.xml" \
  -F "lineCrossImage=@test-data.xml" 