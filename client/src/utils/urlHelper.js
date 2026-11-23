/**
 * Automatically converts Google Drive share links into direct embeddable image URLs
 * Supported formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/file/d/FILE_ID
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 */
export function convertGoogleDriveUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();

  // Pattern 1: drive.google.com/file/d/{FILE_ID}/...
  const fileDMatch = trimmed.match(/(?:drive|docs)\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (fileDMatch && fileDMatch[1]) {
    const fileId = fileDMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // Pattern 2: drive.google.com/...[?&]id={FILE_ID}
  const idMatch = trimmed.match(/(?:drive|docs)\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/i);
  if (idMatch && idMatch[1]) {
    const fileId = idMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return trimmed;
}

export const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80';

/**
 * Resolves any image URL (remote HTTPS, Google Drive, or backend relative /uploads/ path)
 */
export function getImageUrl(url, fallback = DEFAULT_PRODUCT_IMAGE) {
  if (!url || typeof url !== 'string' || !url.trim()) return fallback;
  const trimmed = url.trim();

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return convertGoogleDriveUrl(trimmed);
  }

  // If it's a relative path starting with /uploads
  if (trimmed.startsWith('/uploads')) {
    const backendBase =
      import.meta.env.VITE_API_URL ||
      (import.meta.env.PROD ? 'https://whatsapp-ecommerce-backend-y08o.onrender.com' : '');
    const cleanBase = backendBase ? backendBase.replace(/\/+$/, '') : '';
    return cleanBase ? `${cleanBase}${trimmed}` : trimmed;
  }

  return trimmed;
}
