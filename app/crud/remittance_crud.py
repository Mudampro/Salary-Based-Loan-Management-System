# app/crud/remittance_crud.py

import secrets
from typing import List, Optional
from sqlalchemy.orm import Session

from .. import model


def _generate_account_number(length: int = 10) -> str:
    return "".join(str(secrets.randbelow(10)) for _ in range(length))


def _generate_unique_account_number(
    db: Session, length: int = 10, max_attempts: int = 30
) -> str:
    for _ in range(max_attempts):
        acct_no = _generate_account_number(length=length)
        exists = (
            db.query(model.PartnerRemittanceAccount)
            .filter(model.PartnerRemittanceAccount.account_number == acct_no)
            .first()
        )
        if not exists:
            return acct_no
    raise ValueError("Unable to generate a unique remittance account number. Please retry.")


def create_remittance_account(
    db: Session,
    organization_id: int,
    bank_name: Optional[str] = "NUN Microfinance Bank",
    account_name: Optional[str] = None,
    provider: Optional[str] = "INTERNAL_VIRTUAL",
    force_new: bool = False,
    commit: bool = True,  
) -> model.PartnerRemittanceAccount:
    """
    Creates a remittance account for an organization.

    - If an active account exists and force_new=False, returns the existing active account.
    - If force_new=True, deactivates existing active accounts and creates a new one.
    - If commit=False, caller controls transaction boundaries.
    """
    org = (
        db.query(model.PartnerOrganization)
        .filter(model.PartnerOrganization.id == organization_id)
        .first()
    )
    if not org:
        raise ValueError("Organization not found.")

    existing_active = (
        db.query(model.PartnerRemittanceAccount)
        .filter(
            model.PartnerRemittanceAccount.organization_id == organization_id,
            model.PartnerRemittanceAccount.is_active.is_(True),
        )
        .first()
    )

    if existing_active and not force_new:
        return existing_active

    if force_new:
        actives = (
            db.query(model.PartnerRemittanceAccount)
            .filter(
                model.PartnerRemittanceAccount.organization_id == organization_id,
                model.PartnerRemittanceAccount.is_active.is_(True),
            )
            .all()
        )
        for a in actives:
            a.is_active = False
            db.add(a)

        if commit:
            db.commit()
        else:
            db.flush()

    acct_no = _generate_unique_account_number(db=db, length=10)

    if not account_name:
        account_name = f"{org.name} - Loan Remittance"

    account = model.PartnerRemittanceAccount(
        organization_id=organization_id,
        account_number=acct_no,
        bank_name=bank_name,
        account_name=account_name,
        provider=provider,
        is_active=True,
    )
    db.add(account)

    if commit:
        db.commit()
        db.refresh(account)
    else:
        db.flush()
        db.refresh(account)

    return account


def list_remittance_accounts_for_org(
    db: Session,
    organization_id: int,
) -> List[model.PartnerRemittanceAccount]:
    return (
        db.query(model.PartnerRemittanceAccount)
        .filter(model.PartnerRemittanceAccount.organization_id == organization_id)
        .order_by(model.PartnerRemittanceAccount.id.desc())
        .all()
    )


def get_active_remittance_account_for_org(
    db: Session,
    organization_id: int,
) -> Optional[model.PartnerRemittanceAccount]:
    return (
        db.query(model.PartnerRemittanceAccount)
        .filter(
            model.PartnerRemittanceAccount.organization_id == organization_id,
            model.PartnerRemittanceAccount.is_active.is_(True),
        )
        .first()
    )
