import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertCircle, Play, Square, CheckCircle2, Clock, Dumbbell, Target, Plus, RotateCcw, Crown, Lock, TrendingUp, BarChart3, PieChart, LineChart, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { useSubscription } from "@/hooks/useSubscription";
import SubscriptionCard from "./SubscriptionCard";
import LockedFeature from "./LockedFeature";
import { useIsMobile } from "@/hooks/use-mobile";
import { useForm } from "react-hook-form";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  completed: boolean;
}

interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  duration_minutes: number;
  difficulty_level: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  scheduled_date: string;
  completed_date?: string;
  created_at: string;
}

const WorkoutPlan = () => {
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [activeTab, setActiveTab] = useState("generate");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [planToExtend, setPlanToExtend] = useState<WorkoutPlan | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { logActivity } = useActivityLogger();
  const { subscriptionInfo, hasAccess } = useSubscription();
  const isMobile = useIsMobile();

  const form = useForm({
    defaultValues: {
      additionalMinutes: ""
    }
  });

  useEffect(() => {
    if (user) {
      loadWorkoutPlans();
    }
  }, [user]);

  const normalizeWorkoutPlanData = (data: any): WorkoutPlan => {
    return {
      ...data,
      exercises: Array.isArray(data.exercises) 
        ? (data.exercises as unknown as Exercise[])
        : [],
      scheduled_date: data.scheduled_date || new Date().toISOString().split('T')[0],
      completed_date: data.completed_date || undefined,
      status: (data.status === 'scheduled' || data.status === 'in-progress' || data.status === 'completed') 
        ? data.status 
        : 'scheduled',
      description: data.description || '',
      difficulty_level: data.difficulty_level || 'beginner',
      duration_minutes: data.duration_minutes || 45
    };
  };

  const loadWorkoutPlans = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPlans: WorkoutPlan[] = (data || []).map(normalizeWorkoutPlanData);
      setWorkoutPlans(formattedPlans);
    } catch (error) {
      console.error('Error loading workout plans:', error);
      toast({
        title: "Error",
        description: "Failed to load workout plans. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkExistingPlanForToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return workoutPlans.some(plan => 
      plan.scheduled_date === today && plan.status === 'scheduled'
    );
  };

  const saveWorkoutPlan = async (planData: Omit<WorkoutPlan, 'id' | 'created_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .insert({
          user_id: user.id,
          name: planData.name,
          description: planData.description,
          exercises: planData.exercises as any,
          duration_minutes: planData.duration_minutes,
          difficulty_level: planData.difficulty_level,
          status: planData.status,
          scheduled_date: planData.scheduled_date,
          completed_date: planData.completed_date || null
        })
        .select()
        .single();

      if (error) throw error;

      const newPlan: WorkoutPlan = normalizeWorkoutPlanData(data);
      setWorkoutPlans(prev => [newPlan, ...prev]);
      await logActivity('plan_generated', `Generated new workout plan: ${planData.name}`);
      
      toast({
        title: "Success",
        description: "Workout plan saved successfully!",
      });

      return newPlan;
    } catch (error) {
      console.error('Error saving workout plan:', error);
      toast({
        title: "Error",
        description: "Failed to save workout plan. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateWorkoutPlan = async (planId: string, updates: Partial<WorkoutPlan>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .update({
          ...updates,
          exercises: updates.exercises as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedPlan: WorkoutPlan = normalizeWorkoutPlanData(data);

      setWorkoutPlans(prev => prev.map(plan => 
        plan.id === planId ? updatedPlan : plan
      ));

      if (currentWorkout && currentWorkout.id === planId) {
        setCurrentWorkout(updatedPlan);
      }

      return updatedPlan;
    } catch (error) {
      console.error('Error updating workout plan:', error);
      toast({
        title: "Error",
        description: "Failed to update workout plan. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteWorkoutPlan = async (planId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('workout_plans')
        .delete()
        .eq('id', planId)
        .eq('user_id', user.id);

      if (error) throw error;

      setWorkoutPlans(prev => prev.filter(plan => plan.id !== planId));
      
      toast({
        title: "Success",
        description: "Workout plan deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting workout plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete workout plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateAdditionalExercises = (additionalMinutes: number): Exercise[] => {
    const exercisePool = [
      { name: 'Burpees', sets: 2, reps: '8-10', rest: '90s' },
      { name: 'Mountain Climbers', sets: 2, reps: '20', rest: '45s' },
      { name: 'Jumping Jacks', sets: 3, reps: '15', rest: '30s' },
      { name: 'High Knees', sets: 2, reps: '30s', rest: '60s' },
      { name: 'Push-ups', sets: 2, reps: '10-12', rest: '60s' },
      { name: 'Squats', sets: 3, reps: '12-15', rest: '45s' },
      { name: 'Plank Hold', sets: 2, reps: '30-45s', rest: '60s' },
      { name: 'Lunges', sets: 2, reps: '10 each leg', rest: '45s' },
    ];

    // Roughly estimate 1 exercise per 7-8 minutes
    const exerciseCount = Math.max(1, Math.floor(additionalMinutes / 7));
    const selectedExercises: Exercise[] = [];

    for (let i = 0; i < exerciseCount; i++) {
      const randomIndex = Math.floor(Math.random() * exercisePool.length);
      const exercise = exercisePool[randomIndex];
      selectedExercises.push({
        ...exercise,
        completed: false
      });
    }

    return selectedExercises;
  };

  const handleExtendWorkout = (plan: WorkoutPlan) => {
    setPlanToExtend(plan);
    setShowExtendDialog(true);
  };

  const extendCompletedWorkout = async (additionalMinutes: number) => {
    if (!planToExtend) return;

    const additionalExercises = generateAdditionalExercises(additionalMinutes);
    const updatedExercises = [...planToExtend.exercises, ...additionalExercises];

    try {
      const updatedPlan = await updateWorkoutPlan(planToExtend.id, {
        exercises: updatedExercises,
        duration_minutes: planToExtend.duration_minutes + additionalMinutes,
        status: 'in-progress'
      });

      if (updatedPlan) {
        setCurrentWorkout(updatedPlan);
        setActiveTab("active");
        await logActivity('workout_created', `Extended completed workout: ${planToExtend.name} by ${additionalMinutes} minutes`);
        toast({
          title: "Workout Extended!",
          description: `Added ${additionalExercises.length} more exercises (${additionalMinutes} min) and moved to active workouts!`,
        });
      }
    } catch (error) {
      console.error('Error extending completed workout:', error);
      toast({
        title: "Error",
        description: "Failed to extend workout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowExtendDialog(false);
      setPlanToExtend(null);
      form.reset();
    }
  };

  const onExtendSubmit = (data: { additionalMinutes: string }) => {
    const minutes = parseInt(data.additionalMinutes);
    if (minutes && minutes > 0) {
      extendCompletedWorkout(minutes);
    }
  };

  const generateWorkout = async () => {
    if (!hasAccess()) {
      toast({
        title: "Subscription Required",
        description: "Please upgrade to Pro to generate AI workout plans.",
        variant: "destructive",
      });
      return;
    }

    if (checkExistingPlanForToday()) {
      toast({
        title: "Plan Already Exists",
        description: "You already have a workout plan scheduled for today. Complete or delete it first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const workoutTypes = ['Push Day', 'Pull Day', 'Leg Day', 'Full Body', 'HIIT', 'Cardio Blast'];
      const workoutType = workoutTypes[Math.floor(Math.random() * workoutTypes.length)];
      
      const exercises: Exercise[] = [
        { name: 'Push-ups', sets: 3, reps: '12-15', rest: '60s', completed: false },
        { name: 'Squats', sets: 3, reps: '15-20', rest: '60s', completed: false },
        { name: 'Plank', sets: 3, reps: '30-45s', rest: '30s', completed: false },
        { name: 'Lunges', sets: 2, reps: '10 each leg', rest: '45s', completed: false },
      ];

      const newPlan = await saveWorkoutPlan({
        name: workoutType,
        description: `AI-generated ${workoutType} workout tailored to your fitness level`,
        exercises,
        duration_minutes: 45,
        difficulty_level: 'beginner',
        status: 'scheduled',
        scheduled_date: new Date().toISOString().split('T')[0],
      });

      setActiveTab("scheduled");
    } catch (error) {
      console.error('Error generating workout:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const startWorkout = async (plan: WorkoutPlan) => {
    try {
      const updatedPlan = await updateWorkoutPlan(plan.id, { status: 'in-progress' });
      if (updatedPlan) {
        setCurrentWorkout(updatedPlan);
        setActiveTab("active");
        await logActivity('workout_created', `Started workout: ${plan.name}`);
        toast({
          title: "Workout Started!",
          description: `${plan.name} is now in progress.`,
        });
      }
    } catch (error) {
      console.error('Error starting workout:', error);
      toast({
        title: "Error",
        description: "Failed to start workout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const completeExercise = async (exerciseIndex: number) => {
    if (!currentWorkout) return;

    const updatedExercises = [...currentWorkout.exercises];
    updatedExercises[exerciseIndex].completed = true;

    try {
      const updatedPlan = await updateWorkoutPlan(currentWorkout.id, {
        exercises: updatedExercises
      });
      
      if (updatedPlan) {
        toast({
          title: "Exercise Completed!",
          description: `Great job on ${updatedExercises[exerciseIndex].name}!`,
        });
      }
    } catch (error) {
      console.error('Error completing exercise:', error);
    }
  };

  const extendWorkout = async () => {
    if (!currentWorkout) return;

    const additionalExercises: Exercise[] = [
      { name: 'Burpees', sets: 2, reps: '8-10', rest: '90s', completed: false },
      { name: 'Mountain Climbers', sets: 2, reps: '20', rest: '45s', completed: false },
    ];

    const updatedExercises = [...currentWorkout.exercises, ...additionalExercises];

    try {
      const updatedPlan = await updateWorkoutPlan(currentWorkout.id, {
        exercises: updatedExercises,
        duration_minutes: currentWorkout.duration_minutes + 15
      });

      if (updatedPlan) {
        toast({
          title: "Workout Extended!",
          description: "Added 2 more exercises to keep you going!",
        });
      }
    } catch (error) {
      console.error('Error extending workout:', error);
    }
  };

  const completeWorkout = async () => {
    if (!currentWorkout) return;

    try {
      const updatedPlan = await updateWorkoutPlan(currentWorkout.id, {
        status: 'completed',
        completed_date: new Date().toISOString().split('T')[0]
      });

      if (updatedPlan) {
        setCurrentWorkout(null);
        setActiveTab("completed");
        await logActivity('workout_completed', `Completed workout: ${currentWorkout.name}`);
        toast({
          title: "Workout Complete!",
          description: "Congratulations on finishing your workout!",
        });
      }
    } catch (error) {
      console.error('Error completing workout:', error);
    }
  };

  const getProgress = (exercises: Exercise[]) => {
    const completed = exercises.filter(ex => ex.completed).length;
    return (completed / exercises.length) * 100;
  };

  const scheduledPlans = workoutPlans.filter(plan => plan.status === 'scheduled');
  const activePlans = workoutPlans.filter(plan => plan.status === 'in-progress');
  const completedPlans = workoutPlans.filter(plan => plan.status === 'completed');

  const handleUpgradeClick = () => {
    window.dispatchEvent(new CustomEvent('upgrade-to-pro'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const todayHasPlan = checkExistingPlanForToday();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workout Plans</h1>
          <p className="text-gray-600 mt-1">AI-powered workout generation and analytics</p>
        </div>
        {hasAccess() && (
          <SubscriptionCard hasAccess={true} onUpgrade={handleUpgradeClick} compact={true} />
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`${isMobile ? 'grid grid-cols-2 grid-rows-2 h-auto p-1 gap-1' : 'grid grid-cols-4'} w-full bg-gray-100`}>
          <TabsTrigger 
            value="generate" 
            className={`flex items-center ${isMobile ? 'justify-center px-2 py-2 text-xs' : 'space-x-2'}`}
          >
            <Target className="h-4 w-4" />
            {!isMobile && <span>Generate</span>}
            {isMobile && <span className="ml-1">Generate</span>}
            {!hasAccess() && <Crown className="h-3 w-3 text-yellow-500 ml-1" />}
          </TabsTrigger>
          <TabsTrigger 
            value="scheduled" 
            className={`flex items-center ${isMobile ? 'justify-center px-2 py-2 text-xs' : 'space-x-2'}`}
          >
            <Clock className="h-4 w-4" />
            {isMobile ? (
              <span className="ml-1">Scheduled</span>
            ) : (
              <span>Scheduled ({scheduledPlans.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="active" 
            className={`flex items-center ${isMobile ? 'justify-center px-2 py-2 text-xs' : 'space-x-2'}`}
          >
            <Dumbbell className="h-4 w-4" />
            {isMobile ? (
              <span className="ml-1">Active</span>
            ) : (
              <span>Active ({activePlans.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className={`flex items-center ${isMobile ? 'justify-center px-2 py-2 text-xs' : 'space-x-2'}`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {isMobile ? (
              <span className="ml-1">Done</span>
            ) : (
              <span>Completed ({completedPlans.length})</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <div className="space-y-6">
            {!hasAccess() ? (
              <LockedFeature
                title="AI Workout Generation"
                description="Get personalized workout plans based on your profile and goals"
                icon={<Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />}
                onUpgrade={handleUpgradeClick}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span>Generate New Workout</span>
                  </CardTitle>
                  <CardDescription>
                    Get a personalized workout plan based on your profile and goals
                  </CardDescription>
                  {todayHasPlan && (
                    <div className="flex items-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-700">
                        You already have a workout plan for today. Complete or delete it first.
                      </span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={generateWorkout} 
                    disabled={isGenerating || todayHasPlan}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating Workout...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Generate Workout Plan
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {!hasAccess() ? (
              <LockedFeature
                title="AI Insights & Analytics"
                description="Get personalized analytics and recommendations"
                icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />}
                onUpgrade={handleUpgradeClick}
              />
            ) : (
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-500 p-2 rounded-lg">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg sm:text-xl">AI Insights</CardTitle>
                      <CardDescription className="text-sm">
                        Personalized analytics and recommendations
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="grid grid-cols-3 gap-4 mb-6 opacity-30">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-lg">
                          <BarChart3 className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-xs text-gray-500">Progress</div>
                      </div>
                      <div className="flex flex-col items-center space-y-2">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-lg">
                          <PieChart className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-xs text-gray-500">Analysis</div>
                      </div>
                      <div className="flex flex-col items-center space-y-2">
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-lg">
                          <LineChart className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-xs text-gray-500">Trends</div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-6 border border-blue-200 shadow-sm">
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Coming Soon</h3>
                      <p className="text-gray-600 mb-4">
                        AI-powered insights to help you understand your fitness journey better
                      </p>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>• Workout performance analytics</p>
                        <p>• Goal achievement predictions</p>
                        <p>• Personalized recommendations</p>
                        <p>• Progress tracking & trends</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="scheduled">
          <div className="space-y-4">
            {scheduledPlans.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No scheduled workouts</p>
                  <p className="text-sm text-gray-500 mt-2">Generate a new workout to get started!</p>
                </CardContent>
              </Card>
            ) : (
              scheduledPlans.map((plan) => (
                <Card key={plan.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{plan.difficulty_level}</Badge>
                        <Button
                          onClick={() => deleteWorkoutPlan(plan.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {plan.duration_minutes}min
                        </span>
                        <span className="flex items-center">
                          <Dumbbell className="h-4 w-4 mr-1" />
                          {plan.exercises.length} exercises
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      {plan.exercises.slice(0, 3).map((exercise, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{exercise.name}</span>
                          <span className="text-gray-500">{exercise.sets} × {exercise.reps}</span>
                        </div>
                      ))}
                      {plan.exercises.length > 3 && (
                        <p className="text-sm text-gray-500">+{plan.exercises.length - 3} more exercises</p>
                      )}
                    </div>
                    <Button onClick={() => startWorkout(plan)} className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Start Workout
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="active">
          <div className="space-y-4">
            {currentWorkout ? (
              <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl text-blue-800">{currentWorkout.name}</CardTitle>
                      <CardDescription className="text-blue-600">{currentWorkout.description}</CardDescription>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                      <span className="text-sm text-gray-600">
                        {currentWorkout.exercises.filter(ex => ex.completed).length} / {currentWorkout.exercises.length}
                      </span>
                    </div>
                    <Progress value={getProgress(currentWorkout.exercises)} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    {currentWorkout.exercises.map((exercise, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-lg border ${
                          exercise.completed 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className={`font-medium ${exercise.completed ? 'text-green-800 line-through' : 'text-gray-800'}`}>
                              {exercise.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {exercise.sets} sets × {exercise.reps} | Rest: {exercise.rest}
                            </p>
                          </div>
                          <Button
                            onClick={() => completeExercise(idx)}
                            disabled={exercise.completed}
                            variant={exercise.completed ? "secondary" : "default"}
                            size="sm"
                          >
                            {exercise.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              "Complete"
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button onClick={extendWorkout} variant="outline" className="flex-1">
                      <Plus className="h-4 w-4 mr-2" />
                      Extend Workout
                    </Button>
                    <Button 
                      onClick={completeWorkout}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Complete Workout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : activePlans.length > 0 ? (
              activePlans.map((plan) => (
                <Card key={plan.id} className="border-blue-200">
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setCurrentWorkout(plan)} className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Resume Workout
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No active workouts</p>
                  <p className="text-sm text-gray-500 mt-2">Start a scheduled workout to begin tracking!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="space-y-4">
            {completedPlans.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No completed workouts yet</p>
                  <p className="text-sm text-gray-500 mt-2">Complete your first workout to see it here!</p>
                </CardContent>
              </Card>
            ) : (
              completedPlans.map((plan) => (
                <Card key={plan.id} className="border-green-200 bg-green-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-green-800">{plan.name}</CardTitle>
                        <CardDescription className="text-green-600">
                          Completed on {new Date(plan.completed_date!).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                        <Button
                          onClick={() => deleteWorkoutPlan(plan.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 text-sm text-green-700 mb-4">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {plan.duration_minutes}min
                      </span>
                      <span className="flex items-center">
                        <Dumbbell className="h-4 w-4 mr-1" />
                        {plan.exercises.length} exercises
                      </span>
                    </div>
                    <Button 
                      onClick={() => handleExtendWorkout(plan)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Extend & Restart Workout
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Extend Workout Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Extend Workout</DialogTitle>
            <DialogDescription>
              How many additional minutes would you like to add to your workout?
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onExtendSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="additionalMinutes"
                rules={{
                  required: "Please enter the number of minutes",
                  min: { value: 1, message: "Must be at least 1 minute" },
                  max: { value: 120, message: "Cannot exceed 120 minutes" }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Minutes</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 15"
                        min="1"
                        max="120"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowExtendDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Extend Workout
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkoutPlan;
