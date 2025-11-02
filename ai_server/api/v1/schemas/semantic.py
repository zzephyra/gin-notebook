from pydantic import BaseModel, Field


class EmbedRequest(BaseModel):
    text: str = Field(..., example="Hello, Mameos!")

class EmbedResponse(BaseModel):
    embeddings: list[float] = Field(
        ...,
        example=[
            0.1, 0.2, 0.3, 0.4
        ],
    )


class IntentRequest(BaseModel):
    text: str = Field(
        ...,
        example="帮我创建一个关于人工智能的笔记",
    )

class IntentResponse(BaseModel):
    intent: str = Field(..., example="create_note")
    score: float = Field(..., example=0.95)



class ActionRequest(BaseModel):
    text: str = Field(
        ...,
        example="修改todo状态为完成",
    )

class ActionResponse(BaseModel):
    action: str = Field(..., example="amend")
    score: float = Field(..., example=0.95)

