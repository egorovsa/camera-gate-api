#!/bin/bash

# Тест реального multipart/form-data запроса от камеры
curl -X POST http://localhost:17777/api/camera/data \
  -H "Content-Type: multipart/form-data; boundary=boundary" \
  -d '--boundary
Content-Disposition: form-data; name="linedetection"
Content-Type: application/xml
Content-Length: 1251

<EventNotificationAlert version="2.0" xmlns="http://www.hikvision.com/ver20/XMLSchema">
<ipAddress>10.17.1.105</ipAddress>
<portNo>7777</portNo>
<protocol>HTTP</protocol>
<macAddress>80:be:af:89:d9:ee</macAddress>
<channelID>1</channelID>
<dateTime>2025-08-03T15:51:35+03:00</dateTime>
<activePostCount>1</activePostCount>
<eventType>linedetection</eventType>
<eventState>active</eventState>
<eventDescription>linedetection alarm</eventDescription>
<DetectionRegionList>
<DetectionRegionEntry>
<regionID>1</regionID>
<sensitivityLevel>50</sensitivityLevel>
<RegionCoordinatesList>
<RegionCoordinates>
<positionX>876</positionX>
<positionY>487</positionY>
</RegionCoordinates>
<RegionCoordinates>
<positionX>403</positionX>
<positionY>152</positionY>
</RegionCoordinates>
</RegionCoordinatesList>
<detectionTarget>vehicle</detectionTarget>
<TargetRect>
<X>0.425</X>
<Y>0.144</Y>
<width>0.021</width>
<height>0.090</height>
</TargetRect>
</DetectionRegionEntry>
</DetectionRegionList>
<channelName>Camera 01</channelName>
<detectionPictureTransType>binary</detectionPictureTransType>
<detectionPicturesNumber>1</detectionPicturesNumber>
<isDataRetransmission>false</isDataRetransmission>
</EventNotificationAlert>

--boundary
Content-Disposition: form-data; name="lineCrossImage"; filename="test-image.jpg"
Content-Type: image/jpeg
Content-Length: 100

Fake JPEG data for testing purposes
--boundary--' 