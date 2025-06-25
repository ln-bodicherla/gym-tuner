
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
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
  LogOut,
  Mail,
  User
} from 'lucide-react';

interface AdminAnalytics {
  total_users: number;
  users_last_30_days: number;
  users_last_7_days: number;
  users_today: number;
  active_subscribers: number;
  inactive_subscribers: number;
  total_workouts: number;
  workouts_last_30_days: number;
  total_workout_plans: number;
  total_goals: number;
  total_injuries: number;
}

interface UserDetails {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  full_name: string | null;
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  trial_end: string | null;
  total_workouts: number;
  total_goals: number;
  total_injuries: number;
}

const Admin = () => {
  const { isAuthenticated, loading, adminInfo, login, logout } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [users, setUsers] = useState<UserDetails[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loginLoading, setLoginLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !analytics) {
      loadAnalytics();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'users' && users.length === 0) {
      loadUsers();
    }
  }, [isAuthenticated, activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const result = await login(email, password);
      
      if (!result.success) {
        toast({
          title: "Authentication Failed",
          description: result.error || "Invalid credentials",
          variant: "destructive",
        });
        return;
      }

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
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "Admin session ended",
    });
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      console.log('Loading analytics data...');
      
      // Get users with auth admin API
      const { data: authData } = await supabase.auth.admin.listUsers();
      const allUsers = authData?.users || [];
      console.log('Total auth users:', allUsers.length);

      // Calculate date ranges
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const usersToday = allUsers.filter(user => 
        new Date(user.created_at) >= today
      ).length;

      const usersLast7Days = allUsers.filter(user => 
        new Date(user.created_at) >= sevenDaysAgo
      ).length;

      const usersLast30Days = allUsers.filter(user => 
        new Date(user.created_at) >= thirtyDaysAgo
      ).length;

      // Get subscription data
      const { data: subscribers, count: subscribersCount } = await supabase
        .from('subscribers')
        .select('subscribed, subscription_tier', { count: 'exact' });

      const activeSubscribers = subscribers?.filter(s => s.subscribed === true).length || 0;
      const inactiveSubscribers = (subscribersCount || 0) - activeSubscribers;

      // Get activity data
      const { count: totalWorkouts } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true });

      const { count: workoutsLast30Days } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { count: totalWorkoutPlans } = await supabase
        .from('workout_plans')
        .select('*', { count: 'exact', head: true });

      const { count: totalGoals } = await supabase
        .from('goals')
        .select('*', { count: 'exact', head: true });

      const { count: totalInjuries } = await supabase
        .from('injuries')
        .select('*', { count: 'exact', head: true });

      const analyticsData: AdminAnalytics = {
        total_users: allUsers.length,
        users_today: usersToday,
        users_last_7_days: usersLast7Days,
        users_last_30_days: usersLast30Days,
        active_subscribers: activeSubscribers,
        inactive_subscribers: inactiveSubscribers,
        total_workouts: totalWorkouts || 0,
        workouts_last_30_days: workoutsLast30Days || 0,
        total_workout_plans: totalWorkoutPlans || 0,
        total_goals: totalGoals || 0,
        total_injuries: totalInjuries || 0,
      };

      console.log('Analytics data loaded:', analyticsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast({
        title: "Analytics Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      console.log('Loading users data...');
      
      // Get all users using the admin API
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching auth users:', authError);
        throw authError;
      }

      const authUsers = authData?.users || [];
      console.log(`Found ${authUsers.length} auth users`);

      // Get profiles data
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name');

      // Get subscription data
      const { data: subscribers } = await supabase
        .from('subscribers')
        .select('user_id, subscribed, subscription_tier, subscription_end, trial_end');

      // Get activity counts
      const { data: workoutCounts } = await supabase
        .from('workouts')
        .select('user_id');

      const { data: goalCounts } = await supabase
        .from('goals')
        .select('user_id');

      const { data: injuryCounts } = await supabase
        .from('injuries')
        .select('user_id');

      // Create lookup maps
      const profileMap = new Map();
      profiles?.forEach(profile => profileMap.set(profile.id, profile));

      const subscriberMap = new Map();
      subscribers?.forEach(sub => subscriberMap.set(sub.user_id, sub));

      const workoutCountMap = new Map();
      workoutCounts?.forEach(workout => {
        const count = workoutCountMap.get(workout.user_id) || 0;
        workoutCountMap.set(workout.user_id, count + 1);
      });

      const goalCountMap = new Map();
      goalCounts?.forEach(goal => {
        const count = goalCountMap.get(goal.user_id) || 0;
        goalCountMap.set(goal.user_id, count + 1);
      });

      const injuryCountMap = new Map();
      injuryCounts?.forEach(injury => {
        const count = injuryCountMap.get(injury.user_id) || 0;
        injuryCountMap.set(injury.user_id, count + 1);
      });

      // Combine all user data
      const combinedUsers = authUsers.map(user => {
        const profile = profileMap.get(user.id) || {};
        const subscription = subscriberMap.get(user.id) || {};
        
        return {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          email_confirmed_at: user.email_confirmed_at,
          full_name: profile.full_name || user.user_metadata?.full_name,
          subscribed: subscription.subscribed || false,
          subscription_tier: subscription.subscription_tier,
          subscription_end: subscription.subscription_end,
          trial_end: subscription.trial_end,
          total_workouts: workoutCountMap.get(user.id) || 0,
          total_goals: goalCountMap.get(user.id) || 0,
          total_injuries: injuryCountMap.get(user.id) || 0,
        };
      });

      console.log(`Loaded ${combinedUsers.length} users with complete data`);
      setUsers(combinedUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast({
        title: "Users Error",
        description: "Failed to load users data",
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getSubscriptionStatus = (user: UserDetails) => {
    const now = new Date();
    
    // Check if user is currently in trial period
    if (user.trial_end && new Date(user.trial_end) > now) {
      const trialDaysLeft = Math.ceil((new Date(user.trial_end).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Free Trial
          </Badge>
          <span className="text-xs text-gray-500">
            {trialDaysLeft} days left
          </span>
        </div>
      );
    }
    
    // Check if user has an active PAID subscription
    if (user.subscribed && user.subscription_end && new Date(user.subscription_end) > now) {
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="default" className="bg-green-500">
            Paid - {user.subscription_tier || 'Active'}
          </Badge>
          <span className="text-xs text-gray-500">
            Until {formatDate(user.subscription_end)}
          </span>
        </div>
      );
    }
    
    // Check if user had a subscription but it expired
    if (user.subscribed === false && (user.subscription_end || user.trial_end)) {
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className="border-orange-300 text-orange-600">
            Expired
          </Badge>
          <span className="text-xs text-gray-500">
            {user.subscription_end ? `Ended ${formatDate(user.subscription_end)}` : 
             user.trial_end ? `Trial ended ${formatDate(user.trial_end)}` : ''}
          </span>
        </div>
      );
    }
    
    // User never had any subscription
    return (
      <Badge variant="outline" className="border-gray-300 text-gray-600">
        Free User
      </Badge>
    );
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
              <img 
                src="/lovable-uploads/af2e857a-423f-4dd0-8bc6-416e6b7a0561.png" 
                alt="Gym Tuner Logo" 
                className="h-16 w-16"
              />
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
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? 'Authenticating...' : 'Login'}
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
              <img 
                src="/lovable-uploads/af2e857a-423f-4dd0-8bc6-416e6b7a0561.png" 
                alt="Gym Tuner Logo" 
                className="h-8 w-8"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Gym Tuner Analytics & Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {adminInfo && (
                <div className="text-sm text-gray-600">
                  Welcome, {adminInfo.full_name}
                </div>
              )}
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading analytics...</span>
              </div>
            ) : (
              <>
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

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Workout Plans</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.total_workout_plans || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        Total created
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
                        <span>Total Goals</span>
                        <Badge variant="outline">{analytics?.total_goals || 0}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Injuries</span>
                        <Badge variant="outline">{analytics?.total_injuries || 0}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  All Users ({users.length})
                </CardTitle>
                <CardDescription>
                  Complete list of registered users with subscription and activity details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading users...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email Status</TableHead>
                          <TableHead>Subscription</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead>Activity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <div>
                                  <div className="font-medium">
                                    {user.full_name || 'Unknown'}
                                  </div>
                                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                                    <Mail className="h-3 w-3" />
                                    <span>{user.email}</span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {user.email_confirmed_at ? (
                                <Badge variant="default" className="bg-green-500">
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-red-300 text-red-600">
                                  Unverified
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {getSubscriptionStatus(user)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {formatDate(user.created_at)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {formatDate(user.last_sign_in_at)}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm space-y-1">
                                <div className="flex items-center gap-1">
                                  <Activity className="h-3 w-3 text-gray-400" />
                                  <span>{user.total_workouts} workouts</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3 text-gray-400" />
                                  <span>{user.total_goals} goals</span>
                                </div>
                                {user.total_injuries > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Badge variant="outline" className="h-4 px-1 text-xs">
                                      {user.total_injuries} injuries
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {users.length === 0 && !usersLoading && (
                      <div className="text-center py-8 text-gray-500">
                        No users found
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
