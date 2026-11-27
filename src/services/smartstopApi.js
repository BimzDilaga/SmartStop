// HTTP boundary only. MySQL connections and credentials belong to the backend.
export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.name = "ApiError"; this.status = status; }
}

export function createApiClient({ baseURL = "http://localhost:5000/api", fetchImpl = globalThis.fetch } = {}) {
  const base = baseURL.replace(/\/+$/, "");
  return {
    async request(path, { method = "GET", body, signal } = {}) {
      const multipart = typeof FormData !== "undefined" && body instanceof FormData;
      const response = await fetchImpl(base + "/" + path.replace(/^\/+/, ""), {
        method, signal, credentials: "include",
        headers: { Accept: "application/json", ...(body != null && !multipart ? { "Content-Type": "application/json" } : {}) },
        ...(body != null ? { body: multipart ? body : JSON.stringify(body) } : {})
      });
      if (response.status === 204) return null;
      let payload;
      try { payload = await response.json(); } catch { throw new ApiError("Respons server belum sesuai format JSON.", response.status); }
      if (!response.ok) throw new ApiError(payload?.message || "Permintaan ke server gagal.", response.status);
      return payload?.data ?? payload;
    }
  };
}

export function createSmartStopApi(client) {
  const resource = path => ({
    list: signal => client.request(path, { signal }),
    get: (id, signal) => client.request(`${path}/${encodeURIComponent(id)}`, { signal }),
    create: body => client.request(path, { method: "POST", body }),
    update: (id, body) => client.request(`${path}/${encodeURIComponent(id)}`, { method: "PUT", body }),
    remove: id => client.request(`${path}/${encodeURIComponent(id)}`, { method: "DELETE" })
  });
  const adminPaths = { routes: "rute", stops: "halte", schedules: "jadwal", information: "informasi", feedback: "masukan", users: "akun", assignments: "penugasan" };
  return {
    auth: {
      register: body => client.request("auth/register", { method: "POST", body }),
      login: body => client.request("auth/login", { method: "POST", body }),
      me: signal => client.request("auth/me", { signal }),
      logout: () => client.request("auth/logout", { method: "POST" }),
      verifyEmail: token => client.request("auth/verify-email", { method: "POST", body: { token } }),
      resendVerification: email => client.request("auth/resend-verification", { method: "POST", body: { email } })
    },
    fleet: { snapshot: signal => client.request("armada", { signal }) },
    stops: resource("halte"), routes: resource("rute"), schedules: resource("jadwal"), information: resource("informasi"),
    tickets: { ...resource("tiket"), quote: body => client.request("tiket/quote", { method: "POST", body }) }, feedback: resource("masukan"),
    content: { hubs: resource("simpul"), infrastructure: resource("infrastruktur") },
    uploads: {
      requestUpload: metadata => client.request("uploads/student-card", { method: "POST", body: metadata }),
      confirmUpload: fileKey => client.request("uploads/student-card/confirm", { method: "POST", body: { fileKey } })
    },
    admin: Object.fromEntries(Object.entries(adminPaths).map(([key, path]) => [key, resource("admin/" + path)])),
    driver: {
      assignment: signal => client.request("driver/assignment", { signal }),
      reportStatus: body => client.request("driver/status", { method: "POST", body }),
      checkIn: body => client.request("driver/check-in", { method: "POST", body })
    }
  };
}

export const smartStopApi = createSmartStopApi(createApiClient({
  baseURL: import.meta.env?.VITE_API_BASE_URL || "http://localhost:5000/api"
}));
