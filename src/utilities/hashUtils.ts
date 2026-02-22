export const generateHash = async (data: string | File): Promise<string> => {
  const encoder = new TextEncoder();
  let originalData: BufferSource;
  
  if (typeof data === 'string') {
    // For string data (like data URLs), use first 1000 chars
    originalData = encoder.encode(data.slice(0, 1000));
  } else {
    // For File objects, use file metadata
    const fileInfo = `${data.name}-${data.size}-${data.lastModified}-${data.type}`;
    originalData = encoder.encode(fileInfo);
  }
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', originalData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
};