from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine
from .routers import articles, options, annotations, analyze

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Add CORS middleware
origins = [
    "http://localhost:3000",
    # Add other origins if necessary
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(articles.router)
app.include_router(options.router)
app.include_router(annotations.router)

# TO DO: create routers/analyze.py
from pydantic import BaseModel

class AnalyzeRequest(BaseModel):
    text: str

@app.post("/analyze")
def analyze_text(request: AnalyzeRequest):
    analyzed_text = request.text + " TEST"
    return {"analyzed_text": analyzed_text}
