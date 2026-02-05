# app/crud/loan_application_crud.py

from typing import List, Optional
from sqlalchemy.orm import Session

from .. import model, schema


def create_loan_application(
    db: Session,
    app_in: schema.LoanApplicationCreate,
) -> model.LoanApplication:
    application = model.LoanApplication(
        customer_id=app_in.customer_id,
        product_id=app_in.product_id,
        link_id=app_in.link_id,
        requested_amount=app_in.requested_amount,
        tenor_months=app_in.tenor_months,
        status="PENDING",
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def get_loan_application(
    db: Session, application_id: int
) -> Optional[model.LoanApplication]:
    return (
        db.query(model.LoanApplication)
        .filter(model.LoanApplication.id == application_id)
        .first()
    )


def list_loan_applications(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    organization_id: Optional[int] = None,
) -> List[model.LoanApplication]:
    query = db.query(model.LoanApplication)

    if status is not None:
        query = query.filter(model.LoanApplication.status == status)

    if organization_id is not None:
        query = query.join(model.Customer).filter(
            model.Customer.organization_id == organization_id
        )

    return query.offset(skip).limit(limit).all()


def _application_has_disbursement(db: Session, application_id: int) -> bool:
    existing_disb = (
        db.query(model.Disbursement)
        .filter(model.Disbursement.loan_application_id == application_id)
        .first()
    )
    return existing_disb is not None


def _application_has_loan(db: Session, application_id: int) -> bool:
    existing_loan = (
        db.query(model.Loan)
        .filter(model.Loan.application_id == application_id)
        .first()
    )
    return existing_loan is not None


def update_application_status(
    db: Session,
    application: model.LoanApplication,
    status_in: schema.LoanApplicationUpdateStatus,
) -> model.LoanApplication:
    """
    Update application safely.

    Critical rule:
    If the application is already DISBURSED (or has disbursement/loan), lock it.
    Prevent changing status back to APPROVED/PENDING/UNDER_REVIEW/REJECTED.
    """

    data = status_in.dict(exclude_unset=True)

    
    disbursed_truth = (
        application.status == "DISBURSED"
        or _application_has_disbursement(db, application.id)
        or _application_has_loan(db, application.id)
    )

    
    if disbursed_truth and "status" in data and data["status"] != "DISBURSED":
        raise ValueError("This application has already been DISBURSED and cannot be changed.")

    for field, value in data.items():
        setattr(application, field, value)

    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def create_loan_application_from_public(
    db: Session,
    customer: model.Customer,
    product: model.LoanProduct,
    link: model.CompanyLoanLink,
    app_in: schema.PublicLoanApplicationCreate,
) -> model.LoanApplication:
    application = model.LoanApplication(
        customer_id=customer.id,
        product_id=product.id,
        link_id=link.id,
        requested_amount=app_in.requested_amount,
        tenor_months=app_in.tenor_months,
        status="PENDING",
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application
