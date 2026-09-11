import multer from "multer";
import path from "path";
import fs from "fs";

export const MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2 MB
export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads", "passports");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Storage engine
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanExt = ext === ".jpeg" || ext === ".jpg" ? ".jpg" : ".png";
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    cb(null, `passport_${uniqueSuffix}${cleanExt}`);
  },
});

// File filter based on MIME type and extension
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowedMime = ["image/jpeg", "image/jpg", "image/png"];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = [".jpg", ".jpeg", ".png"];

  if (allowedMime.includes(file.mimetype) && allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type. Only JPG/JPEG and PNG images are supported."));
  }
};

export const photoUpload = multer({
  storage,
  limits: {
    fileSize: MAX_PHOTO_SIZE,
  },
  fileFilter,
});

/**
 * Validates actual binary magic bytes of the file on disk to guarantee it is not a disguised payload.
 */
export function validateImageMagicBytes(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;

  const buffer = Buffer.alloc(8);
  const fd = fs.openSync(filePath, "r");
  fs.readSync(fd, buffer, 0, 8, 0);
  fs.closeSync(fd);

  // JPEG magic bytes: FF D8 FF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  return isJpeg || isPng;
}
