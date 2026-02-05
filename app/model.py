# app/model.py

from datetime import datetime
import uuid
import enum

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Numeric,
    Text,
    Float,
)
from sqlalchemy.orm import relationship
from sqlalchemy import Enum as SqlEnum

from .db import Base



class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    LOAN_OFFICER = "LOAN_OFFICER"
    MANAGER = "MANAGER"
    CASHIER = "CASHIER"
    AUTHORIZER = "AUTHORIZER"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

    role = Column(SqlEnum(UserRole), nullable=False, default=UserRole.LOAN_OFFICER)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)



class PartnerOrganization(Base):
    __tablename__ = "partner_organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    email = Column(String(255), nullable=True) 
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)

    contact_person_name = Column(String(255), nullable=True)
    contact_person_email = Column(String(255), nullable=True)  
    contact_person_phone = Column(String(50), nullable=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    loan_links = relationship("CompanyLoanLink", back_populates="organization")
    customers = relationship("Customer", back_populates="organization")

    
    partner_users = relationship("PartnerUser", back_populates="organization", cascade="all, delete-orphan")
    remittance_accounts = relationship("PartnerRemittanceAccount", back_populates="organization", cascade="all, delete-orphan")
    inbound_transactions = relationship("InboundTransaction", back_populates="organization", cascade="all, delete-orphan")



class CompanyLoanLink(Base):
    __tablename__ = "company_loan_links"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(100), unique=True, index=True, nullable=False)

    organization_id = Column(Integer, ForeignKey("partner_organizations.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("loan_products.id"), nullable=False)

    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("PartnerOrganization", back_populates="loan_links")
    product = relationship("LoanProduct", back_populates="company_links")
    applications = relationship("LoanApplication", back_populates="link")

    @staticmethod
    def generate_token() -> str:
        return uuid.uuid4().hex

    @property
    def organization_name(self):
        return self.organization.name if self.organization else None

    @property
    def loan_product_name(self):
        return self.product.name if self.product else None




class Customer(Base):
    """
    NEW:
    - nun_account_number: created on APPROVAL (if none)
    - account_balance: simulated wallet balance to prove disbursement credit
    """
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)

    staff_id = Column(String(100), nullable=False)
    organization_id = Column(Integer, ForeignKey("partner_organizations.id"), nullable=False)

    bvn = Column(String(11), nullable=True)

    net_monthly_salary = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    nun_account_number = Column(String(20), nullable=True, unique=True, index=True)
    account_balance = Column(Numeric(12, 2), nullable=False, default=0)

    organization = relationship("PartnerOrganization", back_populates="customers")
    applications = relationship("LoanApplication", back_populates="customer")
    disbursements = relationship("Disbursement", back_populates="customer")




class LoanProduct(Base):
    __tablename__ = "loan_products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String, nullable=True)

    interest_rate = Column(Float, nullable=False)

    max_tenor_months = Column(Integer, nullable=False)
    min_amount = Column(Float, nullable=True)
    max_amount = Column(Float, nullable=True)

    repayment_frequency = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    applications = relationship("LoanApplication", back_populates="product", cascade="all, delete-orphan")
    loans = relationship("Loan", back_populates="product", cascade="all, delete-orphan")
    company_links = relationship("CompanyLoanLink", back_populates="product")




class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(Integer, primary_key=True, index=True)

    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("loan_products.id"), nullable=False)
    link_id = Column(Integer, ForeignKey("company_loan_links.id"), nullable=True)

    requested_amount = Column(Numeric(12, 2), nullable=False)
    approved_amount = Column(Numeric(12, 2), nullable=True)

    tenor_months = Column(Integer, nullable=False)

    status = Column(String(50), default="PENDING", index=True)

    officer_comment = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer", back_populates="applications")
    product = relationship("LoanProduct", back_populates="applications")
    link = relationship("CompanyLoanLink", back_populates="applications")
    loan = relationship("Loan", back_populates="application", uselist=False)




class Loan(Base):
    """
    Created on APPROVAL but stays pending until DISBURSE.
    """
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)

    application_id = Column(Integer, ForeignKey("loan_applications.id"), nullable=False, unique=True)
    product_id = Column(Integer, ForeignKey("loan_products.id"), nullable=False)

    principal_amount = Column(Numeric(12, 2), nullable=False)
    interest_rate = Column(Numeric(5, 4), nullable=False)
    total_payable = Column(Numeric(12, 2), nullable=False)

    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)

    status = Column(String(50), default="PENDING_DISBURSEMENT", index=True)

    disbursed_at = Column(DateTime, nullable=True)
    disbursement_reference = Column(String(50), nullable=True, unique=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("LoanApplication", back_populates="loan")
    product = relationship("LoanProduct", back_populates="loans")
    repayments = relationship("Repayment", back_populates="loan")
    disbursements = relationship("Disbursement", back_populates="loan")




class Repayment(Base):
    __tablename__ = "repayments"

    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=False)

    installment_number = Column(Integer, nullable=False)
    due_date = Column(DateTime, nullable=False)
    amount_due = Column(Numeric(12, 2), nullable=False)

    amount_paid = Column(Numeric(12, 2), nullable=False, default=0)
    is_paid = Column(Boolean, default=False)
    paid_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    loan = relationship("Loan", back_populates="repayments")

   
    allocations = relationship("TransactionAllocation", back_populates="repayment", cascade="all, delete-orphan")




class Disbursement(Base):
    __tablename__ = "disbursements"

    id = Column(Integer, primary_key=True, index=True)

    loan_application_id = Column(Integer, ForeignKey("loan_applications.id"), nullable=False, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)

    amount = Column(Numeric(12, 2), nullable=False)
    method = Column(String(30), nullable=False, default="NUN_ACCOUNT")
    reference = Column(String(50), nullable=True, unique=True, index=True)
    narration = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="disbursements")
    loan = relationship("Loan", back_populates="disbursements")




class PartnerUserRole(str, enum.Enum):
    PARTNER_ADMIN = "PARTNER_ADMIN"
    PARTNER_STAFF = "PARTNER_STAFF"


class PartnerUser(Base):
    """
    Partner portal user (HR/Accountant). Separate from bank staff User.
    Organization can have multiple partner users.
    """
    __tablename__ = "partner_users"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("partner_organizations.id"), nullable=False, index=True)

    full_name = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)

    hashed_password = Column(String(255), nullable=True)  # null until invite completed
    role = Column(SqlEnum(PartnerUserRole), nullable=False, default=PartnerUserRole.PARTNER_ADMIN)

    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("PartnerOrganization", back_populates="partner_users")
    invite_tokens = relationship("PartnerInviteToken", back_populates="partner_user", cascade="all, delete-orphan")


class PartnerInviteToken(Base):
    """
    One-time invite token used to set password securely.
    Store token_hash (never store raw token).
    """
    __tablename__ = "partner_invite_tokens"

    id = Column(Integer, primary_key=True, index=True)
    partner_user_id = Column(Integer, ForeignKey("partner_users.id"), nullable=False, index=True)

    token_hash = Column(String(255), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    partner_user = relationship("PartnerUser", back_populates="invite_tokens")


class PartnerRemittanceAccount(Base):
    """
    Where partner org remits monthly (virtual/dedicated account).
    """
    __tablename__ = "partner_remittance_accounts"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("partner_organizations.id"), nullable=False, index=True)

    account_number = Column(String(32), nullable=False, unique=True, index=True)
    bank_name = Column(String(255), nullable=True)
    account_name = Column(String(255), nullable=True)

    provider = Column(String(100), nullable=True)  
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("PartnerOrganization", back_populates="remittance_accounts")
    inbound_transactions = relationship("InboundTransaction", back_populates="remittance_account")


class TransactionMatchStatus(str, enum.Enum):
    UNMATCHED = "UNMATCHED"
    MATCHED = "MATCHED"
    DISPUTED = "DISPUTED"


class InboundTransaction(Base):
    """
    Money received from partner org remittance.
    This drives AUTOMATED repayment updates.
    """
    __tablename__ = "inbound_transactions"

    id = Column(Integer, primary_key=True, index=True)

    remittance_account_id = Column(Integer, ForeignKey("partner_remittance_accounts.id"), nullable=True, index=True)
    organization_id = Column(Integer, ForeignKey("partner_organizations.id"), nullable=True, index=True)

    amount = Column(Numeric(12, 2), nullable=False)
    reference = Column(String(100), nullable=False, unique=True, index=True)

    narration = Column(Text, nullable=True)
    sender_name = Column(String(255), nullable=True)

    paid_at = Column(DateTime, nullable=False)
    match_status = Column(SqlEnum(TransactionMatchStatus), nullable=False, default=TransactionMatchStatus.UNMATCHED)

    raw_payload = Column(Text, nullable=True)  
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("PartnerOrganization", back_populates="inbound_transactions")
    remittance_account = relationship("PartnerRemittanceAccount", back_populates="inbound_transactions")
    allocations = relationship("TransactionAllocation", back_populates="transaction", cascade="all, delete-orphan")


class TransactionAllocation(Base):
    """
    Audit trail: shows how inbound transaction was applied to repayments.
    """
    __tablename__ = "transaction_allocations"

    id = Column(Integer, primary_key=True, index=True)

    transaction_id = Column(Integer, ForeignKey("inbound_transactions.id"), nullable=False, index=True)
    repayment_id = Column(Integer, ForeignKey("repayments.id"), nullable=False, index=True)

    amount_applied = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    transaction = relationship("InboundTransaction", back_populates="allocations")
    repayment = relationship("Repayment", back_populates="allocations")
