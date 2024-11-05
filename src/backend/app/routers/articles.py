from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import SessionLocal

router = APIRouter(prefix="/articles", tags=["articles"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/article", response_model=schemas.Article)
def create_article(article: schemas.ArticleCreate, db: Session = Depends(get_db)):
    db_article = models.Article(source=article.source,
                                link=article.link,
                                author=article.author,
                                title=article.title,
                                topic=article.topic,
                                abstract=article.abstract,
                                html=article.html,
                                text=article.text,
                                published_date=article.published_date,
                                modified_date=article.modified_date,
                                membership=article.membership,
                                language=article.language)

    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article

@router.get("/", response_model=List[schemas.Article])
def read_articles(
    q: Optional[str] = Query(None, min_length=1, max_length=50),
    db: Session = Depends(get_db)
):
    if q:
        articles = db.query(models.Article).filter(
            models.Article.source.ilike(f"%{q}%") |
            models.Article.link.ilike(f"%{q}%") |
            models.Article.author.ilike(f"%{q}%") |
            models.Article.title.ilike(f"%{q}%") |
            models.Article.text.ilike(f"%{q}%")
        ).all()
    else:
        articles = db.query(models.Article).all()
    return articles

@router.get("/article/{article_id}", response_model=List[schemas.Annotation])
def get_annotations_by_article(article_id: int, db: Session = Depends(get_db)):
    annotations = db.query(models.Annotation).filter(
        models.Annotation.article_id == article_id
    ).order_by(models.Annotation.timestamp.asc()).all()
    return annotations
