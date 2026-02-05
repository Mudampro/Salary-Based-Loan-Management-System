import os
from pathlib import Path
from datetime import timedelta
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..db import get_db
from .. import model, schema
from ..security import verify_password, create_access_token, get_password_hash


ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

router = APIRouter(prefix="/auth", tags=["Auth"])



def authenticate_user(db: Session, email: str, password: str) -> Optional[model.User]:
    user = db.query(model.User).filter(model.User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if getattr(user, "is_active", True) is False:
        return None
    return user


@router.post("/login", response_model=schema.TokenWithUser)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token = create_access_token(
        data={
            "user_id": user.id,
            "email": user.email,
            "role": user.role.value if user.role else None,
        },
        expires_delta=timedelta(minutes=30),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }



@router.post("/bootstrap-admin", response_model=schema.UserOut, status_code=status.HTTP_201_CREATED)
def bootstrap_admin(
    user_in: schema.UserCreate,
    db: Session = Depends(get_db),
):
    """
    Creates the FIRST admin user, only when BOOTSTRAP_ADMIN_ENABLED=true.
    After you create the admin once, set BOOTSTRAP_ADMIN_ENABLED=false (or remove it).
    """

    enabled = os.getenv("BOOTSTRAP_ADMIN_ENABLED", "false").lower() == "true"
    if not enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bootstrap admin is disabled. Enable BOOTSTRAP_ADMIN_ENABLED=true to use this route.",
        )

    
    existing_admin = (
        db.query(model.User)
        .filter(model.User.role == model.UserRole.ADMIN)
        .first()
    )
    if existing_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An admin user already exists. Bootstrap route cannot be used again.",
        )

    
    existing_email = db.query(model.User).filter(model.User.email == user_in.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )

    
    admin = model.User(
        full_name=user_in.full_name,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role=model.UserRole.ADMIN,
        is_active=True,
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin
