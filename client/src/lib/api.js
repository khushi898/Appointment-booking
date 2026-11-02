// Small wrapper around fetch() for talking to our Express API.
// Every request: adds the base URL, sends/receives JSON, attaches the JWT,
// and turns error responses into an ApiError the pages can display.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const TOKEN_KEY = 'token';

// The JWT lives in localStorage so the user stays logged in after a refresh.
export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// Error with the HTTP status and the API's field details,
// e.g. status 400, details [{ field: 'email', message: 'Email is invalid' }].
export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// AuthProvider registers a function here so that any 401 on a logged-in
// request (expired/invalid token) logs the user out everywhere.
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function request(method, path, { body, query } = {}) {
  const url = new URL(`/api${path}`, API_URL);
  // Add ?page=1&search=... skipping empty values
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });

  const headers = {};
  const token = tokenStorage.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    // fetch only throws when the request never got a response (offline, server down, CORS)
    throw new ApiError(0, 'Cannot reach the server. Please check your connection and try again.');
  }

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && token && onUnauthorized) onUnauthorized();
    throw new ApiError(response.status, json.message || 'Something went wrong', json.details || []);
  }
  return json; // { success, data, message? }
}

export const api = {
  get: (path, query) => request('GET', path, { query }),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  delete: (path) => request('DELETE', path),
};

// [{ field: 'email', message: '...' }] -> { email: '...' } for showing under each input
export function toFieldErrors(details = []) {
  return Object.fromEntries(details.map(({ field, message }) => [field, message]));
}
