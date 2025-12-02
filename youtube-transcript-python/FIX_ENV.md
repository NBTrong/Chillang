# Fix .env File Not Loading

## Vấn đề

Đã tạo file `.env` nhưng vẫn bị báo lỗi `API_KEY not set in environment`.

## Nguyên nhân

Python không tự động load file `.env`. Cần dùng thư viện `python-dotenv` để load.

## Đã fix

1. ✅ Đã thêm `python-dotenv` vào `requirements.txt`
2. ✅ Đã thêm `load_dotenv()` vào `main.py`

## Cách fix

### Bước 1: Cài python-dotenv

```bash
# Activate virtual environment
source venv/bin/activate

# Cài python-dotenv
pip install python-dotenv

# Hoặc cài lại tất cả dependencies
pip install -r requirements.txt
```

### Bước 2: Kiểm tra file .env

Đảm bảo file `.env` có format đúng:

```bash
# Trong thư mục youtube-transcript-python
cat .env
```

Format đúng:
```
API_KEY=your-secret-api-key-here
REQUIRE_API_KEY=true
PORT=8000
```

**Lưu ý:**
- Không có spaces xung quanh dấu `=`
- Không có quotes (trừ khi giá trị có spaces)
- Mỗi biến một dòng

### Bước 3: Test lại

```bash
# Activate venv
source venv/bin/activate

# Chạy service
python main.py
```

Bây giờ sẽ không còn warning nữa.

## Kiểm tra .env có được load không

Thêm vào `main.py` để debug:

```python
from dotenv import load_dotenv
load_dotenv()

# Debug: print environment variables
import os
print(f"API_KEY from env: {os.getenv('API_KEY', 'NOT SET')}")
print(f"REQUIRE_API_KEY: {os.getenv('REQUIRE_API_KEY', 'NOT SET')}")
```

## Troubleshooting

### Vẫn không load được

1. **Kiểm tra file .env có đúng vị trí không:**
   ```bash
   # Phải ở cùng thư mục với main.py
   ls -la .env
   ```

2. **Kiểm tra format .env:**
   ```bash
   # Không nên có spaces
   API_KEY=value  # ✅ Đúng
   API_KEY = value  # ❌ Sai
   ```

3. **Kiểm tra python-dotenv đã cài chưa:**
   ```bash
   pip list | grep dotenv
   ```

4. **Thử load thủ công:**
   ```python
   from dotenv import load_dotenv
   import os
   
   # Load từ đường dẫn cụ thể
   load_dotenv('.env')
   
   # Hoặc đường dẫn đầy đủ
   load_dotenv('/path/to/youtube-transcript-python/.env')
   
   print(os.getenv('API_KEY'))
   ```

## Alternative: Dùng environment variables trực tiếp

Nếu không muốn dùng .env file:

```bash
# Export trước khi chạy
export API_KEY=your-key
export REQUIRE_API_KEY=true
python main.py
```

## Quick Fix Command

```bash
cd youtube-transcript-python
source venv/bin/activate
pip install python-dotenv
python main.py
```






