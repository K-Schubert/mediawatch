from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, UniqueConstraint, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class Article(Base):
    __tablename__ = 'articles'

    id = Column(Integer, primary_key=True, index=True)
    source = Column(Text, nullable=False)
    link = Column(Text, nullable=False, unique=True)
    author = Column(Text, nullable=False)
    title = Column(Text)
    topic = Column(Text)
    abstract = Column(Text)
    html = Column(Text)
    text = Column(Text)
    published_date = Column(TIMESTAMP)
    modified_date = Column(TIMESTAMP)
    membership = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    modified_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    language = Column(String(2), server_default='fr')
    annotations = relationship('Annotation', back_populates='article')

    __table_args__ = (
        UniqueConstraint('link', name='uq_link'),
    )

class Annotation(Base):
    __tablename__ = 'annotations'
    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey('articles.id'))
    highlighted_text = Column(Text)
    category = Column(String)
    subcategory = Column(String)
    article_metadata = Column(JSON)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    user = Column(String)  # Placeholder for user identification
    comments = relationship('Comment', back_populates='annotation', cascade='all, delete-orphan')

    article = relationship('Article', back_populates='annotations')

class Comment(Base):
    __tablename__ = 'comments'
    id = Column(Integer, primary_key=True, index=True)
    annotation_id = Column(Integer, ForeignKey('annotations.id'))
    user = Column(String)
    comment_text = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    annotation = relationship('Annotation', back_populates='comments')

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    modified_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    # Add back_populates to specify the bidirectional relationship
    annotations = relationship('Annotation', back_populates='user', cascade='all, delete-orphan')
    comments = relationship('Comment', back_populates='user', cascade='all, delete-orphan')  # Add this line
    tokens = relationship("TokenTable", back_populates="user", cascade="all, delete-orphan")

class TokenTable(Base):
    __tablename__ = "tokens"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    access_token = Column(String(450), unique=True, nullable=False)
    refresh_token = Column(String(450), nullable=False)
    status = Column(Boolean, default=True)
    created_date = Column(DateTime, server_default=func.current_timestamp())
    expires_at = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="tokens")
