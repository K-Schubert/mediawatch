from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine
from .routers import articles, options, annotations, analyze, auth

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
app.include_router(analyze.router)
app.include_router(auth.router)
