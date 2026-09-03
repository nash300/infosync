export const PASSWORD_POLICY_MIN_LENGTH = 12;
export const PASSWORD_POLICY_MAX_LENGTH = 128;
export const ADMIN_PASSWORD_POLICY_MIN_LENGTH = 12;

export const passwordPolicyDescription =
  `Lösenordet måste vara minst ${PASSWORD_POLICY_MIN_LENGTH} tecken och innehålla både bokstäver och siffror.`;

export function validatePasswordPolicy(password: string) {
  const hasAllowedLength =
    password.length >= PASSWORD_POLICY_MIN_LENGTH &&
    password.length <= PASSWORD_POLICY_MAX_LENGTH;
  const hasLetter = /\p{L}/u.test(password);
  const hasNumber = /\p{N}/u.test(password);

  return hasAllowedLength && hasLetter && hasNumber;
}

export const adminPasswordPolicyDescription =
  `Administratörslösenordet måste vara minst ${ADMIN_PASSWORD_POLICY_MIN_LENGTH} tecken och innehålla bokstäver, siffror och specialtecken.`;

export function validateAdminPasswordPolicy(password: string) {
  return (
    password.length >= ADMIN_PASSWORD_POLICY_MIN_LENGTH &&
    password.length <= PASSWORD_POLICY_MAX_LENGTH &&
    /\p{L}/u.test(password) &&
    /\p{N}/u.test(password) &&
    /[^\p{L}\p{N}]/u.test(password)
  );
}
