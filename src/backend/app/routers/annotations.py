from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import SessionLocal
from ..routers.auth import oauth2_scheme, get_user_from_token
from .auth import get_current_user

router = APIRouter(
    prefix="/annotations",
    tags=["annotations"],
    dependencies=[Depends(get_current_user)]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.Annotation)
def create_annotation(annotation: schemas.AnnotationCreate, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    current_user = get_user_from_token(token, db)
    db_annotation = models.Annotation(
        article_id=annotation.article_id,
        highlighted_text=annotation.highlighted_text,
        start_position=annotation.start_position,
        end_position=annotation.end_position,
        category=annotation.category,
        subcategory=annotation.subcategory,
        article_metadata=annotation.article_metadata,
        user_id=current_user.id,
        username=current_user.username
    )
    db.add(db_annotation)
    db.commit()
    db.refresh(db_annotation)
    return db_annotation

@router.delete("/{annotation_id}", response_model=schemas.Annotation)
def delete_annotation(annotation_id: int, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    current_user = get_user_from_token(token, db)
    annotation = db.query(models.Annotation).filter(models.Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    if annotation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this annotation")
    db.delete(annotation)
    db.commit()
    return annotation

@router.put("/{annotation_id}", response_model=schemas.Annotation)
def update_annotation(annotation_id: int, updated_annotation: schemas.AnnotationUpdate, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    current_user = get_user_from_token(token, db)
    annotation = db.query(models.Annotation).filter(models.Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    if annotation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this annotation")

    # Update only category, subcategory and timestamp
    if updated_annotation.category is not None:
        annotation.category = updated_annotation.category
    if updated_annotation.subcategory is not None:
        annotation.subcategory = updated_annotation.subcategory
    if updated_annotation.timestamp is not None:
        annotation.timestamp = updated_annotation.timestamp

    # Keep existing positions and text
    annotation.start_position = annotation.start_position
    annotation.end_position = annotation.end_position
    annotation.highlighted_text = annotation.highlighted_text

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
def create_comment(comment: schemas.CommentCreate, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    current_user = get_user_from_token(token, db)
    db_comment = models.Comment(
        annotation_id=comment.annotation_id,
        comment_text=comment.comment_text,
        user_id=current_user.id,
        username=current_user.username
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

@router.delete("/comments/{comment_id}", response_model=schemas.Comment)
def delete_comment(comment_id: int, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    current_user = get_user_from_token(token, db)
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    db.delete(comment)
    db.commit()
    return comment

@router.get("/user/{user_name}", response_model=List[schemas.Annotation])
def get_annotations_by_user(user_name: str, db: Session = Depends(get_db)):
    annotations = db.query(models.Annotation).filter(
        models.Annotation.user == user_name
    ).order_by(models.Annotation.timestamp.asc()).all()
    return annotations

@router.delete("/article/{article_id}/all", response_model=List[schemas.Annotation])
def delete_all_article_annotations(article_id: int, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    current_user = get_user_from_token(token, db)
    annotations = db.query(models.Annotation).filter(
        models.Annotation.article_id == article_id,
        models.Annotation.user_id == current_user.id
    ).all()

    if not annotations:
        raise HTTPException(status_code=404, detail="No annotations found for this article")

    # Store annotations before deletion for return value
    deleted_annotations = [annotation for annotation in annotations]

    # Delete all annotations
    for annotation in annotations:
        db.delete(annotation)

    db.commit()
    return deleted_annotations
