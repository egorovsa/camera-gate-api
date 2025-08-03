import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

// Настройка multer для обработки любых полей (более гибко)
const upload = multer().any();

export const multipartMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: 'Failed to process multipart data' });
    }
    next();
  });
}; 