
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, Crown, RefreshCw, LogOut, Trash2 } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  trial_end?: string;
  cancelled_but_active?: boolean;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading, adminUser } = useAdmin();
  const { signOutAdmin } = useAdminAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    subscribedUsers: 0,
    trialUsers: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Use admin RPC function to get all user data (bypasses RLS)
      const { data: usersData, error: usersError } = await supabase
        .rpc('admin_get_all_users');

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
      }

      // Map the data to our UserData interface
      const combinedUsers: UserData[] = usersData?.map(user => ({
        id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        created_at: user.created_at,
        subscribed: user.subscribed,
        subscription_tier: user.subscription_tier,
        subscription_end: user.subscription_end,
        trial_end: user.trial_end,
        cancelled_but_active: user.cancelled_but_active,
      })) || [];

      setUsers(combinedUsers);

      // Calculate stats
      const totalUsers = combinedUsers.length;
      const subscribedUsers = combinedUsers.filter(u => u.subscribed).length;
      const trialUsers = combinedUsers.filter(u => 
        u.trial_end && new Date(u.trial_end) > new Date()
      ).length;

      setStats({ totalUsers, subscribedUsers, trialUsers });

    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionStatus = (user: UserData) => {
    // Check if user is on trial
    const isOnTrial = user.trial_end && new Date(user.trial_end) > new Date();
    
    if (user.subscribed && !user.cancelled_but_active) {
      return <Badge className="bg-green-100 text-green-800">Active Paid Subscription</Badge>;
    }
    if (user.subscribed && user.cancelled_but_active) {
      return <Badge className="bg-orange-100 text-orange-800">Cancelled Paid Account</Badge>;
    }
    if (isOnTrial) {
      return <Badge className="bg-blue-100 text-blue-800">Active Trial</Badge>;
    }
    return <Badge variant="secondary">Regular Free</Badge>;
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user: ${userEmail}?`)) {
      return;
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `User ${userEmail} has been deleted successfully.`,
      });
      
      // Refresh the users list
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome, {adminUser?.full_name || adminUser?.email}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={signOutAdmin} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribed Users</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subscribedUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Users</CardTitle>
            <Badge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trialUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users & Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userData) => (
                  <TableRow key={userData.id}>
                    <TableCell className="font-medium">
                      {userData.full_name || 'No name'}
                    </TableCell>
                    <TableCell>{userData.email}</TableCell>
                    <TableCell>{getSubscriptionStatus(userData)}</TableCell>
                    <TableCell>
                      {userData.subscription_tier && (
                        <Badge variant="outline">{userData.subscription_tier}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(userData.created_at).toLocaleDateString()}
                    </TableCell>
                     <TableCell>
                       <div className="flex gap-2">
                         <Button
                           size="sm"
                           variant="destructive"
                           onClick={() => deleteUser(userData.id, userData.email)}
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
