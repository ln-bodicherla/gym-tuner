
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Target, User, Heart, AlertTriangle, Plus } from "lucide-react";
import { useActivity } from "@/contexts/ActivityContext";
import { ActivityLog } from "@/hooks/useActivityLogger";

const getActivityIcon = (type: ActivityLog['activity_type']) => {
  switch (type) {
    case 'profile_update':
      return <User className="h-4 w-4" />;
    case 'goal_created':
    case 'goal_updated':
    case 'goal_deleted':
      return <Target className="h-4 w-4" />;
    case 'injury_added':
    case 'injury_updated':
    case 'injury_deleted':
      return <AlertTriangle className="h-4 w-4" />;
    case 'workout_created':
    case 'workout_completed':
      return <Heart className="h-4 w-4" />;
    case 'plan_generated':
      return <Plus className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getActivityColor = (type: ActivityLog['activity_type']) => {
  switch (type) {
    case 'profile_update':
      return 'from-blue-500 to-blue-600';
    case 'goal_created':
    case 'goal_updated':
      return 'from-green-500 to-green-600';
    case 'goal_deleted':
      return 'from-red-500 to-red-600';
    case 'injury_added':
    case 'injury_updated':
      return 'from-yellow-500 to-yellow-600';
    case 'injury_deleted':
      return 'from-gray-500 to-gray-600';
    case 'workout_created':
    case 'workout_completed':
      return 'from-purple-500 to-purple-600';
    case 'plan_generated':
      return 'from-orange-500 to-orange-600';
    default:
      return 'from-gray-500 to-gray-600';
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
};

const RecentActivity = () => {
  const { activities, loading } = useActivity();

  if (loading) {
    return (
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
          <CardDescription>Your latest actions and achievements</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
        <CardDescription>Your latest actions and achievements</CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No recent activity yet</p>
            <p className="text-sm text-gray-400">Start using the app to see your activity here</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border-l-4 border-l-transparent hover:border-l-blue-500 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className={`bg-gradient-to-r ${getActivityColor(activity.activity_type)} p-2 rounded-full flex-shrink-0`}>
                    <div className="text-white">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {formatTimeAgo(activity.created_at)}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs flex-shrink-0 ml-2 capitalize">
                  {activity.activity_type.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
