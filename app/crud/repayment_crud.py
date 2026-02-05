# app/crud/repayment_crud.py

from typing import List, Optional
from datetime import timedelta, datetime
from decimal import Decimal

from sqlalchemy.orm import Session
from sqlalchemy import asc

from .. import model, schema



def generate_repayment_schedule(
    db: Session,
    loan: model.Loan,
    monthly_amount: Decimal,
    tenor_months: int,
) -> List[model.Repayment]:
    if tenor_months <= 0:
        raise ValueError("tenor_months must be >= 1")

    amt = Decimal(str(monthly_amount)).quantize(Decimal("0.01"))
    if amt <= 0:
        raise ValueError("monthly_amount must be > 0")

    if not loan or not getattr(loan, "id", None):
        raise ValueError("loan is required")

    start_date = loan.start_date or datetime.utcnow()
    if loan.start_date is None:
        loan.start_date = start_date
        db.add(loan)
        db.commit()
        db.refresh(loan)

    existing = (
        db.query(model.Repayment)
        .filter(model.Repayment.loan_id == loan.id)
        .first()
    )
    if existing:
        return list_repayments_for_loan(db, loan.id)

    repayments: List[model.Repayment] = []
    for i in range(1, tenor_months + 1):
        due_date = start_date + timedelta(days=30 * i)

        repayment = model.Repayment(
            loan_id=loan.id,
            installment_number=i,
            due_date=due_date,
            amount_due=amt,
            amount_paid=Decimal("0.00"),
            is_paid=False,
            paid_at=None,
        )
        db.add(repayment)
        repayments.append(repayment)

    db.commit()
    for r in repayments:
        db.refresh(r)
    return repayments


def list_repayments_for_loan(db: Session, loan_id: int) -> List[model.Repayment]:
    return (
        db.query(model.Repayment)
        .filter(model.Repayment.loan_id == loan_id)
        .order_by(model.Repayment.installment_number.asc())
        .all()
    )


def get_repayment(db: Session, repayment_id: int) -> Optional[model.Repayment]:
    return (
        db.query(model.Repayment)
        .filter(model.Repayment.id == repayment_id)
        .first()
    )




def _set_loan_status(db: Session, loan_id: int) -> None:
    loan = db.query(model.Loan).filter(model.Loan.id == loan_id).first()
    if not loan:
        return

    total = db.query(model.Repayment).filter(model.Repayment.loan_id == loan_id).count()
    if total == 0:
        return

    unpaid = (
        db.query(model.Repayment)
        .filter(model.Repayment.loan_id == loan_id, model.Repayment.is_paid.is_(False))
        .count()
    )

    loan.status = "ACTIVE" if unpaid > 0 else "CLOSED"
    db.add(loan)
    db.commit()




def apply_inbound_transaction_to_org(
    db: Session,
    tx: model.InboundTransaction,
) -> dict:
    if not tx:
        raise ValueError("InboundTransaction (tx) is required.")
    if not tx.organization_id:
        raise ValueError("InboundTransaction must have organization_id.")

    remaining = Decimal(str(tx.amount)).quantize(Decimal("0.01"))
    if remaining <= 0:
        raise ValueError("Transaction amount must be > 0")

    
    existing_alloc = (
        db.query(model.TransactionAllocation)
        .filter(model.TransactionAllocation.transaction_id == tx.id)
        .first()
    )
    if existing_alloc:
        raise ValueError("This transaction has already been allocated.")

    unpaid_rows = (
        db.query(model.Repayment)
        .join(model.Loan, model.Repayment.loan_id == model.Loan.id)
        .join(model.LoanApplication, model.Loan.application_id == model.LoanApplication.id)
        .join(model.Customer, model.LoanApplication.customer_id == model.Customer.id)
        .filter(model.Customer.organization_id == tx.organization_id)
        .filter(model.Repayment.is_paid.is_(False))
        .order_by(asc(model.Repayment.due_date), asc(model.Repayment.installment_number))
        .all()
    )

    allocations_made = 0
    loans_touched = set()
    total_applied = Decimal("0.00")

    for r in unpaid_rows:
        if remaining <= 0:
            break

        due = Decimal(str(r.amount_due)).quantize(Decimal("0.01"))
        already_paid = Decimal(str(r.amount_paid or 0)).quantize(Decimal("0.01"))
        outstanding = (due - already_paid).quantize(Decimal("0.01"))

        if outstanding <= 0:
            r.is_paid = True
            if r.paid_at is None:
                r.paid_at = tx.paid_at
            db.add(r)
            loans_touched.add(r.loan_id)
            continue

        apply_amt = min(remaining, outstanding).quantize(Decimal("0.01"))
        if apply_amt <= 0:
            continue

        r.amount_paid = (already_paid + apply_amt).quantize(Decimal("0.01"))
        r.paid_at = tx.paid_at
        r.is_paid = r.amount_paid >= due
        db.add(r)

        alloc = model.TransactionAllocation(
            transaction_id=tx.id,
            repayment_id=r.id,
            amount_applied=apply_amt,
        )
        db.add(alloc)

        allocations_made += 1
        loans_touched.add(r.loan_id)
        total_applied = (total_applied + apply_amt).quantize(Decimal("0.01"))
        remaining = (remaining - apply_amt).quantize(Decimal("0.01"))

    db.commit()

    for loan_id in loans_touched:
        _set_loan_status(db, loan_id)

    tx.match_status = (
        model.TransactionMatchStatus.MATCHED
        if allocations_made > 0
        else model.TransactionMatchStatus.UNMATCHED
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    return {
        "transaction_id": tx.id,
        "organization_id": tx.organization_id,
        "allocations_made": allocations_made,
        "total_applied": str(total_applied),
        "unallocated_amount": str(remaining),
        "match_status": tx.match_status.value if hasattr(tx.match_status, "value") else str(tx.match_status),
    }



def reverse_repayment_payment(
    db: Session,
    repayment: model.Repayment,
    reverse_in: schema.RepaymentReverseRequest,
    delete_allocations: bool = True,
) -> model.Repayment:
    if repayment is None:
        raise ValueError("repayment is required")

    paid = Decimal(str(repayment.amount_paid or 0)).quantize(Decimal("0.01"))
    if paid <= 0:
        raise ValueError("This repayment has no recorded payment to reverse.")

    if delete_allocations:
        db.query(model.TransactionAllocation).filter(
            model.TransactionAllocation.repayment_id == repayment.id
        ).delete(synchronize_session=False)

    repayment.amount_paid = Decimal("0.00")
    repayment.is_paid = False
    repayment.paid_at = None

    db.add(repayment)
    db.commit()
    db.refresh(repayment)

    _set_loan_status(db, repayment.loan_id)
    return repayment



def reverse_inbound_transaction(db: Session, tx: model.InboundTransaction, reason: str = None) -> dict:
    if not tx:
        raise ValueError("tx is required")

    allocs = (
        db.query(model.TransactionAllocation)
        .filter(model.TransactionAllocation.transaction_id == tx.id)
        .all()
    )

    
    if not allocs:
        raise ValueError("Cannot reverse: transaction has no allocations.")

    touched_loans = set()
    total_reversed = Decimal("0.00")

    for a in allocs:
        r = db.query(model.Repayment).filter(model.Repayment.id == a.repayment_id).first()
        if not r:
            continue

        applied = Decimal(str(a.amount_applied or 0)).quantize(Decimal("0.01"))
        paid = Decimal(str(r.amount_paid or 0)).quantize(Decimal("0.01"))

        new_paid = (paid - applied).quantize(Decimal("0.01"))
        if new_paid < 0:
            new_paid = Decimal("0.00")

        r.amount_paid = new_paid
        r.is_paid = new_paid >= Decimal(str(r.amount_due)).quantize(Decimal("0.01"))
        if not r.is_paid:
            r.paid_at = None

        db.add(r)
        touched_loans.add(r.loan_id)
        total_reversed = (total_reversed + applied).quantize(Decimal("0.01"))

    db.query(model.TransactionAllocation).filter(
        model.TransactionAllocation.transaction_id == tx.id
    ).delete(synchronize_session=False)

    tx.match_status = model.TransactionMatchStatus.DISPUTED
    db.add(tx)
    db.commit()

    for loan_id in touched_loans:
        _set_loan_status(db, loan_id)

    db.refresh(tx)
    return {
        "transaction_id": tx.id,
        "total_reversed": str(total_reversed),
        "message": "Transaction reversed. Allocations removed and repayments updated.",
    }
