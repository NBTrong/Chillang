import { useState } from 'react'
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Box,
  AppBar,
  Toolbar,
  Stack,
} from '@mui/material'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            React + TypeScript + Material UI
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h4" component="h1" gutterBottom>
              Welcome to Your App
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              This is a React application built with TypeScript and Material UI.
            </Typography>
            <Stack spacing={2} direction="row" sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={() => setCount((count) => count + 1)}
              >
                Count is {count}
              </Button>
              <Button
                variant="outlined"
                onClick={() => setCount(0)}
              >
                Reset
              </Button>
            </Stack>
            <Typography variant="body2" sx={{ mt: 3 }} color="text.secondary">
              Edit <code>src/App.tsx</code> and save to test HMR
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default App
