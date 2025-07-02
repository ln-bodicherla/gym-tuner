
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, Crown, RefreshCw } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  trial_end?: string;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
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
      
      // Fetch profiles with their subscription info
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, created_at');

      if (profilesError) {
        throw profilesError;
      }

      // Fetch subscribers data
      const { data: subscribersData, error: subscribersError } = await supabase
        .from('subscribers')
        .select('user_id, email, subscribed, subscription_tier, subscription_end, trial_end');

      if (subscribersError) {
        throw subscribersError;
      }

      // Combine the data
      const combinedUsers = profilesData?.map(profile => {
        const subscription = subscribersData?.find(sub => sub.user_id === profile.id);
        return {
          id: profile.id,
          email: subscription?.email || 'No email',
          full_name: profile.full_name,
          created_at: profile.created_at,
          subscribed: subscription?.subscribed || false,
          subscription_tier: subscription?.subscription_tier,
          subscription_end: subscription?.subscription_end,
          trial_end: subscription?.trial_end,
        };
      }) || [];

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
    if (user.subscribed) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    if (user.trial_end && new Date(user.trial_end) > new Date()) {
      return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
    }
    return <Badge variant="secondary">Free</Badge>;
  };

  const makeUserAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .insert({ user_id: userId, created_by: user?.id });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "User has been made an admin",
      });
    } catch (error) {
      console.error('Error making user admin:', error);
      toast({
        title: "Error",
        description: "Failed to make user admin",
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
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={fetchUsers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => makeUserAdmin(userData.id)}
                      >
                        Make Admin
                      </Button>
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
