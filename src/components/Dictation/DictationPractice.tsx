import {
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  Button,
  LinearProgress,
} from '@mui/material'

type DictationPracticeProps = {
  prompt?: string
  userInput: string
  accuracy?: number
  isLoading?: boolean
  onChange: (value: string) => void
  onSubmit: () => void
}

export function DictationPractice({
  prompt,
  userInput,
  accuracy,
  isLoading,
  onChange,
  onSubmit,
}: DictationPracticeProps) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Dictation Practice</Typography>
          <Typography color="text.secondary">
            {prompt ?? 'Play a script segment to start practicing.'}
          </Typography>
          <TextField
            label="Type what you hear"
            multiline
            minRows={4}
            value={userInput}
            onChange={(event) => onChange(event.target.value)}
            disabled={isLoading}
          />
          {typeof accuracy === 'number' && (
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Accuracy: {Math.round(accuracy * 100)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.round(accuracy * 100)}
              />
            </Stack>
          )}
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={isLoading}
          >
            Check
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}

