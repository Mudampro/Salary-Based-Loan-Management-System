# app/crud/dashboard_crud.py

from datetime import datetime
from decimal import Decimal
from typing import Dict, Tuple

from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from .. import model


def _month_range(year: int, month: int) -> Tuple[datetime, datetime]:
    if month < 1 or month > 12:
        raise ValueError("month must be between 1 and 12")
    start = datetime(year, month, 1)
    if month == 12:
        end = datetime(year + 1, 1, 1)
    else:
        end = datetime(year, month + 1, 1)
    return start, end


def get_dashboard_summary(db: Session, year: int, month: int) -> Dict:
    """
    Staff/Admin dashboard KPIs.

    Uses Repayment + Allocation + Transactions:
    - total_outstanding: sum(amount_due - amount_paid) for unpaid
    - overdue_amount: outstanding where due_date < now
    - this_month_due: outstanding where due_date in selected month
    - this_month_collected: sum(inbound_transactions.amount) where paid_at in selected month
      (simple and consistent with your design; allocations can also be used but this is enough)
    - work queue counts:
      pending_applications, approved_not_disbursed, active_loans
    """
    now = datetime.utcnow()
    start, end = _month_range(year, month)

    outstanding_expr = (model.Repayment.amount_due - func.coalesce(model.Repayment.amount_paid, 0))

    # Total outstanding (all orgs)
    total_outstanding = (
        db.query(func.coalesce(func.sum(outstanding_expr), 0))
        .filter(outstanding_expr > 0)
        .scalar()
    )

    # Overdue outstanding
    overdue_amount = (
        db.query(func.coalesce(func.sum(outstanding_expr), 0))
        .filter(outstanding_expr > 0)
        .filter(model.Repayment.due_date < now)
        .scalar()
    )

    # This month due (outstanding in month)
    this_month_due = (
        db.query(func.coalesce(func.sum(outstanding_expr), 0))
        .filter(outstanding_expr > 0)
        .filter(model.Repayment.due_date >= start, model.Repayment.due_date < end)
        .scalar()
    )

    # This month collected (sum inbound transactions in month)
    this_month_collected = (
        db.query(func.coalesce(func.sum(model.InboundTransaction.amount), 0))
        .filter(model.InboundTransaction.paid_at >= start, model.InboundTransaction.paid_at < end)
        .scalar()
    )

    # Work queue
    pending_applications = (
        db.query(func.count(model.LoanApplication.id))
        .filter(model.LoanApplication.status == "PENDING")
        .scalar()
    )

    approved_not_disbursed = (
        db.query(func.count(model.Loan.id))
        .filter(model.Loan.status == "PENDING_DISBURSEMENT")
        .scalar()
    )

    active_loans = (
        db.query(func.count(model.Loan.id))
        .filter(model.Loan.status == "ACTIVE")
        .scalar()
    )

    # Ensure Decimal outputs
    def to_dec(x) -> Decimal:
        if isinstance(x, Decimal):
            return x
        return Decimal(str(x or "0")).quantize(Decimal("0.01"))

    return {
        "year": year,
        "month": month,
        "total_outstanding": to_dec(total_outstanding),
        "overdue_amount": to_dec(overdue_amount),
        "this_month_due": to_dec(this_month_due),
        "this_month_collected": to_dec(this_month_collected),
        "pending_applications": int(pending_applications or 0),
        "approved_not_disbursed": int(approved_not_disbursed or 0),
        "active_loans": int(active_loans or 0),
    }
