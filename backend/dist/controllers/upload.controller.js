"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure the uploads directory exists
const uploadDir = path_1.default.join(__dirname, '..', '..', 'uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Configure multer for disk storage
const storage = multer_1.default.diskStorage({
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
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB limit per file
    },
}).single('file'); // Expect a single file with the field name 'file'
/**
 * Handle image upload and return the URL
 */
const uploadImage = (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            if (err instanceof multer_1.default.MulterError) {
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
exports.uploadImage = uploadImage;
//# sourceMappingURL=upload.controller.js.map