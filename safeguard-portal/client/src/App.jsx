import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import ClientDashboard from "./pages/client/ClientDashboard";
import TechDashboard from "./pages/tech/TechDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import QuoteRequest from "./pages/QuoteRequest";
import Layout from './pages/admin/components/Layout.jsx'
import AdminClients from "./pages/admin/AdminClients.jsx";
import AdminEmployees from "./pages/admin/AdminEmployees.jsx";
import AdminInstallations from "./pages/admin/AdminInstallations.jsx";
import AdminInventory from "./pages/admin/AdminInventory.jsx";
import AdminReviews from "./pages/admin/AdminReviews.jsx";
import AdminService from "./pages/admin/AdminService.jsx";
import AdminPayments from "./pages/admin/AdminPayments.jsx";
import AdminQuoteRequests from "./pages/admin/AdminQuoteRequests.jsx";
import ProtectedRoutes from "./ProtectedRoutes.jsx";
import EmployeeLogin from "./pages/employee/EmployeeLogin.jsx";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quote-request" element={<QuoteRequest />} />
        <Route path="/login" element={<Login />} />
        <Route path="/employee/login" element={<EmployeeLogin />} />
        <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/tech/dashboard" element={<TechDashboard />} />

        <Route element={
          <ProtectedRoutes>
            <Layout />
          </ProtectedRoutes>
        }>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/clients" element={<AdminClients />} />
          <Route path="/admin/employees" element={<AdminEmployees />} />
          <Route path="/admin/installations" element={<AdminInstallations />} />
          <Route path="/admin/inventory" element={<AdminInventory />} />
          <Route path="/admin/Reviews" element={<AdminReviews />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/service" element={<AdminService />} />
          <Route path="/admin/quote-requests" element={<AdminQuoteRequests />} />
        </Route>


      </Routes>
    </BrowserRouter>
  );
}
