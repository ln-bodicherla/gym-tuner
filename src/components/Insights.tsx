
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, PieChart, LineChart } from "lucide-react";

const Insights = () => {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-600 to-purple-500 p-2 rounded-lg">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg sm:text-xl">AI Insights</CardTitle>
            <CardDescription className="text-sm">Personalized analytics and recommendations</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
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
      </CardContent>
    </Card>
  );
};

export default Insights;
