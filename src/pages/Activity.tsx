
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Target, User, Heart, AlertTriangle, Plus, ArrowLeft } from "lucide-react";
import { useActivity } from "@/contexts/ActivityContext";
import { ActivityLog } from "@/hooks/useActivityLogger";
import { useNavigate } from "react-router-dom";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;

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

const ActivityPage = () => {
  const { activities, loading } = useActivity();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(activities.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentActivities = activities.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="px-4 py-4 sm:px-6 sm:py-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Activity History</CardTitle>
              <CardDescription>All your activities and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="px-4 py-4 sm:px-6 sm:py-8 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            <CardTitle className="text-2xl">Activity History</CardTitle>
            <CardDescription>
              All your activities and achievements ({activities.length} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-16 w-16 mx-auto text-gray-400 mb-6" />
                <p className="text-xl text-gray-500 mb-2">No activity yet</p>
                <p className="text-gray-400">Start using the app to see your activity here</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {currentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4 border-l-transparent hover:border-l-blue-500 transition-colors"
                    >
                      <div className="flex items-center space-x-4 min-w-0 flex-1">
                        <div className={`bg-gradient-to-r ${getActivityColor(activity.activity_type)} p-3 rounded-full flex-shrink-0`}>
                          <div className="text-white">
                            {getActivityIcon(activity.activity_type)}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-base truncate">
                            {activity.description}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatTimeAgo(activity.created_at)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="flex-shrink-0 ml-4 capitalize">
                        {activity.activity_type.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage > 1) handlePageChange(currentPage - 1);
                            }}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handlePageChange(page);
                                  }}
                                  isActive={currentPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}

                        <PaginationItem>
                          <PaginationNext 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage < totalPages) handlePageChange(currentPage + 1);
                            }}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActivityPage;
