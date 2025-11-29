const { uploadFile } = require('../services/supabaseService');
const multer = require('multer');

// Configure multer for memory storage (we'll upload directly to Supabase)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB limit
  }
});

/**
 * POST /api/upload/report
 * Upload a file (photo or audio) for a report
 */
async function uploadReportFile(req, res) {
  try {
    const { userId, fileType } = req.body; // fileType: 'photo' or 'audio'
    const file = req.file;

    if (!file) {
      return res.status(400).json({ 
        error: 'No file provided',
        message: 'Please provide a file to upload'
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID required',
        message: 'Please provide userId in request body'
      });
    }

    // Determine file extension
    const originalName = file.originalname || 'file';
    const extension = originalName.split('.').pop() || (fileType === 'photo' ? 'jpg' : 'mp3');
    const timestamp = Date.now();
    
    // Create path: reports/{userId}/{timestamp}_{fileType}.{ext}
    const fileName = fileType === 'photo' 
      ? `${timestamp}_photo.${extension}`
      : `${timestamp}_audio.${extension}`;
    const path = `${userId}/${fileName}`;

    console.log(`Uploading ${fileType} file to Supabase: reports/${path}`);

    // Upload to Supabase using service role key (bypasses RLS)
    // Create a file-like object with buffer and mimetype
    const fileForUpload = {
      buffer: file.buffer,
      type: file.mimetype || (fileType === 'photo' ? 'image/jpeg' : 'audio/mpeg')
    };
    const publicUrl = await uploadFile('reports', path, fileForUpload, { public: true });

    res.json({
      success: true,
      url: publicUrl,
      path: path,
      fileName: fileName
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Provide helpful error message if Supabase is not configured
    if (error.message && error.message.includes('Supabase admin client is not configured')) {
      return res.status(500).json({ 
        error: 'Storage not configured',
        message: 'Supabase Storage is not configured on the backend. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env file and restart the server.'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to upload file',
      message: error.message 
    });
  }
}

/**
 * POST /api/upload/panic
 * Upload panic audio file
 */
async function uploadPanicAudio(req, res) {
  try {
    const { userId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ 
        error: 'No file provided',
        message: 'Please provide an audio file to upload'
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID required',
        message: 'Please provide userId in request body'
      });
    }

    const timestamp = Date.now();
    const path = `${userId}/${timestamp}_panic_audio.webm`;

    console.log(`Uploading panic audio to Supabase: panic/${path}`);

    // Upload to Supabase using service role key (bypasses RLS)
    const fileForUpload = {
      buffer: file.buffer,
      type: file.mimetype || 'audio/webm'
    };
    const publicUrl = await uploadFile('panic', path, fileForUpload, {
      public: false,
      expiresIn: 60 * 60 * 24 // 24 hours
    });

    res.json({
      success: true,
      url: publicUrl,
      path: path
    });

  } catch (error) {
    console.error('Error uploading panic audio:', error);
    
    // Provide helpful error message if Supabase is not configured
    if (error.message && error.message.includes('Supabase admin client is not configured')) {
      return res.status(500).json({ 
        error: 'Storage not configured',
        message: 'Supabase Storage is not configured on the backend. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env file and restart the server.'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to upload panic audio',
      message: error.message 
    });
  }
}

// Middleware for single file upload
const uploadMiddleware = upload.single('file');

module.exports = {
  uploadReportFile: [uploadMiddleware, uploadReportFile],
  uploadPanicAudio: [uploadMiddleware, uploadPanicAudio]
};

