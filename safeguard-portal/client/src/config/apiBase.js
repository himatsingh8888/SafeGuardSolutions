/** Backend origin; override with VITE_API_BASE_URL in client/.env */
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5001";
