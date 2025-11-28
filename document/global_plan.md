Đây là bản tài liệu đặc tả thiết kế (Design Specifications) hoàn chỉnh, đã cập nhật cấu trúc điều hướng theo phong cách **"AI Chat" (Sidebar Navigation)** và luồng học **Listening Comprehension** mới.

Bạn có thể chuyển tiếp toàn bộ nội dung dưới đây cho đội ngũ UI/UX Designer.

---

# PRODUCT DESIGN SPECIFICATIONS: TUBE STUDY APP

## 1. TỔNG QUAN (OVERVIEW)
* **Concept:** Ứng dụng học ngoại ngữ cá nhân hóa qua YouTube, sử dụng AI để tạo bài tập.
* **Core Philosophy:** Giao diện lấy cảm hứng từ các ứng dụng AI Chat (ChatGPT, Gemini) để tạo cảm giác hiện đại, nhanh chóng và tập trung vào nội dung.
* **User Journey:** Paste Link -> AI Xử lý -> Chọn chế độ học (Reading/Listening/Dictation).

## 2. HỆ THỐNG ĐIỀU HƯỚNG (NAVIGATION SYSTEM)
* **Không dùng Bottom Navigation Bar.**
* **Sử dụng Sidebar (Hamburger Menu):** Chứa lịch sử và tài nguyên cá nhân.
* **Màn hình chính:** Tập trung hoàn toàn vào ô nhập liệu (Input) để bắt đầu phiên học mới.

---

## 3. CHI TIẾT CÁC MÀN HÌNH (DETAILED SCREENS)

### 1. Màn hình Home (New Study Session)
*Màn hình mặc định khi mở app. Tối giản, sạch sẽ.*

* **Top Bar:**
    * **Left:** Icon 3 gạch (Hamburger Menu) -> Mở Sidebar.
    * **Right:** Avatar User (hoặc Icon thông báo).
* **Center Area (Vùng trung tâm):**
    * **Logo/Greeting:** Câu chào thân thiện (VD: "What do you want to learn today?").
    * **Input Field (Primary Element):** Một ô nhập liệu lớn, bo góc, nằm giữa màn hình (hoặc lệch dưới).
        * *Placeholder:* "Dán link YouTube video vào đây..."
        * *Icons trong Input:* Paste Button, Send Button (Mũi tên).
* **Interaction:**
    * User paste link -> Bấm Send -> App gọi Supabase Edge Function `fetch-youtube-caption` để lấy transcript/caption từ RapidAPI YouTube Transcriptor API (backend sử dụng RapidAPI thay vì YouTube Data API v3 để đơn giản hóa quy trình).
    * Backend đồng thời lưu metadata video + transcript vào `videos`/`reading_segments`, tạo (hoặc cập nhật) `study_session` trạng thái `ready`, sau đó trả transcript + session info cho frontend.
    * Nếu video có caption: Hiển thị transcript ngay bên dưới input (scrollable), đồng thời hiện CTA “Mở Video Dashboard” (navigate tới **Màn hình 3** với `youtube_video_id`).
    * Nếu video không có caption: Hiển thị lỗi `"Video này không có caption"` ngay dưới input.

### 2. Sidebar (Navigation Drawer - "My Library")
*Trượt ra từ cạnh trái. Quản lý tài nguyên.*

* **Top Section (Cố định):**
    * **[+] New Study Session:** Nút để quay lại màn hình Home trống.
    * **💎 Vocabulary Manager:** Lối tắt vào kho từ vựng (Icon nổi bật).
* **Middle Section (Scrollable - "Recent"):**
    * Label: "Recent Videos" hoặc "My Library".
    * **List Items:** Danh sách video đã học.
        * Hiển thị: Tên video (1 dòng).
        * Trạng thái: Icon nhỏ bên cạnh (VD: ✅ Đã xong, 🟠 Đang học).
    * *Action:* Tap để mở lại video đó. Long-press để Xóa/Ghim.
* **Bottom Section (Footer):**
    * **Settings:** Cài đặt giao diện (Dark/Light), Tài khoản.
    * User Profile info.

### 3. Màn hình Video Dashboard (Hub)
*Hiện ra sau khi paste link hoặc chọn video từ Sidebar. Nơi chọn chế độ học.*

* **Hero Section:** Thumbnail video lớn (làm mờ hoặc bo góc), Tiêu đề video đầy đủ.
* **Stats:** Tổng số từ vựng | Độ khó (AI đánh giá).
* **Mode Selection (3 Card lớn - Entry Points):**
    1.  **📖 Reading Mode:** Subtext: "Đọc hiểu & Tra từ". (Hiển thị % tiến độ).
    2.  **🎧 Listening Comprehension:** Subtext: "Nghe & Làm Quiz". (Hiển thị điểm số cao nhất).
    3.  **✍️ Dictation Mode:** Subtext: "Chép chính tả". (Hiển thị số câu hoàn thành).
* **Navigation:** Nút Back ở góc trái trên để về Home.

### 4. Màn hình Reading Mode (Đọc hiểu)
*Giao diện đọc văn bản chuyên sâu.*

* **Tools:** Nút chỉnh Font (Aa), Nút bật/tắt dịch song ngữ, Nút AI Summary.
* **Content:**
    * Script hiển thị dạng đoạn văn (Paragraphs), trình bày như một bài báo/ebook.
    * Cột bên phải có các mốc thời gian nhỏ (Timestamp) để định vị.
* **Interaction:**
    * **Tap từ:** Hiện Bottom Sheet tra từ điển (Nghĩa, IPA, Audio, nút "Add to Flashcard").
    * **Tap câu:** Highlight câu và phát Audio tương ứng (Mini player hiện ở dưới đáy).

### 5. Màn hình Listening Comprehension (Interactive)
*Quy trình 2 bước: Test trước - Script sau.*

**Phase A: Quiz Mode (Mặc định)**
* **Video Player:** Nằm trên cùng. **Ẩn hoàn toàn Subtitle/CC**.
* **Quiz Area:**
    * Hiển thị câu hỏi trắc nghiệm do AI sinh ra.
    * **Nút Hint:** Bấm vào sẽ tua video đến đoạn liên quan (vẫn không hiện sub).
    * **Nút Regenerate:** Tạo bộ câu hỏi mới.
* **Action:** Nút "Submit Answers".

**Phase B: Review Mode (Sau khi nộp bài)**
* **Result:** Hiển thị điểm số (VD: 8/10).
* **Action:** Nút **"Show Transcript"** xuất hiện.
* **Transcript View:**
    * Khi bấm Show Transcript, kịch bản hiện ra bên dưới video.
    * Tự động cuộn (Auto-scroll) khớp với video để user nghe lại và kiểm tra lỗi sai.

### 6. Màn hình Dictation Mode (Chép chính tả)
*Giao diện tập trung (Focus Mode).*

* **Visual:** Ẩn Video. Chỉ hiện Waveform âm thanh hoặc Progress Bar của câu hiện tại.
* **Input:** Ô nhập text lớn.
* **Controls:** Play (Replay 1 câu), Skip, Hint.
* **Feedback:** So sánh text nhập và đáp án gốc (Tô màu Xanh/Đỏ).

### 7. Màn hình Vocabulary Manager (Truy cập từ Sidebar)
* **Header:** Thống kê số từ cần ôn (SRS Due).
* **Action:** Nút to **"Start Review"**.
* **List:** Danh sách từ đã lưu. Mỗi từ có chấm màu thể hiện độ thuộc bài (New/Hard/Mastered).
* **Detail View:** Khi bấm vào từ -> Hiện nghĩa và **Câu ví dụ gốc trong video** (Kèm nút Play để xem lại ngữ cảnh).

### 8. Màn hình Flashcard Review
* Giao diện thẻ bài (Flashcard).
* **Front:** Từ vựng + Audio.
* **Back:** Nghĩa + Context Sentence.
* **Rating:** 4 nút đánh giá (Again, Hard, Good, Easy).

---

## 4. YÊU CẦU UI/UX (REQUIREMENTS)

1.  **Dark Mode:** Thiết kế mặc định hoặc ưu tiên Dark Mode (nền tối, chữ trắng) để làm nổi bật Video và tạo cảm giác "Cinematic".
2.  **Typography:** Font Sans-serif hiện đại, sạch sẽ (Inter, Roboto, SF Pro). Size chữ đọc phải đủ lớn.
3.  **Chat Metaphor:** Các hiệu ứng chuyển cảnh, loading nên mượt mà giống như đang chat với AI.
4.  Phông cơ bản là 14px để font chữ đọc phải đủ lớn.