import { PomodoroTimer } from "@/components/pomodoro/PomodoroTimer";
import { CountdownTimer } from "@/components/pomodoro/CountdownTimer";
import { SessionsList } from "@/components/pomodoro/SessionsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timer, Clock, List } from "lucide-react";

const Pomodoro = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Focus Timer</h1>
          <p className="text-muted-foreground">Stay productive with Pomodoro technique and custom timers</p>
        </div>

        <Tabs defaultValue="pomodoro" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="pomodoro" className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Pomodoro
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              My Sessions
            </TabsTrigger>
            <TabsTrigger value="countdown" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Countdown
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pomodoro">
            <PomodoroTimer />
          </TabsContent>

          <TabsContent value="sessions">
            <SessionsList />
          </TabsContent>

          <TabsContent value="countdown">
            <CountdownTimer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Pomodoro;
