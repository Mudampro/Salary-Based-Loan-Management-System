# app/routers/loan.py

from typing import List, Optional
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import schema
from ..db import get_db
from ..crud import loan_crud, loan_application_crud, repayment_crud
from ..security import require_roles

router = APIRouter(
    prefix="/loans",
    tags=["Loans"],
)


@router.post(
    "/",
    response_model=schema.LoanOut,
    status_code=status.HTTP_201_CREATED,
)
def create_loan(
    loan_in: schema.LoanCreate,
    tenor_months: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles([
            schema.UserRoleEnum.ADMIN,
            schema.UserRoleEnum.CASHIER,
            schema.UserRoleEnum.AUTHORIZER,
        ])
    ),
):
    
    application = loan_application_crud.get_loan_application(
        db, loan_in.application_id
    )
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan application not found.",
        )

    if application.status not in ("APPROVED", "DISBURSEMENT_PENDING"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Loan application is not approved for disbursement.",
        )

    loan = loan_crud.create_loan(db, loan_in)

    if tenor_months <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenor must be greater than 0.",
        )
    monthly = (loan.total_payable / Decimal(tenor_months)).quantize(Decimal("0.01"))

    repayment_crud.generate_repayment_schedule(
        db,
        loan=loan,
        monthly_amount=monthly,
        tenor_months=tenor_months,
    )

    return loan


@router.get(
    "/",
    response_model=List[schema.LoanOut],
)
def list_loans(
    status_filter: Optional[str] = None,
    organization_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles([
            schema.UserRoleEnum.ADMIN,
            schema.UserRoleEnum.LOAN_OFFICER,
            schema.UserRoleEnum.MANAGER,
            schema.UserRoleEnum.CASHIER,
            schema.UserRoleEnum.AUTHORIZER,
        ])
    ),
):
    return loan_crud.list_loans(
        db,
        skip=skip,
        limit=limit,
        status=status_filter,
        organization_id=organization_id,
    )


@router.get(
    "/{loan_id}",
    response_model=schema.LoanOut,
)
def get_loan(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles([
            schema.UserRoleEnum.ADMIN,
            schema.UserRoleEnum.LOAN_OFFICER,
            schema.UserRoleEnum.MANAGER,
            schema.UserRoleEnum.CASHIER,
            schema.UserRoleEnum.AUTHORIZER,
        ])
    ),
):
    loan = loan_crud.get_loan(db, loan_id)
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found.",
        )
    return loan
