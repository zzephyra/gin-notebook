import logging
import sys
from core.config import settings
LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"

def get_logger(name: str = "app") -> logging.Logger:
    """
    获取一个项目级别统一配置的 logger。
    """
    logger = logging.getLogger(name)
    if not logger.handlers:  # 防止重复添加 handler
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(LOG_FORMAT)
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


# 预置一个全局 logger 方便直接使用
logger = get_logger(settings.APP_NAME)
