# app/routers/organization.py

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import schema
from ..db import get_db
from ..crud import organization_crud
from ..security import require_roles

router = APIRouter(
    prefix="/organizations",
    tags=["Organizations"],
)


@router.post(
    "/",
    response_model=schema.PartnerOrganizationOut,
    status_code=status.HTTP_201_CREATED,
)
def create_organization(
    org_in: schema.PartnerOrganizationCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(require_roles([schema.UserRoleEnum.ADMIN])),
):
    existing = organization_crud.get_organization_by_name(db, org_in.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization with this name already exists.",
        )
    return organization_crud.create_organization(db, org_in)


@router.get(
    "/",
    response_model=List[schema.PartnerOrganizationOut],
)
def list_organizations(
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin=Depends(require_roles([schema.UserRoleEnum.ADMIN])),
):
    return organization_crud.list_organizations(
        db, skip=skip, limit=limit, is_active=is_active
    )


@router.get(
    "/{org_id}",
    response_model=schema.PartnerOrganizationOut,
)
def get_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(require_roles([schema.UserRoleEnum.ADMIN])),
):
    org = organization_crud.get_organization(db, org_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found.",
        )
    return org


@router.put(
    "/{org_id}",
    response_model=schema.PartnerOrganizationOut,
)
def update_organization(
    org_id: int,
    org_in: schema.PartnerOrganizationUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(require_roles([schema.UserRoleEnum.ADMIN])),
):
    org = organization_crud.get_organization(db, org_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found.",
        )
    return organization_crud.update_organization(db, org, org_in)


@router.patch(
    "/{org_id}/activate",
    response_model=schema.PartnerOrganizationOut,
)
def activate_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(require_roles([schema.UserRoleEnum.ADMIN])),
):
    org = organization_crud.get_organization(db, org_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found.",
        )
    return organization_crud.set_organization_active(db, org, True)


@router.patch(
    "/{org_id}/deactivate",
    response_model=schema.PartnerOrganizationOut,
)
def deactivate_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(require_roles([schema.UserRoleEnum.ADMIN])),
):
    org = organization_crud.get_organization(db, org_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found.",
        )
    return organization_crud.set_organization_active(db, org, False)
