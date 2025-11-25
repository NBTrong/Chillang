import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import { CircularProgress, Box } from '@mui/material'
import { AppLayout } from './components/common/AppLayout'
import { HomePage } from './pages/Home'
import { VideoLearningPage } from './pages/VideoLearning'
import { DictationPage } from './pages/Dictation'
import { FlashcardsPage } from './pages/Flashcards'
import { VocabularyPage } from './pages/Vocabulary'

function App() {
  return (
    <AppLayout>
      <Suspense
        fallback={
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        }
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/video-learning" element={<VideoLearningPage />} />
          <Route path="/dictation" element={<DictationPage />} />
          <Route path="/flashcards" element={<FlashcardsPage />} />
          <Route path="/vocabulary" element={<VocabularyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  )
}

export default App
