from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import SessionLocal

router = APIRouter(prefix="/annotations", tags=["annotations"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.Annotation)
def create_annotation(annotation: schemas.AnnotationCreate, db: Session = Depends(get_db)):
    db_annotation = models.Annotation(
        article_id=annotation.article_id,
        highlighted_text=annotation.highlighted_text,
        category=annotation.category,
        subcategory=annotation.subcategory,
        article_metadata=annotation.article_metadata,
        user=annotation.user
        # Do not include `timestamp` here; it will be set by the database.
    )
    db.add(db_annotation)
    db.commit()
    db.refresh(db_annotation)
    return db_annotation

@router.delete("/{annotation_id}", response_model=schemas.Annotation)
def delete_annotation(annotation_id: int, db: Session = Depends(get_db)):
    annotation = db.query(models.Annotation).filter(models.Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    db.delete(annotation)
    db.commit()
    return annotation

@router.put("/{annotation_id}", response_model=schemas.Annotation)
def update_annotation(annotation_id: int, updated_annotation: schemas.AnnotationUpdate, db: Session = Depends(get_db)):
    annotation = db.query(models.Annotation).filter(models.Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")

    # Update only the fields provided
    if updated_annotation.highlighted_text is not None:
        annotation.highlighted_text = updated_annotation.highlighted_text
    if updated_annotation.category is not None:
        annotation.category = updated_annotation.category
    if updated_annotation.subcategory is not None:
        annotation.subcategory = updated_annotation.subcategory
    if updated_annotation.timestamp is not None:
        annotation.timestamp = updated_annotation.timestamp
    if updated_annotation.user is not None:
        annotation.user = updated_annotation.user

    db.commit()
    db.refresh(annotation)
    return annotation

@router.get("/article/{article_id}", response_model=List[schemas.Annotation])
def get_annotations_by_article(article_id: int, db: Session = Depends(get_db)):
    annotations = db.query(models.Annotation).filter(
        models.Annotation.article_id == article_id
    ).order_by(models.Annotation.timestamp.asc()).all()
    return annotations

@router.post("/comments/", response_model=schemas.Comment)
def create_comment(comment: schemas.CommentCreate, db: Session = Depends(get_db)):
    db_comment = models.Comment(
        annotation_id=comment.annotation_id,
        user=comment.user,
        comment_text=comment.comment_text
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

@router.get("/user/{user_name}", response_model=List[schemas.Annotation])
def get_annotations_by_user(user_name: str, db: Session = Depends(get_db)):
    annotations = db.query(models.Annotation).filter(
        models.Annotation.user == user_name
    ).order_by(models.Annotation.timestamp.asc()).all()
    return annotations
