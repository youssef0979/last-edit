import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface UnitConversionWarningProps {
  fromUnit: string;
  toUnit: string;
  setCount: number;
}

export function UnitConversionWarning({ fromUnit, toUnit, setCount }: UnitConversionWarningProps) {
  const conversionFactor = toUnit === 'kg' ? 1 / 2.20462 : 2.20462;
  const exampleFrom = fromUnit === 'kg' ? 100 : 220;
  const exampleTo = (exampleFrom * conversionFactor).toFixed(1);

  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Unit Conversion</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          Changing from {fromUnit} to {toUnit} will automatically convert all {setCount} historical sets for this exercise.
        </p>
        <p className="text-xs text-muted-foreground">
          Example: {exampleFrom} {fromUnit} → {exampleTo} {toUnit}
        </p>
        <p className="text-xs font-medium">
          This ensures your progress graph and statistics remain accurate.
        </p>
      </AlertDescription>
    </Alert>
  );
}
