"""Xác thực người dùng và quản lý phiên đăng nhập (Session Management) cho NetMon.

Lưu ý: Các phiên làm việc (sessions) được lưu trong bộ nhớ RAM (In-Memory),
hoàn toàn KHÔNG ghi ra file đĩa (không tạo file sessions.json) nhằm bảo mật,
tránh xung đột mã nguồn Git giữa các môi trường triển khai.
"""
import secrets
import time

VALID_USERNAME = "system"
VALID_PASSWORD = "@cronis1"
SESSION_DURATION_SECONDS = 30 * 24 * 3600  # 30 ngày

# Lưu trữ phiên đăng nhập hoàn toàn trong bộ nhớ (In-Memory)
_SESSIONS = {}


def authenticate(username, password):
    """Kiểm tra thông tin đăng nhập: system / @cronis1."""
    if username == VALID_USERNAME and password == VALID_PASSWORD:
        token = secrets.token_hex(24)
        now = time.time()
        _SESSIONS[token] = {
            "username": username,
            "created_at": now,
            "expires_at": now + SESSION_DURATION_SECONDS,
        }
        return token
    return None


def validate_token(token):
    """Kiểm tra token có hợp lệ và còn hạn không."""
    if not token or token not in _SESSIONS:
        return False
    sess = _SESSIONS[token]
    if time.time() > sess.get("expires_at", 0):
        del _SESSIONS[token]
        return False
    return True


def logout(token):
    """Xóa phiên đăng nhập."""
    if token and token in _SESSIONS:
        del _SESSIONS[token]


def get_token_from_headers(headers):
    """Trích xuất token từ Cookie hoặc Authorization header."""
    cookie_str = headers.get("Cookie", "")
    if "netmon_session=" in cookie_str:
        for part in cookie_str.split(";"):
            part = part.strip()
            if part.startswith("netmon_session="):
                return part.split("=", 1)[1]

    auth_str = headers.get("Authorization", "")
    if auth_str.startswith("Bearer "):
        return auth_str.split(" ", 1)[1]

    return None


def is_authenticated(headers):
    """Kiểm tra request có được xác thực không."""
    token = get_token_from_headers(headers)
    return validate_token(token)
