import {
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
  Button,
} from '@mui/material'
import type { VocabularyItem } from '../../types/vocabulary'

type VocabularyPanelProps = {
  items: VocabularyItem[]
  onAdd?: () => void
}

export function VocabularyPanel({ items, onAdd }: VocabularyPanelProps) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" mb={2}>
          <Typography variant="h6">Vocabulary</Typography>
          <Button variant="outlined" size="small" onClick={onAdd}>
            Add Word
          </Button>
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {items.map((item) => (
            <Chip
              key={item.id}
              label={`${item.word} · ${item.translation ?? '—'}`}
            />
          ))}
          {items.length === 0 && (
            <Typography color="text.secondary">
              No vocabulary saved yet. Select a word from the script to get
              started.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

