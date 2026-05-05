/**
 * YouTube URL helpers
 * SECURITY: getEmbedUrl() output must be encrypted before storage.
 * Never return embed URLs to the client except through /api/videos/[id]/play
 */

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
];

/**
 * Extracts the 11-character YouTube video ID from any valid YouTube URL.
 */
export function extractYouTubeId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Builds a privacy-enhanced YouTube embed URL from a video ID.
 * Uses youtube-nocookie.com to reduce tracking.
 */
export function getEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
}

/**
 * Returns the highest-quality available thumbnail URL for a YouTube video.
 */
export function getThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

/**
 * Returns a medium-quality thumbnail (more reliable than maxresdefault).
 */
export function getThumbnailMedium(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Validates that a string is a valid YouTube URL.
 */
export function isValidYouTubeUrl(url: string): boolean {
  try {
    new URL(url);
    return extractYouTubeId(url) !== null;
  } catch {
    return false;
  }
}
