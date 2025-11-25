export type VideoMetadata = {
  id: string
  title: string
  thumbnailUrl: string
  duration: number
  language: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
}

export type VideoInput = {
  url: string
  language: string
  difficulty: VideoMetadata['difficulty']
}

