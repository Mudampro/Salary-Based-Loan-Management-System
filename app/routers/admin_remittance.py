# app/routers/admin_remittance.py

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from .. import model, schema
from ..security import require_roles
from ..crud import admin_remittance_crud, repayment_crud

router = APIRouter(prefix="/admin/remittances", tags=["Admin Remittances"])


@router.get("/summary", response_model=schema.AdminRemittanceSummaryOut)
def org_remittance_summary(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            [schema.UserRoleEnum.ADMIN, schema.UserRoleEnum.MANAGER, schema.UserRoleEnum.CASHIER]
        )
    ),
):
    org = (
        db.query(model.PartnerOrganization)
        .filter(model.PartnerOrganization.id == organization_id)
        .first()
    )
    if not org:
        raise HTTPException(status_code=404, detail="Partner organization not found.")

    return admin_remittance_crud.get_org_remittance_summary(db, organization_id)


@router.get("/transactions", response_model=schema.AdminRemittanceTransactionsOut)
def org_transactions(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            [schema.UserRoleEnum.ADMIN, schema.UserRoleEnum.MANAGER, schema.UserRoleEnum.CASHIER]
        )
    ),
):
    org = (
        db.query(model.PartnerOrganization)
        .filter(model.PartnerOrganization.id == organization_id)
        .first()
    )
    if not org:
        raise HTTPException(status_code=404, detail="Partner organization not found.")

    return admin_remittance_crud.list_org_transactions_with_allocation(db, organization_id)


@router.get(
    "/transactions/{transaction_id}/allocations",
    response_model=List[schema.TransactionAllocationOut],
)
def transaction_allocations(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            [schema.UserRoleEnum.ADMIN, schema.UserRoleEnum.MANAGER, schema.UserRoleEnum.CASHIER]
        )
    ),
):
    tx = (
        db.query(model.InboundTransaction)
        .filter(model.InboundTransaction.id == transaction_id)
        .first()
    )
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    return admin_remittance_crud.list_transaction_allocations(db, transaction_id)



@router.post("/transactions/{transaction_id}/apply", status_code=status.HTTP_200_OK)
def apply_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            [schema.UserRoleEnum.ADMIN, schema.UserRoleEnum.MANAGER, schema.UserRoleEnum.CASHIER]
        )
    ),
):
    tx = (
        db.query(model.InboundTransaction)
        .filter(model.InboundTransaction.id == transaction_id)
        .first()
    )
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    
    if tx.match_status == model.TransactionMatchStatus.MATCHED:
        raise HTTPException(status_code=400, detail="Transaction already MATCHED (already allocated).")

    try:
        result = repayment_crud.apply_inbound_transaction_to_org(db, tx)
        return {"message": "Transaction allocated successfully.", "result": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/transactions/{transaction_id}/reverse", status_code=status.HTTP_200_OK)
def reverse_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles([schema.UserRoleEnum.ADMIN, schema.UserRoleEnum.MANAGER])),
):
    tx = (
        db.query(model.InboundTransaction)
        .filter(model.InboundTransaction.id == transaction_id)
        .first()
    )
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    
    if tx.match_status == model.TransactionMatchStatus.UNMATCHED:
        raise HTTPException(status_code=400, detail="This transaction is UNMATCHED (no allocations). Nothing to reverse.")

    try:
        result = repayment_crud.reverse_inbound_transaction(db, tx)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
