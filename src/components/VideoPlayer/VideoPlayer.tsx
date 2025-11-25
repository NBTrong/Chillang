import { Card, CardContent, Typography } from '@mui/material'
import YouTube, { type YouTubeProps } from 'react-youtube'

type VideoPlayerProps = {
  videoId?: string
  title?: string
  onReady?: YouTubeProps['onReady']
  onStateChange?: YouTubeProps['onStateChange']
}

const defaultOptions: YouTubeProps['opts'] = {
  height: '360',
  width: '640',
  playerVars: {
    autoplay: 0,
    rel: 0,
  },
}

export function VideoPlayer({
  videoId,
  title,
  onReady,
  onStateChange,
}: VideoPlayerProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title ?? 'Video Preview'}
        </Typography>
        {videoId ? (
          <YouTube
            videoId={videoId}
            opts={defaultOptions}
            onReady={onReady}
            onStateChange={onStateChange}
          />
        ) : (
          <Typography color="text.secondary">
            Provide a valid YouTube URL to start learning.
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

