# app/routers/loan_application.py

from typing import List, Optional
from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from .. import schema, model
from ..db import get_db
from ..crud import (
    loan_application_crud,
    customer_crud,
    loan_product_crud,
    loan_link_crud,
)
from ..security import require_roles

router = APIRouter(
    prefix="/loan-applications",
    tags=["Loan Applications"],
)


@router.post(
    "/",
    response_model=schema.LoanApplicationOut,
    status_code=status.HTTP_201_CREATED,
)
def create_loan_application(
    app_in: schema.LoanApplicationCreate,
    db: Session = Depends(get_db),
):
    customer = customer_crud.get_customer(db, app_in.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    product = loan_product_crud.get_loan_product(db, app_in.product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=400, detail="Loan product not available.")

    if app_in.link_id is not None:
        link = loan_link_crud.get_link(db, app_in.link_id)
        if not link or not link.is_active:
            raise HTTPException(status_code=400, detail="Invalid or inactive loan link.")

        if link.organization_id != customer.organization_id:
            raise HTTPException(
                status_code=400,
                detail="Customer does not belong to this organization link.",
            )

        if link.product_id != app_in.product_id:
            raise HTTPException(
                status_code=400,
                detail="This link is not for the selected loan product.",
            )

    return loan_application_crud.create_loan_application(db, app_in)


@router.get(
    "/",
    response_model=List[schema.LoanApplicationOut],
)
def list_loan_applications(
    status_filter: Optional[str] = None,
    organization_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return loan_application_crud.list_loan_applications(
        db,
        skip=skip,
        limit=limit,
        status=status_filter,
        organization_id=organization_id,
    )


@router.get(
    "/{application_id}",
    response_model=schema.LoanApplicationOut,
)
def get_loan_application(
    application_id: int,
    db: Session = Depends(get_db),
):
    application = (
        db.query(model.LoanApplication)
        .options(
            joinedload(model.LoanApplication.customer).joinedload(model.Customer.organization),
            joinedload(model.LoanApplication.product),
        )
        .filter(model.LoanApplication.id == application_id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Loan application not found.")
    return application


@router.patch(
    "/{application_id}/status",
    response_model=schema.LoanApplicationOut,
)
def update_loan_application_status(
    application_id: int,
    status_in: schema.LoanApplicationUpdateStatus,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            [
                schema.UserRoleEnum.ADMIN,
                schema.UserRoleEnum.LOAN_OFFICER,
                schema.UserRoleEnum.MANAGER,
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

    if status_in.status is None:
        raise HTTPException(status_code=400, detail="Status is required.")

    
    if status_in.status == "DISBURSED":
        raise HTTPException(
            status_code=400,
            detail="DISBURSED cannot be set here. Use the disbursement endpoint instead.",
        )

    allowed = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"]
    if status_in.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Allowed: {allowed}",
        )

    
    if status_in.status == "APPROVED":
        if status_in.approved_amount is None:
            raise HTTPException(
                status_code=400,
                detail="approved_amount is required when approving an application.",
            )

        
        if not application.customer:
            raise HTTPException(status_code=400, detail="Application customer not loaded.")
        customer_crud.ensure_customer_account(db, application.customer, prefix="248")

    try:
        updated = loan_application_crud.update_application_status(
            db=db,
            application=application,
            status_in=status_in,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return updated




@router.post(
    "/public/{token}",
    response_model=schema.LoanApplicationOut,
    status_code=status.HTTP_201_CREATED,
)
def submit_public_loan_application(
    token: str,
    app_in: schema.PublicLoanApplicationCreate,
    db: Session = Depends(get_db),
):
    link = loan_link_crud.get_link_by_token(db, token)
    if not link or not link.is_active:
        raise HTTPException(status_code=404, detail="Application link not found or inactive.")

    if link.expires_at and link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Application link has expired.")

    customer = None

    if app_in.bvn:
        customer = (
            db.query(model.Customer)
            .filter(
                model.Customer.bvn == app_in.bvn,
                model.Customer.organization_id == link.organization_id,
            )
            .first()
        )

    if not customer:
        customer = (
            db.query(model.Customer)
            .filter(
                model.Customer.staff_id == app_in.staff_id,
                model.Customer.organization_id == link.organization_id,
            )
            .first()
        )

    if customer:
        customer.full_name = app_in.full_name
        customer.email = app_in.email
        customer.phone = app_in.phone
        customer.net_monthly_salary = app_in.net_pay
        customer.bvn = app_in.bvn
        customer.staff_id = app_in.staff_id
    else:
        customer = model.Customer(
            full_name=app_in.full_name,
            email=app_in.email,
            phone=app_in.phone,
            staff_id=app_in.staff_id,
            organization_id=link.organization_id,
            net_monthly_salary=app_in.net_pay,
            bvn=app_in.bvn,
        )
        db.add(customer)

    db.flush()

    existing_active_loan = (
        db.query(model.Loan)
        .join(model.LoanApplication)
        .filter(
            model.LoanApplication.customer_id == customer.id,
            model.Loan.status == "ACTIVE",
        )
        .first()
    )
    if existing_active_loan:
        raise HTTPException(
            status_code=400,
            detail="You already have an active loan. Please complete repayment before applying for a new one.",
        )

    existing_pending_app = (
        db.query(model.LoanApplication)
        .filter(
            model.LoanApplication.customer_id == customer.id,
            model.LoanApplication.status.in_(["PENDING", "UNDER_REVIEW"]),
        )
        .first()
    )
    if existing_pending_app:
        raise HTTPException(
            status_code=400,
            detail="You already have a loan application under review. Please wait for a decision.",
        )

    product = loan_product_crud.get_loan_product(db, link.product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=400, detail="Loan product not available.")

    if product.min_amount is not None:
        min_amount = Decimal(str(product.min_amount))
        if app_in.requested_amount < min_amount:
            raise HTTPException(status_code=400, detail=f"Minimum amount for this product is {min_amount}.")

    if product.max_amount is not None:
        max_amount = Decimal(str(product.max_amount))
        if app_in.requested_amount > max_amount:
            raise HTTPException(status_code=400, detail=f"Maximum amount for this product is {max_amount}.")

    if app_in.tenor_months <= 0:
        raise HTTPException(status_code=400, detail="Tenor must be at least 1 month.")

    max_by_salary = app_in.net_pay * Decimal(app_in.tenor_months) * Decimal("0.75")
    if app_in.requested_amount > max_by_salary:
        raise HTTPException(
            status_code=400,
            detail="Requested amount is too high for your salary and tenor. Please reduce amount or increase tenor.",
        )

    application = loan_application_crud.create_loan_application_from_public(
        db=db,
        customer=customer,
        product=product,
        link=link,
        app_in=app_in,
    )
    return application
