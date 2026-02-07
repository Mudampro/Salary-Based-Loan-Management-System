# app/schema.py

from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from enum import Enum

from pydantic import BaseModel, EmailStr, Field, constr, ConfigDict




class PartnerOrganizationBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None

    contact_person_name: Optional[str] = None
    contact_person_email: Optional[EmailStr] = None
    contact_person_phone: Optional[str] = None


class PartnerOrganizationCreate(PartnerOrganizationBase):
    pass


class PartnerOrganizationUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None

    contact_person_name: Optional[str] = None
    contact_person_email: Optional[EmailStr] = None
    contact_person_phone: Optional[str] = None


class PartnerOrganizationOut(PartnerOrganizationBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)




class CompanyLoanLinkBase(BaseModel):
    organization_id: int
    product_id: int
    is_active: bool = True
    expires_at: Optional[datetime] = None


class CompanyLoanLinkCreate(BaseModel):
    organization_id: int
    product_id: int
    expires_at: Optional[datetime] = None


class CompanyLoanLinkOut(CompanyLoanLinkBase):
    id: int
    token: str
    created_at: datetime

    organization_name: Optional[str] = None
    loan_product_name: Optional[str] = None

    class Config:
        orm_mode = True




class CustomerBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    staff_id: str
    organization_id: int
    net_monthly_salary: Decimal
    bvn: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    staff_id: Optional[str] = None
    organization_id: Optional[int] = None
    net_monthly_salary: Optional[Decimal] = None
    bvn: Optional[str] = None


class CustomerOut(CustomerBase):
    id: int
    created_at: datetime

    nun_account_number: Optional[str] = None
    account_balance: Decimal = Decimal("0.00")

    organization: Optional[PartnerOrganizationOut] = None

    model_config = ConfigDict(from_attributes=True)




class LoanProductBase(BaseModel):
    name: str = Field(..., description="Name of the loan product")
    description: Optional[str] = Field(None, description="Short description of the loan product")
    interest_rate: float = Field(..., ge=0, description="Nominal annual interest rate (percentage, e.g. 24.0)")
    max_tenor_months: int = Field(..., description="Maximum tenor in months (e.g. 12, 24)")
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    repayment_frequency: Optional[str] = None
    is_active: bool = True


class LoanProductCreate(LoanProductBase):
    pass


class LoanProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    interest_rate: Optional[float] = None
    max_tenor_months: Optional[int] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    repayment_frequency: Optional[str] = None
    is_active: Optional[bool] = None


class LoanProductOut(LoanProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True




class LoanApplicationBase(BaseModel):
    customer_id: int
    product_id: int
    link_id: Optional[int] = None
    requested_amount: Decimal
    tenor_months: int


class LoanApplicationCreate(LoanApplicationBase):
    pass


class LoanApplicationUpdateStatus(BaseModel):
    status: Optional[str] = None
    approved_amount: Optional[Decimal] = None
    officer_comment: Optional[str] = None


class LoanApplicationUpdate(BaseModel):
    requested_amount: Optional[Decimal] = None
    tenor_months: Optional[int] = None
    status: Optional[str] = None
    approved_amount: Optional[Decimal] = None
    officer_comment: Optional[str] = None


class LoanApplicationOut(BaseModel):
    id: int
    customer_id: int
    product_id: int
    link_id: Optional[int] = None

    requested_amount: Decimal
    approved_amount: Optional[Decimal] = None
    tenor_months: int

    status: str
    officer_comment: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    customer: Optional[CustomerOut] = None
    product: Optional[LoanProductOut] = None
    link: Optional[CompanyLoanLinkOut] = None

    class Config:
        orm_mode = True




class PublicLoanApplicationBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    staff_id: str
    net_pay: Decimal
    bvn: constr(pattern=r"^\d{11}$")

    requested_amount: Decimal
    tenor_months: int


class PublicLoanApplicationCreate(PublicLoanApplicationBase):
    pass




class LoanBase(BaseModel):
    application_id: int
    principal_amount: Decimal
    interest_rate: Decimal
    total_payable: Decimal
    status: Optional[str] = None

    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    disbursed_at: Optional[datetime] = None
    disbursement_reference: Optional[str] = None


class LoanCreate(LoanBase):
    product_id: int


class LoanOut(BaseModel):
    id: int
    application_id: int
    product_id: int

    principal_amount: Decimal
    interest_rate: Decimal
    total_payable: Decimal

    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    status: Optional[str] = None
    created_at: datetime

    disbursed_at: Optional[datetime] = None
    disbursement_reference: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class LoanUpdateStatus(BaseModel):
    status: Optional[str] = None




class RepaymentBase(BaseModel):
    loan_id: int
    installment_number: int
    due_date: datetime
    amount_due: Decimal


class RepaymentCreate(RepaymentBase):
    pass


class RepaymentMarkPaid(BaseModel):
    amount_paid: Decimal
    paid_at: Optional[datetime] = None


class RepaymentReverseRequest(BaseModel):
    reason: Optional[str] = None


class RepaymentOut(RepaymentBase):
    id: int
    amount_paid: Decimal
    is_paid: bool
    paid_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        orm_mode = True




class DisbursementOut(BaseModel):
    id: int
    loan_application_id: int
    loan_id: Optional[int] = None
    customer_id: int
    amount: Decimal
    method: str
    reference: Optional[str] = None
    narration: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DisburseLoanRequest(BaseModel):
    disburse_amount: Optional[Decimal] = None
    narration: Optional[str] = None
    reference: Optional[str] = None


class DisburseLoanResponse(BaseModel):
    loan: LoanOut
    disbursement: DisbursementOut
    customer: CustomerOut

    model_config = ConfigDict(from_attributes=True)




class UserRoleEnum(str, Enum):
    ADMIN = "ADMIN"
    LOAN_OFFICER = "LOAN_OFFICER"
    MANAGER = "MANAGER"
    CASHIER = "CASHIER"
    AUTHORIZER = "AUTHORIZER"


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRoleEnum


class UserCreate(UserBase):
    password: str
    is_active: bool = True


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRoleEnum] = None
    is_active: Optional[bool] = None


class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True
        use_enum_values = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: int
    role: UserRoleEnum
    email: EmailStr


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class ResetPasswordRequest(BaseModel):
    new_password: str


class TokenWithUser(Token):
    user: UserOut

    class Config:
        orm_mode = True
        use_enum_values = True


class MessageOut(BaseModel):
    message: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordConfirmRequest(BaseModel):
    token: str
    new_password: str




class OrgMonthlyRepaymentRow(BaseModel):
    installment_number: int
    loan_id: int
    due_date: datetime
    amount_due: Decimal
    amount_paid: Decimal
    is_paid: bool
    paid_at: Optional[datetime]

    class Config:
        orm_mode = True


class OrgMonthlyReportOut(BaseModel):
    organization_id: int
    year: int
    month: int

    total_active_loans: int
    new_loans_count: int
    new_loans_principal: Decimal

    scheduled_amount: Decimal
    paid_amount: Decimal
    collection_rate: Optional[float]

    repayments: List[OrgMonthlyRepaymentRow]


class OrgMonthlyReportV2Organization(BaseModel):
    id: int
    name: str


class OrgMonthlyReportV2Period(BaseModel):
    year: int
    month: int
    label: str


class OrgMonthlyReportV2Summary(BaseModel):
    loans_in_period: int
    total_principal: float
    total_expected_month: float
    total_paid_month: float
    total_outstanding_month: float


class OrgMonthlyReportV2RepaymentRow(BaseModel):
    id: int
    installment_number: Optional[int] = None
    due_date: Optional[str] = None
    amount_due: float
    amount_paid: float
    is_paid: bool
    paid_at: Optional[str] = None


class OrgMonthlyReportV2LoanItem(BaseModel):
    loan_id: int
    principal_amount: float
    status: str
    total_expected_for_month: float
    total_paid_for_month: float
    total_outstanding_for_month: float
    repayments: List[OrgMonthlyReportV2RepaymentRow] = []


class OrgMonthlyReportV2Out(BaseModel):
    organization: Optional[OrgMonthlyReportV2Organization] = None
    period: OrgMonthlyReportV2Period
    summary: OrgMonthlyReportV2Summary
    items: List[OrgMonthlyReportV2LoanItem] = []




class PartnerUserRoleEnum(str, Enum):
    PARTNER_ADMIN = "PARTNER_ADMIN"
    PARTNER_STAFF = "PARTNER_STAFF"


class PartnerUserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: PartnerUserRoleEnum = PartnerUserRoleEnum.PARTNER_ADMIN
    is_active: bool = False


class PartnerUserCreate(PartnerUserBase):
    organization_id: int


class PartnerUserOut(BaseModel):
    id: int
    organization_id: int
    email: str
    full_name: Optional[str] = None
    role: PartnerUserRoleEnum
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

class PartnerInviteCreateRequest(BaseModel):
    organization_id: int
    email: EmailStr
    full_name: Optional[str] = None
    role: PartnerUserRoleEnum = PartnerUserRoleEnum.PARTNER_ADMIN
    expires_in_hours: int = 24


class PartnerInviteCreateOut(BaseModel):
    message: str
    invite_link: str
    expires_at: datetime
    partner_user: PartnerUserOut

    class Config:
        orm_mode = True
        use_enum_values = True

class PartnerInviteValidateIn(BaseModel):
    token: str


class PartnerInviteCompleteIn(BaseModel):
    token: str
    password: str = Field(min_length=8)
    full_name: Optional[str] = None

class MessageOut(BaseModel):
    message: str

class PartnerLoginRequest(BaseModel):
    email: EmailStr
    password: str


class PartnerTokenWithUser(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: PartnerUserOut

    class Config:
        orm_mode = True
        use_enum_values = True

class PartnerMonthlyDueOut(BaseModel):
    organization_id: int
    year: int
    month: int
    amount_due: Decimal
    repayments_count: int

    model_config = ConfigDict(from_attributes=True)




class RemittanceIngestRequest(BaseModel):
    organization_id: int
    amount: Decimal
    narration: Optional[str] = None
    sender_name: Optional[str] = None
    paid_at: Optional[datetime] = None




class PartnerRemittanceAccountCreate(BaseModel):
    organization_id: int
    bank_name: Optional[str] = None
    account_name: Optional[str] = None
    provider: Optional[str] = None


class PartnerRemittanceAccountOut(BaseModel):
    id: int
    organization_id: int
    account_number: str
    bank_name: Optional[str] = None
    account_name: Optional[str] = None
    provider: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)



class TransactionAllocationOut(BaseModel):
    id: int
    transaction_id: int
    repayment_id: int
    amount_applied: Decimal
    created_at: datetime

    class Config:
        orm_mode = True




class InboundTransactionOut(BaseModel):
    id: int
    organization_id: Optional[int] = None
    remittance_account_id: Optional[int] = None
    amount: Decimal
    reference: str
    narration: Optional[str] = None
    sender_name: Optional[str] = None
    paid_at: datetime
    match_status: str
    created_at: datetime

    class Config:
        orm_mode = True




class DashboardSummaryOut(BaseModel):
    year: int
    month: int

    total_outstanding: Decimal
    overdue_amount: Decimal
    this_month_due: Decimal
    this_month_collected: Decimal

    pending_applications: int
    approved_not_disbursed: int
    active_loans: int


class AdminRemittanceSummaryOut(BaseModel):
    organization_id: int
    total_remitted: Decimal
    total_applied: Decimal
    unallocated_balance: Decimal
    total_outstanding: Decimal

class AdminRemittanceTransactionRow(BaseModel):
    tx: InboundTransactionOut
    applied_amount: Decimal
    unallocated_amount: Decimal

class AdminRemittanceTransactionsOut(BaseModel):
    organization_id: int
    rows: List[AdminRemittanceTransactionRow]



class PartnerStaffLoanRow(BaseModel):
    customer_id: int
    staff_id: str
    full_name: str
    email: str
    phone: str

    loan_id: int
    loan_status: str
    principal_amount: Decimal
    total_payable: Decimal

    total_due: Decimal
    total_paid: Decimal
    outstanding: Decimal

    next_due_date: Optional[datetime] = None
    next_amount_due: Optional[Decimal] = None

    model_config = ConfigDict(from_attributes=True)


class PartnerStaffLoansOut(BaseModel):
    organization_id: int
    rows: List[PartnerStaffLoanRow]

    model_config = ConfigDict(from_attributes=True)