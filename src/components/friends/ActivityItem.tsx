import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FriendActivity } from "@/hooks/use-friend-activities";
import { CheckSquare, Activity, Moon, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface ActivityItemProps {
  activity: FriendActivity;
}

export const ActivityItem = ({ activity }: ActivityItemProps) => {
  const navigate = useNavigate();

  const getActivityIcon = () => {
    switch (activity.activity_type) {
      case "habit_completion":
        return <CheckSquare className="h-4 w-4" />;
      case "performance_score":
        return <Activity className="h-4 w-4" />;
      case "sleep_entry":
        return <Moon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getActivityMessage = () => {
    const data = activity.activity_data;
    
    switch (activity.activity_type) {
      case "habit_completion":
        return (
          <>
            completed <span style={{ color: data.habit_color }} className="font-semibold">{data.habit_name}</span>
          </>
        );
      case "performance_score":
        return (
          <>
            scored <span className="font-semibold">{data.score}/10</span> on{" "}
            <span style={{ color: data.habit_color }} className="font-semibold">{data.habit_name}</span>
          </>
        );
      case "sleep_entry":
        return (
          <>
            slept for <span className="font-semibold">{data.hours_slept} hours</span>
            {data.sleep_quality && (
              <> with quality <span className="font-semibold">{data.sleep_quality}/5</span></>
            )}
          </>
        );
      default:
        return "had an activity";
    }
  };

  const getViewLink = () => {
    switch (activity.activity_type) {
      case "habit_completion":
        return `/friends/${activity.user_id}/habits`;
      case "performance_score":
        return `/friends/${activity.user_id}/performance`;
      case "sleep_entry":
        return `/friends/${activity.user_id}/sleep`;
      default:
        return null;
    }
  };

  const viewLink = getViewLink();

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
      <Avatar className="h-10 w-10">
        <AvatarImage src={activity.avatar_url || ""} />
        <AvatarFallback>
          {activity.username?.charAt(0).toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1 rounded-full bg-primary/10 text-primary">
            {getActivityIcon()}
          </div>
          <p className="text-sm">
            <span className="font-medium">{activity.full_name || activity.username}</span>{" "}
            {getActivityMessage()}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
        </p>
      </div>

      {viewLink && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(viewLink)}
          className="shrink-0"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
