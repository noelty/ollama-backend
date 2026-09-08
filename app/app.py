from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routes import router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # app startup code
    init_db()
    print("db initialized")
    app.include_router(router)
    print("router done")
    yield
    
    # app shutdown code

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



