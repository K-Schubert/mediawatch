from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
import os
import openai

# Load environment variables if necessary (e.g., via dotenv)
openai.api_key = os.getenv("OPENAI_API_KEY")

from .. import models, schemas
from ..database import SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

router = APIRouter()

class AnalyzeRequest(BaseModel):
    article_id: int

@router.post("/analyze")
def analyze_text(request: AnalyzeRequest, db: Session = Depends(get_db)):
    # Fetch the article text from the database
    article = db.query(models.Article).filter(models.Article.id == request.article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    # Generate a prompt and call OpenAI API
    prompt = generate_prompt(article.text)
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=prompt,
            temperature=0.2,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {e}")

    # Parse the response to extract annotations
    annotations = parse_response(response, article.id)

    # Save annotations to the database
    for annotation in annotations:
        db_annotation = models.Annotation(
            article_id=annotation['article_id'],
            highlighted_text=annotation['highlighted_text'],
            category=annotation['category'],
            subcategory=annotation['subcategory'],
            timestamp=annotation['timestamp'],
            user='auto_generated',  # Indicate that these are auto-generated
        )
        db.add(db_annotation)
    db.commit()

    # Return the saved annotations
    return annotations

def generate_prompt(article_text):
    return [
        {"role": "system", "content": "You are an assistant that analyzes articles and identifies manipulative techniques."},
        {"role": "user", "content": f"Analyze the following article text:\n\n{article_text}\n\nProvide a JSON array with annotations including the highlighted text, category, and subcategory."}
    ]

def parse_response(response, article_id):
    import json

    # Extract and parse response
    assistant_reply = response.choices[0].message['content'].strip()
    try:
        annotations = json.loads(assistant_reply)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Error parsing OpenAI response: {e}")

    # Add required fields
    for annotation in annotations:
        annotation['article_id'] = article_id
        annotation['timestamp'] = datetime.utcnow().isoformat()

    return annotations
