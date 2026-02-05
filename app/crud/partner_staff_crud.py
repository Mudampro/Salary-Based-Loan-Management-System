from typing import List, Optional, Dict
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func, asc

from .. import model


def list_org_staff_with_loans(db: Session, organization_id: int) -> Dict:
    """
    Read-only view for partner org:
    - list staff (customers) in org who have a loan
    - show loan totals + repayment summary
    """

    
    loans = (
        db.query(model.Loan)
        .join(model.LoanApplication, model.Loan.application_id == model.LoanApplication.id)
        .join(model.Customer, model.LoanApplication.customer_id == model.Customer.id)
        .filter(model.Customer.organization_id == organization_id)
        .order_by(model.Loan.created_at.desc())
        .all()
    )

    rows = []
    for loan in loans:
        app = loan.application
        cust = app.customer if app else None
        if not cust:
            continue

        
        total_due = (
            db.query(func.coalesce(func.sum(model.Repayment.amount_due), 0))
            .filter(model.Repayment.loan_id == loan.id)
            .scalar()
        )
        total_paid = (
            db.query(func.coalesce(func.sum(model.Repayment.amount_paid), 0))
            .filter(model.Repayment.loan_id == loan.id)
            .scalar()
        )

        total_due = Decimal(str(total_due or "0"))
        total_paid = Decimal(str(total_paid or "0"))
        outstanding = (total_due - total_paid)

        
        next_rep = (
            db.query(model.Repayment)
            .filter(model.Repayment.loan_id == loan.id)
            .filter(model.Repayment.is_paid.is_(False))
            .order_by(asc(model.Repayment.due_date), asc(model.Repayment.installment_number))
            .first()
        )

        rows.append(
            {
                "customer_id": cust.id,
                "staff_id": cust.staff_id,
                "full_name": cust.full_name,
                "email": cust.email,
                "phone": cust.phone,
                "loan_id": loan.id,
                "loan_status": loan.status or "",
                "principal_amount": loan.principal_amount,
                "total_payable": loan.total_payable,
                "total_due": total_due,
                "total_paid": total_paid,
                "outstanding": outstanding,
                "next_due_date": next_rep.due_date if next_rep else None,
                "next_amount_due": next_rep.amount_due if next_rep else None,
            }
        )

    return {"organization_id": organization_id, "rows": rows}
