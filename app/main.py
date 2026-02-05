# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import Base, engine

from app.routers import auth as auth_router_module
from app.routers import user as user_router_module

from app.routers import (
    organization_router,
    loan_product_router,
    loan_link_router,
    customer_router,
    loan_application_router,
    loan_router,
    repayment_router,
    disbursement,
    report_router,
    remittance_accounts,
    remittance,
    partner_auth,
    partner_dashboard,
    dashboard,
    partner,
    admin_remittance,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NUN MFB Salary-Based Loan API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router_module.router)
app.include_router(user_router_module.router)
app.include_router(admin_remittance.router)
app.include_router(partner_auth.router)
app.include_router(partner_dashboard.router)
app.include_router(partner.router)
app.include_router(remittance_accounts.router)
app.include_router(remittance.router)
app.include_router(organization_router)
app.include_router(loan_product_router)
app.include_router(loan_link_router)
app.include_router(customer_router)
app.include_router(loan_application_router)
app.include_router(loan_router)
app.include_router(repayment_router)
app.include_router(disbursement.router)
app.include_router(report_router.router)
app.include_router(dashboard.router)



@app.get("/")
def root():
    return {"status": "ok", "service": "NUN MFB Salary-Based Loan API"}
