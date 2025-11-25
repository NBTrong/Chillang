import {
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  TextField,
  Button,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { VocabularyPanel } from '../../components/Vocabulary'
import {
  defaultVocabularyFilters,
  useVocabulary,
} from '../../hooks/useVocabulary'

type FilterForm = {
  keyword: string
  language: string
}

export function VocabularyPage() {
  const { items, filters, setFilters } = useVocabulary()
  const { register, handleSubmit, reset } = useForm<FilterForm>({
    defaultValues: filters,
  })

  const onSubmit = handleSubmit((values) => setFilters(values))

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Vocabulary Manager</Typography>
      <Typography color="text.secondary">
        Filter, annotate, and send vocabulary entries to flashcards. Phase 1
        prepares the UI and state hooks, while later phases will persist data via
        Supabase.
      </Typography>

      <Card component="form" onSubmit={onSubmit}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Keyword"
                {...register('keyword')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Language"
                {...register('language')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Button fullWidth variant="contained" type="submit">
                Apply
              </Button>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                type="button"
                onClick={() => {
                  reset(defaultVocabularyFilters)
                  setFilters({ ...defaultVocabularyFilters })
                }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <VocabularyPanel items={items} />
    </Stack>
  )
}

