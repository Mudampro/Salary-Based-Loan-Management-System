# app/crud/customer_crud.py

from typing import List, Optional
from decimal import Decimal
import secrets

from sqlalchemy.orm import Session, joinedload

from .. import model, schema


def create_customer(db: Session, customer_in: schema.CustomerCreate) -> model.Customer:
    customer = model.Customer(
        full_name=customer_in.full_name,
        email=customer_in.email,
        phone=customer_in.phone,
        staff_id=customer_in.staff_id,
        organization_id=customer_in.organization_id,
        net_monthly_salary=customer_in.net_monthly_salary,
        bvn=customer_in.bvn,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def get_customer(db: Session, customer_id: int) -> Optional[model.Customer]:
    return (
        db.query(model.Customer)
        .options(joinedload(model.Customer.organization))
        .filter(model.Customer.id == customer_id)
        .first()
    )


def list_customers(db: Session, skip: int = 0, limit: int = 100) -> List[model.Customer]:
    return (
        db.query(model.Customer)
        .options(joinedload(model.Customer.organization))
        .order_by(model.Customer.id.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_customer_by_staff_and_org(
    db: Session, staff_id: str, organization_id: int
) -> Optional[model.Customer]:
    return (
        db.query(model.Customer)
        .filter(
            model.Customer.staff_id == staff_id,
            model.Customer.organization_id == organization_id,
        )
        .first()
    )


def list_customers_by_org(
    db: Session, organization_id: int, skip: int = 0, limit: int = 100
) -> List[model.Customer]:
    return (
        db.query(model.Customer)
        .options(joinedload(model.Customer.organization))
        .filter(model.Customer.organization_id == organization_id)
        .order_by(model.Customer.id.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_customer(
    db: Session,
    customer: model.Customer,
    customer_in: schema.CustomerUpdate,
) -> model.Customer:
    for field, value in customer_in.dict(exclude_unset=True).items():
        setattr(customer, field, value)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def get_customer_loan_history(db: Session, customer_id: int) -> List[model.LoanApplication]:
    """
    Returns all loan applications for this customer (latest first),
    with product + link + customer loaded for frontend display.
    """
    return (
        db.query(model.LoanApplication)
        .options(
            joinedload(model.LoanApplication.product),
            joinedload(model.LoanApplication.link),
            joinedload(model.LoanApplication.customer).joinedload(model.Customer.organization),
        )
        .filter(model.LoanApplication.customer_id == customer_id)
        .order_by(model.LoanApplication.id.desc())
        .all()
    )


# =========================
# Account generation
# =========================

def _generate_10_digit_account(prefix: str = "248") -> str:
    suffix = "".join(str(secrets.randbelow(10)) for _ in range(7))
    return f"{prefix}{suffix}"


def ensure_customer_account(db: Session, customer: model.Customer, prefix: str = "248") -> model.Customer:
    if customer.nun_account_number:
        return customer

    for _ in range(30):
        acc = _generate_10_digit_account(prefix=prefix)
        exists = (
            db.query(model.Customer)
            .filter(model.Customer.nun_account_number == acc)
            .first()
        )
        if not exists:
            customer.nun_account_number = acc
            if customer.account_balance is None:
                customer.account_balance = Decimal("0.00")
            db.add(customer)
            db.commit()
            db.refresh(customer)
            return customer

    raise RuntimeError("Unable to generate unique account number.")
