import { Grid, Stack, Typography, Card, CardContent } from '@mui/material'
import { FlashcardPanel } from '../../components/Flashcard'
import { useFlashcard } from '../../hooks/useFlashcard'

export function FlashcardsPage() {
  const { cards, stats } = useFlashcard()

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Flashcard Review</Typography>
      <Typography color="text.secondary">
        The spaced repetition engine will live here. Phase 1 includes the data
        scaffolding so future work can plug into Supabase tables.
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Today&apos;s Plan</Typography>
              <Typography variant="h3">{stats.today}</Typography>
              <Typography color="text.secondary">Cards scheduled</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Mastered</Typography>
              <Typography variant="h3">{stats.mastered}</Typography>
              <Typography color="text.secondary">Cards</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Streak</Typography>
              <Typography variant="h3">{stats.streak}</Typography>
              <Typography color="text.secondary">Days in a row</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <FlashcardPanel cards={cards} />
    </Stack>
  )
}

