import fs from 'fs';

/**
 * Convert Node.js ReadStream to async generator
 */
async function* nodeStreamToIterator(stream: fs.ReadStream): AsyncGenerator<Uint8Array> {
  for await (const chunk of stream) {
    yield new Uint8Array(chunk as Buffer);
  }
}

/**
 * Convert async iterator to Web ReadableStream
 */
function iteratorToStream(iterator: AsyncGenerator<Uint8Array>): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });
}

/**
 * Stream a file from filesystem as Web ReadableStream
 * Memory efficient - doesn't load entire file into memory
 */
export function streamFile(filePath: string): ReadableStream<Uint8Array> {
  const nodeStream = fs.createReadStream(filePath);
  return iteratorToStream(nodeStreamToIterator(nodeStream));
}

/**
 * Content type mapping for allowed file extensions
 */
export const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

/**
 * Get content type from filename extension
 */
export function getContentType(filename: string): string {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return CONTENT_TYPES[ext] || 'application/octet-stream';
}
