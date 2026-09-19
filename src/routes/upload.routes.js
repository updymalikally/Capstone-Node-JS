import express from 'express';
import { uploadProfilePicture } from '../controllers/upload.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadSingleImage } from '../middleware/upload.middleware.js';

const router = express.Router();

router.post('/profile-picture', protect, uploadSingleImage, uploadProfilePicture);

export default router;
