// frontend/src/Router.jsx
import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";


import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";


import ApplyLoanPage from "./pages/public/ApplyLoanPage";
import LoanApplicationResultPage from "./pages/public/LoanApplicationResultPage";


import PartnerLoginPage from "./pages/partner/PartnerLoginPage";
import PartnerInvitePage from "./pages/partner/PartnerInvitePage";
import PartnerDashboardPage from "./pages/partner/PartnerDashboardPage";


import PartnerStaffLoansPage from "./pages/partner/PartnerStaffLoansPage";
import PartnerTransactionsPage from "./pages/partner/PartnerTransactionsPage";

import PartnerLayout from "./layouts/PartnerLayout";
import usePartnerProtectedRoute from "./hooks/usePartnerProtectedRoute";


import HomePage from "./pages/dashboard/HomePage";
import DashboardLayout from "./layouts/DashboardLayout";
import useProtectedRoute from "./hooks/useProtectedRoute";


import OrganizationsListPage from "./pages/organizations/OrganizationsListPage";
import OrganizationFormPage from "./pages/organizations/OrganizationFormPage";


import CustomersListPage from "./pages/customers/CustomersListPage";
import CustomerFormPage from "./pages/customers/CustomerFormPage";
import CustomerDetailPage from "./pages/customers/CustomerDetailPage";


import LoanProductsListPage from "./pages/loanProducts/LoanProductsListPage";
import LoanProductFormPage from "./pages/loanProducts/LoanProductFormPage";


import LoanLinksListPage from "./pages/loanLinks/LoanLinksListPage";
import LoanLinkCreatePage from "./pages/loanLinks/LoanLinkCreatePage";


import LoanApplicationsListPage from "./pages/loanApplications/LoanApplicationsListPage";
import LoanApplicationDetailPage from "./pages/loanApplications/LoanApplicationDetailPage";


import LoansListPage from "./pages/loans/LoansListPage";
import LoanDetailPage from "./pages/loans/LoanDetailPage";


import PartnerUsersPage from "./pages/partnerAdmin/PartnerUsersPage";


import RemittanceLedgerPage from "./pages/remittance/RemittanceLedgerPage";


import UsersListPage from "./pages/users/UsersListPage";
import UserFormPage from "./pages/users/UserFormPage";


import AccountPage from "./pages/account/AccountPage";
import ChangePasswordPage from "./pages/account/ChangePasswordPage";


import OrgMonthlyReportPage from "./pages/reports/OrgMonthlyReportPage";


import NotFoundPage from "./pages/NotFoundPage";


function ProtectedRoute({ children }) {
  useProtectedRoute();
  return children;
}


function PartnerProtectedRoute({ children }) {
  usePartnerProtectedRoute();
  return children;
}

export default function Router() {
  return (
    <HashRouter>
      <Routes>
        
        <Route path="/apply/:token" element={<ApplyLoanPage />} />
        <Route
          path="/apply/:token/result"
          element={<LoanApplicationResultPage />}
        />

        
        <Route path="/partner/login" element={<PartnerLoginPage />} />
        <Route path="/partner/invite/:token" element={<PartnerInvitePage />} />

        
        <Route
          path="/partner"
          element={
            <PartnerProtectedRoute>
              <PartnerLayout />
            </PartnerProtectedRoute>
          }
        >
          <Route path="dashboard" element={<PartnerDashboardPage />} />

          
          <Route path="staff-loans" element={<PartnerStaffLoansPage />} />

          
          <Route path="transactions" element={<PartnerTransactionsPage />} />
        </Route>

        
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />

          
          <Route path="organizations" element={<OrganizationsListPage />} />
          <Route path="organizations/new" element={<OrganizationFormPage />} />
          <Route
            path="organizations/:id/edit"
            element={<OrganizationFormPage />}
          />

         
          <Route path="customers" element={<CustomersListPage />} />
          <Route path="customers/new" element={<CustomerFormPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />

          
          <Route path="loan-products" element={<LoanProductsListPage />} />
          <Route path="loan-products/new" element={<LoanProductFormPage />} />
          <Route
            path="loan-products/:id/edit"
            element={<LoanProductFormPage />}
          />

          
          <Route path="loan-links" element={<LoanLinksListPage />} />
          <Route path="loan-links/new" element={<LoanLinkCreatePage />} />

          
          <Route
            path="loan-applications"
            element={<LoanApplicationsListPage />}
          />
          <Route
            path="loan-applications/:id"
            element={<LoanApplicationDetailPage />}
          />

          
          <Route path="loans" element={<LoansListPage />} />
          <Route path="loans/:id" element={<LoanDetailPage />} />

          
          <Route path="remittance-ledger" element={<RemittanceLedgerPage />} />

          
          <Route path="partner-users" element={<PartnerUsersPage />} />

          
          <Route path="users" element={<UsersListPage />} />
          <Route path="users/new" element={<UserFormPage />} />

          
          <Route path="account" element={<AccountPage />} />
          <Route
            path="account/change-password"
            element={<ChangePasswordPage />}
          />

          
          <Route
            path="reports/org-monthly"
            element={<OrgMonthlyReportPage />}
          />
          <Route path="reports" element={<OrgMonthlyReportPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </HashRouter>
  );
}
