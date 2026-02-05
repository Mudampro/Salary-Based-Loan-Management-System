# app/crud/loan_product_crud.py

from typing import List, Optional

from sqlalchemy.orm import Session

from app import model, schema


def create_loan_product(db: Session, product_in: schema.LoanProductCreate) -> model.LoanProduct:
    product = model.LoanProduct(**product_in.dict())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def list_loan_products(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
) -> List[model.LoanProduct]:
    query = db.query(model.LoanProduct)

    if is_active is not None:
        query = query.filter(model.LoanProduct.is_active == is_active)

    return query.offset(skip).limit(limit).all()


def get_loan_product(db: Session, product_id: int) -> Optional[model.LoanProduct]:
    return db.query(model.LoanProduct).filter(model.LoanProduct.id == product_id).first()


def update_loan_product(
    db: Session,
    product: model.LoanProduct,
    product_in: schema.LoanProductUpdate,
) -> model.LoanProduct:
    update_data = product_in.dict(exclude_unset=True)

    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product
