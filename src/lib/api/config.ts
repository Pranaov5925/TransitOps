// Central API configuration. Swap API_BASE_URL to point at the real backend
// with no other changes required.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

// When true, all API calls resolve against the in-memory mock layer.
// Flip to false once VITE_API_BASE_URL is set to a real backend.
export const USE_MOCK_API = !API_BASE_URL;

export const AUTH_TOKEN_KEY = "transitops.token";
export const AUTH_USER_KEY = "transitops.user";
