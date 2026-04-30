import { supabase } from '../lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

export type VideoRecord = {
  id: string
  owner_id: string
  youtube_video_id: string
  title: string | null
  channel_name: string | null
  thumbnail_url: string | null
  duration_seconds: number | null
  difficulty_level: string | null
  ai_metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  is_deleted: boolean | null
  deleted_at: string | null
}

export type StudySessionRecord = {
  id: string
  owner_id: string
  video_id: string
  status: 'pending' | 'ready' | 'in_progress' | 'completed'
  reading_progress: number
  listening_high_score: number | null
  dictation_completed: number
  ai_summary: string | null
  metadata: Record<string, unknown> | null
  last_opened_at: string
  created_at: string
  updated_at: string
}

export type ReadingSegment = {
  id: string
  video_id: string
  segment_index: number
  starts_at_ms: number | null
  ends_at_ms: number | null
  original_text: string
  translated_text: string | null
}

export type ListeningQuizQuestion = {
  id: string
  quiz_id: string
  prompt: string
  correct_option: string
  distractors: string[]
  hint: string | null
  reference_start_ms: number | null
  reference_end_ms: number | null
  explanation: string | null
}

export type ListeningQuiz = {
  id: string
  session_id: string
  phase: 'quiz' | 'review'
  question_count: number
  max_score: number
  created_at: string
}

export type DictationPrompt = {
  id: string
  session_id: string
  prompt_index: number
  audio_url: string | null
  expected_text: string
  context: Record<string, unknown> | null
}

export type VocabularyItem = {
  id: string
  word: string
  ipa: string | null
  definition: string | null
  translation: string | null
  context_sentence: string | null
  mastery_level: 'new' | 'learning' | 'hard' | 'mastered'
  due_at: string | null
  created_at: string
  updated_at: string
}

export type AuthUser = Pick<User, 'id' | 'email' | 'user_metadata'>

/**
 * Get user avatar URL from user metadata (Google OAuth provides avatar_url or picture)
 */
export const getUserAvatarUrl = (user: AuthUser | null): string | null => {
  if (!user?.user_metadata) return null
  return user.user_metadata.avatar_url || user.user_metadata.picture || null
}

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user as AuthUser | null
}

export const signInWithGoogle = async () => {
  // Use environment variable if set, otherwise use current origin
  // For local development, make sure to add http://localhost:5173 (or your dev port)
  // to Supabase Dashboard > Authentication > URL Configuration > Redirect URLs
  const redirectTo = import.meta.env.VITE_AUTH_REDIRECT_URL || window.location.origin

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  })

  if (error) throw error
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const upsertVideo = async (input: Partial<VideoRecord>) => {
  const { data, error } = await supabase
    .from('videos')
    .upsert(input, { onConflict: 'owner_id,youtube_video_id', ignoreDuplicates: false })
    .select('*')
    .single()

  if (error) throw error
  return data as VideoRecord
}

export const createStudySession = async (input: Partial<StudySessionRecord>) => {
  const { data, error } = await supabase.from('study_sessions').insert(input).select('*').single()
  if (error) throw error
  return data as StudySessionRecord
}

export type RecentSessionRecord = {
  session_id: string
  owner_id: string
  status: string
  reading_progress: number
  listening_high_score: number | null
  dictation_completed: number
  last_opened_at: string
  youtube_video_id: string
  title: string
  thumbnail_url: string | null
  difficulty_level: string | null
}

export const fetchRecentSessions = async (limit = 20, offset = 0, userId?: string) => {
  // Use provided userId or get from session (faster than getUser())
  let ownerId = userId
  if (!ownerId) {
    const { data: session } = await supabase.auth.getSession()
    if (!session?.session?.user) {
      return []
    }
    ownerId = session.session.user.id
  }

  const { data, error } = await supabase
    .from('recent_study_sessions')
    .select('*')
    .eq('owner_id', ownerId)
    .order('last_opened_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data as RecentSessionRecord[]
}

export const fetchReadingSegments = async (videoId: string) => {
  const { data, error } = await supabase
    .from('reading_segments')
    .select('*')
    .eq('video_id', videoId)
    .order('segment_index', { ascending: true })

  if (error) throw error
  return data as ReadingSegment[]
}

export const fetchListeningQuiz = async (sessionId: string) => {
  const { data: quiz, error: quizError } = await supabase
    .from('listening_quizzes')
    .select('id, session_id, phase, question_count, max_score, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (quizError) throw quizError

  // If no quiz found, return null
  if (!quiz) {
    return null
  }

  const { data: questions, error: questionsError } = await supabase
    .from('listening_quiz_questions')
    .select('*')
    .eq('quiz_id', quiz.id)
    .order('created_at', { ascending: true })

  if (questionsError) throw questionsError
  return { quiz: quiz as ListeningQuiz, questions: (questions || []) as ListeningQuizQuestion[] }
}

export const fetchDictationPrompts = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('dictation_prompts')
    .select('*')
    .eq('session_id', sessionId)
    .order('prompt_index', { ascending: true })

  if (error) throw error
  return data as DictationPrompt[]
}

export const listVocabularyItems = async () => {
  const { data, error } = await supabase.from('vocabulary_items').select('*').order('due_at', { ascending: true })
  if (error) throw error
  return data as VocabularyItem[]
}

export const logFlashcardReview = async (vocabularyId: string, rating: 'again' | 'hard' | 'good' | 'easy') => {
  const { data, error } = await supabase
    .from('flashcard_reviews')
    .insert({ vocabulary_id: vocabularyId, rating })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const fetchVideoByYoutubeId = async (youtubeVideoId: string) => {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .ilike('youtube_video_id', youtubeVideoId)
    .eq('is_deleted', false)
    .maybeSingle()

  if (error) throw error
  return data as VideoRecord | null
}

export const softDeleteVideoByYoutubeId = async (youtubeVideoId: string) => {
  const { error } = await supabase
    .from('videos')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('youtube_video_id', youtubeVideoId)

  if (error) throw error
}

export const fetchStudySessionByVideoId = async (videoId: string) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('video_id', videoId)
    .maybeSingle()

  if (error) throw error
  return data as StudySessionRecord | null
}

export const fetchVocabularyByVideoId = async (videoId: string) => {
  const { data, error } = await supabase
    .from('vocabulary_items')
    .select('*')
    .eq('video_id', videoId)
    .order('word', { ascending: true })

  if (error) throw error
  return data as VocabularyItem[]
}

export const countVocabularyByVideo = async (videoId: string) => {
  const { count, error } = await supabase
    .from('vocabulary_items')
    .select('*', { count: 'exact', head: true })
    .eq('video_id', videoId)

  if (error) throw error
  return count ?? 0
}

export const updateStudySession = async (sessionId: string, updates: Partial<StudySessionRecord>) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select('*')
    .single()

  if (error) throw error
  return data as StudySessionRecord
}

export const generateMoreQuestions = async (sessionId: string) => {
  const { data, error } = await supabase.functions.invoke<{
    success: boolean
    questionsAdded: number
    totalQuestions: number
  }>('generate-more-questions', {
    body: { sessionId },
  })

  if (error) throw error
  return data
}

export type UserProfile = {
  id: string
  language: 'vi' | 'en'
  created_at: string
  updated_at: string
}

export const getUserProfile = async (userId?: string): Promise<UserProfile | null> => {
  // Use provided userId or get from session (faster than getUser())
  let ownerId = userId
  if (!ownerId) {
    const { data: session } = await supabase.auth.getSession()
    if (!session?.session?.user) return null
    ownerId = session.session.user.id
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', ownerId)
    .maybeSingle()

  if (error) throw error
  return data as UserProfile | null
}

export const updateUserLanguage = async (language: 'vi' | 'en', userId?: string): Promise<UserProfile> => {
  // Use provided userId or get from session (faster than getUser())
  let ownerId = userId
  if (!ownerId) {
    const { data: session } = await supabase.auth.getSession()
    if (!session?.session?.user) {
      throw new Error('User not authenticated')
    }
    ownerId = session.session.user.id
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(
      {
        id: ownerId,
        language,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single()

  if (error) throw error
  return data as UserProfile
}

