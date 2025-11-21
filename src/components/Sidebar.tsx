import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Activity, 
  CheckSquare, 
  Moon, 
  Calendar, 
  User, 
  LogOut,
  LayoutDashboard
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Performance", href: "/performance", icon: Activity },
  { name: "Habits", href: "/habits", icon: CheckSquare },
  { name: "Sleep", href: "/sleep", icon: Moon },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Profile", href: "/profile", icon: User },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleNavigation = (href: string) => {
    navigate(href);
    onNavigate?.();
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="rounded-full bg-primary p-2">
          <Activity className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-sidebar-foreground">Resolve</span>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </button>
          );
        })}
      </nav>

      <div className="border-t p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-sidebar-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
