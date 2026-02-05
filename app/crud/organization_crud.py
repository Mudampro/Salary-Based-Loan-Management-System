# app/crud/organization_crud.py

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from .. import model, schema
from ..crud import remittance_crud


def create_organization(
    db: Session, org_in: schema.PartnerOrganizationCreate
) -> model.PartnerOrganization:
    """
    Creates PartnerOrganization + automatically creates a UNIQUE virtual remittance account.
    Single transaction (no double commit).
    """
    org = model.PartnerOrganization(
        name=org_in.name,
        email=org_in.email,
        phone=org_in.phone,
        address=org_in.address,
        contact_person_name=org_in.contact_person_name,
        contact_person_email=org_in.contact_person_email,
        contact_person_phone=org_in.contact_person_phone,
        is_active=True,
    )

    try:
        db.add(org)
        db.flush()  

        remittance_crud.create_remittance_account(
            db=db,
            organization_id=org.id,
            bank_name="NUN Microfinance Bank",
            account_name=f"{org.name} - Loan Remittance",
            provider="INTERNAL_VIRTUAL",
            force_new=False,
            commit=False,  
        )

        db.commit()
        db.refresh(org)
        return org

    except IntegrityError:
        db.rollback()
        raise


def get_organization(db: Session, org_id: int) -> Optional[model.PartnerOrganization]:
    return (
        db.query(model.PartnerOrganization)
        .filter(model.PartnerOrganization.id == org_id)
        .first()
    )


def get_organization_by_name(
    db: Session, name: str
) -> Optional[model.PartnerOrganization]:
    return (
        db.query(model.PartnerOrganization)
        .filter(model.PartnerOrganization.name == name)
        .first()
    )


def list_organizations(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
) -> List[model.PartnerOrganization]:
    query = db.query(model.PartnerOrganization)
    if is_active is not None:
        query = query.filter(model.PartnerOrganization.is_active == is_active)
    return query.offset(skip).limit(limit).all()


def update_organization(
    db: Session,
    org: model.PartnerOrganization,
    org_in: schema.PartnerOrganizationUpdate,
) -> model.PartnerOrganization:
    for field, value in org_in.dict(exclude_unset=True).items():
        setattr(org, field, value)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


def set_organization_active(
    db: Session, org: model.PartnerOrganization, is_active: bool
) -> model.PartnerOrganization:
    org.is_active = is_active
    db.add(org)
    db.commit()
    db.refresh(org)
    return org
