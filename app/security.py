# app/security.py

import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Callable

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .db import get_db
from . import model, schema
from .config import settings


if settings.ENV != "production":
    load_dotenv()

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
partner_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/partner/auth/login")


def _normalize_secret(value: str) -> str:
    """
    ✅ BEST FIX for your current situation:
    Convert ANY length string into a fixed-length value before bcrypt.

    bcrypt has a hard limit of 72 BYTES. If you pass longer values, it crashes.
    This function makes the input safe by SHA-256 hashing it first.
    """
    if value is None:
        value = ""
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # bcrypt will NEVER crash now
    return pwd_context.verify(_normalize_secret(plain_password), hashed_password)


def get_password_hash(password: str) -> str:
    # bcrypt will NEVER crash now
    return pwd_context.hash(_normalize_secret(password))


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    to_encode = data.copy()

    if "sub" not in to_encode:
        if "user_id" in to_encode:
            to_encode["sub"] = str(to_encode["user_id"])
        elif "partner_user_id" in to_encode:
            to_encode["sub"] = str(to_encode["partner_user_id"])

    if "typ" not in to_encode:
        if "partner_user_id" in to_encode:
            to_encode["typ"] = "PARTNER"
        else:
            to_encode["typ"] = "STAFF"

    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def _role_value(role_obj) -> str:
    if role_obj is None:
        return ""
    if hasattr(role_obj, "value"):
        return str(role_obj.value).strip().upper()
    return str(role_obj).strip().upper()


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> model.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate staff credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if str(payload.get("typ", "")).upper() != "STAFF":
            raise credentials_exception

        user_id = payload.get("user_id") or payload.get("sub")
        if user_id is None:
            raise credentials_exception

        user_id = int(user_id)

    except (JWTError, ValueError):
        raise credentials_exception

    user = db.query(model.User).filter(model.User.id == user_id).first()
    if not user:
        raise credentials_exception

    if getattr(user, "is_active", True) is False:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user.")

    return user


def require_roles(allowed_roles: List[schema.UserRoleEnum]) -> Callable:
    allowed = [_role_value(r) for r in allowed_roles]

    def role_checker(current_user: model.User = Depends(get_current_user)):
        current_role = _role_value(getattr(current_user, "role", None))
        if current_role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current_user

    return role_checker


def get_current_partner_user(
    db: Session = Depends(get_db),
    token: str = Depends(partner_oauth2_scheme),
) -> model.PartnerUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate partner credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if str(payload.get("typ", "")).upper() != "PARTNER":
            raise credentials_exception

        partner_user_id = payload.get("partner_user_id") or payload.get("sub")
        if partner_user_id is None:
            raise credentials_exception

        partner_user_id = int(partner_user_id)

    except (JWTError, ValueError):
        raise credentials_exception

    user = db.query(model.PartnerUser).filter(model.PartnerUser.id == partner_user_id).first()
    if not user:
        raise credentials_exception

    if getattr(user, "is_active", False) is False:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive partner user.")

    return user
