export type PasswordStrength = "weak" | "normal" | "strong";

export type PasswordStrengthResult = {
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  meetsPolicy: boolean;
  strength: PasswordStrength;
};

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const meetsPolicy = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  let strength: PasswordStrength;

  if (!hasMinLength || !hasUpper || !hasLower || (!hasNumber && !hasSpecial)) {
    strength = "weak";
  } else if (hasNumber && hasSpecial) {
    strength = "strong";
  } else {
    strength = "normal";
  }

  return {
    hasMinLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    meetsPolicy,
    strength,
  };
}
