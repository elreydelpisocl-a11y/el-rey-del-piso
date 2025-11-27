export const convertToDirectImageURL = (url: string): string => {
  if (!url) return '';
  const trimmedUrl = url.trim();

  // Basic check to see if it's already a direct link to an image file
  if (trimmedUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i) != null) {
      return trimmedUrl;
  }

  // Handle Google Drive URLs
  // Patterns: 
  // 1. https://drive.google.com/file/d/ID/view...
  // 2. https://drive.google.com/open?id=ID
  // 3. https://docs.google.com/file/d/ID/edit
  if (trimmedUrl.includes('drive.google.com') || trimmedUrl.includes('docs.google.com')) {
    // Robust regex to extract ID
    // Matches /d/ID or id=ID, capturing alphanumeric characters, hyphens, and underscores.
    // We removed {25,} length constraint to be safer, though IDs are usually long.
    const idMatch = trimmedUrl.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/);
    
    if (idMatch && idMatch[1]) {
      // Use the thumbnail endpoint with a large size request (sz=s3000).
      // This is significantly more reliable for <img> tags than the uc?export=view endpoint
      // as it handles caching and headers better for public files.
      return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=s3000`;
    }
  }
  
  return trimmedUrl;
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount);
};