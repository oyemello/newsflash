import * as crypto from 'crypto';

export function generateHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export const sha1 = (s: string) => crypto.createHash('sha1').update(s).digest('hex');

export function generateObjectHash(obj: any): string {
  const sortedString = JSON.stringify(obj, Object.keys(obj).sort());
  return generateHash(sortedString);
}

export function compareHashes(hash1: string, hash2: string): boolean {
  return hash1 === hash2;
}

export function generateFeedHash(feedData: any[]): string {
  // Create a simplified representation of the feed for hashing
  const feedSummary = feedData.map(item => ({
    id: item.id,
    title: item.title,
    published_at: item.published_at,
    updated_at: item.updated_at,
  }));
  
  return generateObjectHash(feedSummary);
}

export function generateContentFingerprint(content: string): string {
  // Remove whitespace and normalize for better fingerprinting
  const normalized = content
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  
  return generateHash(normalized);
}
