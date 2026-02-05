# app/routers/repayment.py

from typing import List
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import schema
from ..db import get_db
from ..crud import repayment_crud, loan_crud
from ..security import require_roles

router = APIRouter(
    prefix="/repayments",
    tags=["Repayments"],
)


@router.get(
    "/loan/{loan_id}",
    response_model=List[schema.RepaymentOut],
)
def list_repayments_for_loan(
    loan_id: int,
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
    loan = loan_crud.get_loan(db, loan_id)
    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found.")
    return repayment_crud.list_repayments_for_loan(db, loan_id)


@router.get(
    "/{repayment_id}",
    response_model=schema.RepaymentOut,
)
def get_repayment(
    repayment_id: int,
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
    repayment = repayment_crud.get_repayment(db, repayment_id)
    if not repayment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repayment not found.")
    return repayment



@router.patch(
    "/{repayment_id}/pay",
    response_model=schema.RepaymentOut,
)
def mark_repayment_paid_disabled(
    repayment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            [
                schema.UserRoleEnum.ADMIN,
                schema.UserRoleEnum.CASHIER,
                schema.UserRoleEnum.LOAN_OFFICER,
                schema.UserRoleEnum.MANAGER,
            ]
        )
    ),
):
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail=(
            "Manual repayment marking is disabled. "
            "Repayments are updated automatically from organization remittance (InboundTransaction)."
        ),
    )


@router.patch(
    "/{repayment_id}/reverse",
    response_model=schema.RepaymentOut,
)
def reverse_repayment(
    repayment_id: int,
    reverse_in: schema.RepaymentReverseRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles([schema.UserRoleEnum.ADMIN, schema.UserRoleEnum.MANAGER])),
):
    repayment = repayment_crud.get_repayment(db, repayment_id)
    if not repayment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repayment not found.")

    
    alloc_count = (
        db.query(model.TransactionAllocation)
        .filter(model.TransactionAllocation.repayment_id == repayment_id)
        .count()
    )
    if alloc_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This repayment was settled via remittance. Reverse the remittance transaction instead.",
        )

    updated = repayment_crud.reverse_repayment_payment(
        db=db,
        repayment=repayment,
        reverse_in=reverse_in,
        delete_allocations=True,
    )
    return updated
