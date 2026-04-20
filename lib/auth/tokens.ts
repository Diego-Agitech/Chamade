export function buildPasswordResetToken() {
  return `${crypto.randomUUID()}-${Date.now()}`;
}

export function buildPasswordResetExpiry(hours = 1) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export function isTokenExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() < Date.now();
}
