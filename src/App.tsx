import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme-provider";
import { PomodoroProvider, usePomodoroContext } from "@/contexts/PomodoroContext";
import { MiniTimerWidget } from "@/components/pomodoro/MiniTimerWidget";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Performance from "./pages/Performance";
import Habits from "./pages/Habits";
import Sleep from "./pages/Sleep";
import CalendarPage from "./pages/CalendarPage";
import Profile from "./pages/Profile";
import Friends from "./pages/Friends";
import FriendProfile from "./pages/FriendProfile";
import Pomodoro from "./pages/Pomodoro";
import Gym from "./pages/Gym";
import Schedule from "./pages/Schedule";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminContent from "./pages/admin/AdminContent";
import AdminLogs from "./pages/admin/AdminLogs";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const GlobalMiniWidget = () => {
  const { showMiniWidget, timeLeft, totalTime, isWork, sessionName, setShowMiniWidget } = usePomodoroContext();
  
  if (!showMiniWidget) return null;
  
  return (
    <MiniTimerWidget
      timeLeft={timeLeft}
      totalTime={totalTime}
      isWork={isWork}
      sessionName={sessionName}
      onClose={() => setShowMiniWidget(false)}
    />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="resolve-theme">
      <PomodoroProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <GlobalMiniWidget />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Layout><Dashboard /></Layout>} />
              <Route path="/performance" element={<Layout><Performance /></Layout>} />
              <Route path="/habits" element={<Layout><Habits /></Layout>} />
              <Route path="/sleep" element={<Layout><Sleep /></Layout>} />
              <Route path="/calendar" element={<Layout><CalendarPage /></Layout>} />
              <Route path="/profile" element={<Layout><Profile /></Layout>} />
              <Route path="/friends" element={<Layout><Friends /></Layout>} />
              <Route path="/friends/:friendId" element={<Layout><FriendProfile /></Layout>} />
              <Route path="/pomodoro" element={<Layout><Pomodoro /></Layout>} />
              <Route path="/gym" element={<Layout><Gym /></Layout>} />
              <Route path="/schedule" element={<Layout><Schedule /></Layout>} />
              <Route path="/admin" element={<AdminUsers />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/content" element={<AdminContent />} />
              <Route path="/admin/logs" element={<AdminLogs />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </PomodoroProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
