# app/routers/remittance.py

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from .. import model, schema
from ..crud import repayment_crud
from ..security import require_roles

router = APIRouter(prefix="/remittance", tags=["Remittance"])


@router.post("/ingest", status_code=status.HTTP_201_CREATED)
def ingest_remittance(
    payload: schema.RemittanceIngestRequest,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles([schema.UserRoleEnum.ADMIN, schema.UserRoleEnum.MANAGER, schema.UserRoleEnum.CASHIER])
    ),
):
    org = db.query(model.PartnerOrganization).filter(model.PartnerOrganization.id == payload.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Partner organization not found.")

    existing = db.query(model.InboundTransaction).filter(model.InboundTransaction.reference == payload.reference).first()
    if existing:
        raise HTTPException(status_code=400, detail="Transaction reference already exists.")

    tx = model.InboundTransaction(
        organization_id=payload.organization_id,
        remittance_account_id=payload.remittance_account_id,
        amount=payload.amount,
        reference=payload.reference,
        narration=payload.narration,
        sender_name=payload.sender_name,
        paid_at=payload.paid_at or datetime.utcnow(),
        match_status=model.TransactionMatchStatus.UNMATCHED,
        raw_payload=None,
    )

    db.add(tx)
    db.commit()
    db.refresh(tx)

    result = repayment_crud.apply_inbound_transaction_to_org(db, tx)
    return {"message": "Remittance ingested and applied automatically.", "result": result}
