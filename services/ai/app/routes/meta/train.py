from typing import NoReturn

from fastapi import APIRouter

from app.orchestration import meta

router = APIRouter(tags=["train"])


@router.post("/train", response_model=None)
def start_training() -> NoReturn:
    meta.block_train()


@router.get("/train/{job_id}", response_model=None)
def get_training_status(job_id: str) -> NoReturn:
    meta.block_train(job_id)
