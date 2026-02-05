# app/crud/user_crud.py

from typing import Optional, List
from sqlalchemy.orm import Session

from .. import model, schema
from ..security import get_password_hash, verify_password


def get_user_by_email(db: Session, email: str) -> Optional[model.User]:
    return db.query(model.User).filter(model.User.email == email).first()


def get_user(db: Session, user_id: int) -> Optional[model.User]:
    return db.query(model.User).filter(model.User.id == user_id).first()


def _normalize_role_to_enum(role_value) -> model.UserRole:
    """
    Accepts either:
      - schema.UserRoleEnum
      - string ("ADMIN")
      - model.UserRole
    Returns model.UserRole.
    """
    if isinstance(role_value, model.UserRole):
        return role_value

    
    if hasattr(role_value, "value"):
        role_value = role_value.value

    
    return model.UserRole(str(role_value))


def create_user(
    db: Session,
    user_in: schema.UserCreate,
) -> model.User:
    hashed_pw = get_password_hash(user_in.password)

    db_user = model.User(
        full_name=user_in.full_name,
        email=user_in.email,
        hashed_password=hashed_pw,
        role=_normalize_role_to_enum(user_in.role),  
        is_active=True if getattr(user_in, "is_active", None) is None else user_in.is_active,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> Optional[model.User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user


def list_users(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> List[model.User]:
    return db.query(model.User).offset(skip).limit(limit).all()


def get_user_by_email(db: Session, email: str) -> Optional[model.User]:
    return db.query(model.User).filter(model.User.email == email).first()


def update_user_password(db: Session, user: model.User, new_password: str) -> model.User:
    user.hashed_password = get_password_hash(new_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

