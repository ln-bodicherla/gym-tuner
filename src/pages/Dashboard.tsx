
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import QuickStats from '@/components/QuickStats';
import RecentActivity from '@/components/RecentActivity';
import WorkoutTracker from '@/components/WorkoutTracker';
import WorkoutPlan from '@/components/WorkoutPlan';
import GoalManager from '@/components/GoalManager';
import InjuryTracker from '@/components/InjuryTracker';
import UserProfile from '@/components/UserProfile';
import SubscriptionCard from '@/components/SubscriptionCard';
import ProfileCompletionCheck from '@/components/ProfileCompletionCheck';
import { useAuthAuditLogger } from '@/components/SecurityAuditLogger';
import { Shield } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useUserProfile } from '@/hooks/useUserProfile';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { hasAccess, isInTrial, getTrialDaysRemaining } = useSubscription();
  const { profile, loading: profileLoading } = useUserProfile();
  
  // Enable automatic audit logging for auth events
  useAuthAuditLogger();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleUpgrade = () => {
    navigate('/subscription');
  };

  const handleCompleteProfile = () => {
    navigate('/profile');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <img 
              src="/lovable-uploads/af2e857a-423f-4dd0-8bc6-416e6b7a0561.png" 
              alt="Gym Tuner Logo" 
              className="h-12 w-12"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate('/admin')}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Shield className="h-4 w-4" />
              <span>Admin Panel</span>
            </Button>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>

        <ProfileCompletionCheck 
          profile={profile}
          onCompleteProfile={handleCompleteProfile}
        />

        {/* Quick Stats */}
        <QuickStats className="mb-8" />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <WorkoutTracker />
            <WorkoutPlan />
            <GoalManager />
          </div>
          
          {/* Right Column */}
          <div className="space-y-8">
            <SubscriptionCard 
              hasAccess={hasAccess()}
              onUpgrade={handleUpgrade}
              isInTrial={isInTrial()}
              trialDaysRemaining={getTrialDaysRemaining()}
            />
            <RecentActivity />
            <InjuryTracker />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <UserProfile />
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                Get support or learn more about Gym Tuner features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  📚 View Documentation
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  💬 Contact Support
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  🎯 Feature Requests
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
