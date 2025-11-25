export type Script = {
  id: string
  videoId: string
  language: string
  content: string
  createdAt: string
}

export type ScriptSegment = {
  id: string
  scriptId?: string
  sentence: string
  startTime: number
  endTime: number
  orderIndex: number
}

