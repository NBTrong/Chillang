import {
  Card,
  CardContent,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material'
import type { ScriptSegment } from '../../types/script'

type ScriptViewerProps = {
  segments: ScriptSegment[]
  activeSegmentId?: string
  onSelect?: (segment: ScriptSegment) => void
}

export function ScriptViewer({
  segments,
  activeSegmentId,
  onSelect,
}: ScriptViewerProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Script
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <List dense disablePadding>
          {segments.map((segment) => (
            <ListItemButton
              key={segment.id}
              selected={segment.id === activeSegmentId}
              onClick={() => onSelect?.(segment)}
              sx={{
                borderRadius: 1,
                mb: 1,
              }}
            >
              <ListItemText
                primary={segment.sentence}
                secondary={`${segment.startTime.toFixed(1)}s - ${segment.endTime.toFixed(1)}s`}
              />
            </ListItemButton>
          ))}
        </List>
        {segments.length === 0 && (
          <Typography color="text.secondary">
            Script segments will appear here once transcripts are processed.
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

