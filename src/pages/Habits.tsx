import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Habits = () => {
  const habits = [
    { name: "Morning Exercise", streak: 15, completed: true },
    { name: "Meditation", streak: 10, completed: true },
    { name: "Reading", streak: 8, completed: false },
    { name: "Journaling", streak: 12, completed: false },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary p-2">
            <CheckSquare className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Habit Tracker</h1>
            <p className="text-muted-foreground">Build and maintain your daily routines</p>
          </div>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Habit
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {habits.map((habit, i) => (
          <Card key={i} className={habit.completed ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{habit.name}</CardTitle>
                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                  habit.completed ? "bg-primary border-primary" : "border-muted-foreground"
                }`}>
                  {habit.completed && <CheckSquare className="h-4 w-4 text-primary-foreground" />}
                </div>
              </div>
              <CardDescription>
                🔥 {habit.streak} day streak
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${Math.min((habit.streak / 30) * 100, 100)}%` }}
                  />
                </div>
                <span>{habit.streak}/30</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Habit Statistics</CardTitle>
          <CardDescription>Your habit completion trends over time</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          Detailed habit analytics and insights will appear here
        </CardContent>
      </Card>
    </div>
  );
};

export default Habits;
