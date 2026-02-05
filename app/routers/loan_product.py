# app/routers/loan_product.py

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import schema
from ..db import get_db
from ..crud import loan_product_crud
from ..security import require_roles

router = APIRouter(
    prefix="/loan-products",
    tags=["Loan Products"],
)


@router.post(
    "/",
    response_model=schema.LoanProductOut,
    status_code=status.HTTP_201_CREATED,
)
def create_loan_product(
    product_in: schema.LoanProductCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(require_roles([schema.UserRoleEnum.ADMIN])),
):
    return loan_product_crud.create_loan_product(db, product_in)


@router.get(
    "/",
    response_model=List[schema.LoanProductOut],
)
def list_loan_products(
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles([
            schema.UserRoleEnum.ADMIN,
            schema.UserRoleEnum.LOAN_OFFICER,
            schema.UserRoleEnum.MANAGER,
        ])
    ),
):
    return loan_product_crud.list_loan_products(
        db, skip=skip, limit=limit, is_active=is_active
    )


@router.get(
    "/{product_id}",
    response_model=schema.LoanProductOut,
)
def get_loan_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles([
            schema.UserRoleEnum.ADMIN,
            schema.UserRoleEnum.LOAN_OFFICER,
            schema.UserRoleEnum.MANAGER,
        ])
    ),
):
    product = loan_product_crud.get_loan_product(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan product not found.",
        )
    return product


@router.put(
    "/{product_id}",
    response_model=schema.LoanProductOut,
)
def update_loan_product(
    product_id: int,
    product_in: schema.LoanProductUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(require_roles([schema.UserRoleEnum.ADMIN])),
):
    product = loan_product_crud.get_loan_product(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan product not found.",
        )
    return loan_product_crud.update_loan_product(db, product, product_in)
