## Tube Study App – Function List

1. **New Study Session (Home)**
   - Paste or type a YouTube link into the primary input field.
   - Trigger AI processing state and route to the Video Dashboard.
   - Provide quick access to sidebar toggles (hamburger & avatar/notifications).

2. **Sidebar / My Library**
   - Toggle drawer via hamburger icon.
   - Start a fresh study session with `[+] New Study Session`.
   - Jump to Vocabulary Manager shortcut.
   - Browse Recent Videos list with status indicators, tap to reopen, long-press for delete/pin options.
   - Access footer actions: Settings (theme/account) and profile summary.

3. **Video Dashboard (Hub)**
   - Display hero area with thumbnail, title, difficulty, vocabulary stats.
   - Offer Back navigation to Home.
   - Surface mode cards with progress indicators:
     - Reading Mode.
     - Listening Comprehension.
     - Dictation Mode.

4. **Reading Mode**
   - Render transcript paragraphs with timestamps column.
   - Provide tools: font size toggle, bilingual subtitles toggle, AI summary.
   - Tap-to-translate words (dictionary sheet with meaning, IPA, audio, add-to-flashcard).
   - Tap sentences to highlight and play synced audio (mini player at bottom).

5. **Listening Comprehension**
   - Phase A (Quiz Mode):
     - Video player without subtitles/CC.
     - AI-generated multiple-choice quiz area with Hint (seek video) and Regenerate controls.
     - Submit Answers action.
   - Phase B (Review Mode):
     - Show score results post-submission.
     - Reveal `Show Transcript` button to toggle transcript.
     - Auto-scroll transcript synced with video playback for review.

6. **Dictation Mode**
   - Focused UI with audio waveform/progress indicator instead of video.
   - Large text input for typing dictated sentence.
   - Controls: Play/replay current sentence, Skip, Hint.
   - Provide immediate feedback by comparing typed text vs ground truth with colored highlights.

7. **Vocabulary Manager**
   - Display SRS due counts in header and a prominent `Start Review` CTA.
   - List saved vocabulary items with mastery chips (New/Hard/Mastered).
   - Show detail view per word with meaning, original context sentence, and play-back-in-video action.

8. **Flashcard Review**
   - Flashcard presentation (front/back) with audio playback on front.
   - Reveal definition plus context sentence on back.
   - Capture spaced-repetition ratings: Again, Hard, Good, Easy.

9. **Global Requirements / UX Enhancements**
   - Enforce default Dark Mode styling and modern sans-serif typography (>=14px).
   - Apply chat-style transitions, loading states, and AI metaphor animations across flows.

