export function persistAuthToken(token: string, maxAgeDays = 30) {
  if (typeof window === 'undefined') return;

  localStorage.setItem('resumax_token', token);
  document.cookie = `resumax_token=${token}; path=/; max-age=${60 * 60 * 24 * maxAgeDays}; SameSite=Lax`;
}
