import { Router } from 'express';
import { processCameraData } from '../controllers/cameraController';
import { multipartMiddleware } from '../middleware/multipart';

const router = Router();

// GET /api/camera/status - Статус камеры
router.get('/status', (req, res) => {
  res.json({
    status: 'available',
    timestamp: new Date().toISOString(),
    message: 'Camera API is ready to receive data'
  });
});

// POST /api/camera/data - Прием XML данных с камеры
router.post('/data', multipartMiddleware, processCameraData);

export { router as cameraRoutes }; 