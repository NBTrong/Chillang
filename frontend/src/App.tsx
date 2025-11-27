import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomeScreen from './components/HomeScreen'
import VideoDashboard from './components/VideoDashboard'
import ReadingScreen from './components/ReadingScreen'
import DictationScreen from './components/DictationScreen'
import ListeningScreen from './components/ListeningScreen'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/:videoId/dash" element={<VideoDashboard />} />
        <Route path="/:videoId/reading" element={<ReadingScreen />} />
        <Route path="/:videoId/dictation" element={<DictationScreen />} />
        <Route path="/:videoId/listening" element={<ListeningScreen />} />
      </Routes>
    </Layout>
  )
}

export default App
