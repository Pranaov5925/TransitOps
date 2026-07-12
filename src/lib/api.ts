const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<{ data: T; status: number }> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const data = await res.json() as T;
  return { data, status: res.status };
}

function get<T>(path: string) {
  return request<T>(path).then((r) => r.data);
}

function post<T>(path: string, body: unknown) {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) });
}

function patch<T>(path: string, body: unknown) {
  return request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

function del(path: string) {
  return request(path, { method: "DELETE" });
}

export const api = { get, post, patch, del, API };
