// helper utilities for translating a username into the internal
// "email" value that Supabase auth expects.  We never expose the
// constructed address to end users; it's purely an implementation detail.

export function toAuthEmail(username: string) {
  const trimmed = username.trim().toLowerCase();
  // if the user has already supplied an @, assume they know what they're
  // doing (this allows the admin script to create an account with a real
  // email if desired). otherwise append a harmless fake domain.
  return trimmed.includes('@') ? trimmed : `${trimmed}@local.test`;
}
