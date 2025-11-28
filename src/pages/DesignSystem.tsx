import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Palette, Type, Box, Sparkles } from "lucide-react";

export default function DesignSystem() {
  return (
    <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Resolve Design System</h1>
        <p className="text-muted-foreground text-lg">
          A cohesive visual identity for calm, focused productivity
        </p>
      </div>

      {/* Color Palette */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle>Color Palette</CardTitle>
          </div>
          <CardDescription>
            Muted sage greens, warm neutrals, and soft terracotta accents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-primary" />
              <div className="text-sm font-medium">Primary</div>
              <div className="text-xs text-muted-foreground">Muted Sage</div>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-accent" />
              <div className="text-sm font-medium">Accent</div>
              <div className="text-xs text-muted-foreground">Soft Terracotta</div>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-secondary" />
              <div className="text-sm font-medium">Secondary</div>
              <div className="text-xs text-muted-foreground">Warm Gray</div>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-muted border border-border" />
              <div className="text-sm font-medium">Muted</div>
              <div className="text-xs text-muted-foreground">Subtle Surface</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Type className="h-5 w-5 text-primary" />
            <CardTitle>Typography</CardTitle>
          </div>
          <CardDescription>DM Sans - Clean, readable, professional</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold">Heading 1</h1>
            <p className="text-xs text-muted-foreground">32px / Bold / DM Sans</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Heading 2</h2>
            <p className="text-xs text-muted-foreground">24px / Semibold / DM Sans</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold">Heading 3</h3>
            <p className="text-xs text-muted-foreground">20px / Semibold / DM Sans</p>
          </div>
          <div>
            <p className="text-base">Body text - The quick brown fox jumps over the lazy dog</p>
            <p className="text-xs text-muted-foreground">14px / Regular / DM Sans</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Small text for captions and labels</p>
            <p className="text-xs text-muted-foreground">12px / Regular / DM Sans</p>
          </div>
        </CardContent>
      </Card>

      {/* Components */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5 text-primary" />
            <CardTitle>Components</CardTitle>
          </div>
          <CardDescription>Unified shapes, shadows, and interactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Buttons */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Buttons</h4>
            <div className="flex flex-wrap gap-2">
              <Button>Primary Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Inputs</h4>
            <Input placeholder="Enter text here..." className="max-w-md" />
          </div>

          {/* Badges */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Badges</h4>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Cards</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover:shadow-md transition-all duration-150">
                <CardHeader>
                  <CardTitle className="text-base">Card Title</CardTitle>
                  <CardDescription>Subtle shadow on hover</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    12px border radius, warm shadows
                  </p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-all duration-150">
                <CardHeader>
                  <CardTitle className="text-base">Consistent Style</CardTitle>
                  <CardDescription>All cards share design</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Same radius, padding, shadows
                  </p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-all duration-150">
                <CardHeader>
                  <CardTitle className="text-base">Visual Calm</CardTitle>
                  <CardDescription>150ms transitions</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Subtle, never distracting
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Design Principles */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Design Principles</CardTitle>
          </div>
          <CardDescription>The philosophy behind Resolve's visual identity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Clarity</h4>
              <p className="text-sm text-muted-foreground">
                Every element serves a purpose. Information hierarchy is clear. No visual noise.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Simplicity</h4>
              <p className="text-sm text-muted-foreground">
                Minimal chrome. Essential features emphasized. Complex interactions feel effortless.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Visual Calm</h4>
              <p className="text-sm text-muted-foreground">
                Muted colors. Subtle motion. Comfortable for extended use. Never overwhelming.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Consistency</h4>
              <p className="text-sm text-muted-foreground">
                Unified radius, spacing, shadows. Predictable interactions. One design language.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Animation Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Motion System</CardTitle>
          <CardDescription>100-150ms subtle transitions throughout</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              All animations use consistent timing (100-150ms) with ease-out easing. Hover over elements to see transitions.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-150 cursor-pointer text-center">
                Fade
              </div>
              <div className="p-4 rounded-lg bg-muted hover:scale-105 transition-all duration-150 cursor-pointer text-center">
                Scale
              </div>
              <div className="p-4 rounded-lg bg-muted hover:shadow-lg transition-all duration-150 cursor-pointer text-center">
                Shadow
              </div>
              <div className="p-4 rounded-lg bg-muted hover:-translate-y-1 transition-all duration-150 cursor-pointer text-center">
                Lift
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
