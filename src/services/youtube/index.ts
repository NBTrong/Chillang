import { buildThumbnailUrl, extractYouTubeId } from '../../utils/youtube'
import type { VideoMetadata } from '../../types/video'

export async function fetchVideoMetadata(
  url: string,
): Promise<VideoMetadata | null> {
  const videoId = extractYouTubeId(url)
  if (!videoId) return null

  // Phase 1 placeholder. Phase 2 will call YouTube Data API via a Supabase Edge Function.
  return {
    id: videoId,
    title: 'Sample YouTube Video',
    thumbnailUrl: buildThumbnailUrl(videoId),
    duration: 0,
    language: 'English',
    difficulty: 'Intermediate',
  }
}

