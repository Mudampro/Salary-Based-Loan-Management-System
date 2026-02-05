# app/crud/disbursement_crud.py

from datetime import datetime
from decimal import Decimal
import uuid

from sqlalchemy.orm import Session

from .. import model, schema
from . import customer_crud
from .loan_crud import ensure_loan_for_application_after_disbursement


def _make_reference() -> str:
    return f"DISB-{uuid.uuid4().hex[:12].upper()}"


def disburse_application(
    db: Session,
    application: model.LoanApplication,
    req: schema.DisburseLoanRequest,
) -> schema.DisburseLoanResponse:
    """
    Disburse ONLY APPROVED applications.
    - Create (or ensure) customer NUN account
    - Create Disbursement record
    - Credit simulated customer balance
    - Create Loan (ACTIVE) + Repayment Schedule (ensured inside loan_crud)
    - Mark application as DISBURSED
    """

    if application.status != "APPROVED":
        raise ValueError("Only APPROVED applications can be disbursed.")

    if application.approved_amount is None:
        raise ValueError("approved_amount is required before disbursement.")

    customer = application.customer
    if not customer:
        raise ValueError("Application has no customer loaded.")

    
    customer_crud.ensure_customer_account(db, customer, prefix="248")

    disburse_amount = req.disburse_amount or application.approved_amount
    disburse_amount = Decimal(str(disburse_amount)).quantize(Decimal("0.01"))

    if disburse_amount <= 0:
        raise ValueError("disburse_amount must be greater than 0.")

    
    existing_disb = (
        db.query(model.Disbursement)
        .filter(model.Disbursement.loan_application_id == application.id)
        .first()
    )
    if existing_disb:
        raise ValueError("This application has already been disbursed.")

    reference = req.reference or _make_reference()

    
    disb = model.Disbursement(
        loan_application_id=application.id,
        loan_id=None,
        customer_id=customer.id,
        amount=disburse_amount,
        method="NUN_ACCOUNT",
        reference=reference,
        narration=req.narration or f"Loan disbursement for application #{application.id}",
        created_at=datetime.utcnow(),
    )

    
    current_bal = Decimal(str(customer.account_balance or 0)).quantize(Decimal("0.01"))
    customer.account_balance = (current_bal + disburse_amount).quantize(Decimal("0.01"))

    db.add(customer)
    db.add(disb)
    db.flush()

    
    loan = ensure_loan_for_application_after_disbursement(
        db=db,
        application=application,
        disburse_amount=disburse_amount,
    )

    
    disb.loan_id = loan.id
    application.status = "DISBURSED"

    db.add(disb)
    db.add(application)
    db.commit()

    db.refresh(customer)
    db.refresh(disb)
    db.refresh(loan)

    return schema.DisburseLoanResponse(
        loan=schema.LoanOut.model_validate(loan),
        disbursement=schema.DisbursementOut.model_validate(disb),
        customer=schema.CustomerOut.model_validate(customer),
    )
