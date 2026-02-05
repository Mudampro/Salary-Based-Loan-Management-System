# app/crud/partner_dashboard_crud.py

from datetime import datetime
from decimal import Decimal
from typing import Optional, Tuple

from sqlalchemy.orm import Session
from sqlalchemy import func

from .. import model


def _month_range(year: int, month: int) -> Tuple[datetime, datetime]:
    """
    Returns [start, end) datetime range for a given year/month.
    end is the first day of next month.
    """
    if month < 1 or month > 12:
        raise ValueError("month must be between 1 and 12")

    start = datetime(year, month, 1)
    if month == 12:
        end = datetime(year + 1, 1, 1)
    else:
        end = datetime(year, month + 1, 1)
    return start, end


def get_org_monthly_due(
    db: Session,
    organization_id: int,
    year: int,
    month: int,
) -> dict:
    """
    Computes total outstanding due for repayments in the given month for a partner org.

    outstanding per repayment = amount_due - amount_paid
    filter: repayment.due_date in month AND outstanding > 0
    org mapping:
        Repayment -> Loan -> LoanApplication -> Customer -> organization_id
    """
    start, end = _month_range(year, month)

    
    outstanding_expr = (model.Repayment.amount_due - model.Repayment.amount_paid)

    total_outstanding = (
        db.query(func.coalesce(func.sum(outstanding_expr), 0))
        .join(model.Loan, model.Loan.id == model.Repayment.loan_id)
        .join(model.LoanApplication, model.LoanApplication.id == model.Loan.application_id)
        .join(model.Customer, model.Customer.id == model.LoanApplication.customer_id)
        .filter(model.Customer.organization_id == organization_id)
        .filter(model.Repayment.due_date >= start, model.Repayment.due_date < end)
        .filter(outstanding_expr > 0)
        .scalar()
    )

    
    repayments_count = (
        db.query(func.count(model.Repayment.id))
        .join(model.Loan, model.Loan.id == model.Repayment.loan_id)
        .join(model.LoanApplication, model.LoanApplication.id == model.Loan.application_id)
        .join(model.Customer, model.Customer.id == model.LoanApplication.customer_id)
        .filter(model.Customer.organization_id == organization_id)
        .filter(model.Repayment.due_date >= start, model.Repayment.due_date < end)
        .filter(outstanding_expr > 0)
        .scalar()
    )

    
    if not isinstance(total_outstanding, Decimal):
        total_outstanding = Decimal(str(total_outstanding or "0"))

    return {
        "organization_id": organization_id,
        "year": year,
        "month": month,
        "amount_due": total_outstanding,
        "repayments_count": int(repayments_count or 0),
    }
