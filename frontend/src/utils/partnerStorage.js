const PARTNER_TOKEN_KEY = "partner_access_token";
const PARTNER_USER_KEY = "partner_current_user";

export function setPartnerToken(token) {
  localStorage.setItem(PARTNER_TOKEN_KEY, token);
}

export function getPartnerToken() {
  return localStorage.getItem(PARTNER_TOKEN_KEY);
}

export function clearPartnerToken() {
  localStorage.removeItem(PARTNER_TOKEN_KEY);
}

export function setPartnerUser(user) {
  localStorage.setItem(PARTNER_USER_KEY, JSON.stringify(user));
}

export function getPartnerUser() {
  const raw = localStorage.getItem(PARTNER_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPartnerUser() {
  localStorage.removeItem(PARTNER_USER_KEY);
}

export function clearPartnerAuth() {
  clearPartnerToken();
  clearPartnerUser();
}
