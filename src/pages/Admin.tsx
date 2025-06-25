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
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  TrendingUp, 
  Activity, 
  Crown, 
  BarChart3,
  LogOut,
  Mail,
  User
} from 'lucide-react';

interface SimpleAnalytics {
  totalUsers: number;
  totalWorkouts: number;
  totalGoals: number;
  totalInjuries: number;
  totalPlans: number;
}

interface UserWithSubscription {
  id: string;
  full_name: string | null;
  created_at: string;
  subscription_status: 'free' | 'trial' | 'paid';
  subscription_tier: string | null;
  trial_end: string | null;
  subscription_end: string | null;
}

const ADMIN_PASSWORD = 'GymTuner2025!Admin';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [analytics, setAnalytics] = useState<SimpleAnalytics | null>(null);
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loginLoading, setLoginLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already authenticated in session
    const adminAuth = sessionStorage.getItem('admin_authenticated');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
      loadAnalytics();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'users' && users.length === 0) {
      loadUsers();
    }
  }, [isAuthenticated, activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      toast({
        title: "Welcome Administrator",
        description: "Successfully logged in to admin dashboard",
      });
      loadAnalytics();
    } else {
      toast({
        title: "Authentication Failed",
        description: "Invalid password",
        variant: "destructive",
      });
    }
    
    setLoginLoading(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setPassword('');
    toast({
      title: "Logged Out",
      description: "Admin session ended",
    });
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      console.log('Loading analytics data...');
      
      // Get basic analytics using count queries
      const [usersRes, workoutsRes, goalsRes, injuriesRes, plansRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('workouts').select('*', { count: 'exact', head: true }),
        supabase.from('goals').select('*', { count: 'exact', head: true }),
        supabase.from('injuries').select('*', { count: 'exact', head: true }),
        supabase.from('workout_plans').select('*', { count: 'exact', head: true })
      ]);

      console.log('Analytics results:', {
        users: usersRes.count,
        workouts: workoutsRes.count,
        goals: goalsRes.count,
        injuries: injuriesRes.count,
        plans: plansRes.count
      });

      // Check for errors
      if (usersRes.error) console.error('Users query error:', usersRes.error);
      if (workoutsRes.error) console.error('Workouts query error:', workoutsRes.error);
      if (goalsRes.error) console.error('Goals query error:', goalsRes.error);
      if (injuriesRes.error) console.error('Injuries query error:', injuriesRes.error);
      if (plansRes.error) console.error('Plans query error:', plansRes.error);

      setAnalytics({
        totalUsers: usersRes.count || 0,
        totalWorkouts: workoutsRes.count || 0,
        totalGoals: goalsRes.count || 0,
        totalInjuries: injuriesRes.count || 0,
        totalPlans: plansRes.count || 0,
      });

      console.log('Analytics set:', {
        totalUsers: usersRes.count || 0,
        totalWorkouts: workoutsRes.count || 0,
        totalGoals: goalsRes.count || 0,
        totalInjuries: injuriesRes.count || 0,
        totalPlans: plansRes.count || 0,
      });
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
      
      // Get users from profiles table and join with subscription data
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, created_at');
      
      if (profilesError) {
        console.error('Profiles error:', profilesError);
        throw profilesError;
      }
      
      console.log('Loaded profiles:', profilesData?.length || 0);
      
      // Get subscription data
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscribers')
        .select('user_id, subscribed, subscription_tier, trial_end, subscription_end');
      
      if (subscriptionsError) {
        console.warn('Could not load subscription data:', subscriptionsError);
      }

      console.log('Loaded subscriptions:', subscriptionsData?.length || 0);

      // Combine profile and subscription data
      const usersWithSubscriptions: UserWithSubscription[] = (profilesData || []).map(profile => {
        const subscription = subscriptionsData?.find(sub => sub.user_id === profile.id);
        
        let subscriptionStatus: 'free' | 'trial' | 'paid' = 'free';
        
        if (subscription) {
          if (subscription.subscribed) {
            subscriptionStatus = 'paid';
          } else if (subscription.trial_end && new Date(subscription.trial_end) > new Date()) {
            subscriptionStatus = 'trial';
          }
        }

        return {
          id: profile.id,
          full_name: profile.full_name,
          created_at: profile.created_at,
          subscription_status: subscriptionStatus,
          subscription_tier: subscription?.subscription_tier || null,
          trial_end: subscription?.trial_end || null,
          subscription_end: subscription?.subscription_end || null,
        };
      });

      console.log('Final users with subscriptions:', usersWithSubscriptions.length);
      setUsers(usersWithSubscriptions);
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

  const getSubscriptionBadge = (user: UserWithSubscription) => {
    switch (user.subscription_status) {
      case 'paid':
        return <Badge className="bg-green-500 text-white">Paid {user.subscription_tier || ''}</Badge>;
      case 'trial':
        return <Badge className="bg-blue-500 text-white">Trial</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-300 text-gray-600">Free</Badge>;
    }
  };

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
              Enter admin password to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
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
              <div className="text-sm text-gray-600">
                Welcome, Administrator
              </div>
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
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Registered users
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.totalWorkouts || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Logged workouts
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.totalGoals || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Set goals
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Workout Plans</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.totalPlans || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Created plans
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
                <CardDescription>
                  Basic application statistics and metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium">User Activity</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>Users: {analytics?.totalUsers || 0}</div>
                      <div>Workouts: {analytics?.totalWorkouts || 0}</div>
                      <div>Goals: {analytics?.totalGoals || 0}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">System Health</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>Injuries tracked: {analytics?.totalInjuries || 0}</div>
                      <div>Plans created: {analytics?.totalPlans || 0}</div>
                      <div>Status: ✅ Operational</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  All Users ({users.length})
                </CardTitle>
                <CardDescription>
                  Complete list of registered users with subscription status
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
                          <TableHead>Subscription</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Details</TableHead>
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
                                  <div className="text-sm text-gray-500">
                                    ID: {user.id.slice(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getSubscriptionBadge(user)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {formatDate(user.created_at)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {user.subscription_status === 'trial' && user.trial_end && (
                                <div>Trial ends: {formatDate(user.trial_end)}</div>
                              )}
                              {user.subscription_status === 'paid' && user.subscription_end && (
                                <div>Renews: {formatDate(user.subscription_end)}</div>
                              )}
                              {user.subscription_status === 'free' && (
                                <div>Free account</div>
                              )}
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
