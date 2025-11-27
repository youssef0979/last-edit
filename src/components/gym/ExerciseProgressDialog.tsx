import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ExerciseProgressDialogProps {
  exercise: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExerciseProgressDialog({ exercise, open, onOpenChange }: ExerciseProgressDialogProps) {
  const { data: sets } = useQuery({
    queryKey: ['exercise-progress', exercise?.id],
    enabled: !!exercise,
    queryFn: async () => {
      if (!exercise) return [];
      
      const { data, error } = await supabase
        .from('set_entries')
        .select('*, gym_sessions!inner(session_index, status)')
        .eq('exercise_id', exercise.id)
        .order('timestamp');
      
      if (error) throw error;
      return data;
    }
  });

  // Calculate estimated 1RM using Epley formula: 1RM = weight × (1 + reps/30)
  const calculateEpley1RM = (weight: number, reps: number) => {
    return weight * (1 + reps / 30);
  };

  // Group sets by session and find best set per session
  const sessionData = sets?.reduce((acc: Record<number, any>, set: any) => {
    const sessionIndex = set.gym_sessions.session_index;
    const estimated1RM = calculateEpley1RM(set.weight, set.reps);
    
    if (!acc[sessionIndex] || estimated1RM > acc[sessionIndex].estimated1RM) {
      acc[sessionIndex] = {
        sessionIndex,
        weight: set.weight,
        reps: set.reps,
        estimated1RM,
        status: set.gym_sessions.status
      };
    }
    
    return acc;
  }, {}) || {};

  // Get all sessions for this user to include skipped ones
  const { data: allSessions } = useQuery({
    queryKey: ['all-sessions', exercise?.id],
    enabled: !!exercise,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('gym_sessions')
        .select('session_index, status')
        .eq('user_id', user.id)
        .order('session_index');
      
      if (error) throw error;
      return data;
    }
  });

  // Create complete chart data including all sessions
  const chartData = allSessions?.map((session: any) => {
    const sessionBestSet = sessionData[session.session_index];
    
    if (session.status === 'skipped' || !sessionBestSet) {
      return {
        session: `${session.session_index}`,
        sessionIndex: session.session_index,
        skipped: true,
        estimated1RM: null,
        label: session.status === 'skipped' ? 'Skipped' : 'No Data'
      };
    }
    
    return {
      session: `${session.session_index}`,
      sessionIndex: session.session_index,
      weight: sessionBestSet.weight,
      reps: sessionBestSet.reps,
      estimated1RM: sessionBestSet.estimated1RM,
      skipped: false
    };
  }) || [];

  // Filter for active data points (non-skipped) for the line
  const activeDataPoints = chartData.filter(d => !d.skipped && d.estimated1RM !== null);

  const allSessionData = allSessions?.map((session: any) => {
    const sessionBestSet = sessionData[session.session_index];
    return {
      sessionIndex: session.session_index,
      status: session.status,
      weight: sessionBestSet?.weight,
      reps: sessionBestSet?.reps,
      estimated1RM: sessionBestSet?.estimated1RM
    };
  }) || [];

  const { data: stats } = useQuery({
    queryKey: ['exercise-stats', exercise?.id],
    enabled: !!exercise,
    queryFn: async () => {
      if (!exercise) return null;
      
      const { data, error } = await supabase
        .from('exercise_stats')
        .select('*')
        .eq('exercise_id', exercise.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{exercise?.name ?? "Exercise"} - Progress</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Tracking best set per session using Epley 1RM formula
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {stats && (
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold">{stats.total_volume?.toFixed(0) || 0}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Est. 1RM</p>
                <p className="text-2xl font-bold">{stats.estimated_1rm?.toFixed(1) || 0} {exercise?.unit ?? ""}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Best Set</p>
                <p className="text-2xl font-bold">{stats.last_best_set_value?.toFixed(1) || 0} {exercise?.unit ?? ""}</p>
              </Card>
            </div>
          )}

          {chartData.length > 0 ? (
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Strength Progress (Session by Session)</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Each point represents the best set from that training session. Skipped sessions appear as neutral placeholders to maintain consistent numbering.
                </p>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="session"
                      label={{ value: 'Session Number', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Estimated 1RM', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload;
                          if (data.skipped) {
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-lg">
                                <p className="font-semibold">Session {data.sessionIndex}</p>
                                <p className="text-sm text-muted-foreground">{data.label}</p>
                              </div>
                            );
                          }
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-semibold">Session {data.sessionIndex}</p>
                              <p className="text-sm text-muted-foreground">
                                Best Set: {data.weight} {exercise.unit} × {data.reps} reps
                              </p>
                              <p className="text-sm font-medium">
                                Est. 1RM: {data.estimated1RM.toFixed(1)} {exercise.unit}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="estimated1RM" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      connectNulls={false}
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        if (payload.skipped) {
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={4}
                              fill="hsl(var(--muted))"
                              stroke="hsl(var(--border))"
                              strokeWidth={2}
                            />
                          );
                        }
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={4}
                            fill="hsl(var(--primary))"
                            stroke="hsl(var(--background))"
                            strokeWidth={2}
                          />
                        );
                      }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Trained (contributes to progress)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted border-2 border-border" />
                    <span className="text-muted-foreground">Skipped (maintains numbering)</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3">Session History</h3>
                <div className="space-y-2">
                  {allSessionData.map((data: any) => (
                    <div 
                      key={data.sessionIndex} 
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={data.status === 'completed' ? 'default' : data.status === 'skipped' ? 'secondary' : 'outline'}>
                          Session {data.sessionIndex}
                        </Badge>
                        {data.status === 'skipped' && (
                          <span className="text-sm text-muted-foreground">Skipped</span>
                        )}
                        {data.status !== 'skipped' && data.weight && (
                          <span className="text-sm text-muted-foreground">
                            Best: {data.weight} {exercise.unit} × {data.reps} reps
                          </span>
                        )}
                        {data.status === 'planned' && !data.weight && (
                          <span className="text-sm text-muted-foreground">In progress</span>
                        )}
                      </div>
                      {data.estimated1RM && (
                        <span className="text-sm font-medium">
                          {data.estimated1RM.toFixed(1)} {exercise.unit} est. 1RM
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No data yet. Start logging sets to see your progress.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
