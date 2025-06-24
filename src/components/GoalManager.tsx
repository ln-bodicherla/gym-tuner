
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, Trash2, Trophy, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLogger } from "@/hooks/useActivityLogger";

interface Goal {
  id: string;
  title: string;
  description: string;
  target_date: string;
  achieved_date?: string;
  status: string;
  target_value?: number;
  current_value?: number;
  unit?: string;
  created_at?: string;
  updated_at?: string;
}

const GoalManager = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { logActivity } = useActivityLogger();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState({
    title: "",
    target_date: "",
    description: "",
    target_value: "",
    unit: ""
  });

  // Fetch goals from database
  const fetchGoals = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: "Error",
        description: "Failed to load goals",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  const handleAddGoal = async () => {
    if (!user || !newGoal.title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in the goal title.",
        variant: "destructive"
      });
      return;
    }

    try {
      const goalData = {
        user_id: user.id,
        title: newGoal.title,
        description: newGoal.description,
        target_date: newGoal.target_date || null,
        status: 'active',
        target_value: newGoal.target_value ? parseFloat(newGoal.target_value) : null,
        current_value: 0,
        unit: newGoal.unit || null
      };

      const { error } = await supabase
        .from('goals')
        .insert(goalData);

      if (error) throw error;

      setNewGoal({
        title: "",
        target_date: "",
        description: "",
        target_value: "",
        unit: ""
      });

      await logActivity('goal_created', `Created goal: ${newGoal.title}`);

      toast({
        title: "Goal Added",
        description: "Your new goal has been created successfully.",
      });

      fetchGoals();
    } catch (error) {
      console.error('Error adding goal:', error);
      toast({
        title: "Error",
        description: "Failed to add goal",
        variant: "destructive"
      });
    }
  };

  const handleAchieveGoal = async (goalId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('goals')
        .update({
          status: 'achieved',
          achieved_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);

      if (error) throw error;

      const goal = goals.find(g => g.id === goalId);
      if (goal) {
        await logActivity('goal_updated', `Achieved goal: ${goal.title}`);
      }

      toast({
        title: "Congratulations! 🎉",
        description: "Goal marked as achieved!",
      });

      fetchGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: "Error",
        description: "Failed to update goal",
        variant: "destructive"
      });
    }
  };

  const handleRemoveGoal = async (goalId: string) => {
    if (!user) return;

    try {
      const goal = goals.find(g => g.id === goalId);
      
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      if (goal) {
        await logActivity('goal_deleted', `Deleted goal: ${goal.title}`);
      }

      toast({
        title: "Goal Removed",
        description: "Goal has been deleted successfully.",
      });

      fetchGoals();
    } catch (error) {
      console.error('Error removing goal:', error);
      toast({
        title: "Error",
        description: "Failed to remove goal",
        variant: "destructive"
      });
    }
  };

  const updateGoalProgress = async (goalId: string, currentValue: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('goals')
        .update({
          current_value: currentValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);

      if (error) throw error;

      const goal = goals.find(g => g.id === goalId);
      if (goal) {
        await logActivity('goal_updated', `Updated progress for goal: ${goal.title}`);
      }

      toast({
        title: "Progress Updated",
        description: "Goal progress has been updated successfully.",
      });

      fetchGoals();
    } catch (error) {
      console.error('Error updating goal progress:', error);
      toast({
        title: "Error",
        description: "Failed to update goal progress",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'achieved':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-2 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Goal Manager</CardTitle>
              <CardDescription>Set and track your fitness goals</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add New Goal */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Create New Goal</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Goal Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Run a 5K marathon"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="target_value">Target Value</Label>
                    <Input
                      id="target_value"
                      type="number"
                      placeholder="e.g., 5"
                      value={newGoal.target_value}
                      onChange={(e) => setNewGoal({...newGoal, target_value: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      placeholder="e.g., km, lbs, reps"
                      value={newGoal.unit}
                      onChange={(e) => setNewGoal({...newGoal, unit: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="target_date">Target Date</Label>
                  <Input
                    id="target_date"
                    type="date"
                    value={newGoal.target_date}
                    onChange={(e) => setNewGoal({...newGoal, target_date: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Why is this goal important to you?"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  />
                </div>
                
                <Button onClick={handleAddGoal} className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </div>
            </div>

            {/* Current Goals */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Your Goals</h3>
              
              {goals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No goals set yet. Create your first goal to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {goals.map((goal) => (
                    <Card key={goal.id} className={`border-l-4 ${goal.status === 'achieved' ? 'border-l-green-500 bg-green-50' : 'border-l-blue-500'}`}>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium">{goal.title}</h4>
                                <Badge className={getStatusColor(goal.status)}>
                                  {goal.status}
                                </Badge>
                                {goal.status === 'achieved' && (
                                  <Trophy className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>

                              {goal.target_value && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                                  <span>Progress: {goal.current_value || 0} / {goal.target_value} {goal.unit}</span>
                                  {goal.status === 'active' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const newValue = prompt(`Enter current value for ${goal.title}:`);
                                        if (newValue && !isNaN(parseFloat(newValue))) {
                                          updateGoalProgress(goal.id, parseFloat(newValue));
                                        }
                                      }}
                                      className="text-xs px-2 py-1 h-6"
                                    >
                                      Update
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {goal.target_date && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Calendar className="h-3 w-3" />
                              <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                            </div>
                          )}

                          {goal.achieved_date && (
                            <div className="flex items-center space-x-2 text-sm text-green-600">
                              <Trophy className="h-3 w-3" />
                              <span>Achieved: {new Date(goal.achieved_date).toLocaleDateString()}</span>
                            </div>
                          )}
                          
                          {goal.description && (
                            <p className="text-sm text-gray-700">{goal.description}</p>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            {goal.status !== 'achieved' && (
                              <Button 
                                size="sm" 
                                className="bg-green-500 hover:bg-green-600"
                                onClick={() => handleAchieveGoal(goal.id)}
                              >
                                <Trophy className="h-3 w-3 mr-1" />
                                Mark Achieved
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleRemoveGoal(goal.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoalManager;
