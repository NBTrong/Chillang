import { useMemo, useState } from 'react'
import type { VideoMetadata } from '../types/video'

const demoVideo: VideoMetadata = {
  id: 'dQw4w9WgXcQ',
  title: 'Language Learning Demo',
  thumbnailUrl: '',
  duration: 213,
  language: 'English',
  difficulty: 'Intermediate',
}

export function useVideo() {
  const [selectedVideoId, setSelectedVideoId] = useState<string | undefined>(
    demoVideo.id,
  )
  const [videoMeta, setVideoMeta] = useState<VideoMetadata | undefined>(
    demoVideo,
  )

  const selectVideo = (videoId: string) => {
    setSelectedVideoId(videoId)
    setVideoMeta({
      ...demoVideo,
      id: videoId,
      title: `YouTube Video (${videoId})`,
    })
  }

  const status = useMemo(
    () => ({
      hasSelection: Boolean(selectedVideoId),
    }),
    [selectedVideoId],
  )

  return {
    selectedVideoId,
    videoMeta,
    status,
    selectVideo,
  }
}

