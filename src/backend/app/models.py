from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, UniqueConstraint, DateTime, ForeignKey, JSON
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
