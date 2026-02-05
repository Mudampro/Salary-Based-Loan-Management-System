# app/crud/report_crud.py

from datetime import datetime, date
from decimal import Decimal
from typing import Dict, Any, List, Tuple

from sqlalchemy.orm import Session
from sqlalchemy import func

from .. import model


def _month_range_dates(year: int, month: int) -> Tuple[date, date]:
    start = date(year, month, 1)
    if month == 12:
        next_month = date(year + 1, 1, 1)
    else:
        next_month = date(year, month + 1, 1)
    return start, next_month


def _month_range_datetimes(year: int, month: int) -> Tuple[datetime, datetime]:
    start = datetime(year, month, 1)
    if month == 12:
        end = datetime(year + 1, 1, 1)
    else:
        end = datetime(year, month + 1, 1)
    return start, end



def get_org_monthly_report_v2(
    db: Session,
    organization_id: int,
    year: int,
    month: int,
) -> Dict[str, Any]:
    org = (
        db.query(model.PartnerOrganization)
        .filter(model.PartnerOrganization.id == organization_id)
        .first()
    )

    period_label = datetime(year, month, 1).strftime("%B %Y")
    start_date, next_month = _month_range_dates(year, month)

    if not org:
        return {
            "organization": None,
            "period": {"year": year, "month": month, "label": period_label},
            "summary": {
                "loans_in_period": 0,
                "total_principal": 0.0,
                "total_expected_month": 0.0,
                "total_paid_month": 0.0,
                "total_outstanding_month": 0.0,
            },
            "items": [],
        }

    loans: List[model.Loan] = (
        db.query(model.Loan)
        .join(model.LoanApplication, model.Loan.application_id == model.LoanApplication.id)
        .join(model.Customer, model.LoanApplication.customer_id == model.Customer.id)
        .filter(model.Customer.organization_id == organization_id)
        .all()
    )

    if not loans:
        return {
            "organization": {"id": org.id, "name": org.name},
            "period": {"year": year, "month": month, "label": period_label},
            "summary": {
                "loans_in_period": 0,
                "total_principal": 0.0,
                "total_expected_month": 0.0,
                "total_paid_month": 0.0,
                "total_outstanding_month": 0.0,
            },
            "items": [],
        }

    loan_ids = [loan.id for loan in loans]

    repayments: List[model.Repayment] = (
        db.query(model.Repayment)
        .filter(model.Repayment.loan_id.in_(loan_ids))
        .all()
    )

    def to_date(dt):
        if not dt:
            return None
        if isinstance(dt, date) and not isinstance(dt, datetime):
            return dt
        return dt.date()

    due_in_month: List[model.Repayment] = []
    paid_in_month: List[model.Repayment] = []

    for r in repayments:
        d_due = to_date(r.due_date)
        d_paid = to_date(r.paid_at)

        if d_due and (start_date <= d_due < next_month):
            due_in_month.append(r)

        if d_paid and (start_date <= d_paid < next_month):
            paid_in_month.append(r)

    loan_ids_in_period = sorted(
        {r.loan_id for r in due_in_month} | {r.loan_id for r in paid_in_month}
    )
    loans_in_period = [loan for loan in loans if loan.id in loan_ids_in_period]

    total_principal = sum(Decimal(loan.principal_amount or 0) for loan in loans_in_period)
    total_expected_month = sum(Decimal(r.amount_due or 0) for r in due_in_month)
    total_paid_month = sum(Decimal(r.amount_paid or 0) for r in paid_in_month)

    total_outstanding_month = total_expected_month - total_paid_month
    if total_outstanding_month < 0:
        total_outstanding_month = Decimal(0)

    reps_by_loan: Dict[int, List[model.Repayment]] = {}
    for r in set(due_in_month + paid_in_month):
        reps_by_loan.setdefault(r.loan_id, []).append(r)

    items: List[Dict[str, Any]] = []

    for loan in loans_in_period:
        reps = sorted(
            reps_by_loan.get(loan.id, []),
            key=lambda r: to_date(r.due_date) or date.max,
        )

        expected_for_loan = sum(Decimal(r.amount_due or 0) for r in reps)
        paid_for_loan = sum(Decimal(r.amount_paid or 0) for r in reps)
        outstanding_for_loan = expected_for_loan - paid_for_loan
        if outstanding_for_loan < 0:
            outstanding_for_loan = Decimal(0)

        
        if loan.status is None:
            status_str = ""
        elif hasattr(loan.status, "name"):
            status_str = loan.status.name
        else:
            status_str = str(loan.status)

        items.append(
            {
                "loan_id": loan.id,
                "principal_amount": float(loan.principal_amount or 0),
                "status": status_str,
                "total_expected_for_month": float(expected_for_loan),
                "total_paid_for_month": float(paid_for_loan),
                "total_outstanding_for_month": float(outstanding_for_loan),
                "repayments": [
                    {
                        "id": r.id,
                        "installment_number": getattr(r, "installment_number", None),
                        "due_date": r.due_date.isoformat() if r.due_date else None,
                        "amount_due": float(r.amount_due or 0),
                        "amount_paid": float(r.amount_paid or 0),
                        "is_paid": bool(r.is_paid),
                        "paid_at": r.paid_at.isoformat() if r.paid_at else None,
                    }
                    for r in reps
                ],
            }
        )

    return {
        "organization": {"id": org.id, "name": org.name},
        "period": {"year": year, "month": month, "label": period_label},
        "summary": {
            "loans_in_period": len(loans_in_period),
            "total_principal": float(total_principal),
            "total_expected_month": float(total_expected_month),
            "total_paid_month": float(total_paid_month),
            "total_outstanding_month": float(total_outstanding_month),
        },
        "items": items,
    }



def get_org_monthly_report_legacy(
    db: Session,
    organization_id: int,
    year: int,
    month: int,
) -> Dict[str, Any]:
    start_dt, end_dt = _month_range_datetimes(year, month)

    
    total_active_loans = (
        db.query(func.count(model.Loan.id))
        .join(model.LoanApplication, model.Loan.application_id == model.LoanApplication.id)
        .join(model.Customer, model.LoanApplication.customer_id == model.Customer.id)
        .filter(model.Customer.organization_id == organization_id)
        .filter(model.Loan.status == "ACTIVE")
        .scalar()
        or 0
    )

    
    new_loans = (
        db.query(model.Loan)
        .join(model.LoanApplication, model.Loan.application_id == model.LoanApplication.id)
        .join(model.Customer, model.LoanApplication.customer_id == model.Customer.id)
        .filter(model.Customer.organization_id == organization_id)
        .filter(model.Loan.created_at >= start_dt, model.Loan.created_at < end_dt)
        .all()
    )

    new_loans_count = len(new_loans)
    new_loans_principal = sum(Decimal(str(l.principal_amount or 0)) for l in new_loans)

    
    repayments = (
        db.query(model.Repayment)
        .join(model.Loan, model.Repayment.loan_id == model.Loan.id)
        .join(model.LoanApplication, model.Loan.application_id == model.LoanApplication.id)
        .join(model.Customer, model.LoanApplication.customer_id == model.Customer.id)
        .filter(model.Customer.organization_id == organization_id)
        .filter(model.Repayment.due_date >= start_dt, model.Repayment.due_date < end_dt)
        .order_by(model.Repayment.due_date.asc(), model.Repayment.installment_number.asc())
        .all()
    )

    scheduled_amount = sum(Decimal(str(r.amount_due or 0)) for r in repayments)
    paid_amount = sum(Decimal(str(r.amount_paid or 0)) for r in repayments)

    collection_rate = None
    if scheduled_amount > 0:
        collection_rate = float((paid_amount / scheduled_amount) * Decimal("100"))

    return {
        "organization_id": organization_id,
        "year": year,
        "month": month,
        "total_active_loans": int(total_active_loans),
        "new_loans_count": int(new_loans_count),
        "new_loans_principal": new_loans_principal,
        "scheduled_amount": scheduled_amount,
        "paid_amount": paid_amount,
        "collection_rate": collection_rate,
        "repayments": repayments,
    }
