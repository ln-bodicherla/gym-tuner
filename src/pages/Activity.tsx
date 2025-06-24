
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
        <div className="px-3 py-4 sm:px-6 sm:py-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl">Activity History</CardTitle>
              <CardDescription>All your activities and achievements</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
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
      <div className="px-3 py-4 sm:px-6 sm:py-8 max-w-4xl mx-auto">
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-4 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-1 sm:gap-2 text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>
            <CardTitle className="text-xl sm:text-2xl">Activity History</CardTitle>
            <CardDescription className="text-sm">
              All your activities and achievements ({activities.length} total)
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 sm:h-16 w-12 sm:w-16 mx-auto text-gray-400 mb-4 sm:mb-6" />
                <p className="text-lg sm:text-xl text-gray-500 mb-2">No activity yet</p>
                <p className="text-sm text-gray-400">Start using the app to see your activity here</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 sm:space-y-4">
                  {currentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg border-l-4 border-l-transparent hover:border-l-blue-500 transition-colors"
                    >
                      <div className={`bg-gradient-to-r ${getActivityColor(activity.activity_type)} p-2 sm:p-3 rounded-full flex-shrink-0 mt-0.5`}>
                        <div className="text-white">
                          {getActivityIcon(activity.activity_type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base leading-tight">
                              {activity.description}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                              <p className="text-xs sm:text-sm text-gray-600">
                                {formatTimeAgo(activity.created_at)}
                              </p>
                              <span className="hidden sm:inline text-gray-400">•</span>
                              <p className="text-xs text-gray-500">
                                {new Date(activity.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs capitalize self-start sm:self-center flex-shrink-0 mt-1 sm:mt-0">
                            {activity.activity_type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-6 sm:mt-8">
                    <Pagination>
                      <PaginationContent className="flex-wrap justify-center gap-1">
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage > 1) handlePageChange(currentPage - 1);
                            }}
                            className={`text-xs sm:text-sm ${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
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
                                  className="cursor-pointer text-xs sm:text-sm min-w-[32px] sm:min-w-[36px]"
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
                              <PaginationItem key={page} className="hidden sm:block">
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
                            className={`text-xs sm:text-sm ${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
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
