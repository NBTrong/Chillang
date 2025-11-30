# Hướng dẫn Setup Authentication cho Local Development

## Vấn đề
Khi đăng nhập Google OAuth ở local, sau khi login thành công, nó redirect về production thay vì local.

## Nguyên nhân
Supabase chỉ cho phép redirect về các URLs đã được cấu hình trong Dashboard. Nếu local URL chưa được thêm vào danh sách, nó sẽ redirect về production URL mặc định.

## Giải pháp

### Bước 1: Thêm Local URL vào Supabase Dashboard

1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **Authentication** > **URL Configuration**
4. Trong phần **Redirect URLs**, thêm local URL của bạn:
   - `http://localhost:5173` (hoặc port mà bạn đang dùng)
   - `http://localhost:5173/**` (để cho phép tất cả paths)
5. Click **Save**

### Bước 2: Kiểm tra Site URL

Đảm bảo **Site URL** trong cùng trang cũng được set đúng:
- Cho local development: có thể để production URL hoặc local URL
- Redirect URLs sẽ override Site URL nếu match

### Bước 3: (Tùy chọn) Sử dụng Environment Variable

Nếu bạn muốn override redirect URL qua environment variable:

1. Tạo file `.env.local` trong thư mục `frontend/`:
```bash
VITE_AUTH_REDIRECT_URL=http://localhost:5173
```

2. Restart dev server sau khi thêm environment variable

### Bước 4: Test lại

1. Restart dev server nếu đang chạy
2. Thử đăng nhập lại với Google
3. Sau khi login thành công, bạn sẽ được redirect về local URL

## Lưu ý

- Nếu bạn đang dùng port khác (không phải 5173), hãy thay đổi URL tương ứng
- Có thể thêm nhiều redirect URLs (mỗi URL một dòng)
- Wildcard `/**` cho phép tất cả paths dưới domain đó

## Troubleshooting

### Vẫn redirect về production?
- Kiểm tra lại Redirect URLs trong Supabase Dashboard đã được save chưa
- Clear browser cache và cookies
- Kiểm tra console để xem có lỗi gì không

### Lỗi "redirect_uri_mismatch"?
- Đảm bảo URL trong Redirect URLs khớp chính xác với URL bạn đang dùng (bao gồm http/https, port, trailing slash)
- Kiểm tra Google OAuth Console nếu bạn tự cấu hình OAuth client


