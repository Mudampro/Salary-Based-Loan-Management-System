# app/crud/loan_link_crud.py

from typing import List, Optional
from sqlalchemy.orm import Session, joinedload

from .. import model, schema


def create_company_loan_link(
    db: Session,
    link_in: schema.CompanyLoanLinkCreate,
) -> model.CompanyLoanLink:
    token = model.CompanyLoanLink.generate_token()

    link = model.CompanyLoanLink(
        token=token,
        organization_id=link_in.organization_id,
        product_id=link_in.product_id,
        is_active=True,
        expires_at=link_in.expires_at,
    )
    db.add(link)
    db.commit()
    db.refresh(link)

    
    return (
        db.query(model.CompanyLoanLink)
        .options(
            joinedload(model.CompanyLoanLink.organization),
            joinedload(model.CompanyLoanLink.product),
        )
        .filter(model.CompanyLoanLink.id == link.id)
        .first()
    )


def get_link(db: Session, link_id: int) -> Optional[model.CompanyLoanLink]:
    return (
        db.query(model.CompanyLoanLink)
        .options(
            joinedload(model.CompanyLoanLink.organization),
            joinedload(model.CompanyLoanLink.product),
        )
        .filter(model.CompanyLoanLink.id == link_id)
        .first()
    )


def get_link_by_token(db: Session, token: str) -> Optional[model.CompanyLoanLink]:
    return (
        db.query(model.CompanyLoanLink)
        .options(
            joinedload(model.CompanyLoanLink.organization),
            joinedload(model.CompanyLoanLink.product),
        )
        .filter(model.CompanyLoanLink.token == token)
        .first()
    )


def list_links(
    db: Session,
    *,
    organization_id: Optional[int] = None,
    product_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[model.CompanyLoanLink]:
    query = (
        db.query(model.CompanyLoanLink)
        .options(
            joinedload(model.CompanyLoanLink.organization),
            joinedload(model.CompanyLoanLink.product),
        )
    )

    if organization_id is not None:
        query = query.filter(model.CompanyLoanLink.organization_id == organization_id)

    if product_id is not None:
        query = query.filter(model.CompanyLoanLink.product_id == product_id)

    return (
        query.order_by(model.CompanyLoanLink.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )



def deactivate_link(
    db: Session,
    link: model.CompanyLoanLink,
) -> model.CompanyLoanLink:
    link.is_active = False
    db.add(link)
    db.commit()
    db.refresh(link)

    return (
        db.query(model.CompanyLoanLink)
        .options(
            joinedload(model.CompanyLoanLink.organization),
            joinedload(model.CompanyLoanLink.product),
        )
        .filter(model.CompanyLoanLink.id == link.id)
        .first()
    )
