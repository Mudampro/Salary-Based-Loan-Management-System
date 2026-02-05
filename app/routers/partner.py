# app/routers/partner.py

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from .. import model, schema
from ..security import require_roles
from ..crud import partner_user_crud

router = APIRouter(prefix="/partner/admin", tags=["Partner Admin"])


@router.get("/users", response_model=List[schema.PartnerUserOut])
def list_partner_users(
    db: Session = Depends(get_db),
    current_user: model.User = Depends(
        require_roles([schema.UserRoleEnum.ADMIN, schema.UserRoleEnum.MANAGER])
    ),
):
    return partner_user_crud.list_partner_users(db)


@router.patch("/users/{partner_user_id}/activate", response_model=schema.PartnerUserOut)
def activate_partner_user(
    partner_user_id: int,
    db: Session = Depends(get_db),
    current_user: model.User = Depends(
        require_roles([schema.UserRoleEnum.ADMIN, schema.UserRoleEnum.MANAGER])
    ),
):
    u = partner_user_crud.get_partner_user(db, partner_user_id)
    if not u:
        raise HTTPException(status_code=404, detail="Partner user not found.")
    return partner_user_crud.set_partner_user_active(db, u, True)


@router.patch("/users/{partner_user_id}/deactivate", response_model=schema.PartnerUserOut)
def deactivate_partner_user(
    partner_user_id: int,
    db: Session = Depends(get_db),
    current_user: model.User = Depends(
        require_roles([schema.UserRoleEnum.ADMIN, schema.UserRoleEnum.MANAGER])
    ),
):
    u = partner_user_crud.get_partner_user(db, partner_user_id)
    if not u:
        raise HTTPException(status_code=404, detail="Partner user not found.")
    return partner_user_crud.set_partner_user_active(db, u, False)


@router.delete("/users/{partner_user_id}", status_code=204)
def delete_partner_user(
    partner_user_id: int,
    db: Session = Depends(get_db),
    current_user: model.User = Depends(
        require_roles([schema.UserRoleEnum.ADMIN, schema.UserRoleEnum.MANAGER])
    ),
):
    u = partner_user_crud.get_partner_user(db, partner_user_id)
    if not u:
        raise HTTPException(status_code=404, detail="Partner user not found.")
    partner_user_crud.delete_partner_user(db, u)
    return
