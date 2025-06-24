
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, PieChart, LineChart, Crown, Lock } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const Insights = () => {
  const { hasAccess } = useSubscription();

  return (
    <Card className={`bg-gradient-to-br ${hasAccess() ? 'from-blue-50 to-purple-50 border-blue-200' : 'from-orange-50 to-yellow-50 border-orange-200'}`}>
      <CardHeader className="px-4 sm:px-6">
        <div className="flex items-center space-x-3">
          <div className={`bg-gradient-to-r ${hasAccess() ? 'from-blue-600 to-purple-500' : 'from-orange-500 to-yellow-500'} p-2 rounded-lg`}>
            {hasAccess() ? (
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            ) : (
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            )}
          </div>
          <div>
            <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
              <span>AI Insights</span>
              {!hasAccess() && <Crown className="h-4 w-4 text-yellow-500" />}
            </CardTitle>
            <CardDescription className="text-sm">
              {hasAccess() 
                ? "Personalized analytics and recommendations"
                : "Upgrade to Pro for AI-powered insights"
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {hasAccess() ? (
          <div className="text-center py-12">
            <div className="grid grid-cols-3 gap-4 mb-6 opacity-30">
              <div className="flex flex-col items-center space-y-2">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div className="text-xs text-gray-500">Progress</div>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-lg">
                  <PieChart className="h-6 w-6 text-white" />
                </div>
                <div className="text-xs text-gray-500">Analysis</div>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-lg">
                  <LineChart className="h-6 w-6 text-white" />
                </div>
                <div className="text-xs text-gray-500">Trends</div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-blue-200 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Coming Soon</h3>
              <p className="text-gray-600 mb-4">
                AI-powered insights to help you understand your fitness journey better
              </p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>• Workout performance analytics</p>
                <p>• Goal achievement predictions</p>
                <p>• Personalized recommendations</p>
                <p>• Progress tracking & trends</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Lock className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-orange-800 mb-2">Pro Feature</h3>
            <p className="text-orange-700 mb-6">
              AI Insights provides personalized analytics and recommendations to help you achieve your fitness goals faster.
            </p>
            <div className="text-sm text-orange-600 space-y-1 mb-6">
              <p>• Workout performance analytics</p>
              <p>• Goal achievement predictions</p>
              <p>• Personalized recommendations</p>
              <p>• Progress tracking & trends</p>
            </div>
            <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Insights;
