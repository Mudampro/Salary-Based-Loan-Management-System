# app/routers/report_router.py

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..db import get_db
from ..crud import report_crud
from .. import schema
from ..security import require_roles

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)



@router.get(
    "/org-monthly",
    response_model=schema.OrgMonthlyReportOut,
)
def org_monthly_report_legacy(
    organization_id: int = Query(..., description="ID of the partner organization"),
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            [
                schema.UserRoleEnum.ADMIN,
                schema.UserRoleEnum.MANAGER,
                schema.UserRoleEnum.LOAN_OFFICER,
                schema.UserRoleEnum.AUTHORIZER,
            ]
        )
    ),
):
    
    return report_crud.get_org_monthly_report_legacy(db, organization_id, year, month)



@router.get(
    "/org-monthly-v2",
    response_model=schema.OrgMonthlyReportV2Out,
)
def org_monthly_report_v2(
    organization_id: int = Query(..., description="ID of the partner organization"),
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            [
                schema.UserRoleEnum.ADMIN,
                schema.UserRoleEnum.MANAGER,
                schema.UserRoleEnum.LOAN_OFFICER,
                schema.UserRoleEnum.AUTHORIZER,
            ]
        )
    ),
):
    return report_crud.get_org_monthly_report_v2(db, organization_id, year, month)
