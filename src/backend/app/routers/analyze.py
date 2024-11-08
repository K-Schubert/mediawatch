# routers/analyze.py
import os
from typing import List
from datetime import datetime
from pydantic import BaseModel
import openai

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from ..database import SessionLocal
from .. import models

import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

router = APIRouter(prefix="/analyze", tags=["analyze"])

# Set your OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

client = openai.OpenAI()

class AnnotationBase(BaseModel):
    category: str
    subcategory: str
    highlighted_text: str
    article_id: int
    user: str

class AnnotationResponse(BaseModel):
    annotations: List[AnnotationBase]

list_of_tactics = """
Category A: Manipulation of language
Reducing Responsibility
    - Passive Voice (1)
    - Minimization (28)
    - Euphemism (4)

Distorting meaning
    - Rebranding negative concepts (32)
    - Loaded language (8)
    - Glittering generalities (18)
    - Sensationalism (11)
    - Sensationalizing successes (60)

Creating confusion
    - Strategic ambiguity (7)
    - Misleading headlines (41)
    - Conflation (42)

Category B: Manipulation through distraction and diversion
    - Shifting blame or attention (X)
    - Scapegoating (16)
    - Smokescreening (30)
    - Marginalization (34)

Personal attacks
    - Ad Hominem Attacks (9)
    - Overemphasis on negative aspects of opponents (35)
    - Hasty Generalizations (33)

Category C: Manipulation of information and evidence
    - Selective presentation (X)
    - Selective reporting (3)
    - Omission (6)
    - Cherry-Picking data (7)

Presenting false or flawed evidence
    - False balance (10)
    - False equivalence (11)
    - Use of flawed studies (29)
    - Manufactured studies (36)
    - Pseudo expertise (56)

Distorting communication
    - False balance in scientific reporting (43)
    - Selective quoting (57)
    - False clarity (63)

Category D: Asymmetry in appeal to empathy
    - Appeal to Emotion (31)
    - Use of emotionally charged words
    - Personification of victims
"""

prompt = """
Analyze the following article text and extract any guard-dog tactics as annotations.

Article Text:
\"\"\"
{article_text}
\"\"\"

Guard-Dog Tactics to Detect:
{list_of_tactics}

Instructions:
1. Extract all guard-dog tactics in the article.
2. Be concise and very specific; only include tactics directly present and related to the article.
3. Provide the output as a JSON array of annotations with fields: "category", "subcategory", "highlighted_text".

Category can be either ["A", "B", "C", "D"].
Subcategory can be any of the tactics listed above with the corresponding number in parentheses.

Example Output:
[
    {{
        "category": "A",
        "subcategory": "Euphemism",
        "highlighted_text": "the phrase used in the article"
    }},
    {{
        "category": "B",
        "subcategory": "Scapegoating",
        "highlighted_text": "another phrase from the article"
    }}
]
"""

@router.post("/")
def analyze_article(article_id: int, db: Session = Depends(get_db)):
    # Fetch the article text from the database
    article = db.query(models.Article).filter(models.Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    article_text = article.text

    # Call OpenAI's API to analyze the text
    try:
        logger.info("Calling OpenAI's API to analyze the text")
        response = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            temperature=0,
            max_tokens=4092,
            messages=[
                {
                    "role": "system",
                    "content": "You are an assistant that detects guard-dog tactics in news articles and outputs annotations in JSON format."
                },
                {
                    "role": "user",
                    "content": prompt.format(article_text=article_text, list_of_tactics=list_of_tactics)
                }
            ],
            response_format=AnnotationResponse,
        )
        logger.info(f"Received response from OpenAI's API: {response}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    # Parse the assistant's reply
    try:
        annotations = response.choices[0].message.parsed.annotations
        logger.info(f"ANNOTATIONS: {annotations}")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to parse LLM response: " + str(e)) from e

    # Save annotations to the database
    saved_annotations = []
    for ann in annotations:
        new_annotation = models.Annotation(
            article_id=article_id,
            highlighted_text=ann.highlighted_text,
            category=ann.category,
            subcategory=ann.subcategory,
            timestamp=datetime.utcnow().isoformat(),
            user='placeholder_user_AI',  # Replace with actual user ID when login is implemented
            article_metadata={"source": article.source, "title": article.title}  # Example metadata, customize as needed
    )
        db.add(new_annotation)
        db.commit()
        db.refresh(new_annotation)

        # Prepare the response dictionary, excluding article_metadata if it's None
        annotation_dict = {
            "id": new_annotation.id,
            "article_id": new_annotation.article_id,
            "highlighted_text": new_annotation.highlighted_text,
            "category": new_annotation.category,
            "subcategory": new_annotation.subcategory,
            "timestamp": new_annotation.timestamp,
            "user": new_annotation.user
        }
        # Optionally include article_metadata if not None
        if new_annotation.article_metadata:
            annotation_dict["article_metadata"] = new_annotation.article_metadata

        saved_annotations.append(annotation_dict)

    return saved_annotations