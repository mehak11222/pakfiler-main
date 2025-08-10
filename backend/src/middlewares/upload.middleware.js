import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Setup upload path
const uploadPath = path.join(process.cwd(), 'src', 'uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Sanitize filename to prevent path traversal
const sanitizeFilename = (filename) => {
  // Remove any path separators and dangerous characters
  let sanitized = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  
  // Prevent directory traversal
  sanitized = sanitized.replace(/\.\./g, '_');
  
  // Limit filename length
  if (sanitized.length > 100) {
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    sanitized = name.substring(0, 100 - ext.length) + ext;
  }
  
  return sanitized;
};

// Enhanced file filter with better security
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf'
  ];
  
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();
  
  if (allowedTypes.test(ext) && allowedMimeTypes.includes(mimeType)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type. Only JPEG, PNG, and PDF files are allowed. Received: ${mimeType}`), false);
  }
};

// Multer storage config with enhanced security
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const sanitizedName = sanitizeFilename(file.originalname);
    const uniqueId = crypto.randomUUID();
    const timestamp = Date.now();
    const ext = path.extname(sanitizedName);
    const name = path.basename(sanitizedName, ext);
    
    const finalFilename = `${timestamp}-${uniqueId}-${name}${ext}`;
    cb(null, finalFilename);
  }
});

export const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024, // Reduced to 10MB
    files: 5, // Limit number of files per request
    fieldNameSize: 100, // Limit field name size
    fieldSize: 1024 * 1024 // Limit field size to 1MB
  },
});

// Rate limiting for file uploads (to be used with express-rate-limit)
export const uploadRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 upload requests per windowMs
  message: 'Too many file upload requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};
