import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Loader2, Trash2, Calendar, Clock, CheckCircle2, Circle, Pause, Play, Eye, EyeOff, Plus, FileText, HelpCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AddHomeworkDialog } from "@/components/study/AddHomeworkDialog";
import { format, isPast, isToday } from "date-fns";

interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  pending_lessons: number;
  release_schedule: string | null;
  release_day: string | null;
  release_time: string | null;
  next_release_at: string | null;
  is_paused: boolean;
  created_at: string;
}

interface Lesson {
  id: string;
  subject_id: string;
  title: string;
  lesson_number: number;
  status: string;
  released_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface Homework {
  id: string;
  subject_id: string;
  amount: number;
  amount_type: string;
  deadline: string;
  notes: string | null;
  status: string;
  completed_at: string | null;
  created_at: string;
}

export default function Subject() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [homeworkDialogOpen, setHomeworkDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSubjectAndLessons();
    }
  }, [id]);

  const fetchSubjectAndLessons = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch subject
      const { data: subjectData, error: subjectError } = await supabase
        .from("study_subjects")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (subjectError) throw subjectError;
      setSubject(subjectData);

      // Fetch lessons for this subject ordered chronologically
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("study_lessons")
        .select("*")
        .eq("subject_id", id)
        .eq("user_id", user.id)
        .order("lesson_number", { ascending: true });

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);

      // Fetch homework for this subject
      const { data: homeworkData, error: homeworkError } = await supabase
        .from("study_homework")
        .select("*")
        .eq("subject_id", id)
        .eq("user_id", user.id)
        .order("deadline", { ascending: true });

      if (homeworkError) throw homeworkError;
      setHomework(homeworkData || []);
    } catch (error: any) {
      toast({
        title: "Error loading subject",
        description: error.message,
        variant: "destructive",
      });
      navigate("/study");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("study_subjects")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Subject deleted",
        description: "The subject and all its lessons have been removed.",
      });
      navigate("/study");
    } catch (error: any) {
      toast({
        title: "Error deleting subject",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const togglePause = async () => {
    if (!subject) return;

    const newPausedState = !subject.is_paused;

    try {
      const { error } = await supabase
        .from("study_subjects")
        .update({ is_paused: newPausedState })
        .eq("id", subject.id);

      if (error) throw error;

      setSubject({ ...subject, is_paused: newPausedState });
      toast({
        title: newPausedState ? "Auto-generation paused" : "Auto-generation resumed",
        description: newPausedState 
          ? "New lessons will not be automatically generated." 
          : "Lessons will be generated according to schedule.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating subject",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const markLessonComplete = async (lesson: Lesson) => {
    try {
      const { error } = await supabase
        .from("study_lessons")
        .update({ 
          status: "completed", 
          completed_at: new Date().toISOString() 
        })
        .eq("id", lesson.id);

      if (error) throw error;

      setLessons(lessons.map(l => 
        l.id === lesson.id 
          ? { ...l, status: "completed", completed_at: new Date().toISOString() }
          : l
      ));

      if (subject) {
        const newPendingCount = Math.max(0, subject.pending_lessons - 1);
        setSubject({ ...subject, pending_lessons: newPendingCount });
        
        await supabase
          .from("study_subjects")
          .update({ pending_lessons: newPendingCount })
          .eq("id", subject.id);
      }

      toast({
        title: "Lesson completed!",
        description: `${lesson.title} marked as complete.`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating lesson",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const markLessonPending = async (lesson: Lesson) => {
    try {
      const { error } = await supabase
        .from("study_lessons")
        .update({ status: "pending", completed_at: null })
        .eq("id", lesson.id);

      if (error) throw error;

      setLessons(lessons.map(l => 
        l.id === lesson.id 
          ? { ...l, status: "pending", completed_at: null }
          : l
      ));

      if (subject) {
        const newPendingCount = subject.pending_lessons + 1;
        setSubject({ ...subject, pending_lessons: newPendingCount });
        
        await supabase
          .from("study_subjects")
          .update({ pending_lessons: newPendingCount })
          .eq("id", subject.id);
      }

      toast({
        title: "Lesson restored",
        description: `${lesson.title} marked as pending.`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating lesson",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const markHomeworkComplete = async (hw: Homework) => {
    try {
      const { error } = await supabase
        .from("study_homework")
        .update({ 
          status: "completed", 
          completed_at: new Date().toISOString() 
        })
        .eq("id", hw.id);

      if (error) throw error;

      setHomework(homework.map(h => 
        h.id === hw.id 
          ? { ...h, status: "completed", completed_at: new Date().toISOString() }
          : h
      ));

      toast({
        title: "Homework completed!",
      });
    } catch (error: any) {
      toast({
        title: "Error updating homework",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteHomework = async (hw: Homework) => {
    try {
      const { error } = await supabase
        .from("study_homework")
        .delete()
        .eq("id", hw.id);

      if (error) throw error;

      setHomework(homework.filter(h => h.id !== hw.id));

      toast({
        title: "Homework deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting homework",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getDeadlineStatus = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    if (isPast(deadlineDate) && !isToday(deadlineDate)) {
      return "overdue";
    }
    if (isToday(deadlineDate)) {
      return "today";
    }
    return "upcoming";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Subject not found</p>
        <Button variant="link" onClick={() => navigate("/study")}>
          Back to Study Planner
        </Button>
      </div>
    );
  }

  const completedLessons = lessons.filter(l => l.status === "completed");
  const pendingLessons = lessons.filter(l => l.status === "pending");
  const displayedLessons = showCompleted ? lessons : pendingLessons;
  const pendingHomework = homework.filter(h => h.status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/study")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: subject.color + "20" }}
            >
              <BookOpen className="h-6 w-6" style={{ color: subject.color }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{subject.name}</h1>
              <p className="text-muted-foreground">Subject workspace</p>
            </div>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Subject
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Subject</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{subject.name}"? This action cannot be undone and will remove all associated lessons.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Subject Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lessons.length}</p>
                <p className="text-sm text-muted-foreground">Total Lessons</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingLessons.length}</p>
                <p className="text-sm text-muted-foreground">Pending Lessons</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedLessons.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Release Schedule & Pause Control */}
      {subject.release_schedule && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{subject.release_schedule}</p>
                  {subject.next_release_at && !subject.is_paused && (
                    <p className="text-sm text-muted-foreground">
                      Next release: {new Date(subject.next_release_at).toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                  {subject.is_paused && (
                    <p className="text-sm text-amber-600">Auto-generation is paused</p>
                  )}
                </div>
              </div>
              <Button
                variant={subject.is_paused ? "default" : "outline"}
                size="sm"
                onClick={togglePause}
              >
                {subject.is_paused ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Homework Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Homework
            </CardTitle>
            <Button size="sm" onClick={() => setHomeworkDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Homework
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pendingHomework.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No pending homework. Add some to track your assignments.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingHomework.map((hw) => {
                const deadlineStatus = getDeadlineStatus(hw.deadline);
                return (
                  <div
                    key={hw.id}
                    className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => markHomeworkComplete(hw)}
                        className="flex-shrink-0 mt-0.5"
                      >
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-emerald-500 transition-colors" />
                      </button>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {hw.amount_type === "pages" ? (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-medium">
                            {hw.amount} {hw.amount_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className={
                            deadlineStatus === "overdue" 
                              ? "text-destructive font-medium" 
                              : deadlineStatus === "today" 
                                ? "text-amber-600 font-medium" 
                                : "text-muted-foreground"
                          }>
                            {deadlineStatus === "overdue" && "Overdue: "}
                            {deadlineStatus === "today" && "Due today: "}
                            {format(new Date(hw.deadline), "MMM d, yyyy")}
                          </span>
                        </div>
                        {hw.notes && (
                          <p className="text-sm text-muted-foreground">{hw.notes}</p>
                        )}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Homework</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this homework?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteHomework(hw)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lessons List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lessons</CardTitle>
            {completedLessons.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
              >
                {showCompleted ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide Completed
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show Completed ({completedLessons.length})
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {displayedLessons.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {showCompleted 
                ? "No lessons yet. They will appear here when released."
                : pendingLessons.length === 0 && completedLessons.length > 0
                  ? "All lessons completed! Great job!"
                  : "No lessons yet. They will appear here when released."
              }
            </p>
          ) : (
            <div className="space-y-2">
              {displayedLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => lesson.status === "completed" 
                        ? markLessonPending(lesson) 
                        : markLessonComplete(lesson)
                      }
                      className="flex-shrink-0"
                    >
                      {lesson.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-emerald-500 transition-colors" />
                      )}
                    </button>
                    <div>
                      <p className={`font-medium ${lesson.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                        {lesson.title}
                      </p>
                      {lesson.released_at && (
                        <p className="text-xs text-muted-foreground">
                          Released {new Date(lesson.released_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={lesson.status === "completed" ? "secondary" : "outline"}>
                    {lesson.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddHomeworkDialog
        open={homeworkDialogOpen}
        onOpenChange={setHomeworkDialogOpen}
        subjectId={subject.id}
        onHomeworkCreated={fetchSubjectAndLessons}
      />
    </div>
  );
}