import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import QuoteRequest from "./pages/QuoteRequest";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quote-request" element={<QuoteRequest />} />
      </Routes>
    </BrowserRouter>
  );
}
