
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  TrendingUp, 
  Activity, 
  Crown, 
  Shield,
  BarChart3,
  Calendar,
  DollarSign,
  LogOut
} from 'lucide-react';

interface AdminAnalytics {
  total_users: number;
  users_last_30_days: number;
  users_last_7_days: number;
  users_today: number;
  active_subscribers: number;
  inactive_subscribers: number;
  basic_subscribers: number;
  premium_subscribers: number;
  enterprise_subscribers: number;
  total_sessions: number;
  sessions_last_30_days: number;
  total_page_views: number;
  page_views_last_30_days: number;
  total_workouts: number;
  workouts_last_30_days: number;
  total_workout_plans: number;
  total_goals: number;
  total_injuries: number;
}

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('verify_admin_session', { 
        session_token: token 
      });

      if (error || !data) {
        localStorage.removeItem('admin_token');
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);
      await loadAnalytics();
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('admin_token');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('admin_login', {
        login_email: email,
        login_password: password
      });

      if (error || !data?.success) {
        toast({
          title: "Authentication Failed",
          description: "Invalid credentials",
          variant: "destructive",
        });
        return;
      }

      localStorage.setItem('admin_token', data.session_token);
      setIsAuthenticated(true);
      await loadAnalytics();
      
      toast({
        title: "Welcome Administrator",
        description: "Successfully logged in to admin dashboard",
      });
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: "Login Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    toast({
      title: "Logged Out",
      description: "Admin session ended",
    });
  };

  const loadAnalytics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_analytics');
      
      if (error) {
        console.error('Failed to load analytics:', error);
        return;
      }

      setAnalytics(data);
    } catch (error) {
      console.error('Analytics loading error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Admin Access</CardTitle>
            <CardDescription>
              Restricted access - Authorized personnel only
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gymtuner.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Authenticating...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Gym Tuner Analytics & Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="text-sm"
              >
                Back to App
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="text-sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.total_users || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{analytics?.users_last_7_days || 0} this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
                  <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.active_subscribers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.inactive_subscribers || 0} inactive
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.total_sessions || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.sessions_last_30_days || 0} last 30 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.total_workouts || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.workouts_last_30_days || 0} this month
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Today</span>
                    <Badge variant="secondary">{analytics?.users_today || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Last 7 days</span>
                    <Badge variant="secondary">{analytics?.users_last_7_days || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Last 30 days</span>
                    <Badge variant="secondary">{analytics?.users_last_30_days || 0}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>App Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Workout Plans</span>
                    <Badge variant="outline">{analytics?.total_workout_plans || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Goals Set</span>
                    <Badge variant="outline">{analytics?.total_goals || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Injuries Tracked</span>
                    <Badge variant="outline">{analytics?.total_injuries || 0}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Statistics</CardTitle>
                <CardDescription>
                  Overview of user registration and activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{analytics?.total_users || 0}</div>
                    <div className="text-sm text-gray-600">Total Users</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{analytics?.users_last_30_days || 0}</div>
                    <div className="text-sm text-gray-600">New This Month</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{analytics?.users_today || 0}</div>
                    <div className="text-sm text-gray-600">Joined Today</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Overview</CardTitle>
                <CardDescription>
                  Premium subscription analytics and revenue insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{analytics?.active_subscribers || 0}</div>
                    <div className="text-sm text-gray-600">Active Subscribers</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{analytics?.inactive_subscribers || 0}</div>
                    <div className="text-sm text-gray-600">Inactive</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{analytics?.basic_subscribers || 0}</div>
                    <div className="text-sm text-gray-600">Basic Plan</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage Analytics</CardTitle>
                <CardDescription>
                  Detailed app usage and engagement metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-medium">Page Views</h4>
                    <div className="text-3xl font-bold">{analytics?.total_page_views || 0}</div>
                    <p className="text-sm text-gray-600">
                      {analytics?.page_views_last_30_days || 0} in the last 30 days
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Sessions</h4>
                    <div className="text-3xl font-bold">{analytics?.total_sessions || 0}</div>
                    <p className="text-sm text-gray-600">
                      {analytics?.sessions_last_30_days || 0} in the last 30 days
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
