# Fix Python 3.13 Compatibility Issue

## Vấn đề

Python 3.13 mới ra và một số packages (như pydantic-core 2.14.1) chưa hỗ trợ đầy đủ, gây lỗi khi build.

## Giải pháp

### Option 1: Dùng Python 3.11 hoặc 3.12 (Khuyên dùng)

```bash
# Kiểm tra Python versions có sẵn
ls -la /usr/local/bin/python3*  # Homebrew
# hoặc
which -a python3

# Nếu có Python 3.11 hoặc 3.12, dùng version đó
python3.12 -m venv venv
# hoặc
python3.11 -m venv venv

# Activate và install
source venv/bin/activate
pip install -r requirements.txt
```

### Option 2: Cài Python 3.12 qua Homebrew

```bash
# Cài Python 3.12
brew install python@3.12

# Tạo venv với Python 3.12
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Option 3: Dùng pyenv để quản lý Python versions

```bash
# Cài pyenv
brew install pyenv

# Cài Python 3.12
pyenv install 3.12.7

# Set local version
cd youtube-transcript-python
pyenv local 3.12.7

# Tạo venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Option 4: Cập nhật packages lên version mới nhất

```bash
# Activate venv
source venv/bin/activate

# Upgrade pip và install packages mới nhất
pip install --upgrade pip setuptools wheel
pip install fastapi uvicorn[standard] yt-dlp pydantic

# Hoặc cập nhật requirements.txt
pip install -r requirements.txt --upgrade
```

## Quick Fix

Nếu đang dùng Python 3.13 và muốn fix nhanh:

```bash
cd youtube-transcript-python

# Xóa venv cũ
rm -rf venv

# Tạo venv mới với Python 3.12 (nếu có)
python3.12 -m venv venv
# hoặc nếu không có, dùng Python 3.11
# python3.11 -m venv venv

# Activate
source venv/bin/activate

# Install với latest versions
pip install --upgrade pip
pip install fastapi uvicorn[standard] yt-dlp "pydantic>=2.8.0"

# Test
python main.py
```

## Kiểm tra Python version

```bash
python3 --version
# Nếu là 3.13, nên dùng 3.11 hoặc 3.12
```

## Recommended Python Version

- **Python 3.11** - Stable, well-supported
- **Python 3.12** - Latest stable, good compatibility
- **Python 3.13** - Too new, may have compatibility issues

## Docker (Không bị ảnh hưởng)

Dockerfile đã dùng Python 3.11, nên không bị ảnh hưởng:

```dockerfile
FROM python:3.11-slim
```

Deploy lên Cloud Run sẽ không có vấn đề này.





