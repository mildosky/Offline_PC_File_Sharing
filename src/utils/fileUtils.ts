export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('video/')) return '🎬';
  if (fileType.startsWith('audio/')) return '🎵';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📽️';
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar')) return '📦';
  if (fileType.startsWith('text/')) return '📃';
  return '📎';
}

export function getFileCategory(fileType: string): string {
  if (fileType.startsWith('image/')) return 'Image';
  if (fileType.startsWith('video/')) return 'Video';
  if (fileType.startsWith('audio/')) return 'Audio';
  if (fileType.includes('pdf')) return 'Document';
  if (fileType.includes('word') || fileType.includes('document')) return 'Document';
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'Document';
  if (fileType.includes('zip') || fileType.includes('rar')) return 'Archive';
  return 'File';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function generatePeerCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const CHUNK_SIZE = 64 * 1024; // 64KB chunks

export async function* fileToChunks(file: File): AsyncGenerator<{ chunk: ArrayBuffer; index: number; total: number }> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = await file.slice(start, end).arrayBuffer();
    yield { chunk, index: i, total: totalChunks };
  }
}

export function reconstructFile(chunks: ArrayBuffer[], fileName: string, fileType: string): File {
  const blob = new Blob(chunks, { type: fileType });
  return new File([blob], fileName, { type: fileType });
}
