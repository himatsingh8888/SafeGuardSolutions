import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import ClientDashboard from "./pages/client/ClientDashboard";
import TechDashboard from "./pages/tech/TechDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import QuoteRequest from "./pages/QuoteRequest";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quote-request" element={<QuoteRequest />} />
        <Route path="/login" element={<Login />} />
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/tech/dashboard" element={<TechDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
