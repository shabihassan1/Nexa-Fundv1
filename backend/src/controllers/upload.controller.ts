import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const newFilename = `${timestamp}_${safeOriginalName}`;
    cb(null, newFilename);
  },
});

// Create the multer upload middleware
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit per file
  },
}).single('file'); // Expect a single file with the field name 'file'

/**
 * Handle image upload and return the URL
 */
export const uploadImage = (req: Request, res: Response) => {
  upload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `File upload error: ${err.message}` });
      }
      return res.status(500).json({ error: `An unknown error occurred during upload: ${err.message}` });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded.' });
    }

    // Construct the public URL for the file
    // Note: This URL path must match the static path in your main server file
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.status(201).json({ url: fileUrl });
  });
}; 