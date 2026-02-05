# app/routers/disbursement.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from ..db import get_db
from .. import schema, model
from ..security import require_roles
from ..crud import disbursement_crud

router = APIRouter(prefix="/disbursements", tags=["Disbursements"])


@router.post(
    "/application/{application_id}",
    response_model=schema.DisburseLoanResponse,
    status_code=status.HTTP_201_CREATED,
)
def disburse_approved_application(
    application_id: int,
    req: schema.DisburseLoanRequest,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            [
                schema.UserRoleEnum.ADMIN,
                schema.UserRoleEnum.MANAGER,
                schema.UserRoleEnum.CASHIER,
                schema.UserRoleEnum.AUTHORIZER,
            ]
        )
    ),
):
    application = (
        db.query(model.LoanApplication)
        .options(joinedload(model.LoanApplication.customer))
        .filter(model.LoanApplication.id == application_id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Loan application not found.")

    
    if str(application.status).upper() not in ["APPROVED", "APPROVED_BY_AUTHORIZER", "READY_FOR_DISBURSEMENT"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Loan application is not approved for disbursement. Current status: {application.status}",
        )

    try:
        return disbursement_crud.disburse_application(db, application, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to disburse loan. {str(e)}",
        )
