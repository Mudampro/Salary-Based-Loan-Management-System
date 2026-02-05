# app/routers/dashboard.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from .. import schema
from ..security import require_roles
from ..crud import dashboard_crud

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=schema.DashboardSummaryOut)
def dashboard_summary(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            [
                schema.UserRoleEnum.ADMIN,
                schema.UserRoleEnum.LOAN_OFFICER,
                schema.UserRoleEnum.MANAGER,
                schema.UserRoleEnum.CASHIER,
                schema.UserRoleEnum.AUTHORIZER,
            ]
        )
    ),
):
    data = dashboard_crud.get_dashboard_summary(db=db, year=year, month=month)
    return data
