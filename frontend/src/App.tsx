import { Routes, Route } from 'react-router-dom'
// import { useEffect } from 'react'
import Layout from './components/Layout'
import HomeScreen from './components/HomeScreen'
import VideoDashboard from './components/VideoDashboard'
import ReadingScreen from './components/ReadingScreen'
import DictationScreen from './components/DictationScreen'
import ListeningScreen from './components/ListeningScreen'
import VocabularyScreen from './components/VocabularyScreen'

// const LAST_VISITED_ROUTE_KEY = 'lastVisitedRoute'

function App() {
  // const location = useLocation()
  // const navigate = useNavigate()

  // // Lưu route hiện tại vào localStorage mỗi khi route thay đổi
  // useEffect(() => {
  //   const currentPath = location.pathname + location.search
  //   localStorage.setItem(LAST_VISITED_ROUTE_KEY, currentPath)
  // }, [location])

  // // Kiểm tra và điều hướng đến route đã lưu khi app khởi động
  // useEffect(() => {
  //   const savedRoute = localStorage.getItem(LAST_VISITED_ROUTE_KEY)
    
  //   // Chỉ điều hướng nếu:
  //   // 1. Có route đã lưu
  //   // 2. Người dùng đang ở trang chủ (để tránh override khi họ truy cập trực tiếp một URL)
  //   if (savedRoute && location.pathname === '/') {
  //     navigate(savedRoute, { replace: true })
  //   }
  // }, []) // Chỉ chạy một lần khi component mount

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/vocabulary" element={<VocabularyScreen />} />
        <Route path="/:videoId/dash" element={<VideoDashboard />} />
        <Route path="/:videoId/reading" element={<ReadingScreen />} />
        <Route path="/:videoId/dictation" element={<DictationScreen />} />
        <Route path="/:videoId/listening" element={<ListeningScreen />} />
      </Routes>
    </Layout>
  )
}

export default App
