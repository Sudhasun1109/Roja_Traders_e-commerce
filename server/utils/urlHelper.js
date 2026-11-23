/**
 * Converts Google Drive sharing links into direct embeddable image URLs
 * Works with any public / anyone with link Google Drive image file.
 */
function convertGoogleDriveUrl(url) {
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

module.exports = {
  convertGoogleDriveUrl
};
