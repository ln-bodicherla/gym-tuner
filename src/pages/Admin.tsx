
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

interface UserDetails {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  full_name: string | null;
}

const ADMIN_PASSWORD = 'GymTuner2025!Admin';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [analytics, setAnalytics] = useState<SimpleAnalytics | null>(null);
  const [users, setUsers] = useState<UserDetails[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loginLoading, setLoginLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
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
    try {
      // Get basic analytics using simple queries
      const [usersRes, workoutsRes, goalsRes, injuriesRes, plansRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('workouts').select('id', { count: 'exact', head: true }),
        supabase.from('goals').select('id', { count: 'exact', head: true }),
        supabase.from('injuries').select('id', { count: 'exact', head: true }),
        supabase.from('workout_plans').select('id', { count: 'exact', head: true })
      ]);

      setAnalytics({
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
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      // Get users from auth.users using admin API
      const { data: authData, error } = await supabase.auth.admin.listUsers();
      
      if (error) throw error;
      
      const usersWithProfiles = await Promise.all(
        (authData?.users || []).map(async (user) => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', user.id)
              .single();

            return {
              id: user.id,
              email: user.email || '',
              created_at: user.created_at,
              last_sign_in_at: user.last_sign_in_at,
              email_confirmed_at: user.email_confirmed_at,
              full_name: profile?.full_name || null,
            };
          } catch {
            return {
              id: user.id,
              email: user.email || '',
              created_at: user.created_at,
              last_sign_in_at: user.last_sign_in_at,
              email_confirmed_at: user.email_confirmed_at,
              full_name: null,
            };
          }
        })
      );

      setUsers(usersWithProfiles);
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
                  Complete list of registered users
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
                          <TableHead>Joined</TableHead>
                          <TableHead>Last Login</TableHead>
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
                            <TableCell className="text-sm text-gray-600">
                              {formatDate(user.created_at)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {formatDate(user.last_sign_in_at)}
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
