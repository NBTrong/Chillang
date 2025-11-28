## Thiết kế hệ thống: Tube Study App

### 1. Mục tiêu & Phạm vi
- Cung cấp trải nghiệm học ngoại ngữ cá nhân hóa từ video YouTube nhờ AI.
- Đảm bảo kiến trúc đủ linh hoạt để mở rộng thêm chế độ học, tự động hóa pipeline AI, và kết nối Supabase làm backend duy nhất.
- Tài liệu mô tả các thành phần chính, luồng dữ liệu, yêu cầu phi chức năng và định hướng mở rộng.

### 2. Kiến trúc tổng thể
- **Client (Frontend SPA)**: Ứng dụng Vite/React mặc định Dark Mode, giao diện mô phỏng chat AI với Sidebar. Chịu trách nhiệm hiển thị màn hình học tập, gọi API Supabase, phát video/audio, đồng bộ trạng thái người dùng.
- **Supabase Backend**: Postgres + PostgREST + Auth. Lưu trữ videos, study_sessions, reading_segments, listening_quizzes, dictation_prompts, vocabulary_items, flashcard_reviews và view recent_study_sessions. Bật Row Level Security theo user. Hỗ trợ đăng nhập với Google thông qua Supabase Auth (OAuth).
- **AI Processing Pipeline**: Edge Function hoặc worker server-side sử dụng service role key. Nhận YouTube URL, trích xuất metadata, transcript (ưu tiên caption/auto-generated caption của YouTube, fallback sang Speech-to-Text nếu không có), sinh quiz/dictation/vocabulary rồi ghi về Supabase.
- **SRS & Automation Services**: Cron/Edge Functions tính lịch ôn tập, gửi thông báo, đồng bộ thống kê.
- **External APIs**: YouTube Data API, Speech-to-Text, Từ điển/LLM để dịch & giải thích từ.

```
Client (Vite/React) <--REST/WebSocket--> Supabase (Auth + PostgREST)
          \                                   ^
           \--(link)--> Edge Function AI -----/
                              |
                        External AI APIs
```

### 3. Thành phần & Trách nhiệm

#### 3.1 Frontend
- **Home/New Session**: Input chính cho URL, trạng thái “Processing AI…”, chuyển sang Video Dashboard.
- **Transcript Prefetch**: Ngay tại Home, frontend gọi Edge Function `fetch-youtube-caption` để lấy caption (YouTube Data API v3). Nếu không có caption → báo lỗi `"Video này không có caption"`.
- **Sidebar/My Library**: Lịch sử video, shortcut Vocabulary Manager, footer Settings/Profile.
- **Video Dashboard**: Hero video, thống kê (độ khó, số từ vựng), 3 card mode (Reading, Listening, Dictation) với tiến độ.
- **Reading Mode**: Hiển thị transcript, timestamp, công cụ Aa/Bilingual/AI Summary, tap-to-translate và mini player.
- **Listening Mode**: Phase A quiz (không subtitles, Hint/Regenerate, Submit). Phase B review (show score, nút Show Transcript, auto-scroll).
- **Dictation Mode**: UI tập trung với waveform, input lớn, Play/Replay/Skip/Hint, highlight chấm lỗi.
- **Vocabulary Manager**: SRS due count, Start Review CTA, danh sách từ và detail view.
- **Flashcard Review**: Flashcard front/back, audio playback, rating Again/Hard/Good/Easy.
- **State management**: Supabase client, global session store, caching recents từ `recent_study_sessions`.

#### 3.2 Supabase Schema (tóm tắt)
- `videos`: lưu metadata, difficulty, thumbnail.
- `study_sessions`: trạng thái xử lý (`processing`, `ready`, `failed`), liên kết user/video.
- `reading_segments`: transcript theo đoạn, timestamp, song ngữ.
- `listening_quizzes`: câu hỏi trắc nghiệm + đáp án.
- `dictation_prompts`: câu dictation, audio start/end.
- `vocabulary_items`: từ, nghĩa, mastery state, context sentence.
- `flashcard_reviews`: ghi nhận rating SRS.
- `recent_study_sessions` view: hỗ trợ Sidebar.
- RLS: `owner_id = auth.uid()` cho tất cả bảng người dùng.

#### 3.3 Edge Functions / Pipeline
1. Nhận yêu cầu mới (Webhook hoặc gọi trực tiếp từ frontend với token tạm). `fetch-youtube-caption` là bước đầu giúp xác nhận caption tồn tại trước khi sinh thêm nội dung AI.
2. Fetch transcript từ **nhiều RapidAPI providers** (multi-provider với fallback):
   - **Provider 1**: `youtube-transcriptor.p.rapidapi.com/transcript` - Response: array với `transcriptionAsText` và `transcription[]`
   - **Provider 2**: `youtube-v2.p.rapidapi.com/video/subtitles` - Response: `{lang, is_available, subtitles[]}` với `start` và `duration`
   - **Random selection**: Mỗi request random chọn 1 provider làm primary
   - **Automatic fallback**: Nếu primary provider fail → tự động thử provider còn lại
   - **Normalization**: Cả 2 providers được normalize về format chung (decode HTML entities, map `duration` → `dur`, join text thành transcript)
   - Nếu cả 2 providers đều fail hoặc video không có caption → trả lỗi `"Video này không có caption"` (404)
   - Edge Function (chạy bằng service role key) sẽ:
     1. Upsert `videos` (owner_id + youtube_video_id) với metadata + transcript json (bao gồm `provider_used`)
     2. Xoá + insert lại `reading_segments` dựa trên normalized segments (sử dụng timestamp/duration)
     3. Tạo hoặc cập nhật `study_sessions` (`status = ready`, `last_opened_at = now()`)
3. Tính độ khó, phân đoạn transcript → insert `reading_segments` (đã làm ở bước 2).
4. Sinh quiz nghe, dictation prompt, vocabulary candidates → insert vào bảng tương ứng.
5. Cập nhật `study_sessions.status` = `ready` (đã làm ở bước 2).
6. Ghi log/thất bại để frontend hiển thị lỗi (status `failed`).

### 4. Luồng dữ liệu chính

1. **Khởi tạo phiên học**  
   - Frontend POST `videos` + `study_sessions`.  
   - Edge Function xử lý, sau khi xong `study_sessions` chuyển sang `ready`.  
   - Sidebar đọc `recent_study_sessions` để hiển thị.

2. **Video Dashboard → Chọn mode**  
   - GET các bảng con để hiển thị tiến độ (ví dụ đếm `reading_segments` đã đọc, điểm quiz cao nhất).  
   - User chọn mode, điều hướng đến screen tương ứng.

3. **Reading Mode**  
   - GET `reading_segments` theo `video_id`, render paragraphs.  
   - Từ điển: frontend gọi API ngoài, có thể ghi `vocabulary_items` khi người dùng lưu.  
   - Tap câu phát audio (YouTube iframe hoặc audio slice).

4. **Listening Comprehension**  
   - Phase A: GET `listening_quizzes`, hiển thị video player ẩn subtitles. Hint tua video (control `player.seekTo`). Submit lưu đáp án (optional `quiz_attempts`).  
   - Phase B: Sau submit hiển thị điểm, cho phép toggle transcript (cũng dùng `reading_segments`) với auto-scroll sync bằng timestamp.

5. **Dictation Mode**  
   - GET `dictation_prompts` theo `session_id`.  
   - Frontend cung cấp playback và so sánh string (Levenshtein). Có thể gửi kết quả lên Supabase để lưu tiến độ.

6. **Vocabulary & Flashcards**  
   - GET `vocabulary_items` hiển thị mastery chips.  
   - Start Review: tải batch từ due list (tính theo SRS).  
   - Mỗi rating POST `flashcard_reviews`, cập nhật `vocabulary_items.next_review_at`.

### 5. Tích hợp Supabase
- **Auth**: Supabase Auth JWT; frontend gửi `apikey` + `Authorization`.  
- **Database**: apply `supabase/schema.sql` bằng `supabase db push` hoặc SQL Editor.  
- **API**: REST endpoints theo bảng (ví dụ `/rest/v1/listening_quizzes?session_id=eq...`). Prefer `return=representation` để nhận dữ liệu vừa insert.  
- **Edge Functions**: lưu trữ service role key ở server, không đưa vào frontend. Chạy định kỳ để làm mới dữ liệu SRS.

### 6. Yêu cầu phi chức năng
- **UI/UX**: Dark mode mặc định, font sans-serif ≥14px, hiệu ứng chat-style, animations mượt.  
- **Hiệu năng**: Prefetch transcript & quiz, cache recents, giới hạn payload (phân trang vocab).  
- **Bảo mật**: Không lộ service role key, RLS nghiêm ngặt, validate URL YouTube.  
- **Khả năng mở rộng**: Edge Function có thể hàng đợi (Supabase Functions + PgBoss). Dễ thêm mode học mới.  
- **Quan sát**: Log pipeline, alert khi AI xử lý thất bại, dashboard thống kê usage.

### 7. Kế hoạch mở rộng
- Đồng bộ đa thiết bị real-time (Supabase Realtime).  
- Analytics học tập (trend nghe/đọc).  
- Offline mode cho flashcard.  
- Hỗ trợ đa ngôn ngữ UI & transcript.  
- Tích hợp LLM chat coach ngay trong màn Reading/Listening.

---
Tài liệu này tổng hợp từ `function_list.md`, `global_plan.md` và `supabase/README.md` để nhóm phát triển (FE/BE/AI/Design) có chung cái nhìn về hệ thống Tube Study App.

