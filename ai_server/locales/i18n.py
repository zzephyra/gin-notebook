from __future__ import annotations
from typing import Dict, Iterable, Optional
from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi import HTTPException
from pydantic_i18n import PydanticI18n
import json
import os
import threading
import time

# --- module-level state ---
_lock = threading.RLock()
_i18n: Optional[PydanticI18n] = None
_locales_dir: str = "locales"
_supported: tuple[str, ...] = ("en", "zh")
_default: str = "en"
_last_mtime: float = 0.0
_enable_hot_reload: bool = False

def _load_locales(locales_dir: str, supported: Iterable[str]) -> Dict[str, Dict]:
    data: Dict[str, Dict] = {}
    for lang in supported:
        path = os.path.join(locales_dir, f"{lang}.json")
        if not os.path.exists(path):
            data[lang] = {}
            continue
        with open(path, "r", encoding="utf-8") as f:
            data[lang] = json.load(f)
    return data

def init_i18n(
    locales_dir: str = "locales",
    supported: Iterable[str] = ("en", "zh"),
    default_locale: str = "en",
    hot_reload: bool = False,
) -> None:
    """在应用启动时调用一次"""
    global _i18n, _locales_dir, _supported, _default, _last_mtime, _enable_hot_reload
    with _lock:
        _locales_dir = locales_dir
        _supported = tuple(supported)
        _default = default_locale
        _enable_hot_reload = hot_reload
        _i18n = PydanticI18n(_load_locales(_locales_dir, _supported), default_locale=default_locale)
        _last_mtime = _calc_dir_mtime(_locales_dir)

def _calc_dir_mtime(path: str) -> float:
    latest = 0.0
    if not os.path.isdir(path):
        return latest
    for fn in os.listdir(path):
        if fn.endswith(".json"):
            latest = max(latest, os.path.getmtime(os.path.join(path, fn)))
    return latest

def _maybe_hot_reload() -> None:
    if not _enable_hot_reload:
        return
    global _last_mtime, _i18n
    current = _calc_dir_mtime(_locales_dir)
    if current > _last_mtime:
        with _lock:
            # 二次检查，避免并发重复加载
            cur2 = _calc_dir_mtime(_locales_dir)
            if cur2 > _last_mtime:
                _i18n = PydanticI18n(_load_locales(_locales_dir, _supported))
                _last_mtime = cur2

def get_locale(request: Request) -> str:
    """解析请求语言：query > cookie > header；仅返回受支持语言"""
    # 可缓存到 request.state，加速二次访问
    if hasattr(request.state, "locale") and request.state.locale:
        return request.state.locale

    lang = request.query_params.get("lang") or request.cookies.get("lang")
    if not lang:
        accept = request.headers.get("Accept-Language", "")
        lang = accept.split(",")[0] if accept else _default
    lang = lang.lower()
    if lang.startswith("zh"):
        locale = "zh" if "zh" in _supported else _default
    elif lang.startswith("en"):
        locale = "en" if "en" in _supported else _default
    else:
        # 简单回退：不认识的语言统一回默认
        locale = _default

    request.state.locale = locale
    return locale

def translate_validation_errors(exc: RequestValidationError, locale: str) -> list[dict]:
    """翻译 Pydantic 校验错误"""
    _maybe_hot_reload()
    assert _i18n is not None, "init_i18n() must be called first"
    return _i18n.translate(exc.errors(), locale=locale)

def t(key: str, locale: str, **ctx) -> str:
    """业务错误/普通提示翻译：查不到则返回 key 本身"""
    _maybe_hot_reload()
    assert _i18n is not None, "init_i18n() must be called first"
    template = _i18n.locales.get(locale, {}).get(key) or key
    try:
        return template.format(**ctx) if ctx else template
    except Exception:
        # 占位符不匹配时回退原模板，避免 500
        return template

# --- 统一异常处理 ---

def validation_exception_handler():
    async def _handler(request: Request, exc: RequestValidationError):
        locale = get_locale(request)
        return JSONResponse(
            status_code=422,
            content={"detail": translate_validation_errors(exc, locale)}
        )
    return _handler

def http_exception_handler():
    async def _handler(request: Request, exc: HTTPException):
        """
        仅当 detail 是 {"error":{"key": "...", "ctx": {...}}} 结构时做翻译
        其他 HTTPException 原样返回
        """
        locale = get_locale(request)
        detail = exc.detail
        if isinstance(detail, dict):
            err = detail.get("error")
            if isinstance(err, dict) and "key" in err:
                key = err["key"]
                ctx = err.get("ctx", {}) or {}
                return JSONResponse(
                    status_code=exc.status_code,
                    content={"detail": {"message": t(key, locale, **ctx), "key": key, "ctx": ctx}}
                )
        return JSONResponse(status_code=exc.status_code, content={"detail": detail})
    return _handler

# --- 工具：抛业务错误 ---

def business_error(key: str, status_code: int = 400, **ctx) -> HTTPException:
    """
    在路由/服务层使用：
    raise business_error(ERROR_GET_INTENT, 500)
    """
    return HTTPException(status_code=status_code, detail={"error": {"key": key, "ctx": ctx}})
