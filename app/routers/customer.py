# app/routers/customer.py

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import schema, model
from ..db import get_db
from ..crud import customer_crud, organization_crud
from ..security import require_roles
from ..crud import loan_application_crud


router = APIRouter(
    prefix="/customers",
    tags=["Customers"],
)


@router.post(
    "/",
    response_model=schema.CustomerOut,
    status_code=status.HTTP_201_CREATED,
)
def create_customer(
    customer_in: schema.CustomerCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles([
            schema.UserRoleEnum.ADMIN,
            schema.UserRoleEnum.LOAN_OFFICER,
        ])
    ),
):
    org = organization_crud.get_organization(db, customer_in.organization_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found.",
        )
    return customer_crud.create_customer(db, customer_in)

@router.get(
    "/",
    response_model=List[schema.CustomerOut],
)
def list_customers(
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
    return customer_crud.list_customers(db, skip=skip, limit=limit)


@router.get(
    "/{customer_id}",
    response_model=schema.CustomerOut,
)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles([
            schema.UserRoleEnum.ADMIN,
            schema.UserRoleEnum.LOAN_OFFICER,
            schema.UserRoleEnum.MANAGER,
        ])
    ),
):
    customer = customer_crud.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )
    return customer

@router.get(
    "/{customer_id}/loans",
    response_model=List[schema.LoanOut],
)
def get_customer_loans(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles([
            schema.UserRoleEnum.ADMIN,
            schema.UserRoleEnum.LOAN_OFFICER,
            schema.UserRoleEnum.MANAGER,
        ])
    ),
):
    customer = customer_crud.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    return (
        db.query(model.Loan)
        .join(model.LoanApplication)
        .filter(model.LoanApplication.customer_id == customer_id)
        .all()
    )


@router.get(
    "/by-organization/{organization_id}",
    response_model=List[schema.CustomerOut],
)
def list_customers_by_organization(
    organization_id: int,
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
    org = organization_crud.get_organization(db, organization_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found.",
        )
    return customer_crud.list_customers_by_org(
        db, organization_id=organization_id, skip=skip, limit=limit
    )

@router.get(
    "/{customer_id}/loan-history",
    response_model=List[schema.LoanApplicationOut],
)
def get_customer_loan_history(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles([
            schema.UserRoleEnum.ADMIN,
            schema.UserRoleEnum.LOAN_OFFICER,
            schema.UserRoleEnum.MANAGER,
        ])
    ),
):
    customer = customer_crud.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    return customer_crud.get_customer_loan_history(db, customer_id)
