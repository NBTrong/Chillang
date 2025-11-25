Đây là bản tài liệu đặc tả thiết kế (Design Specifications) hoàn chỉnh và chi tiết nhất, đã cập nhật logic **Listening Comprehension (Quiz trước - Script sau)**. Bạn có thể gửi file này trực tiếp cho đội ngũ UI/UX Designer.

---

# PRODUCT DESIGN SPECS: APP HỌC NGOẠI NGỮ QUA VIDEO (TUBE STUDY)

**1. TỔNG QUAN (OVERVIEW)**
* **Mục tiêu sản phẩm:** Ứng dụng học ngoại ngữ chuyên sâu qua video YouTube, tập trung vào phương pháp "Active Recall" (Gợi nhớ chủ động) và "Context-based Learning" (Học qua ngữ cảnh).
* **Đối tượng người dùng:** Người học ngoại ngữ trình độ từ Pre-Intermediate trở lên, muốn cải thiện kỹ năng Nghe thật, Đọc hiểu và Từ vựng.
* **Phong cách thiết kế (Look & Feel):**
    * **Minimalist & Clean:** Tối giản, nhiều khoảng trắng để giảm tải nhận thức.
    * **Focus-oriented:** Loại bỏ xao nhãng, đặc biệt trong các màn hình học tập.
    * **Professional:** Màu sắc tạo cảm giác tin cậy, học thuật nhưng không nhàm chán.

**2. CẤU TRÚC ĐIỀU HƯỚNG (NAVIGATION)**
Sử dụng **Bottom Navigation Bar** với 3 Tabs chính:
1.  **Home (Thư viện):** Quản lý video và tiến độ học.
2.  **Vocabulary (Từ vựng):** Quản lý kho từ vựng và trạng thái ghi nhớ.
3.  **Settings (Cài đặt):** Tài khoản, giao diện, nhắc nhở.

---

## 3. CHI TIẾT CÁC MÀN HÌNH (DETAILED SCREENS)

### 1. Màn hình Home (My Library)
*Màn hình chính hiển thị danh sách video người dùng đã thêm.*

* **Header:**
    * Tiêu đề: "My Library" (hoặc "Thư viện").
    * **Search Icon:** Tìm kiếm video trong list.
    * **Filter Chips:** [Tất cả] [Đang học] [Đã xong].
* **Video List (Main Content):** Hiển thị dạng thẻ (Card). Mỗi thẻ gồm:
    * **Thumbnail:** Ảnh bìa video (Bên trái).
        * *Overlay "Đang xử lý":* Nếu video mới add chưa xong, phủ lớp mờ + Spinner xoay.
    * **Metadata (Bên phải):** Tiêu đề (giới hạn 2 dòng), Tên kênh, Thời lượng (VD: 10:25).
    * **Visual Progress (Điểm nhấn UX):** 3 icon nhỏ đại diện cho 3 kỹ năng, mỗi icon có vòng tròn màu bao quanh thể hiện % hoàn thành:
        * 📖 (Reading): % Đã đọc.
        * 🎧 (Listening): % Điểm Quiz trung bình.
        * ✍️ (Dictation): % Số câu đã chép.
* **Floating Action Button (FAB):** Nút tròn to dấu `+` ở góc dưới phải để thêm video.
* **Empty State:** Hình minh họa khuyến khích người dùng dán link video đầu tiên.

### 2. Màn hình Add Video (Modal/Popup)
*Hiện lên khi user nhấn nút FAB (+).*

* **Input:** Ô nhập link YouTube (Hỗ trợ auto-paste từ clipboard).
* **Preview Area:** Tự động load Thumbnail + Title video ngay khi nhận diện link hợp lệ.
* **Primary Button:** "Import Video". Khi bấm, Modal đóng lại, Toast thông báo "Đang xử lý AI...".

### 3. Màn hình Video Dashboard
*Màn hình trung tâm sau khi chọn 1 video. Đóng vai trò là "Menu chọn chế độ học".*

* **Hero Section:** Thumbnail video (làm mờ background), Tiêu đề lớn.
* **Stats:** Tổng số từ vựng | Độ khó (Easy/Medium/Hard).
* **Mode Selection (3 Card lớn):**
    1.  **📖 Reading Mode:** Subtext: "Đọc hiểu & Tra từ". (Kèm progress bar).
    2.  **🎧 Listening Comprehension:** Subtext: "Luyện nghe & Làm Quiz". (Kèm điểm số cao nhất).
    3.  **✍️ Dictation Mode:** Subtext: "Nghe chép chính tả". (Kèm số câu đã chép).
* **Secondary Actions:** Reset tiến độ, Xóa video.

### 4. Màn hình Reading Mode (Đọc hiểu)
*Giao diện tối ưu cho việc đọc văn bản dài.*

* **Top Toolbar:**
    * **Aa Menu:** Chỉnh size chữ, Font (Serif/Sans), Theme (Sáng/Tối/Vàng nhạt).
    * **AI Summary:** Icon hiển thị tóm tắt nội dung bài (Popup).
    * **Toggle:** "Song ngữ" (Hiện/Ẩn dòng dịch tiếng Việt bên dưới mỗi đoạn).
* **Content Area:**
    * Hiển thị Script dạng **Đoạn văn (Paragraphs)**, không ngắt dòng theo thời gian.
    * Cột bên phải: Các mốc thời gian nhỏ (1:00, 2:00) để định vị.
* **Interactions:**
    * **Tap vào từ:** Hiện Bottom Sheet tra từ (Nghĩa, IPA, Audio, nút "Add to Flashcard").
    * **Tap vào câu/đoạn:** Highlight câu đó và **Phát Audio** đoạn đó (Mini player hiện lên ở đáy màn hình).

### 5. Màn hình Listening Comprehension (MỚI)
*Quy trình: Nghe -> Làm Quiz -> Có kết quả -> Mới hiện Script.*

**A. Trạng thái 1: Testing Phase (Mặc định khi vào)**
* **Media Area (Trên cùng):** Video Player. **TUYỆT ĐỐI KHÔNG HIỆN SUBTITLE/CC**.
* **Quiz Area (Dưới):**
    * Hiển thị câu hỏi trắc nghiệm (Gen bởi AI).
    * Các lựa chọn A, B, C, D.
    * **Nút "Hint" (Gợi ý):** Bấm vào sẽ tua video đến đoạn chứa câu trả lời (nhưng vẫn không hiện sub).
    * **Nút "Regenerate Quiz":** Icon reload để AI tạo bộ câu hỏi khác.
* **Navigation:** Next / Previous câu hỏi.
* **Bottom Action:** Nút **"Submit Answers"** (Nộp bài).

**B. Trạng thái 2: Review Phase (Sau khi nộp bài)**
* **Result Header:** Hiển thị điểm số (VD: 8/10). List các câu đúng/sai.
* **Tabs:** [Quiz Review] | [Full Transcript].
* **Full Transcript View (Mới xuất hiện):**
    * Lúc này mới hiện toàn bộ Script.
    * Script tự động cuộn (Auto-scroll) theo video (Karaoke effect).
    * Người dùng nghe lại để đối chiếu xem tại sao mình làm sai.

### 6. Màn hình Dictation Mode (Chép chính tả)
*Giao diện tập trung cao độ.*

* **Focus UI:** Ẩn Video Player, chỉ hiện thanh sóng âm (Waveform) hoặc Progress Bar của câu hiện tại.
* **Controls:** Play (Replay câu hiện tại), Slow (0.75x), Skip (Bỏ qua câu này).
* **Input Field:** Vùng nhập văn bản lớn.
* **Feedback Mechanism:**
    * Sau khi user bấm "Check":
    * Không xóa text của user.
    * Dùng màu sắc: **Xanh lá** cho từ đúng, **Đỏ** cho từ sai/thiếu.
    * Hiển thị đáp án đúng ngay bên dưới để so sánh.

### 7. Màn hình Vocabulary Manager (Kho từ vựng)
*Tab 2 trên Bottom Bar. Nơi quản lý "tài sản" kiến thức.*

* **Stats Header:** "Cần ôn tập hôm nay: 25 từ".
* **Action Button:** Nút lớn **"Start Review Session"** (Bắt đầu học Flashcard).
* **Vocab List:** Danh sách cuộn vô tận.
    * **Sort/Filter:** Mới nhất, Theo video, Theo SRS Level (New/Learning/Mastered).
    * **Item:** Từ vựng (Bold) + Nghĩa (Grey) + Chấm màu trạng thái (Đỏ/Vàng/Xanh).

### 8. Màn hình Word Detail (Chi tiết từ)
*Hiện ra khi bấm vào một từ trong list.*

* **Info:** Word, IPA, Meaning, User's Note.
* **Context Card (Tính năng Killer):**
    * Trích dẫn câu gốc chứa từ đó trong video.
    * **Nút Play Video:** Bấm vào sẽ mở Video Player (dạng Overlay hoặc chuyển sang màn Listening) và **Seek** ngay đến giây xuất hiện câu đó.

### 9. Màn hình Flashcard Review (Học từ)
*Giao diện Spaced Repetition System (SRS).*

* **Mặt trước:** Từ vựng + Nút nghe Audio (Audio cắt từ video gốc).
* **Tap để lật thẻ.**
* **Mặt sau:** Nghĩa + Câu ví dụ (Context) + IPA.
* **Rating Buttons:** 4 nút ở đáy màn hình:
    1.  **Again (Quên):** Màu đỏ.
    2.  **Hard (Khó):** Màu cam.
    3.  **Good (Nhớ):** Màu xanh dương.
    4.  **Easy (Dễ):** Màu xanh lá.

---

## 4. YÊU CẦU UI & UX (REQUIREMENTS)

1.  **Dark Mode:** Bắt buộc có thiết kế Dark Mode hoàn chỉnh (ưu tiên nền đen sâu hoặc xám than để làm nổi bật Video và Text).
2.  **Typography:**
    * Sử dụng Font Sans-serif hiện đại, dễ đọc trên mobile (Inter, Roboto, SF Pro).
    * Cỡ chữ mặc định cần đủ lớn (tối thiểu 16px cho body text).
3.  **Loading States:** Vì app sử dụng AI (Gen quiz, Lấy sub), cần thiết kế các hiệu ứng Skeleton Loading hoặc Spinner đẹp mắt để user không cảm thấy app bị đơ.
4.  **Màu sắc định danh (Brand Colors - Gợi ý):**
    * **Primary:** Deep Blue (Học thuật, Tin cậy).
    * **Secondary:** Vibrant Orange (Năng động, Kêu gọi hành động).
    * **Success/Error:** Green / Red chuẩn UI.