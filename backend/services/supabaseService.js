const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
let supabaseAdmin = null;

if (supabaseUrl && supabaseServiceRoleKey) {
  try {
    // Admin client with service role key (bypasses RLS)
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('Supabase admin client initialized successfully');
  } catch (error) {
    console.warn('Supabase admin initialization error:', error);
  }
} else {
  console.warn('Supabase not configured in backend. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env file');
}

/**
 * Get Supabase admin client (with service role key, bypasses RLS)
 * Use this for backend operations that need elevated permissions
 */
function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not configured. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env');
  }
  return supabaseAdmin;
}

/**
 * Upload file to Supabase Storage (admin operation)
 * @param {string} bucket - The storage bucket name
 * @param {string} path - The path within the bucket
 * @param {Buffer|Blob|File} file - The file to upload (can be Buffer, Blob, or File)
 * @returns {Promise<string>} The public URL of the uploaded file
 */
async function uploadFile(bucket, path, file, options = {}) {
  const admin = getSupabaseAdmin();
  
  try {
    console.log(`Uploading file to ${bucket}/${path}`);
    
    // Handle different file input types
    let fileBuffer;
    let contentType = 'application/octet-stream';
    
    const hasFileClass = typeof File !== 'undefined';
    const hasBlobClass = typeof Blob !== 'undefined';

    if (Buffer.isBuffer(file)) {
      fileBuffer = file;
    } else if (file.buffer) {
      // Multer file object
      fileBuffer = file.buffer;
      contentType = file.type || file.mimetype || contentType;
    } else if ((hasFileClass && file instanceof File) || (hasBlobClass && file instanceof Blob)) {
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      contentType = file.type || contentType;
    } else {
      fileBuffer = Buffer.from(file);
    }
    
    const { data, error } = await admin.storage
      .from(bucket)
      .upload(path, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get the public URL
    let fileUrl = null;
    if (options.public !== false) {
      const { data: urlData } = admin.storage
        .from(bucket)
        .getPublicUrl(path);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL after upload');
      }
      fileUrl = urlData.publicUrl;
    } else {
      const expiresIn = options.expiresIn || 60 * 60; // default 1 hour
      const { data: signedData, error: signedError } = await admin.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);
      if (signedError || !signedData?.signedUrl) {
        throw new Error('Failed to generate signed URL after upload');
      }
      fileUrl = signedData.signedUrl;
    }

    console.log('File uploaded successfully:', fileUrl);
    return fileUrl;
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    throw error;
  }
}

/**
 * Delete file from Supabase Storage (admin operation)
 * @param {string} bucket - The storage bucket name
 * @param {string} path - The path to the file
 */
async function deleteFile(bucket, path) {
  const admin = getSupabaseAdmin();
  
  try {
    const { error } = await admin.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
    
    console.log(`File deleted: ${bucket}/${path}`);
  } catch (error) {
    console.error('Error deleting from Supabase:', error);
    throw error;
  }
}

/**
 * List files in a bucket (admin operation)
 * @param {string} bucket - The storage bucket name
 * @param {string} folder - Optional folder path
 */
async function listFiles(bucket, folder = '') {
  const admin = getSupabaseAdmin();
  
  try {
    const { data, error } = await admin.storage
      .from(bucket)
      .list(folder);

    if (error) {
      console.error('Error listing files:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error listing files from Supabase:', error);
    throw error;
  }
}

module.exports = {
  getSupabaseAdmin,
  uploadFile,
  deleteFile,
  listFiles
};

