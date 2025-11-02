from pydantic import BaseModel, Field
from typing import Generic, TypeVar

T = TypeVar("T")

class Error(BaseModel):
    code: str = Field(..., examples=["VALIDATION_ERROR"])
    message: str

class Envelope(BaseModel, Generic[T]):
    data: T | None = None
    error: Error | None = None

