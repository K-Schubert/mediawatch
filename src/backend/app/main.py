from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine
from .routers import articles, options, annotations, analyze, auth
from .routers.auth import get_current_user
from fastapi.openapi.docs import get_swagger_ui_html

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

app.include_router(auth.router)
app.include_router(annotations.router, dependencies=[Depends(get_current_user)])
app.include_router(options.router)
app.include_router(analyze.router, dependencies=[Depends(get_current_user)])
app.include_router(articles.router, dependencies=[Depends(get_current_user)])

# Secure Swagger UI
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html(request: Request, user=Depends(get_current_user)):
    return get_swagger_ui_html(openapi_url="/openapi.json", title="API Docs")

@app.get("/openapi.json", include_in_schema=False)
async def get_open_api_endpoint(user=Depends(get_current_user)):
    return app.openapi()
