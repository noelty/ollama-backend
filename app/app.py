from fastapi import FastAPI
from contextlib import asynccontextmanager

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





