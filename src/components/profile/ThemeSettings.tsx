import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5" />
          Theme Preferences
        </CardTitle>
        <CardDescription>
          Choose your preferred color theme
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={theme} onValueChange={setTheme}>
          <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="light" id="light" />
            <Label htmlFor="light" className="flex items-center gap-3 cursor-pointer flex-1">
              <Sun className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="font-medium">Light</div>
                <div className="text-sm text-muted-foreground">Bright and clear</div>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="dark" id="dark" />
            <Label htmlFor="dark" className="flex items-center gap-3 cursor-pointer flex-1">
              <Moon className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-medium">Dark</div>
                <div className="text-sm text-muted-foreground">Easy on the eyes</div>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="system" id="system" />
            <Label htmlFor="system" className="flex items-center gap-3 cursor-pointer flex-1">
              <Monitor className="h-5 w-5 text-purple-500" />
              <div>
                <div className="font-medium">System</div>
                <div className="text-sm text-muted-foreground">Matches your device</div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
