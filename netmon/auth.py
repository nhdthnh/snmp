"""Xác thực người dùng và quản lý phiên đăng nhập (Session Management) cho NetMon."""
import json
import os
import secrets
import time
from pathlib import Path

from . import config

VALID_USERNAME = "system"
VALID_PASSWORD = "@cronis1"
SESSION_DURATION_SECONDS = 30 * 24 * 3600  # 30 ngày

SESSIONS_FILE = config.DATA_DIR / "sessions.json"

_SESSIONS = {}


def _load_sessions():
    global _SESSIONS
    if SESSIONS_FILE.is_file():
        try:
            with open(SESSIONS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                now = time.time()
                # Chỉ nạp các phiên chưa hết hạn
                _SESSIONS = {
                    tok: sess for tok, sess in data.items()
                    if sess.get("expires_at", 0) > now
                }
        except Exception:
            _SESSIONS = {}


def _save_sessions():
    try:
        config.DATA_DIR.mkdir(parents=True, exist_ok=True)
        with open(SESSIONS_FILE, "w", encoding="utf-8") as f:
            json.dump(_SESSIONS, f, indent=2)
    except Exception:
        pass


# Khởi động nạp session từ đĩa
_load_sessions()


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
        _save_sessions()
        return token
    return None


def validate_token(token):
    """Kiểm tra token có hợp lệ và còn hạn không."""
    if not token or token not in _SESSIONS:
        return False
    sess = _SESSIONS[token]
    if time.time() > sess.get("expires_at", 0):
        del _SESSIONS[token]
        _save_sessions()
        return False
    return True


def logout(token):
    """Xóa phiên đăng nhập."""
    if token and token in _SESSIONS:
        del _SESSIONS[token]
        _save_sessions()


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
