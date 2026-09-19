import { uploadBufferToCloudinary } from '../config/cloudinary.js';
import User from '../models/user.model.js';

/**
 * @desc    Upload profile picture to Cloudinary
 * @route   POST /upload/profile-picture
 * @access  Private (JWT)
 */
export const uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file (field name: profilePicture)',
      });
    }

    // Upload memory buffer to Cloudinary
    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, 'finance_tracker_profiles');

    // Update user profile in database
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: uploadResult.secure_url },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: user.profilePicture,
        cloudinaryInfo: {
          public_id: uploadResult.public_id,
          format: uploadResult.format,
          url: uploadResult.secure_url,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
