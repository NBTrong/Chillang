# Personal Language Learning App

A comprehensive language learning application that uses YouTube videos as learning materials with interactive features for vocabulary building, dictation practice, and step-by-step learning.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Material UI
- **Backend**: Supabase (PostgreSQL, Storage, Edge Functions, Auth)
- **Build Tool**: Vite

## Core Features

1. **YouTube Video Integration**
   - Accept YouTube video URLs
   - Extract and display video content
   - Video player with custom controls

2. **Script Extraction**
   - Extract transcript/subtitles from YouTube videos
   - Support for multiple languages
   - Display script alongside video

3. **Sentence-to-Segment Mapping**
   - Map each sentence to specific video time segments
   - Click on sentence to jump to corresponding video segment
   - Visual highlighting of current sentence during playback

4. **Audio-Only Mode**
   - Toggle to hide video, show only audio
   - Focus mode for listening practice
   - Maintains all other functionality

5. **Dictation Practice**
   - Practice typing what you hear
   - Real-time feedback on accuracy
   - Progress tracking

6. **Vocabulary Lookup**
   - Select words/phrases from script
   - View definitions and translations
   - Manual notes or AI-powered explanations
   - Support for multiple languages

7. **Flashcard System**
   - Add vocabulary to flashcard deck
   - Spaced repetition system
   - Review and practice flashcards

8. **Multi-language Support**
   - Support for learning multiple languages
   - Language selection interface
   - Localized UI (i18n)

9. **Step-by-Step Learning Material**
   - Structured learning paths
   - Progress tracking
   - Difficulty levels

## Implementation Plan

### Phase 1: Project Setup & Infrastructure

#### 1.1 Supabase Setup
- [x] Scaffold Supabase project configuration (`src/services/supabase`)
- [x] Provide database schema blueprint (`supabase/schema.sql`):
  - `users` (extends Supabase auth.users)
  - `videos` (store YouTube video metadata)
  - `scripts` (store video transcripts with timestamps)
  - `script_segments` (map sentences to video time segments)
  - `vocabulary` (user's vocabulary collection)
  - `flashcards` (flashcard deck items)
  - `dictation_sessions` (track dictation practice)
  - `learning_progress` (track user progress)
- [x] Enable Row Level Security (RLS) with placeholder user-scoped policies
- [ ] Configure Storage buckets for user uploads (pending until needed)

> Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your `.env.local` before running the Supabase client locally.

#### 1.2 Frontend Dependencies
- [x] Install Supabase client: `@supabase/supabase-js`
- [x] Install YouTube player: `react-youtube` and icon support via `@mui/icons-material`
- [x] Install i18n library: `react-i18next` + `i18next`
- [x] Install audio/video utilities: `wavesurfer.js` (ready for future phases)
- [x] Install router: `react-router-dom`
- [x] Install form handling: `react-hook-form`

#### 1.3 Project Structure
```
src/
├── components/
│   ├── VideoPlayer/
│   ├── ScriptViewer/
│   ├── Dictation/
│   ├── Vocabulary/
│   ├── Flashcard/
│   └── common/
├── pages/
│   ├── Home/
│   ├── VideoLearning/
│   ├── Dictation/
│   ├── Flashcards/
│   └── Vocabulary/
├── services/
│   ├── supabase/
│   ├── youtube/
│   └── ai/
├── hooks/
│   ├── useVideo.ts
│   ├── useScript.ts
│   ├── useDictation.ts
│   └── useFlashcard.ts
├── types/
│   ├── video.ts
│   ├── script.ts
│   ├── vocabulary.ts
│   └── user.ts
├── utils/
│   ├── youtube.ts
│   ├── transcription.ts
│   └── i18n.ts
└── App.tsx
```
- [x] Created the directory structure above with placeholder components, hooks, and service layers wired into the router-driven UI scaffold.

### Phase 2: YouTube Video Integration

#### 2.1 Video Input & Processing
- [ ] Create video input component (URL input field)
- [ ] Extract YouTube video ID from URL
- [ ] Validate YouTube URL format
- [ ] Store video metadata in Supabase:
  - Video ID, title, thumbnail, duration
  - Language, difficulty level
  - User who added it

#### 2.2 Video Player Component
- [ ] Integrate YouTube iframe player or use HTML5 video
- [ ] Custom controls for playback
- [ ] Time tracking and seeking functionality
- [ ] Play/pause, volume, speed controls
- [ ] Display current playback time

**Technical Notes:**
- Use YouTube IFrame API for embedding
- Store video reference in state
- Implement time update listeners

### Phase 3: Script Extraction & Display

#### 3.1 Script Extraction
- [ ] Create Supabase Edge Function for script extraction:
  - Use YouTube Transcript API or similar service
  - Extract subtitles/captions from YouTube
  - Parse and structure transcript data
- [ ] Alternative: Use client-side library if available
- [ ] Store script in database with timestamps

#### 3.2 Script Display Component
- [ ] Display script alongside video player
- [ ] Format script with proper line breaks
- [ ] Highlight current sentence based on video time
- [ ] Make sentences clickable to seek video

**Database Schema for Scripts:**
```sql
scripts (
  id uuid PRIMARY KEY,
  video_id uuid REFERENCES videos(id),
  language text,
  content text,
  created_at timestamp
)

script_segments (
  id uuid PRIMARY KEY,
  script_id uuid REFERENCES scripts(id),
  sentence text,
  start_time decimal,
  end_time decimal,
  order_index integer
)
```

### Phase 4: Sentence-to-Segment Mapping

#### 4.1 Segment Mapping UI
- [ ] Create interface for mapping sentences to video segments
- [ ] Allow user to select sentence and set start/end times
- [ ] Visual timeline showing segments
- [ ] Auto-detect segments using silence detection (optional)

#### 4.2 Interactive Script
- [ ] Click sentence to jump to video time
- [ ] Auto-scroll script as video plays
- [ ] Highlight active sentence segment
- [ ] Show segment boundaries visually

**Implementation:**
- Use video time update events
- Match current time with segment timestamps
- Update UI state accordingly

### Phase 5: Audio-Only Mode

#### 5.1 Toggle Feature
- [ ] Add toggle button in video player controls
- [ ] Hide video element when audio-only is active
- [ ] Show audio waveform or simple audio player UI
- [ ] Maintain all other functionality (script, dictation, etc.)

**Implementation:**
- Conditional rendering of video element
- Use audio element or YouTube audio-only mode
- Preserve playback state when toggling

### Phase 6: Dictation Practice

#### 6.1 Dictation Component
- [ ] Create dictation interface:
  - Audio playback controls
  - Text input area
  - Submit/check button
- [ ] Implement real-time comparison:
  - Compare user input with script
  - Highlight correct/incorrect words
  - Calculate accuracy percentage
- [ ] Support for sentence-by-sentence or full script dictation

#### 6.2 Dictation Session Tracking
- [ ] Store dictation sessions in database
- [ ] Track accuracy, time taken, attempts
- [ ] Show progress history
- [ ] Allow retry functionality

**Database Schema:**
```sql
dictation_sessions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  script_segment_id uuid REFERENCES script_segments(id),
  user_input text,
  accuracy decimal,
  completed_at timestamp
)
```

### Phase 7: Vocabulary Lookup & Management

#### 7.1 Word Selection & Lookup
- [ ] Enable text selection in script viewer
- [ ] Show popup/modal on word/phrase selection:
  - Display definition
  - Show translation (if different language)
  - AI-powered explanation option
- [ ] Support for multi-word phrase selection

#### 7.2 Vocabulary Storage
- [ ] Store selected vocabulary in database
- [ ] Link vocabulary to source video/script
- [ ] Allow manual notes/definitions
- [ ] Support AI-generated explanations (using Supabase Edge Function + AI API)

**Database Schema:**
```sql
vocabulary (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  word text,
  phrase text,
  definition text,
  translation text,
  notes text,
  source_video_id uuid REFERENCES videos(id),
  source_script_segment_id uuid REFERENCES script_segments(id),
  created_at timestamp
)
```

#### 7.3 AI Integration (Optional)
- [ ] Create Supabase Edge Function for AI explanations
- [ ] Integrate with OpenAI/Anthropic API or similar
- [ ] Generate contextual explanations based on video content
- [ ] Cache AI responses to reduce API calls

### Phase 8: Flashcard System

#### 8.1 Flashcard Creation
- [ ] Add "Add to Flashcard" button in vocabulary popup
- [ ] Create flashcard from vocabulary item
- [ ] Allow custom front/back content
- [ ] Support images (from video thumbnails)

#### 8.2 Flashcard Review
- [ ] Create flashcard review interface
- [ ] Implement spaced repetition algorithm:
  - Track review intervals
  - Adjust difficulty based on performance
  - Schedule next review
- [ ] Show progress statistics

**Database Schema:**
```sql
flashcards (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  vocabulary_id uuid REFERENCES vocabulary(id),
  front_text text,
  back_text text,
  image_url text,
  difficulty integer,
  last_reviewed timestamp,
  next_review timestamp,
  review_count integer,
  created_at timestamp
)
```

### Phase 9: Multi-language Support

#### 9.1 Language Selection
- [ ] Create language selector component
- [ ] Store user's learning language preference
- [ ] Filter videos/content by language
- [ ] Support multiple learning languages per user

#### 9.2 Internationalization (i18n)
- [ ] Set up i18n library
- [ ] Create translation files for UI
- [ ] Support at least English and Vietnamese initially
- [ ] Allow language switching in settings

**Implementation:**
- Use react-i18next or similar
- Store translations in JSON files
- Detect browser language or user preference

### Phase 10: Step-by-Step Learning Material

#### 10.1 Learning Path Structure
- [ ] Create learning path/course structure
- [ ] Organize videos by difficulty/level
- [ ] Define prerequisites and progression
- [ ] Track completion status

#### 10.2 Progress Tracking
- [ ] Track user progress through materials:
  - Videos watched
  - Vocabulary learned
  - Dictation completed
  - Flashcards reviewed
- [ ] Show progress dashboard
- [ ] Generate learning statistics

**Database Schema:**
```sql
learning_paths (
  id uuid PRIMARY KEY,
  title text,
  description text,
  language text,
  difficulty_level integer,
  order_index integer
)

learning_path_items (
  id uuid PRIMARY KEY,
  path_id uuid REFERENCES learning_paths(id),
  video_id uuid REFERENCES videos(id),
  order_index integer
)

user_progress (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  path_id uuid REFERENCES learning_paths(id),
  item_id uuid REFERENCES learning_path_items(id),
  completed boolean,
  completed_at timestamp,
  score decimal
)
```

## API Integration Points

### YouTube API
- Extract video metadata
- Get video transcripts/subtitles
- Embed video player

### Supabase Services
- **Database**: Store all user data, videos, scripts, vocabulary, flashcards
- **Storage**: Store user-uploaded content (if needed)
- **Edge Functions**: 
  - Script extraction from YouTube
  - AI-powered vocabulary explanations
  - Audio processing (if needed)
- **Auth**: User authentication and authorization

### External APIs (Optional)
- OpenAI/Anthropic for AI explanations
- Translation API for multi-language support
- Dictionary API for vocabulary definitions

## UI/UX Considerations

1. **Layout**:
   - Video player on left/top
   - Script viewer on right/bottom
   - Collapsible panels for vocabulary/flashcards
   - Responsive design for mobile

2. **Material UI Components**:
   - Use MUI components consistently
   - Follow Material Design principles
   - Custom theme for language learning context

3. **User Flow**:
   - Simple onboarding
   - Clear navigation between features
   - Intuitive controls
   - Progress feedback

## Security Considerations

1. **RLS Policies**: Ensure users can only access their own data
2. **Input Validation**: Validate YouTube URLs and user inputs
3. **Rate Limiting**: Prevent abuse of API calls
4. **Content Moderation**: Filter inappropriate content (if user-generated)

## Performance Optimization

1. **Lazy Loading**: Load video/script data on demand
2. **Caching**: Cache frequently accessed data
3. **Pagination**: Paginate large lists (vocabulary, flashcards)
4. **Optimistic Updates**: Update UI immediately, sync with backend

## Testing Strategy

1. **Unit Tests**: Test utility functions, hooks
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Test complete user flows
4. **Manual Testing**: Test with real YouTube videos

## Deployment

1. **Frontend**: Deploy to Vercel/Netlify
2. **Backend**: Supabase handles backend infrastructure
3. **Environment Variables**: Configure API keys and Supabase credentials
4. **CI/CD**: Set up automated deployment pipeline

## Future Enhancements

- Social features (share progress, compete with friends)
- Speech recognition for pronunciation practice
- Video annotations and notes
- Community-contributed learning materials
- Mobile app (React Native)
- Offline mode support
- Advanced analytics and insights

## Development Workflow

1. Start with Phase 1 (Setup)
2. Implement features incrementally (Phase 2 → Phase 10)
3. Test each phase before moving to next
4. Iterate based on user feedback
5. Deploy incrementally (can deploy after each major phase)

## Notes for AI Implementation

When implementing each phase:
1. Read this README to understand the full context
2. Check existing code structure before making changes
3. Follow TypeScript best practices
4. Use Material UI components consistently
5. Implement proper error handling
6. Add loading states for async operations
7. Ensure responsive design
8. Write clean, commented code (comments in English)
9. Test functionality before marking as complete
10. Update this README if architecture changes significantly
