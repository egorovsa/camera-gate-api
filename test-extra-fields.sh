#!/bin/bash

# Тест с дополнительными полями
curl -X POST http://localhost:17777/api/camera/data \
  -F "linedetection=@test-data.xml" \
  -F "lineCrossImage=@test-data.xml" \
  -F "extraField=some extra data" \
  -F "anotherFile=@test-data.xml" 