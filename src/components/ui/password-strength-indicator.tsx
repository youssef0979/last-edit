import { calculatePasswordStrength } from "@/lib/validations";
import { Progress } from "@/components/ui/progress";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const { score, feedback, color } = calculatePasswordStrength(password);
  const maxScore = 8;
  const percentage = (score / maxScore) * 100;

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Progress value={percentage} className="h-2" />
        <div
          className={`absolute top-0 left-0 h-2 rounded-full transition-all ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Password strength:</span>
        <span className={`font-medium ${
          score <= 2 ? "text-destructive" : 
          score <= 4 ? "text-[hsl(var(--accent))]" : 
          score <= 6 ? "text-[hsl(var(--chart-4))]" : 
          "text-[hsl(var(--chart-1))]"
        }`}>
          {feedback}
        </span>
      </div>
      {score < 6 && (
        <ul className="text-xs text-muted-foreground space-y-1 mt-2">
          {password.length < 12 && <li>• At least 12 characters</li>}
          {!/[A-Z]/.test(password) && <li>• One uppercase letter</li>}
          {!/[a-z]/.test(password) && <li>• One lowercase letter</li>}
          {!/[0-9]/.test(password) && <li>• One number</li>}
          {!/[^A-Za-z0-9]/.test(password) && <li>• One special character</li>}
        </ul>
      )}
    </div>
  );
}
