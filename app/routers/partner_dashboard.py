from typing import List
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from .. import schema, model
from ..security import get_current_partner_user
from ..crud import remittance_crud, partner_dashboard_crud
from ..crud import partner_staff_crud

router = APIRouter(prefix="/partner/dashboard", tags=["Partner Dashboard"])


@router.get("/me", response_model=schema.PartnerUserOut)
def partner_me(current_partner=Depends(get_current_partner_user)):
    return current_partner


@router.get("/remittance-account", response_model=schema.PartnerRemittanceAccountOut)
def my_remittance_account(
    db: Session = Depends(get_db),
    current_partner=Depends(get_current_partner_user),
):
    acct = remittance_crud.get_active_remittance_account_for_org(
        db, current_partner.organization_id
    )
    if not acct:
        raise HTTPException(
            status_code=404,
            detail="No active remittance account. Contact the bank.",
        )
    return acct


def _generate_remittance_reference() -> str:
    """
    Generates a bank-controlled unique reference for inbound remittance transactions.
    Example: RMT-20260205123045-1A2B3C4D
    """
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    rnd = uuid4().hex[:8].upper()
    return f"RMT-{ts}-{rnd}"


@router.post("/remit", status_code=status.HTTP_201_CREATED)
def partner_remit_money(
    payload: schema.RemittanceIngestRequest,
    db: Session = Depends(get_db),
    current_partner=Depends(get_current_partner_user),
):
    
    if payload.organization_id != current_partner.organization_id:
        raise HTTPException(
            status_code=403,
            detail="You can only remit for your organization.",
        )

    acct = remittance_crud.get_active_remittance_account_for_org(
        db, current_partner.organization_id
    )
    if not acct:
        raise HTTPException(
            status_code=404,
            detail="No active remittance account. Contact the bank.",
        )

    
    reference = _generate_remittance_reference()

    
    while (
        db.query(model.InboundTransaction)
        .filter(model.InboundTransaction.reference == reference)
        .first()
        is not None
    ):
        reference = _generate_remittance_reference()

    paid_at = payload.paid_at or datetime.utcnow()

    tx = model.InboundTransaction(
        organization_id=current_partner.organization_id,
        remittance_account_id=acct.id,
        amount=payload.amount,
        reference=reference,
        narration=getattr(payload, "narration", None),
        sender_name=getattr(payload, "sender_name", None),
        paid_at=paid_at,
        match_status=model.TransactionMatchStatus.UNMATCHED,
        raw_payload=None,
    )

    db.add(tx)
    db.commit()
    db.refresh(tx)

    return {
        "message": "Remittance received. Pending bank allocation.",
        "transaction_id": tx.id,
        "reference": tx.reference,
        "match_status": tx.match_status.value,
    }


@router.get("/transactions", response_model=List[schema.InboundTransactionOut])
def my_transactions(
    db: Session = Depends(get_db),
    current_partner=Depends(get_current_partner_user),
):
    return (
        db.query(model.InboundTransaction)
        .filter(model.InboundTransaction.organization_id == current_partner.organization_id)
        .order_by(model.InboundTransaction.paid_at.desc())
        .all()
    )


@router.get("/monthly-due", response_model=schema.PartnerMonthlyDueOut)
def my_monthly_due(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_partner=Depends(get_current_partner_user),
):
    return partner_dashboard_crud.get_org_monthly_due(
        db=db,
        organization_id=current_partner.organization_id,
        year=year,
        month=month,
    )


@router.get("/staff-loans", response_model=schema.PartnerStaffLoansOut)
def my_staff_loans(
    db: Session = Depends(get_db),
    current_partner=Depends(get_current_partner_user),
):
    return partner_staff_crud.list_org_staff_with_loans(
        db=db,
        organization_id=current_partner.organization_id,
    )
