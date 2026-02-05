# app/crud/partner_user_crud.py

from typing import List, Optional
from sqlalchemy.orm import Session

from .. import model


def list_partner_users(db: Session) -> List[model.PartnerUser]:
    return (
        db.query(model.PartnerUser)
        .order_by(model.PartnerUser.created_at.desc())
        .all()
    )


def get_partner_user(db: Session, partner_user_id: int) -> Optional[model.PartnerUser]:
    return (
        db.query(model.PartnerUser)
        .filter(model.PartnerUser.id == partner_user_id)
        .first()
    )


def set_partner_user_active(
    db: Session, partner_user: model.PartnerUser, is_active: bool
) -> model.PartnerUser:
    partner_user.is_active = is_active
    db.add(partner_user)
    db.commit()
    db.refresh(partner_user)
    return partner_user


def delete_partner_user(db: Session, partner_user: model.PartnerUser) -> None:
    """
    Deletes PartnerUser and cascades invite_tokens due to model cascade config.
    """
    db.delete(partner_user)
    db.commit()
