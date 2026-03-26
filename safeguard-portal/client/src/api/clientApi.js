const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000";

function authHeaders() {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      typeof data === "object" && data?.message ? data.message : `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data;
}

/** @typedef {{ clientId: string, fname: string, name: string, address: string, customerType: string, email: string, phone: string }} NormalizedClient */

export function normalizeClient(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.clientId ?? raw.clientID ?? raw.ClientId ?? "";
  const fname = raw.fname ?? raw.Fname ?? "";
  const name = raw.name ?? raw.Name ?? raw.lname ?? raw.Lname ?? "";
  const address = raw.address ?? raw.Address ?? "";
  const customerType = raw.customertyupe ?? raw.customerType ?? raw.CustomerType ?? "";
  const email = raw.email ?? raw.emila ?? raw.Email ?? "";
  const phone = raw.phone ?? raw.Phone ?? "";

  return {
    clientId: id !== undefined && id !== null ? String(id) : "",
    fname: String(fname),
    name: String(name),
    address: String(address),
    customerType: String(customerType),
    email: String(email),
    phone: String(phone),
  };
}

export function normalizeInstallation(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.installationID ?? raw.installationId ?? raw.InstallationID ?? "";
  return {
    id: id !== undefined && id !== null ? String(id) : "",
    siteId: raw.siteId ?? raw.SiteId ?? "",
    address: String(raw.Address ?? raw.address ?? ""),
    scheduledDate: raw.schedulateDate ?? raw.scheduledDate ?? raw.scheduleDate ?? raw.ScheduledDate ?? "",
    completedDate: raw.completedDate ?? raw.compeltedDate ?? raw.CompletedDate ?? "",
    status: String(raw.Status ?? raw.status ?? ""),
    description: String(raw.Description ?? raw.description ?? raw.Descirpot ?? ""),
    price: raw.Price ?? raw.price ?? "",
    technicianNums: raw.technicianNums ?? raw.TechnicianNums ?? "",
  };
}

export function normalizePayment(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.paymentID ?? raw.paymentId ?? raw.PaymentID ?? "";
  return {
    id: id !== undefined && id !== null ? String(id) : "",
    status: String(raw.status ?? raw.Status ?? ""),
    dueDate: raw.dueDate ?? raw.DueDate ?? "",
    createDate: raw.createDate ?? raw.CreateDate ?? "",
    totalAmount: raw.totalamoutn ?? raw.totalAmount ?? raw.TotalAmount ?? "",
    paymentType: raw.paumentType ?? raw.paymentType ?? raw.PaymentType ?? "",
  };
}

export function getStoredClientId() {
  return (
    localStorage.getItem("clientId") ||
    localStorage.getItem("clientID") ||
    import.meta.env.VITE_DEV_CLIENT_ID ||
    ""
  );
}

export async function fetchClient(clientId) {
  const data = await apiFetch(`/api/client/${encodeURIComponent(clientId)}`);
  return normalizeClient(data);
}

export async function updateClient(clientId, body) {
  const payload = {
    fname: body.fname,
    name: body.name,
    address: body.address,
    email: body.email,
    phone: body.phone,
  };
  return apiFetch(`/api/client/${encodeURIComponent(clientId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchInstallations(clientId, limit) {
  const q =
    limit !== undefined && limit !== null && limit !== ""
      ? `?limit=${encodeURIComponent(String(limit))}`
      : "";
  const data = await apiFetch(
    `/api/client/${encodeURIComponent(clientId)}/installations${q}`
  );
  if (!Array.isArray(data)) return [];
  return data.map(normalizeInstallation).filter(Boolean);
}

export async function fetchInstallationDetail(clientId, installationId) {
  return apiFetch(
    `/api/client/${encodeURIComponent(clientId)}/installations/${encodeURIComponent(installationId)}`
  );
}

export async function fetchPayments(clientId) {
  const data = await apiFetch(`/api/client/${encodeURIComponent(clientId)}/payments`);
  if (!Array.isArray(data)) return [];
  return data.map(normalizePayment).filter(Boolean);
}

export function statusToProgress(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("complete")) return 100;
  if (s.includes("cancel")) return 0;
  if (s.includes("progress")) return 65;
  if (s.includes("schedule")) return 30;
  return 45;
}
