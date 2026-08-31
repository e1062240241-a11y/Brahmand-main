import { MAX_POST_CHAR_LIMIT } from '../constants/community';

export function splitTextIntoTweets(text: string, limit: number = MAX_POST_CHAR_LIMIT): string[] {
  const words = text.split(' ');
  const chunks: string[] = [];
  let currentChunk = '';

  for (const word of words) {
    if ((currentChunk + ' ' + word).trim().length <= limit) {
      currentChunk = (currentChunk + ' ' + word).trim();
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = word;
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  return chunks;
}
