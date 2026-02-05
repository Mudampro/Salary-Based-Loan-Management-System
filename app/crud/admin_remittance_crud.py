# app/crud/admin_remittance_crud.py

from decimal import Decimal
from typing import List, Dict

from sqlalchemy.orm import Session
from sqlalchemy import func

from .. import model


def get_org_remittance_summary(db: Session, organization_id: int) -> Dict:
    """
    Summary:
    - total_remitted = sum(inbound.amount)
    - total_applied = sum(allocations.amount_applied)
    - unallocated_balance = remitted - applied
    - total_outstanding = sum(repayment.amount_due - amount_paid) for org where outstanding > 0
    """
    total_remitted = (
        db.query(func.coalesce(func.sum(model.InboundTransaction.amount), 0))
        .filter(model.InboundTransaction.organization_id == organization_id)
        .scalar()
    )

    total_applied = (
        db.query(func.coalesce(func.sum(model.TransactionAllocation.amount_applied), 0))
        .join(model.InboundTransaction, model.TransactionAllocation.transaction_id == model.InboundTransaction.id)
        .filter(model.InboundTransaction.organization_id == organization_id)
        .scalar()
    )

    outstanding_expr = (model.Repayment.amount_due - model.Repayment.amount_paid)
    total_outstanding = (
        db.query(func.coalesce(func.sum(outstanding_expr), 0))
        .join(model.Loan, model.Loan.id == model.Repayment.loan_id)
        .join(model.LoanApplication, model.LoanApplication.id == model.Loan.application_id)
        .join(model.Customer, model.Customer.id == model.LoanApplication.customer_id)
        .filter(model.Customer.organization_id == organization_id)
        .filter(outstanding_expr > 0)
        .scalar()
    )

    total_remitted = Decimal(str(total_remitted or "0"))
    total_applied = Decimal(str(total_applied or "0"))
    total_outstanding = Decimal(str(total_outstanding or "0"))

    return {
        "organization_id": organization_id,
        "total_remitted": total_remitted,
        "total_applied": total_applied,
        "unallocated_balance": (total_remitted - total_applied),
        "total_outstanding": total_outstanding,
    }


def list_org_transactions_with_allocation(db: Session, organization_id: int) -> Dict:
    """
    Returns each tx and how much was applied vs unallocated
    """
    txs: List[model.InboundTransaction] = (
        db.query(model.InboundTransaction)
        .filter(model.InboundTransaction.organization_id == organization_id)
        .order_by(model.InboundTransaction.paid_at.desc())
        .all()
    )

    rows = []
    for tx in txs:
        applied = (
            db.query(func.coalesce(func.sum(model.TransactionAllocation.amount_applied), 0))
            .filter(model.TransactionAllocation.transaction_id == tx.id)
            .scalar()
        )
        applied = Decimal(str(applied or "0"))
        amt = Decimal(str(tx.amount or "0"))
        rows.append(
            {
                "tx": tx,
                "applied_amount": applied,
                "unallocated_amount": (amt - applied),
            }
        )

    return {"organization_id": organization_id, "rows": rows}


def list_transaction_allocations(db: Session, transaction_id: int) -> List[model.TransactionAllocation]:
    return (
        db.query(model.TransactionAllocation)
        .filter(model.TransactionAllocation.transaction_id == transaction_id)
        .order_by(model.TransactionAllocation.id.asc())
        .all()
    )