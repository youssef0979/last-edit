/**
 * Error handling utility to sanitize error messages
 * Prevents exposing internal system details to users
 */

export interface SanitizedError {
  userMessage: string;
  shouldLog: boolean;
}

/**
 * Sanitizes Supabase authentication errors
 */
export function sanitizeAuthError(error: any): SanitizedError {
  const errorCode = error?.code || error?.error_code || "";
  const errorMessage = error?.message || "";

  // Map specific error codes to user-friendly messages
  const authErrorMap: Record<string, string> = {
    invalid_credentials: "Invalid email or password. Please try again.",
    user_not_found: "Invalid email or password. Please try again.",
    invalid_grant: "Invalid email or password. Please try again.",
    email_not_confirmed: "Please check your email to verify your account.",
    user_already_exists: "An account with this email already exists.",
    email_exists: "An account with this email already exists.",
    weak_password: "Password is too weak. Please choose a stronger password.",
    over_email_send_rate_limit: "Too many emails sent. Please try again later.",
    invalid_email: "Please enter a valid email address.",
  };

  // Check for known error codes
  for (const [code, message] of Object.entries(authErrorMap)) {
    if (errorCode.includes(code) || errorMessage.toLowerCase().includes(code.replace(/_/g, " "))) {
      return { userMessage: message, shouldLog: false };
    }
  }

  // Check for rate limiting
  if (errorMessage.includes("rate limit") || errorMessage.includes("too many")) {
    return {
      userMessage: "Too many attempts. Please wait a moment and try again.",
      shouldLog: true,
    };
  }

  // Check for network errors
  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return {
      userMessage: "Network error. Please check your connection and try again.",
      shouldLog: true,
    };
  }

  // Generic fallback for unknown errors
  return {
    userMessage: "An error occurred. Please try again or contact support if the issue persists.",
    shouldLog: true,
  };
}

/**
 * Sanitizes database operation errors
 */
export function sanitizeDatabaseError(error: any): SanitizedError {
  const errorCode = error?.code || "";
  const errorMessage = error?.message || "";

  // Map database error codes
  const dbErrorMap: Record<string, string> = {
    "23505": "This item already exists.",
    "23503": "Cannot perform this action due to related data.",
    "42501": "You don't have permission to perform this action.",
    "23514": "The data provided doesn't meet the requirements.",
    "22001": "The data provided is too long.",
  };

  // Check for PostgreSQL error codes
  for (const [code, message] of Object.entries(dbErrorMap)) {
    if (errorCode === code) {
      return { userMessage: message, shouldLog: true };
    }
  }

  // Check for RLS policy violations
  if (errorMessage.includes("policy") || errorMessage.includes("permission")) {
    return {
      userMessage: "You don't have permission to perform this action.",
      shouldLog: true,
    };
  }

  // Check for connection issues
  if (errorMessage.includes("connection") || errorMessage.includes("timeout")) {
    return {
      userMessage: "Connection error. Please try again.",
      shouldLog: true,
    };
  }

  // Generic fallback
  return {
    userMessage: "An error occurred while saving. Please try again.",
    shouldLog: true,
  };
}

/**
 * Main error handler that logs errors appropriately
 */
export function handleError(error: any, context: "auth" | "database" = "database"): string {
  const sanitized = context === "auth" 
    ? sanitizeAuthError(error) 
    : sanitizeDatabaseError(error);

  // Log detailed error for debugging (only if needed)
  if (sanitized.shouldLog) {
    console.error(`[${context}] Error:`, {
      message: error?.message,
      code: error?.code,
      details: error?.details,
    });
  }

  return sanitized.userMessage;
}
