
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Activity, Crown, Check, Star, TrendingUp, Target } from 'lucide-react';

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      setError(error.message);
    } else {
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    }
    setLoading(false);
  };

  const proFeatures = [
    { icon: Star, text: "Unlimited AI workout plans" },
    { icon: TrendingUp, text: "Advanced progress analytics" },
    { icon: Target, text: "Personalized goal tracking" },
    { icon: Crown, text: "Priority support" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Auth Form */}
        <Card className="lg:col-span-3">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-3 rounded-lg">
                <Activity className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Gym Tuner</CardTitle>
            <CardDescription>Smart Workout Planning</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
                    disabled={loading}
                  >
                    {loading ? 'Creating account...' : 'Sign Up'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Subscription Info Sidebar */}
        <Card className="lg:col-span-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mb-3">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-xl">Start with Gym Tuner Pro</CardTitle>
            <CardDescription>
              Get the most out of your fitness journey
            </CardDescription>
            <div className="text-center space-y-1">
              <div className="text-3xl font-bold text-gray-900">$9.99</div>
              <div className="text-gray-600">/month</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {proFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-1.5 rounded-lg">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">{feature.text}</span>
                    <Check className="h-4 w-4 text-green-500 ml-auto" />
                  </div>
                );
              })}
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-gray-800 mb-2">What you get:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• AI-powered workout recommendations</li>
                <li>• Unlimited workout plan generation</li>
                <li>• Advanced progress tracking</li>
                <li>• Injury management system</li>
                <li>• Goal-based fitness planning</li>
              </ul>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Start your free account and upgrade anytime
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthForm;
