import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BookOpen, Loader2, Trash2, Calendar, Clock, CheckCircle2, Circle, Pause, Play, Eye, EyeOff, Plus, FileText, HelpCircle, GraduationCap, AlertTriangle, Pencil, Check, X } from "lucide-react";
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
import { AddExamDialog } from "@/components/study/AddExamDialog";
import { AddLessonDialog } from "@/components/study/AddLessonDialog";
import { format, isPast, isToday, differenceInDays } from "date-fns";

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

interface Exam {
  id: string;
  subject_id: string;
  exam_date: string;
  topics: string;
  importance: string;
  notes: string | null;
  status: string;
  created_at: string;
}

export default function Subject() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [homeworkDialogOpen, setHomeworkDialogOpen] = useState(false);
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    if (id) {
      fetchSubjectData();
    }
  }, [id]);

  // Real-time subscription for new lessons
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel('study-lessons-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'study_lessons',
          filter: `subject_id=eq.${id}`,
        },
        (payload) => {
          const newLesson = payload.new as Lesson;
          setLessons((prev) => {
            // Check if lesson already exists
            if (prev.some(l => l.id === newLesson.id)) return prev;
            // Add and sort by lesson_number
            return [...prev, newLesson].sort((a, b) => a.lesson_number - b.lesson_number);
          });
          // Update subject's pending_lessons count
          setSubject((prev) => prev ? { ...prev, pending_lessons: prev.pending_lessons + 1 } : prev);
          toast({ title: "New lesson released!", description: newLesson.title });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, toast]);

  const fetchSubjectData = async () => {
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

      // Fetch lessons ordered chronologically
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("study_lessons")
        .select("*")
        .eq("subject_id", id)
        .eq("user_id", user.id)
        .order("lesson_number", { ascending: true });

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);

      // Fetch homework
      const { data: homeworkData, error: homeworkError } = await supabase
        .from("study_homework")
        .select("*")
        .eq("subject_id", id)
        .eq("user_id", user.id)
        .order("deadline", { ascending: true });

      if (homeworkError) throw homeworkError;
      setHomework(homeworkData || []);

      // Fetch exams ordered by date
      const { data: examsData, error: examsError } = await supabase
        .from("study_exams")
        .select("*")
        .eq("subject_id", id)
        .eq("user_id", user.id)
        .order("exam_date", { ascending: true });

      if (examsError) throw examsError;
      setExams(examsData || []);
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
        description: "The subject and all its data have been removed.",
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
      });
    } catch (error: any) {
      toast({
        title: "Error updating subject",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startEditingLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setEditingTitle(lesson.title);
  };

  const cancelEditingLesson = () => {
    setEditingLessonId(null);
    setEditingTitle("");
  };

  const saveEditingLesson = async () => {
    if (!editingLessonId || !editingTitle.trim()) return;

    try {
      const { error } = await supabase
        .from("study_lessons")
        .update({ title: editingTitle.trim() })
        .eq("id", editingLessonId);

      if (error) throw error;

      setLessons(lessons.map(l => 
        l.id === editingLessonId ? { ...l, title: editingTitle.trim() } : l
      ));
      toast({ title: "Lesson renamed" });
      cancelEditingLesson();
    } catch (error: any) {
      toast({ title: "Error updating lesson", description: error.message, variant: "destructive" });
    }
  };

  const markLessonComplete = async (lesson: Lesson) => {
    try {
      const { error } = await supabase
        .from("study_lessons")
        .update({ status: "completed", completed_at: new Date().toISOString() })
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
        await supabase.from("study_subjects").update({ pending_lessons: newPendingCount }).eq("id", subject.id);
      }

      toast({ title: "Lesson completed!" });
    } catch (error: any) {
      toast({ title: "Error updating lesson", description: error.message, variant: "destructive" });
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
        l.id === lesson.id ? { ...l, status: "pending", completed_at: null } : l
      ));

      if (subject) {
        const newPendingCount = subject.pending_lessons + 1;
        setSubject({ ...subject, pending_lessons: newPendingCount });
        await supabase.from("study_subjects").update({ pending_lessons: newPendingCount }).eq("id", subject.id);
      }

      toast({ title: "Lesson restored" });
    } catch (error: any) {
      toast({ title: "Error updating lesson", description: error.message, variant: "destructive" });
    }
  };

  const markHomeworkComplete = async (hw: Homework) => {
    try {
      const { error } = await supabase
        .from("study_homework")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", hw.id);

      if (error) throw error;

      setHomework(homework.map(h => 
        h.id === hw.id ? { ...h, status: "completed", completed_at: new Date().toISOString() } : h
      ));

      toast({ title: "Homework completed!" });
    } catch (error: any) {
      toast({ title: "Error updating homework", description: error.message, variant: "destructive" });
    }
  };

  const deleteHomework = async (hw: Homework) => {
    try {
      const { error } = await supabase.from("study_homework").delete().eq("id", hw.id);
      if (error) throw error;
      setHomework(homework.filter(h => h.id !== hw.id));
      toast({ title: "Homework deleted" });
    } catch (error: any) {
      toast({ title: "Error deleting homework", description: error.message, variant: "destructive" });
    }
  };

  const markExamComplete = async (exam: Exam) => {
    try {
      const { error } = await supabase
        .from("study_exams")
        .update({ status: "completed" })
        .eq("id", exam.id);

      if (error) throw error;

      setExams(exams.map(e => e.id === exam.id ? { ...e, status: "completed" } : e));
      toast({ title: "Exam marked as done!" });
    } catch (error: any) {
      toast({ title: "Error updating exam", description: error.message, variant: "destructive" });
    }
  };

  const deleteExam = async (exam: Exam) => {
    try {
      const { error } = await supabase.from("study_exams").delete().eq("id", exam.id);
      if (error) throw error;
      setExams(exams.filter(e => e.id !== exam.id));
      toast({ title: "Exam deleted" });
    } catch (error: any) {
      toast({ title: "Error deleting exam", description: error.message, variant: "destructive" });
    }
  };

  const getDeadlineStatus = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    if (isPast(deadlineDate) && !isToday(deadlineDate)) return "overdue";
    if (isToday(deadlineDate)) return "today";
    return "upcoming";
  };

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{importance}</Badge>;
    }
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
        <Button variant="link" onClick={() => navigate("/study")}>Back to Study Planner</Button>
      </div>
    );
  }

  const completedLessons = lessons.filter(l => l.status === "completed");
  const pendingLessons = lessons.filter(l => l.status === "pending");
  const displayedLessons = showCompleted ? lessons : pendingLessons;
  const pendingHomework = homework.filter(h => h.status === "pending");
  const upcomingExams = exams.filter(e => e.status === "upcoming");

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
                Are you sure you want to delete "{subject.name}"? This will remove all lessons, homework, and exams.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lessons.length}</p>
                <p className="text-sm text-muted-foreground">Lessons</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingHomework.length}</p>
                <p className="text-sm text-muted-foreground">Homework</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingExams.length}</p>
                <p className="text-sm text-muted-foreground">Exams</p>
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

      {/* Release Schedule */}
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
                      Next: {format(new Date(subject.next_release_at), "EEEE, MMM d 'at' h:mm a")}
                    </p>
                  )}
                  {subject.is_paused && (
                    <p className="text-sm text-amber-600">Auto-generation paused</p>
                  )}
                </div>
              </div>
              <Button variant={subject.is_paused ? "default" : "outline"} size="sm" onClick={togglePause}>
                {subject.is_paused ? <><Play className="h-4 w-4 mr-2" />Resume</> : <><Pause className="h-4 w-4 mr-2" />Pause</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exams Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Exams
            </CardTitle>
            <Button size="sm" onClick={() => setExamDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Exam
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingExams.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No upcoming exams. Add one to track your schedule.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingExams.map((exam) => {
                const daysUntil = differenceInDays(new Date(exam.exam_date), new Date());
                const isClose = daysUntil <= 3 && daysUntil >= 0;
                const isPastExam = daysUntil < 0;
                
                return (
                  <div
                    key={exam.id}
                    className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <button onClick={() => markExamComplete(exam)} className="flex-shrink-0 mt-0.5">
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-emerald-500 transition-colors" />
                      </button>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(exam.exam_date), "EEEE, MMMM d, yyyy")}
                          </span>
                          {getImportanceBadge(exam.importance)}
                          {isClose && !isPastExam && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {daysUntil === 0 ? "Today!" : `${daysUntil} days left`}
                            </Badge>
                          )}
                          {isPastExam && (
                            <Badge variant="outline" className="text-muted-foreground">Past</Badge>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Topics:</p>
                          <p className="text-sm">{exam.topics}</p>
                        </div>
                        {exam.notes && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Notes:</p>
                            <p className="text-sm text-muted-foreground">{exam.notes}</p>
                          </div>
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
                          <AlertDialogTitle>Delete Exam</AlertDialogTitle>
                          <AlertDialogDescription>Are you sure you want to delete this exam?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteExam(exam)}>Delete</AlertDialogAction>
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
                  <div key={hw.id} className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <button onClick={() => markHomeworkComplete(hw)} className="flex-shrink-0 mt-0.5">
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-emerald-500 transition-colors" />
                      </button>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {hw.amount_type === "pages" ? <FileText className="h-4 w-4 text-muted-foreground" /> : <HelpCircle className="h-4 w-4 text-muted-foreground" />}
                          <span className="font-medium">{hw.amount} {hw.amount_type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className={
                            deadlineStatus === "overdue" ? "text-destructive font-medium" 
                            : deadlineStatus === "today" ? "text-amber-600 font-medium" 
                            : "text-muted-foreground"
                          }>
                            {deadlineStatus === "overdue" && "Overdue: "}
                            {deadlineStatus === "today" && "Due today: "}
                            {format(new Date(hw.deadline), "MMM d, yyyy")}
                          </span>
                        </div>
                        {hw.notes && <p className="text-sm text-muted-foreground">{hw.notes}</p>}
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
                          <AlertDialogDescription>Are you sure?</AlertDialogDescription>
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

      {/* Lessons */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lessons</CardTitle>
            <div className="flex items-center gap-2">
              {completedLessons.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setShowCompleted(!showCompleted)}>
                  {showCompleted ? <><EyeOff className="h-4 w-4 mr-2" />Hide Completed</> : <><Eye className="h-4 w-4 mr-2" />Show Completed ({completedLessons.length})</>}
                </Button>
              )}
              <Button size="sm" onClick={() => setLessonDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Lesson
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {displayedLessons.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {pendingLessons.length === 0 && completedLessons.length > 0 ? "All lessons completed!" : "No lessons yet. Add one to get started."}
            </p>
          ) : (
            <div className="space-y-2">
              {displayedLessons.map((lesson) => (
                <div key={lesson.id} className="group flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <button onClick={() => lesson.status === "completed" ? markLessonPending(lesson) : markLessonComplete(lesson)} className="flex-shrink-0">
                      {lesson.status === "completed" ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-muted-foreground hover:text-emerald-500 transition-colors" />}
                    </button>
                    {editingLessonId === lesson.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditingLesson();
                            if (e.key === "Escape") cancelEditingLesson();
                          }}
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={saveEditingLesson}>
                          <Check className="h-4 w-4 text-emerald-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelEditingLesson}>
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <div>
                          <p className={`font-medium ${lesson.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{lesson.title}</p>
                          {lesson.released_at && <p className="text-xs text-muted-foreground">Released {format(new Date(lesson.released_at), "MMM d, yyyy")}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:opacity-100 ml-auto"
                          onClick={() => startEditingLesson(lesson)}
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {editingLessonId !== lesson.id && (
                    <Badge variant={lesson.status === "completed" ? "secondary" : "outline"}>{lesson.status}</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddHomeworkDialog open={homeworkDialogOpen} onOpenChange={setHomeworkDialogOpen} subjectId={subject.id} onHomeworkCreated={fetchSubjectData} />
      <AddExamDialog open={examDialogOpen} onOpenChange={setExamDialogOpen} subjectId={subject.id} onExamCreated={fetchSubjectData} />
      <AddLessonDialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen} subjectId={subject.id} currentLessonCount={lessons.length} onLessonCreated={fetchSubjectData} />
    </div>
  );
}