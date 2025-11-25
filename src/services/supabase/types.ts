export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type Timestamp = string

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          display_name: string | null
          interface_language: string | null
          learning_languages: string[] | null
          created_at: Timestamp
        }
        Insert: {
          id: string
          display_name?: string | null
          interface_language?: string | null
          learning_languages?: string[] | null
          created_at?: Timestamp
        }
        Update: Database['public']['Tables']['users']['Insert']
      }
      videos: {
        Row: {
          id: string
          user_id: string
          youtube_id: string
          title: string
          thumbnail_url: string | null
          duration: number | null
          language: string
          difficulty: number | null
          created_at: Timestamp
        }
        Insert: Partial<Database['public']['Tables']['videos']['Row']> &
          Pick<
            Database['public']['Tables']['videos']['Row'],
            'id' | 'user_id' | 'youtube_id' | 'title' | 'language'
          >
        Update: Database['public']['Tables']['videos']['Insert']
      }
      scripts: {
        Row: {
          id: string
          video_id: string
          language: string
          content: string
          created_at: Timestamp
        }
        Insert: {
          id: string
          video_id: string
          language: string
          content: string
          created_at?: Timestamp
        }
        Update: Database['public']['Tables']['scripts']['Insert']
      }
      script_segments: {
        Row: {
          id: string
          script_id: string
          sentence: string
          start_time: number
          end_time: number
          order_index: number
        }
        Insert: Database['public']['Tables']['script_segments']['Row']
        Update: Database['public']['Tables']['script_segments']['Insert']
      }
      vocabulary: {
        Row: {
          id: string
          user_id: string
          word: string
          phrase: string | null
          definition: string | null
          translation: string | null
          notes: string | null
          source_video_id: string | null
          source_script_segment_id: string | null
          created_at: Timestamp
        }
        Insert: Partial<Database['public']['Tables']['vocabulary']['Row']> &
          Pick<Database['public']['Tables']['vocabulary']['Row'], 'id' | 'user_id' | 'word'>
        Update: Database['public']['Tables']['vocabulary']['Insert']
      }
      flashcards: {
        Row: {
          id: string
          user_id: string
          vocabulary_id: string
          front_text: string
          back_text: string
          image_url: string | null
          difficulty: number | null
          last_reviewed: Timestamp | null
          next_review: Timestamp | null
          review_count: number | null
          created_at: Timestamp
        }
        Insert: Partial<Database['public']['Tables']['flashcards']['Row']> &
          Pick<
            Database['public']['Tables']['flashcards']['Row'],
            'id' | 'user_id' | 'vocabulary_id' | 'front_text' | 'back_text'
          >
        Update: Database['public']['Tables']['flashcards']['Insert']
      }
      dictation_sessions: {
        Row: {
          id: string
          user_id: string
          script_segment_id: string
          user_input: string
          accuracy: number
          completed_at: Timestamp
        }
        Insert: Database['public']['Tables']['dictation_sessions']['Row']
        Update: Database['public']['Tables']['dictation_sessions']['Insert']
      }
      learning_progress: {
        Row: {
          id: string
          user_id: string
          video_id: string
          progress: Json
          updated_at: Timestamp
        }
        Insert: Database['public']['Tables']['learning_progress']['Row']
        Update: Database['public']['Tables']['learning_progress']['Insert']
      }
    }
  }
}

