/**
 * Input Validation Utilities for App
 */

// Patterns for SQL injection and code injection / script tags / malformed queries
const CODE_SQL_INJECTION_PATTERN = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|UNION|DECLARE|SCRIPT)\b|<script|javascript:|eval\(|onload\s*=|onerror\s*=|--|\/\*|\*\/)/i;

export interface ValidationRules {
  required?: boolean;
  phone?: boolean;
  email?: boolean;
  pincode?: boolean;
  aadhaar?: boolean;
  minLength?: number;
  maxLength?: number;
  preventInjection?: boolean; // Defaults to true for security
  custom?: (value: string) => string | null | undefined;
}

/**
 * Validates text input against malicious SQL/code patterns.
 */
export const checkSecurityInjection = (text: string): string | null => {
  if (!text) return null;
  if (CODE_SQL_INJECTION_PATTERN.test(text)) {
    return 'Invalid input: special characters, SQL queries or code tags are not allowed.';
  }
  return null;
};

/**
 * Validates phone number (must be 10 digits).
 */
export const validatePhone = (phone: string): string | null => {
  if (!phone) return 'Phone number is required';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length !== 10) {
    return 'Please enter a valid 10-digit phone number';
  }
  return null;
};

/**
 * Validates email address format.
 */
export const validateEmail = (email: string): string | null => {
  if (!email) return null; // If required, handle with required rule
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address';
  }
  return null;
};

/**
 * Validates 6-digit Indian Pincode.
 */
export const validatePincode = (pincode: string): string | null => {
  if (!pincode) return null;
  const cleanPin = pincode.replace(/[^0-9]/g, '');
  if (cleanPin.length !== 6) {
    return 'Please enter a valid 6-digit pincode';
  }
  return null;
};

/**
 * Validates 12-digit Aadhaar number.
 */
export const validateAadhaar = (aadhaar: string): string | null => {
  if (!aadhaar) return null;
  const cleanAadhaar = aadhaar.replace(/[^0-9]/g, '');
  if (cleanAadhaar.length !== 12) {
    return 'Please enter a valid 12-digit Aadhaar number';
  }
  return null;
};

/**
 * Main input validation function.
 */
export const validateInput = (value: string, rules: ValidationRules = {}): string | null => {
  const val = value || '';

  // 1. Security / Injection Check (enabled by default unless explicitly false)
  if (rules.preventInjection !== false && val.length > 0) {
    const secErr = checkSecurityInjection(val);
    if (secErr) return secErr;
  }

  // 2. Required check
  if (rules.required && !val.trim()) {
    return 'This field is required';
  }

  // If empty and not required, pass
  if (!val.trim()) {
    return null;
  }

  // 3. Phone rule
  if (rules.phone) {
    const err = validatePhone(val);
    if (err) return err;
  }

  // 4. Email rule
  if (rules.email) {
    const err = validateEmail(val);
    if (err) return err;
  }

  // 5. Pincode rule
  if (rules.pincode) {
    const err = validatePincode(val);
    if (err) return err;
  }

  // 6. Aadhaar rule
  if (rules.aadhaar) {
    const err = validateAadhaar(val);
    if (err) return err;
  }

  // 7. MinLength
  if (rules.minLength && val.trim().length < rules.minLength) {
    return `Must be at least ${rules.minLength} characters`;
  }

  // 8. MaxLength
  if (rules.maxLength && val.trim().length > rules.maxLength) {
    return `Must not exceed ${rules.maxLength} characters`;
  }

  // 9. Custom validation
  if (rules.custom) {
    const customErr = rules.custom(val);
    if (customErr) return customErr;
  }

  return null;
};
