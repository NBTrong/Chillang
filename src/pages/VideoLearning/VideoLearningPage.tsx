import { Grid, Stack, Typography, TextField, Button } from '@mui/material'
import { useState } from 'react'
import { VideoPlayer } from '../../components/VideoPlayer'
import { ScriptViewer } from '../../components/ScriptViewer'
import { useVideo } from '../../hooks/useVideo'
import { useScript } from '../../hooks/useScript'
import { extractYouTubeId } from '../../utils/youtube'

export function VideoLearningPage() {
  const [inputUrl, setInputUrl] = useState('')
  const { selectedVideoId, selectVideo, videoMeta } = useVideo()
  const { segments } = useScript()

  const handleLoadVideo = () => {
    const videoId = extractYouTubeId(inputUrl)
    if (videoId) {
      selectVideo(videoId)
    }
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h4">YouTube Integration</Typography>
      <Typography color="text.secondary">
        Paste any YouTube URL to test the upcoming integration. Phase 1 wires up
        the UI so later phases can connect Supabase services and transcript
        extraction workflows.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          fullWidth
          label="YouTube URL"
          value={inputUrl}
          onChange={(event) => setInputUrl(event.target.value)}
        />
        <Button variant="contained" onClick={handleLoadVideo}>
          Load
        </Button>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <VideoPlayer videoId={selectedVideoId} title={videoMeta?.title} />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <ScriptViewer segments={segments} />
        </Grid>
      </Grid>
    </Stack>
  )
}

