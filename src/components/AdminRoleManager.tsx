
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, Trash2 } from 'lucide-react';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
  user_email?: string;
}

const AdminRoleManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'moderator' | 'user'>('user');
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    loadUserRoles();
    loadAllUsers();
  }, []);

  const loadUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user emails for display
      const rolesWithEmails = await Promise.all(
        (data || []).map(async (role) => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', role.user_id)
              .single();

            return {
              ...role,
              user_email: profile?.full_name || 'Unknown User'
            };
          } catch {
            return { ...role, user_email: 'Unknown User' };
          }
        })
      );

      setUserRoles(rolesWithEmails);
    } catch (error) {
      console.error('Error loading user roles:', error);
      toast({
        title: "Error",
        description: "Failed to load user roles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');

      if (error) throw error;
      setAllUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const assignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: "Error",
        description: "Please select both a user and role",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser,
          role: selectedRole,
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role assigned successfully"
      });

      loadUserRoles();
      setSelectedUser('');
      setSelectedRole('user');
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive"
      });
    }
  };

  const removeRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role removed successfully"
      });

      loadUserRoles();
    } catch (error: any) {
      console.error('Error removing role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove role",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Assign User Roles</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {allUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={assignRole}>
              Assign Role
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Current User Roles</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userRoles.length === 0 ? (
              <p className="text-gray-500">No user roles assigned yet.</p>
            ) : (
              userRoles.map(role => (
                <div key={role.id} className="flex items-center justify-between py-2 px-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">{role.user_email}</span>
                    <Badge className={getRoleBadgeColor(role.role)}>
                      {role.role}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRole(role.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRoleManager;
