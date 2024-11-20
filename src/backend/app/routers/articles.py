from typing import Optional, List, Dict
import csv
from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from sqlalchemy import and_
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import SessionLocal
from .auth import get_current_user


router = APIRouter(
    prefix="/articles",
    tags=["articles"],
    dependencies=[Depends(get_current_user)]
)

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
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Article)

    if q:
        query = query.filter(
            models.Article.source.ilike(f"%{q}%") |
            models.Article.link.ilike(f"%{q}%") |
            models.Article.author.ilike(f"%{q}%") |
            models.Article.title.ilike(f"%{q}%") |
            models.Article.topic.ilike(f"%{q}%") |
            models.Article.abstract.ilike(f"%{q}%") |
            models.Article.text.ilike(f"%{q}%")
        )

    if start_date and end_date:
        query = query.filter(
            and_(
                models.Article.published_date >= start_date,
                models.Article.published_date <= end_date
            )
        )
    elif start_date:
        query = query.filter(models.Article.published_date >= start_date)
    elif end_date:
        query = query.filter(models.Article.published_date <= end_date)

    if source:
        query = query.filter(models.Article.source.ilike(f"%{source}%"))

    articles = query.all()
    return articles

@router.get("/article/{article_id}", response_model=List[schemas.Annotation])
def get_annotations_by_article(article_id: int, db: Session = Depends(get_db)):
    annotations = db.query(models.Annotation).filter(
        models.Annotation.article_id == article_id
    ).order_by(models.Annotation.timestamp.asc()).all()
    return annotations

@router.post("/upload-csv", response_model=Dict)
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV file.")

    articles = []
    content = await file.read()
    decoded_content = content.decode('utf-8').splitlines()
    reader = csv.DictReader(decoded_content)

    for row in reader:
        # Validate required fields
        if not row['source'] or not row['link'] or not row['title']:
            continue  # Skip rows with missing required fields

        article = models.Article(
            source=row['source'],
            link=row['link'],
            author=row.get('author'),
            title=row['title'],
            topic=row.get('topic'),
            abstract=row.get('abstract'),
            html=row.get('html'),
            text=row.get('text'),
            published_date=row.get('published_date'),
            modified_date=row.get('modified_date'),
            membership=row.get('membership'),
            language=row.get('language')
        )
        db.add(article)
        articles.append(article)

    db.commit()
    for article in articles:
        db.refresh(article)

    return {"articles": f"Uploaded {len(articles)} articles successfully"}
