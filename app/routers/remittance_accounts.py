# app/routers/remittance_accounts.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from .. import schema
from ..crud import remittance_crud
from ..security import require_roles

router = APIRouter(prefix="/remittance-accounts", tags=["Remittance Accounts"])


@router.post("/", response_model=schema.PartnerRemittanceAccountOut, status_code=status.HTTP_201_CREATED)
def create_account(
    payload: schema.PartnerRemittanceAccountCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles([schema.UserRoleEnum.ADMIN, schema.UserRoleEnum.MANAGER])),
):
    try:
        return remittance_crud.create_remittance_account(
            db=db,
            organization_id=payload.organization_id,
            bank_name=payload.bank_name or "NUN Microfinance Bank",
            account_name=payload.account_name,
            provider=payload.provider or "INTERNAL_VIRTUAL",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/org/{organization_id}", response_model=List[schema.PartnerRemittanceAccountOut])
def list_accounts_for_org(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles([schema.UserRoleEnum.ADMIN, schema.UserRoleEnum.MANAGER])),
):
    return remittance_crud.list_remittance_accounts_for_org(db, organization_id)


@router.get("/org/{organization_id}/active", response_model=schema.PartnerRemittanceAccountOut)
def get_active_account_for_org(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles([schema.UserRoleEnum.ADMIN, schema.UserRoleEnum.MANAGER])),
):
    acct = remittance_crud.get_active_remittance_account_for_org(db, organization_id)
    if not acct:
        raise HTTPException(status_code=404, detail="No active remittance account for this organization.")
    return acct
