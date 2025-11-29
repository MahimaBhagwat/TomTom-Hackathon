import api from '../config/api';

/**
 * Upload a file to Supabase Storage via backend (bypasses RLS)
 * @param {File} file - The file to upload
 * @param {string} bucket - The storage bucket name (e.g., 'reports', 'panic')
 * @param {string} path - The path within the bucket (e.g., 'userId/filename.jpg')
 * @param {string} userId - The user ID (extracted from path if not provided)
 * @returns {Promise<string|null>} The public URL of the uploaded file, or null if failed
 */
export const uploadToSupabase = async (file, bucket, path, userId = null) => {
  if (!file) {
    return null;
  }

  try {
    // Extract userId from path if not provided: path format is "userId/filename"
    if (!userId && path.includes('/')) {
      userId = path.split('/')[0];
    }

    if (!userId) {
      throw new Error('User ID is required for file upload');
    }

    console.log(`Uploading ${file.name} to ${bucket}/${path} via backend`);

    // Determine file type from bucket and path
    const fileType = path.includes('photo') || path.includes('_photo') ? 'photo' : 'audio';
    const endpoint = bucket === 'panic' ? '/api/upload/panic' : '/api/upload/report';

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    if (bucket === 'reports') {
      formData.append('fileType', fileType);
    }

    // Upload via backend (which uses service role key to bypass RLS)
    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data.success && response.data.url) {
      console.log('File uploaded successfully:', response.data.url);
      return response.data.url;
    } else {
      throw new Error('Upload failed: No URL returned from server');
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
    throw new Error(errorMessage);
  }
};

/**
 * Delete a file from Supabase Storage
 * @param {string} bucket - The storage bucket name
 * @param {string} path - The path to the file
 */
export const deleteFromSupabase = async (bucket, path) => {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting from Supabase:', error);
    throw error;
  }
};

