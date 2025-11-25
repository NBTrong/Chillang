import { Grid, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { VideoPlayer } from '../../components/VideoPlayer'
import { ScriptViewer } from '../../components/ScriptViewer'
import { VocabularyPanel } from '../../components/Vocabulary'
import { FlashcardPanel } from '../../components/Flashcard'
import { useVideo } from '../../hooks/useVideo'
import { useScript } from '../../hooks/useScript'
import { useVocabulary } from '../../hooks/useVocabulary'
import { useFlashcard } from '../../hooks/useFlashcard'

export function HomePage() {
  const { t } = useTranslation()
  const { selectedVideoId, videoMeta } = useVideo()
  const { segments } = useScript()
  const { items } = useVocabulary()
  const { cards } = useFlashcard()

  return (
    <Stack spacing={4}>
      <div>
        <Typography variant="h4" gutterBottom>
          {t('welcome')}
        </Typography>
        <Typography color="text.secondary">
          Phase 1 sets up the foundation. Upcoming phases will connect these
          modules to Supabase and YouTube services.
        </Typography>
      </div>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <VideoPlayer videoId={selectedVideoId} title={videoMeta?.title} />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <ScriptViewer segments={segments} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <VocabularyPanel items={items} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FlashcardPanel cards={cards} />
        </Grid>
      </Grid>
    </Stack>
  )
}

