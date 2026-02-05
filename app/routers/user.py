# app/routers/user.py

import os
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import schema, model
from ..db import get_db
from ..crud import user_crud
from ..security import (
    require_roles,
    get_current_user,
    get_password_hash,
    verify_password,
)

from ..utils.reset_tokens import (
    create_password_reset_token,
    verify_password_reset_token,
)

router = APIRouter(prefix="/users", tags=["Users"])

FRONTEND_RESET_URL = os.environ.get(
    "FRONTEND_RESET_URL", "http://localhost:5173/reset-password"
)

MIN_PASSWORD_LEN = int(os.environ.get("MIN_PASSWORD_LEN", "6"))


def _password_strength_check(pw: str):
    if not pw or len(pw) < MIN_PASSWORD_LEN:
        raise HTTPException(
            status_code=400,
            detail=f"Password must be at least {MIN_PASSWORD_LEN} characters.",
        )


# -----------------------
# Admin: Create / List Users
# -----------------------

@router.post(
    "/",
    response_model=schema.UserOut,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    user_in: schema.UserCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(require_roles([schema.UserRoleEnum.ADMIN])),
):
    existing = user_crud.get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists.",
        )

    _password_strength_check(user_in.password)

    return user_crud.create_user(db, user_in)


@router.get(
    "/",
    response_model=List[schema.UserOut],
)
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin=Depends(require_roles([schema.UserRoleEnum.ADMIN])),
):
    return user_crud.list_users(db, skip=skip, limit=limit)


# -----------------------
# Current user info
# -----------------------

@router.get("/me", response_model=schema.UserOut)
def me(current_user: model.User = Depends(get_current_user)):
    return current_user


# -----------------------
# Change Password (Self)
# Keep BOTH endpoints so old frontend won't break
# -----------------------

def _change_password_logic(
    payload: schema.ChangePasswordRequest,
    db: Session,
    current_user: model.User,
):
    if not payload.old_password or not payload.new_password:
        raise HTTPException(status_code=400, detail="old_password and new_password are required.")

    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Old password is incorrect.")

    if payload.old_password == payload.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different from old password.",
        )

    _password_strength_check(payload.new_password)

    current_user.hashed_password = get_password_hash(payload.new_password)
    db.add(current_user)
    db.commit()

    # return both keys so any frontend expecting either won't break
    return {
        "detail": "Password changed successfully.",
        "message": "Password changed successfully.",
    }


@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password_old_path(
    payload: schema.ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: model.User = Depends(get_current_user),
):
    return _change_password_logic(payload, db, current_user)


@router.patch("/me/change-password", status_code=status.HTTP_200_OK)
def change_password_new_path(
    payload: schema.ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: model.User = Depends(get_current_user),
):
    return _change_password_logic(payload, db, current_user)


# -----------------------
# Admin reset user password
# -----------------------

@router.post(
    "/{user_id}/reset-password",
    status_code=status.HTTP_200_OK,
)
def reset_password_admin(
    user_id: int,
    payload: schema.ResetPasswordRequest,
    db: Session = Depends(get_db),
    current_admin=Depends(require_roles([schema.UserRoleEnum.ADMIN])),
):
    if not payload.new_password:
        raise HTTPException(status_code=400, detail="new_password is required.")

    _password_strength_check(payload.new_password)

    user = user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.hashed_password = get_password_hash(payload.new_password)
    db.add(user)
    db.commit()

    return {
        "detail": "Password reset successfully.",
        "message": "Password reset successfully.",
    }


# -----------------------
# Forgot password + token reset (self-service)
# -----------------------

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(payload: schema.ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Demo mode: prints reset link in backend console.
    Production: send email.
    Always return same response to prevent email enumeration.
    """
    # Prevent email enumeration
    user = user_crud.get_user_by_email(db, payload.email) if payload.email else None

    if user:
        token = create_password_reset_token(user.email)
        reset_link = f"{FRONTEND_RESET_URL}?token={token}"
        print("PASSWORD RESET LINK:", reset_link)

    msg = "If the email exists, a reset link has been generated."
    return {"detail": msg, "message": msg}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password_with_token(
    payload: schema.ResetPasswordConfirmRequest,
    db: Session = Depends(get_db),
):
    if not payload.token:
        raise HTTPException(status_code=400, detail="token is required.")
    if not payload.new_password:
        raise HTTPException(status_code=400, detail="new_password is required.")

    _password_strength_check(payload.new_password)

    email = verify_password_reset_token(payload.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired token.")

    user = user_crud.get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.hashed_password = get_password_hash(payload.new_password)
    db.add(user)
    db.commit()

    return {
        "detail": "Password reset successful. You can now log in.",
        "message": "Password reset successful. You can now log in.",
    }
