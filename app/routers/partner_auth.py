# app/routers/partner_auth.py

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..db import get_db
from .. import model, schema
from ..security import verify_password, get_password_hash, create_access_token
from ..security import require_roles
from ..config import settings

router = APIRouter(prefix="/partner", tags=["Partner Auth"])


def _now_utc_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _hash_token(raw: str) -> str:
    raw = (raw or "").strip()
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _get_partner_user_by_email(db: Session, email: str) -> Optional[model.PartnerUser]:
    return db.query(model.PartnerUser).filter(model.PartnerUser.email == email).first()


def _get_latest_invite_by_hash(
    db: Session, token_hash: str
) -> Optional[model.PartnerInviteToken]:
    """
    Always use the most recent invite row for a given hash.
    """
    return (
        db.query(model.PartnerInviteToken)
        .filter(model.PartnerInviteToken.token_hash == token_hash)
        .order_by(model.PartnerInviteToken.id.desc())
        .first()
    )


@router.post(
    "/invite/create",
    response_model=schema.PartnerInviteCreateOut,
    status_code=status.HTTP_201_CREATED,
)
def create_partner_invite(
    payload: schema.PartnerInviteCreateRequest,
    db: Session = Depends(get_db),
    current_user: model.User = Depends(
        require_roles([schema.UserRoleEnum.ADMIN, schema.UserRoleEnum.MANAGER])
    ),
):
    org = (
        db.query(model.PartnerOrganization)
        .filter(model.PartnerOrganization.id == payload.organization_id)
        .first()
    )
    if not org:
        raise HTTPException(status_code=404, detail="Partner organization not found.")

    partner_user = _get_partner_user_by_email(db, payload.email)
    if partner_user:
        if partner_user.organization_id != org.id:
            raise HTTPException(
                status_code=400,
                detail="Email already belongs to another organization.",
            )

        if payload.full_name is not None:
            partner_user.full_name = payload.full_name
        if payload.role is not None:
            partner_user.role = payload.role

        db.add(partner_user)
        db.commit()
        db.refresh(partner_user)
    else:
        partner_user = model.PartnerUser(
            organization_id=org.id,
            email=payload.email,
            full_name=payload.full_name,
            role=payload.role,
            is_active=False,
            hashed_password=None,
        )
        db.add(partner_user)
        db.commit()
        db.refresh(partner_user)

    raw_token = secrets.token_urlsafe(32)
    token_hash = _hash_token(raw_token)

    expires_in_hours = getattr(payload, "expires_in_hours", None)
    if not isinstance(expires_in_hours, int) or expires_in_hours <= 0:
        expires_in_hours = 24

    now = _now_utc_naive()
    expires_at = now + timedelta(hours=expires_in_hours)

    invite = model.PartnerInviteToken(
        partner_user_id=partner_user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        used_at=None,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    base = settings.frontend_base_url.rstrip("/")
    invite_link = f"{base}/#/partner/invite/{raw_token}"

    return schema.PartnerInviteCreateOut(
        message="Invite created successfully.",
        invite_link=invite_link,
        expires_at=expires_at,
        partner_user=schema.PartnerUserOut.model_validate(partner_user),
    )


@router.post("/invite/validate", response_model=schema.MessageOut)
def validate_partner_invite(
    payload: schema.PartnerInviteValidateIn,
    db: Session = Depends(get_db),
):
    token_hash = _hash_token(payload.token)
    invite = _get_latest_invite_by_hash(db, token_hash)

    
    if not invite:
        raise HTTPException(status_code=400, detail="Invalid invite token.")

    if invite.used_at is not None:
        raise HTTPException(status_code=400, detail="Invite token already used.")

    now = _now_utc_naive()
    if invite.expires_at < now:
        raise HTTPException(status_code=400, detail="Invite token expired.")

    partner_user = (
        db.query(model.PartnerUser)
        .filter(model.PartnerUser.id == invite.partner_user_id)
        .first()
    )
    if not partner_user:
        raise HTTPException(status_code=400, detail="Partner user not found.")

    return schema.MessageOut(message="Invite token is valid.")


@router.post("/invite/complete", response_model=schema.MessageOut)
def complete_partner_invite(
    payload: schema.PartnerInviteCompleteIn,
    db: Session = Depends(get_db),
):
    token_hash = _hash_token(payload.token)
    invite = _get_latest_invite_by_hash(db, token_hash)

    if not invite:
        raise HTTPException(status_code=400, detail="Invalid invite token.")

    if invite.used_at is not None:
        raise HTTPException(status_code=400, detail="Invite token already used.")

    now = _now_utc_naive()
    if invite.expires_at < now:
        raise HTTPException(status_code=400, detail="Invite token expired.")

    partner_user = (
        db.query(model.PartnerUser)
        .filter(model.PartnerUser.id == invite.partner_user_id)
        .first()
    )
    if not partner_user:
        raise HTTPException(status_code=400, detail="Partner user not found.")

    if payload.full_name is not None:
        partner_user.full_name = payload.full_name

    try:
        partner_user.hashed_password = get_password_hash(payload.password)
        partner_user.is_active = True
        invite.used_at = now  

        db.add(partner_user)
        db.add(invite)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to complete invite. Please try again.")

    return schema.MessageOut(message="Password set successfully. You can now login.")


@router.post("/auth/login", response_model=schema.PartnerTokenWithUser)
def partner_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = _get_partner_user_by_email(db, form_data.username)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    if not user.is_active or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not active. Complete invite setup.",
        )

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    access_token = create_access_token(
        data={
            "partner_user_id": user.id,
            "email": user.email,
            "role": user.role.value if user.role else None,
            "organization_id": user.organization_id,
            "typ": "PARTNER",
        },
        expires_delta=timedelta(minutes=30),
    )

    return {"access_token": access_token, "token_type": "bearer", "user": user}
