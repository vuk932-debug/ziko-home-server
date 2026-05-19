import multer from 'multer';

// Use memory storage to store files as buffers
const storage = multer.memoryStorage();

// Validate file types and size
const fileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  const allowedMimeTypes = [
    'image/jpeg', 
    'image/jpg',
    'image/png', 
    'image/webp'
  ];
  console.log(`[DEBUG] Multer filtering file: ${file.originalname} (${file.mimetype})`);
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.warn(`[DEBUG] File rejected: ${file.mimetype} is not allowed.`);
    cb(new Error(`Invalid file type (${file.mimetype}). Only JPEG, PNG, and WEBP are allowed.`), false);
  }
};

export const uploadToMemory = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Deprecated Cloudinary middleware (preserved for compatibility if needed, but not used)
export const uploadToCloudinary = uploadToMemory;
