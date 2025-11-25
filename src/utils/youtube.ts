const YOUTUBE_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/

export function extractYouTubeId(url: string): string | undefined {
  const match = url.match(YOUTUBE_REGEX)
  return match?.[1]
}

export function buildThumbnailUrl(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

