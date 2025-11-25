import {
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  Chip,
} from '@mui/material'
import type { Flashcard } from '../../types/vocabulary'

type FlashcardPanelProps = {
  cards: Flashcard[]
  onStartReview?: () => void
}

export function FlashcardPanel({ cards, onStartReview }: FlashcardPanelProps) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" mb={2}>
          <Typography variant="h6">Flashcards</Typography>
          <Button variant="contained" size="small" onClick={onStartReview}>
            Review
          </Button>
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {cards.map((card) => (
            <Chip
              key={card.id}
              label={card.frontText}
              color={card.difficulty > 2 ? 'warning' : 'default'}
            />
          ))}
          {cards.length === 0 && (
            <Typography color="text.secondary">
              Create flashcards from vocabulary items to review them later.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

