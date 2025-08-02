import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/health
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// GET /api/health/detailed
router.get('/detailed', (req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024 * 100) / 100} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100} MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100} MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024 * 100) / 100} MB`
    },
    version: process.version,
    platform: process.platform
  });
});

export { router as healthRoutes }; 