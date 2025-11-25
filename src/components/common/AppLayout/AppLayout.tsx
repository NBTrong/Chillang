import type { ReactNode } from 'react'
import {
  AppBar,
  Box,
  Container,
  Stack,
  Toolbar,
  Typography,
  Button,
} from '@mui/material'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import { Link as RouterLink, useLocation } from 'react-router-dom'

type AppLayoutProps = {
  children: ReactNode
}

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Video Learning', path: '/video-learning' },
  { label: 'Dictation', path: '/dictation' },
  { label: 'Flashcards', path: '/flashcards' },
  { label: 'Vocabulary', path: '/vocabulary' },
]

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="transparent" elevation={0}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <SchoolOutlinedIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Personal Language Learning
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            {navItems.map((item) => {
              const isActive =
                item.path === '/'
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path)
              return (
                <Button
                  key={item.path}
                  component={RouterLink}
                  to={item.path}
                  color={isActive ? 'primary' : 'inherit'}
                  variant={isActive ? 'contained' : 'text'}
                >
                  {item.label}
                </Button>
              )
            })}
          </Stack>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  )
}

