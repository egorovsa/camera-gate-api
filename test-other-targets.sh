#!/bin/bash

# Тест с дополнительными полями
curl -X POST http://localhost:17777/api/camera/data \
  -F "linedetection=@test-other-targets.xml" \
  -F "lineCrossImage=@test-other-targets.xml" \
  -F "extraField=some extra data" \
  -F "anotherFile=@test-other-targets.xml" 