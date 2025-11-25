import { Grid, Stack, Typography } from '@mui/material'
import { DictationPractice } from '../../components/Dictation'
import { ScriptViewer } from '../../components/ScriptViewer'
import { useDictation } from '../../hooks/useDictation'
import { useScript } from '../../hooks/useScript'

export function DictationPage() {
  const { segments } = useScript()
  const { prompt, userInput, accuracy, setUserInput, checkAnswer, isLoading } =
    useDictation()

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Dictation Practice</Typography>
      <Typography color="text.secondary">
        This page combines the script view with the dictation trainer. Phase 2
        onwards will sync audio playback and transcript segments.
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <ScriptViewer segments={segments} />
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <DictationPractice
            prompt={prompt}
            userInput={userInput}
            accuracy={accuracy}
            isLoading={isLoading}
            onChange={setUserInput}
            onSubmit={checkAnswer}
          />
        </Grid>
      </Grid>
    </Stack>
  )
}

