from sentence_transformers import SentenceTransformer
from threading import Lock
from core.logger import logger
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import Dict, List, Optional, Tuple
import re
import torch

LANG_RESOURCES = {
    "zh": {
        # 通用
        "todo_words": ["todo", "待办", "待辦", "任务", "任務"],
        "note_words": ["笔记", "页面", "page", "note"],
        "create_words": ["添加", "新增", "创建", "加上", "新建"],
        "create_note_words": ["新建", "创建", "新增", "建一个", "新起一篇"],
        "title_markers": ["标题", "题目", "標題", "題目"],
        "priority_high": ["高优先", "优先级高"],
        "priority_low": ["低优先", "优先级低"],
        "today": ["今天", "今日"],
        "tomorrow": ["明天"],
        "day_after_tomorrow": ["后天"],
        "next_monday": ["下周一"],

        # 角色/创作/辅助类
        "role_play_words": ["扮演", "假设你是", "请作为", "充当", "以…身份"],
        "brainstorm_words": ["头脑风暴", "灵感", "想法", "点子"],
        "story_words": ["写一个故事", "创作一个故事", "故事开头", "剧情"],
        "summary_words": ["总结", "概括", "提炼要点", "生成摘要"],
        "rewrite_words": ["改写", "润色", "优化表述", "提升语气"],
        "translate_words": ["翻译", "翻到", "译成", "翻成"],
        "idea_words": ["构思", "想法", "主题", "方向"],
        "character_words": ["人物设定", "角色介绍", "性格特点", "背景故事"],
    },
    "en": {
        "todo_words": ["todo", "task", "to-do"],
        "note_words": ["note", "page", "document"],
        "create_words": ["add", "create", "new", "make"],
        "create_note_words": ["create", "add", "make", "write"],
        "title_markers": ["title", "called", "named"],
        "priority_high": ["high priority"],
        "priority_low": ["low priority"],
        "today": ["today"],
        "tomorrow": ["tomorrow"],
        "day_after_tomorrow": ["day after tomorrow"],
        "next_monday": ["next monday"],

        # Roleplay & creative intents
        "role_play_words": ["act as", "pretend to be", "roleplay", "you are"],
        "brainstorm_words": ["brainstorm", "ideas", "inspiration"],
        "story_words": ["write a story", "create a story", "plot", "scenario"],
        "summary_words": ["summarize", "tl;dr", "short summary"],
        "rewrite_words": ["rewrite", "polish", "refine"],
        "translate_words": ["translate", "to english", "to chinese"],
        "idea_words": ["generate ideas", "concept", "direction"],
        "character_words": ["character", "persona", "background", "personality"],
    }
}

INTENTS = {
    "create_todo": [
        "添加一个待办", "创建任务", "新增todo", "建立待办事项",
        "create a todo", "add a task", "new todo", "create a to-do", "add a to-do"
    ],
    "create_note": [
        "创建一篇笔记", "新建页面", "创建note",
        "create a note", "add a new page"
    ],
    "role_play": [
        "请扮演一名 …", "假设你是 …", "充当 … 的角色",
        "act as …", "pretend to be …", "you are …", "roleplay …"
    ],
    "brainstorm": [
        "帮我头脑风暴一下", "生成一些灵感", "想法清单", 
        "brainstorm ideas", "give me some inspiration", "list ideas"
    ],

    "story_write": [
        "写一个故事", "创作一个短篇", "生成剧情", 
        "write a story", "create a story", "generate a plot"
    ],

    "summary": [
        "请总结这篇笔记", "生成摘要", "提炼要点",
        "summarize this note", "give me a summary"
    ],

    "rewrite": [
        "帮我润色这段文字", "优化表达", "改写得更自然",
        "rewrite this text", "polish the paragraph"
    ],

    "translate": [
        "翻译成英文", "翻译成中文",
        "translate to English", "translate to Chinese"
    ],

    "idea_generate": [
        "生成一些想法", "给我几个主题方向", "头脑风暴新点子",
        "give me ideas", "generate creative directions"
    ],

    "character_build": [
        "创建人物设定", "帮我设计角色背景", "角色档案",
        "create a character", "build a persona", "character background"
    ],
}

ACTS = {
  "confirm": ["确认", "好的", "就这样", "ok", "yes", "go ahead"],
  "cancel":  ["取消", "算了", "先不要", "别", "no", "stop", "cancel"],
  "amend":   ["改成明天", "改标题为…", "优先级设高", "status 改成进行中"],
  "clarify": ["明天", "高优先", "标题叫…"],
  "select":  ["选第一个", "第二个", "就是‘跑步’那条"],
}

PRIORITY_ENUM = {"low", "normal", "high"}



@dataclass
class Slots:
    title: str
    due_date: Optional[str] = None  # YYYY-MM-DD or None
    priority: str = "normal"        # low|normal|high
    project_id: Optional[str] = None
    locale: str = "zh"

    def normalize(self) -> "Slots":
        p = (self.priority or "normal").lower()
        self.priority = p if p in PRIORITY_ENUM else "normal"
        if self.due_date and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", self.due_date):
            self.due_date = None
        return self

@dataclass
class IntentCandidate:
    intent: str
    confidence: float
    slots: Slots
    raw_text: str

    def to_dict(self) -> dict:
        d = asdict(self)
        d["slots"] = asdict(self.slots)
        return d

class SemanticService:
    _instance = None
    _lock = Lock()
    ACT_THRESH = 0.75
    INTENT_THRESH = 0.60

    def __new__(cls, model_name: str = "all-MiniLM-L6-v2"):
        # 单例模式，确保只加载一次模型
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    logger.info(f"[SemanticService] Loading model: {model_name}")
                    cls._instance = super().__new__(cls)
                    cls._instance.model = SentenceTransformer(model_name)
        return cls._instance

    def embed(self, text: str, normalize: bool = True) -> list[float]:
        if not text:
            return []
        emb = self.model.encode(text, normalize_embeddings=normalize)
        return emb.tolist()

    def embed_batch(self, texts: list[str], normalize: bool = True) -> list[list[float]]:
        return self.model.encode(texts, normalize_embeddings=normalize).tolist()


    def intent_analyze(self, text: str) ->  Tuple[str, float]:
        centroids = self.get_intent_centroids()
        q = self.model.encode([text], convert_to_tensor=True, normalize_embeddings=True)[0]
        
        best, score = None, -1.0
        for intent, centroid in centroids.items():
            sim = torch.nn.functional.cosine_similarity(q, centroid, dim=0).item()
            if sim > score:
                best, score = intent, sim

        if best is None or score < self.INTENT_THRESH:
            return "unknown", score
        
        return best, score
        
    
    def action_analyze(self, text: str) -> Tuple[str, float]:
        centroids = self.get_act_centroids()
        q = self.model.encode([text], convert_to_tensor=True, normalize_embeddings=True)[0]
        
        best, score = None, -1.0
        for act, centroid in centroids.items():
            sim = torch.nn.functional.cosine_similarity(q, centroid, dim=0).item()
            if sim > score:
                best, score = act, sim

        if best is None or score < self.ACT_THRESH:
            return "none", score
        logger.info(f"[Action Analyze] text={text}, act={best}, score={score:.4f}")
        return best, score

    @lru_cache(maxsize=1)
    def get_intent_centroids(self) -> Dict[str, torch.Tensor]:
        centroids: Dict[str, torch.Tensor] = {}
        for name, samples in INTENTS.items():
            v = self.model.encode(samples, convert_to_tensor=True, normalize_embeddings=True)
            centroids[name] = v.mean(dim=0)
        return centroids
    

    @lru_cache(maxsize=1)
    def get_act_centroids(self) -> Dict[str, torch.Tensor]:
        centroids: Dict[str, torch.Tensor] = {}
        for name, samples in ACTS.items():
            v = self.model.encode(samples, convert_to_tensor=True, normalize_embeddings=True)
            centroids[name] = v.mean(dim=0)
        return centroids