from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ArticleBase(BaseModel):
    source: str
    link: str
    author: str
    title: Optional[str] = None
    topic: Optional[str] = None
    abstract: Optional[str] = None
    html: Optional[str] = None
    text: Optional[str] = None
    published_date: Optional[datetime] = None
    modified_date: Optional[datetime] = None
    membership: Optional[str] = None
    language: Optional[str] = 'fr'

class ArticleCreate(ArticleBase):
    pass

class Article(ArticleBase):
    id: int
    created_at: datetime
    modified_at: datetime

    class Config:
        orm_mode = True

class CommentBase(BaseModel):
    annotation_id: int
    user: str
    comment_text: str

class CommentCreate(CommentBase):
    pass

class Comment(CommentBase):
    id: int
    timestamp: datetime

    class Config:
        orm_mode = True

class AnnotationBase(BaseModel):
    article_id: int
    highlighted_text: str
    category: str
    subcategory: str
    article_metadata: Optional[dict] = None
    user: str

class AnnotationCreate(AnnotationBase):
    pass

class Annotation(AnnotationBase):
    id: int
    timestamp: datetime
    comments: List[Comment] = []

    class Config:
        orm_mode = True

class AnnotationUpdate(BaseModel):
    highlighted_text: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    timestamp: Optional[datetime] = None
    user: Optional[str] = None

    class Config:
        orm_mode = True
