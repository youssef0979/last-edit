import { z } from "zod";

// Password validation schema
export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter")
  .regex(/[a-z]/, "Password must include at least one lowercase letter")
  .regex(/[0-9]/, "Password must include at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must include at least one special character");

// Email validation schema
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .min(1, "Email is required");

// Full name validation schema
export const fullNameSchema = z
  .string()
  .trim()
  .min(1, "Full name is required")
  .max(100, "Full name must be less than 100 characters")
  .regex(/^[a-zA-Z\s'-]+$/, "Full name can only contain letters, spaces, hyphens, and apostrophes");

// Calendar note validation schema
export const calendarNoteSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  content: z
    .string()
    .trim()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  reminder_time: z
    .string()
    .datetime()
    .optional()
    .nullable(),
});

// Bio validation schema
export const bioSchema = z
  .string()
  .trim()
  .max(500, "Bio must be less than 500 characters")
  .optional();

// Helper function to calculate password strength
export function calculatePasswordStrength(password: string): {
  score: number;
  feedback: string;
  color: string;
} {
  if (!password) return { score: 0, feedback: "Enter a password", color: "bg-muted" };

  let score = 0;
  const checks = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  // Calculate score
  if (checks.length) score += 2;
  if (checks.uppercase) score += 1;
  if (checks.lowercase) score += 1;
  if (checks.number) score += 1;
  if (checks.special) score += 1;

  // Add bonus for longer passwords
  if (password.length >= 16) score += 1;
  if (password.length >= 20) score += 1;

  // Determine feedback and color
  if (score <= 2) {
    return { score, feedback: "Weak", color: "bg-destructive" };
  } else if (score <= 4) {
    return { score, feedback: "Fair", color: "bg-[hsl(var(--accent))]" };
  } else if (score <= 6) {
    return { score, feedback: "Good", color: "bg-[hsl(var(--chart-4))]" };
  } else {
    return { score, feedback: "Strong", color: "bg-[hsl(var(--chart-1))]" };
  }
}
