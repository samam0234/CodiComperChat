from typing import NoReturn

from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["train"])

# v1은 자체 가중치 학습을 하지 않는다 (기획서 7.7장). 경로만 설계에 남기고 막아 둔다.
_BLOCKED_DETAIL = (
    "학습 API는 v1에서 막혀 있다. 미구현이 아니라 의도적으로 닫아 둔 것이다 "
    "(기획서 7.6장·7.7장). 경로만 설계에 남겨 두고, 로그가 쌓인 뒤 v2에서 연다."
)


@router.post("/train", response_model=None)
def start_training() -> NoReturn:
    raise HTTPException(status_code=403, detail=_BLOCKED_DETAIL)


@router.get("/train/{job_id}", response_model=None)
def get_training_status(job_id: str) -> NoReturn:
    raise HTTPException(
        status_code=403,
        detail=f"{_BLOCKED_DETAIL} (요청 작업: {job_id})",
    )
