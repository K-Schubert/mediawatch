from pydantic import BaseModel
from typing import Optional, List, Dict, Any
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
    comment_text: str

class CommentCreate(CommentBase):
    pass

class Comment(CommentBase):
    id: int
    timestamp: datetime
    username: str
    user_id: int

    class Config:
        orm_mode = True

class AnnotationBase(BaseModel):
    article_id: int
    highlighted_text: str
    start_position: int
    end_position: int
    category: str
    subcategory: str
    article_metadata: Optional[Dict[str, Any]] = None

class AnnotationCreate(AnnotationBase):
    pass

class Annotation(AnnotationBase):
    id: int
    timestamp: datetime
    comments: List[Comment] = []
    user_id: int
    username: str

    class Config:
        orm_mode = True

class AnnotationUpdate(BaseModel):
    highlighted_text: Optional[str] = None
    start_position: int  # Change to required
    end_position: int    # Change to required
    category: Optional[str] = None
    subcategory: Optional[str] = None
    timestamp: Optional[datetime] = None
    user: Optional[str] = None

    class Config:
        orm_mode = True

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    role: Optional[str] = None

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
