
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, Calendar, TrendingUp, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Goal {
  id: string;
  title: string;
  category: string;
  target: string;
  current: string;
  unit: string;
  deadline: string;
  priority: string;
  description: string;
  progress: number;
}

const GoalManager = () => {
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: "1",
      title: "Weight Loss",
      category: "weight",
      target: "165",
      current: "175",
      unit: "lbs",
      deadline: "2024-04-15",
      priority: "high",
      description: "Lose 10 pounds for summer",
      progress: 0
    },
    {
      id: "2",
      title: "Bench Press PR",
      category: "strength",
      target: "200",
      current: "175",
      unit: "lbs",
      deadline: "2024-03-30",
      priority: "medium",
      description: "Increase bench press to 200 lbs",
      progress: 60
    }
  ]);

  const [newGoal, setNewGoal] = useState({
    title: "",
    category: "",
    target: "",
    current: "",
    unit: "",
    deadline: "",
    priority: "",
    description: ""
  });

  const goalCategories = [
    { value: "weight", label: "Weight Management", icon: "⚖️" },
    { value: "strength", label: "Strength", icon: "💪" },
    { value: "endurance", label: "Endurance", icon: "🏃" },
    { value: "flexibility", label: "Flexibility", icon: "🤸" },
    { value: "body-composition", label: "Body Composition", icon: "📊" },
    { value: "performance", label: "Performance", icon: "🏆" }
  ];

  const priorityLevels = [
    { value: "low", label: "Low", color: "bg-gray-100 text-gray-800" },
    { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-800" },
    { value: "high", label: "High", color: "bg-red-100 text-red-800" }
  ];

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.category || !newGoal.target) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const current = parseFloat(newGoal.current) || 0;
    const target = parseFloat(newGoal.target) || 0;
    const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;

    const goal: Goal = {
      id: Date.now().toString(),
      ...newGoal,
      progress
    };

    setGoals([...goals, goal]);
    setNewGoal({
      title: "",
      category: "",
      target: "",
      current: "",
      unit: "",
      deadline: "",
      priority: "",
      description: ""
    });

    toast({
      title: "Goal Added",
      description: "Your new goal has been set and will influence your workout plans.",
    });
  };

  const updateGoalProgress = (id: string, newCurrent: string) => {
    setGoals(goals.map(goal => {
      if (goal.id === id) {
        const current = parseFloat(newCurrent) || 0;
        const target = parseFloat(goal.target) || 0;
        const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
        return { ...goal, current: newCurrent, progress };
      }
      return goal;
    }));
  };

  const getPriorityColor = (priority: string) => {
    const level = priorityLevels.find(l => l.value === priority);
    return level?.color || "bg-gray-100 text-gray-800";
  };

  const getCategoryIcon = (category: string) => {
    const cat = goalCategories.find(c => c.value === category);
    return cat?.icon || "🎯";
  };

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
              <CardDescription>Set and track your fitness goals to stay motivated</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add New Goal */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Create New Goal</h3>
              
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Lose 10 pounds"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={newGoal.category} onValueChange={(value) => setNewGoal({...newGoal, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {goalCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <span className="flex items-center space-x-2">
                          <span>{category.icon}</span>
                          <span>{category.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="current">Current *</Label>
                  <Input
                    id="current"
                    type="number"
                    placeholder="0"
                    value={newGoal.current}
                    onChange={(e) => setNewGoal({...newGoal, current: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="target">Target *</Label>
                  <Input
                    id="target"
                    type="number"
                    placeholder="0"
                    value={newGoal.target}
                    onChange={(e) => setNewGoal({...newGoal, target: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    placeholder="lbs"
                    value={newGoal.unit}
                    onChange={(e) => setNewGoal({...newGoal, unit: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Target Date</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newGoal.priority} onValueChange={(value) => setNewGoal({...newGoal, priority: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
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

            {/* Current Goals */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Active Goals</h3>
              
              {goals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No goals set yet. Create your first goal to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {goals.map((goal) => (
                    <Card key={goal.id} className="border-l-4 border-l-purple-500">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{getCategoryIcon(goal.category)}</span>
                              <h4 className="font-medium">{goal.title}</h4>
                              <Badge className={getPriorityColor(goal.priority)}>
                                {goal.priority}
                              </Badge>
                            </div>
                            
                            {goal.progress >= 100 && (
                              <Award className="h-5 w-5 text-yellow-500" />
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Progress: {goal.current} / {goal.target} {goal.unit}</span>
                              <span className="font-medium">{Math.round(goal.progress)}%</span>
                            </div>
                            <Progress value={goal.progress} className="h-2" />
                          </div>
                          
                          {goal.deadline && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Calendar className="h-3 w-3" />
                              <span>Target: {new Date(goal.deadline).toLocaleDateString()}</span>
                            </div>
                          )}
                          
                          {goal.description && (
                            <p className="text-sm text-gray-700">{goal.description}</p>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              placeholder="Update current"
                              className="flex-1"
                              onBlur={(e) => updateGoalProgress(goal.id, e.target.value)}
                            />
                            <Button size="sm" variant="outline">
                              <TrendingUp className="h-3 w-3" />
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
