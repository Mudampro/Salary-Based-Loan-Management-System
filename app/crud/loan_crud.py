# app/crud/loan_crud.py

from typing import List, Optional
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from .. import model, schema
from ..crud import repayment_crud 

NUN_INTEREST_RATE = Decimal("6")  


def create_loan(db: Session, loan_in: schema.LoanCreate) -> model.Loan:
    """
    Optional/manual loan creation (only if you still keep POST /loans).
    Disbursement flow should create loan automatically instead.
    """
    loan = model.Loan(
        application_id=loan_in.application_id,
        product_id=loan_in.product_id,
        principal_amount=loan_in.principal_amount,
        interest_rate=loan_in.interest_rate,
        total_payable=loan_in.total_payable,
        start_date=loan_in.start_date,
        end_date=loan_in.end_date,
        status=loan_in.status,
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return loan


def get_loan(db: Session, loan_id: int) -> Optional[model.Loan]:
    return db.query(model.Loan).filter(model.Loan.id == loan_id).first()


def list_loans(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    organization_id: Optional[int] = None,
) -> List[model.Loan]:
    query = db.query(model.Loan)

    if status is not None:
        query = query.filter(model.Loan.status == status)

    if organization_id is not None:
        query = (
            query.join(model.LoanApplication)
            .join(model.Customer)
            .filter(model.Customer.organization_id == organization_id)
        )

    return query.offset(skip).limit(limit).all()


def update_loan_status(db: Session, loan: model.Loan, status_in: "schema.LoanUpdateStatus") -> model.Loan:
    data = status_in.dict(exclude_unset=True)
    for field, value in data.items():
        setattr(loan, field, value)
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return loan


def calculate_total_payable(principal: Decimal, tenor_months: int) -> Decimal:
    if tenor_months <= 0:
        raise ValueError("tenor_months must be >= 1")

    yearly_rate = NUN_INTEREST_RATE / Decimal("100")  
    interest = principal * yearly_rate * Decimal(tenor_months) / Decimal("12")
    total = principal + interest
    return total.quantize(Decimal("0.01"))


def create_loan_from_disbursement_no_commit(
    db: Session,
    application: model.LoanApplication,
    disburse_amount: Decimal,
) -> model.Loan:
    """
    Creates loan at DISBURSEMENT time but DOES NOT COMMIT.
    Disbursement flow will commit once after updating everything.
    """
    if application.status != "APPROVED":
        raise ValueError("Application must be APPROVED before disbursement.")

    if application.tenor_months <= 0:
        raise ValueError("Application tenor_months must be >= 1.")

    if disburse_amount is None or disburse_amount <= 0:
        raise ValueError("disburse_amount must be > 0.")

    existing = db.query(model.Loan).filter(model.Loan.application_id == application.id).first()
    if existing:
        return existing

    tenor_months = int(application.tenor_months)

    total_payable = calculate_total_payable(
        principal=Decimal(str(disburse_amount)),
        tenor_months=tenor_months,
    )

    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=30 * tenor_months)

    loan = model.Loan(
        application_id=application.id,
        product_id=application.product_id,
        principal_amount=Decimal(str(disburse_amount)),
        interest_rate=NUN_INTEREST_RATE,
        total_payable=total_payable,
        start_date=start_date,
        end_date=end_date,
        status="ACTIVE",
    )

    db.add(loan)
    db.flush()  
    return loan


def ensure_loan_for_application_after_disbursement(
    db: Session,
    application: model.LoanApplication,
    disburse_amount: Decimal,
) -> model.Loan:
    """
    Ensures loan exists after disbursement and ensures repayment schedule exists.
    This guarantees automated remittance allocation always has repayments to update.
    """
    

    existing = db.query(model.Loan).filter(model.Loan.application_id == application.id).first()
    tenor = int(application.tenor_months)

    if existing:
        monthly = (Decimal(str(existing.total_payable)) / Decimal(tenor)).quantize(Decimal("0.01"))
        repayment_crud.generate_repayment_schedule(
            db=db,
            loan=existing,
            monthly_amount=monthly,
            tenor_months=tenor,
        )
        return existing

    loan = create_loan_from_disbursement_no_commit(db, application, disburse_amount)

    monthly = (Decimal(str(loan.total_payable)) / Decimal(tenor)).quantize(Decimal("0.01"))
    repayment_crud.generate_repayment_schedule(
        db=db,
        loan=loan,
        monthly_amount=monthly,
        tenor_months=tenor,
    )

    return loan
