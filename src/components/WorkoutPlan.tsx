
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, Play, CheckCircle, RotateCcw, Calendar, Zap, Plus, History, RefreshCw, AlertTriangle, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActivity } from "@/contexts/ActivityContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
  completed: boolean;
}

interface Workout {
  id: string;
  name: string;
  duration: number;
  difficulty: string;
  focus: string[];
  exercises: Exercise[];
  date: string;
  status: "scheduled" | "in-progress" | "completed";
  generatedAt: string;
  basedOnData?: {
    recentWorkouts: number;
    activeInjuries: number;
    activeGoals: number;
  };
}

const WorkoutPlan = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { logActivity } = useActivity();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [activeInjuries, setActiveInjuries] = useState<any[]>([]);
  const [activeGoals, setActiveGoals] = useState<any[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [extendTime, setExtendTime] = useState<string>("");
  const [extendingWorkout, setExtendingWorkout] = useState<string | null>(null);

  // Load user data from Supabase
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      // Load profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      // Load recent workouts (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: workoutsData } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user?.id)
        .gte('workout_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('workout_date', { ascending: false });

      // Load active injuries
      const { data: injuriesData } = await supabase
        .from('injuries')
        .select('*')
        .eq('user_id', user?.id)
        .in('status', ['active', 'recovering']);

      // Load active goals
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active');

      setUserProfile(profile);
      setRecentWorkouts(workoutsData || []);
      setActiveInjuries(injuriesData || []);
      setActiveGoals(goalsData || []);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load workouts from localStorage
  useEffect(() => {
    const savedWorkouts = localStorage.getItem('workoutPlans');
    if (savedWorkouts) {
      setWorkouts(JSON.parse(savedWorkouts));
    }
  }, []);

  // Save workouts to localStorage whenever workouts change
  useEffect(() => {
    localStorage.setItem('workoutPlans', JSON.stringify(workouts));
  }, [workouts]);

  const generateIntelligentWorkout = async (isRegenerate = false, forceGenerate = false) => {
    if (generating) return;
    
    setGenerating(true);

    // Check if user profile exists and has basic information
    if (!userProfile || !userProfile.fitness_level) {
      toast({
        title: "Profile Required",
        description: "Please complete your profile first to generate personalized workouts.",
        variant: "destructive"
      });
      setGenerating(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const existingTodayWorkout = workouts.find(w => w.date === today);
    const completedTodayWorkout = workouts.find(w => w.date === today && w.status === 'completed');
    
    // Check if there's a completed workout today and we're not forcing generation
    if (completedTodayWorkout && !isRegenerate && !forceGenerate) {
      setShowConfirmation(true);
      setGenerating(false);
      return;
    }

    if (existingTodayWorkout && !isRegenerate && !forceGenerate) {
      toast({
        title: "Today's Workout Exists",
        description: "You already have a workout plan for today. Use regenerate to create a new one.",
        variant: "destructive"
      });
      setGenerating(false);
      return;
    }

    try {
      const maxTime = parseInt(userProfile.max_workout_time) || 60;
      const fitnessLevel = userProfile.fitness_level || 'intermediate';
      const limitations = userProfile.limitations || '';
      
      // Analyze recent workout patterns - include completed workouts from localStorage
      const allRecentWorkouts = [...recentWorkouts];
      const completedLocalWorkouts = workouts.filter(w => w.status === 'completed' && w.date >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      allRecentWorkouts.push(...completedLocalWorkouts.map(w => ({ name: w.name, workout_date: w.date })));
      
      const recentWorkoutTypes = allRecentWorkouts.map(w => w.name.toLowerCase());
      const workoutFrequency = allRecentWorkouts.length;
      
      // Get muscle groups worked recently
      const recentMuscleGroups = [];
      allRecentWorkouts.slice(0, 7).forEach(workout => {
        if (workout.name.toLowerCase().includes('chest') || workout.name.toLowerCase().includes('push')) {
          recentMuscleGroups.push('chest', 'shoulders', 'triceps');
        }
        if (workout.name.toLowerCase().includes('back') || workout.name.toLowerCase().includes('pull')) {
          recentMuscleGroups.push('back', 'biceps');
        }
        if (workout.name.toLowerCase().includes('leg') || workout.name.toLowerCase().includes('squat')) {
          recentMuscleGroups.push('legs', 'glutes');
        }
      });

      let workoutType;
      let focus: string[] = [];
      let exercises: Exercise[] = [];
      let duration = Math.min(maxTime, 45);

      // Smart workout selection logic
      if (recentMuscleGroups.filter(g => g === 'chest').length >= 2) {
        workoutType = recentMuscleGroups.filter(g => g === 'legs').length >= 2 ? 'Upper Back & Core' : 'Lower Body Strength';
      } else if (recentMuscleGroups.filter(g => g === 'legs').length >= 2) {
        workoutType = 'Upper Body Push';
      } else if (workoutFrequency >= 4) {
        workoutType = 'Active Recovery & Flexibility';
      } else {
        const types = ['Full Body Circuit', 'Upper Body Strength', 'Lower Body Power', 'Core & Cardio'];
        workoutType = types[Math.floor(Math.random() * types.length)];
      }

      // Account for injuries
      const hasBackIssues = activeInjuries.some(i => i.name.toLowerCase().includes('back')) || 
                           limitations.toLowerCase().includes('back');
      const hasKneeIssues = activeInjuries.some(i => i.name.toLowerCase().includes('knee')) || 
                           limitations.toLowerCase().includes('knee');
      const hasShoulderIssues = activeInjuries.some(i => i.name.toLowerCase().includes('shoulder')) || 
                               limitations.toLowerCase().includes('shoulder');

      // Generate exercises based on workout type and limitations
      switch (workoutType) {
        case 'Upper Body Push':
          focus = ['Chest', 'Shoulders', 'Triceps'];
          exercises = [
            { 
              name: hasShoulderIssues ? 'Wall Push-ups' : (hasBackIssues ? 'Incline Push-ups' : 'Push-ups'), 
              sets: 3, reps: '10-12', rest: '60s', completed: false,
              notes: hasShoulderIssues || hasBackIssues ? 'Modified for injury safety' : ''
            },
            { 
              name: hasShoulderIssues ? 'Light Lateral Raises' : 'Shoulder Press', 
              sets: 3, reps: '8-10', rest: '90s', completed: false 
            },
            { name: 'Tricep Dips', sets: 3, reps: '8-12', rest: '60s', completed: false },
            { name: 'Chest Fly (Light)', sets: 2, reps: '12-15', rest: '60s', completed: false }
          ];
          break;

        case 'Lower Body Power':
          focus = ['Legs', 'Glutes'];
          exercises = [
            { 
              name: hasKneeIssues ? 'Wall Sits' : 'Bodyweight Squats', 
              sets: 3, reps: hasKneeIssues ? '30-45s' : '12-15', rest: '90s', completed: false,
              notes: hasKneeIssues ? 'Modified for knee safety' : ''
            },
            { name: 'Glute Bridges', sets: 3, reps: '15-20', rest: '60s', completed: false },
            { 
              name: hasKneeIssues ? 'Standing Calf Raises' : 'Reverse Lunges', 
              sets: 3, reps: '10 each leg', rest: '60s', completed: false 
            },
            { 
              name: 'Single Leg Deadlifts', sets: 2, reps: '8 each leg', rest: '90s', completed: false,
              notes: hasBackIssues ? 'Use light weight or bodyweight only' : ''
            }
          ];
          break;

        case 'Active Recovery & Flexibility':
          focus = ['Recovery', 'Flexibility'];
          duration = Math.min(maxTime, 30);
          exercises = [
            { name: 'Gentle Stretching Routine', sets: 1, reps: '10 min', rest: '0s', completed: false },
            { name: 'Foam Rolling', sets: 1, reps: '5 min', rest: '0s', completed: false },
            { name: 'Deep Breathing', sets: 3, reps: '2 min', rest: '30s', completed: false },
            { name: 'Light Walking', sets: 1, reps: '10 min', rest: '0s', completed: false }
          ];
          break;

        case 'Upper Back & Core':
          focus = ['Back', 'Core'];
          exercises = [
            { name: 'Band Pull-Aparts', sets: 3, reps: '15-20', rest: '45s', completed: false },
            { 
              name: hasBackIssues ? 'Modified Plank' : 'Plank', 
              sets: 3, reps: hasBackIssues ? '20-30s' : '30-60s', rest: '60s', completed: false 
            },
            { name: 'Reverse Fly', sets: 3, reps: '12-15', rest: '60s', completed: false },
            { name: 'Dead Bug', sets: 2, reps: '10 each side', rest: '45s', completed: false }
          ];
          break;

        default: // Full Body Circuit
          focus = ['Full Body'];
          exercises = [
            { name: 'Jumping Jacks', sets: 3, reps: '30s', rest: '30s', completed: false },
            { 
              name: hasBackIssues ? 'Modified Burpees' : 'Burpees', 
              sets: 2, reps: '5-8', rest: '90s', completed: false 
            },
            { name: 'Mountain Climbers', sets: 3, reps: '30s', rest: '30s', completed: false },
            { name: 'Bodyweight Squats', sets: 3, reps: '12-15', rest: '60s', completed: false }
          ];
      }

      // Adjust duration based on fitness level
      if (fitnessLevel === 'beginner') {
        duration = Math.min(maxTime, 25);
      } else if (fitnessLevel === 'advanced' || fitnessLevel === 'expert') {
        duration = Math.min(maxTime, 60);
      }

      const newWorkout: Workout = {
        id: `workout_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: `${workoutType} - ${new Date().toLocaleDateString()}`,
        duration,
        difficulty: fitnessLevel,
        focus,
        exercises,
        date: today,
        status: 'scheduled',
        generatedAt: new Date().toISOString(),
        basedOnData: {
          recentWorkouts: allRecentWorkouts.length,
          activeInjuries: activeInjuries.length,
          activeGoals: activeGoals.length
        }
      };

      // Remove existing workout for today if regenerating
      if ((isRegenerate || forceGenerate) && existingTodayWorkout) {
        setWorkouts(prev => prev.filter(w => w.id !== existingTodayWorkout.id));
      }

      setWorkouts(prev => [...prev, newWorkout]);

      // Log activity
      await logActivity(
        'plan_generated',
        `Generated ${workoutType.toLowerCase()} workout plan`,
        { 
          workoutType,
          duration,
          basedOnRecentWorkouts: allRecentWorkouts.length,
          consideredInjuries: activeInjuries.length,
          isRegenerate: isRegenerate || forceGenerate
        }
      );
      
      toast({
        title: isRegenerate || forceGenerate ? "Workout Regenerated!" : "Smart Workout Generated!",
        description: `A ${duration}-minute ${workoutType.toLowerCase()} workout based on your recent activity and goals.`,
      });

      setShowConfirmation(false);
    } catch (error) {
      console.error('Error generating workout:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate workout plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirmGeneration = () => {
    setShowConfirmation(false);
    generateIntelligentWorkout(false, true);
  };

  const extendWorkout = async (workoutId: string) => {
    if (!extendTime || isNaN(parseInt(extendTime))) {
      toast({
        title: "Invalid Time",
        description: "Please enter a valid number of minutes to extend.",
        variant: "destructive"
      });
      return;
    }

    const additionalMinutes = parseInt(extendTime);
    const workout = workouts.find(w => w.id === workoutId);
    
    if (!workout) return;

    // Generate additional exercises based on the additional time
    const additionalExercises: Exercise[] = [];
    const baseExerciseCount = Math.floor(additionalMinutes / 10); // Roughly 10 minutes per exercise
    
    // Simple exercise pool for extensions
    const exercisePool = [
      { name: 'Light Cardio', sets: 1, reps: `${Math.min(additionalMinutes, 15)} min`, rest: '0s' },
      { name: 'Core Finisher', sets: 2, reps: '15-20', rest: '45s' },
      { name: 'Stretching', sets: 1, reps: `${Math.min(additionalMinutes / 2, 10)} min`, rest: '0s' },
      { name: 'Bodyweight Squats', sets: 2, reps: '10-15', rest: '60s' },
      { name: 'Push-ups', sets: 2, reps: '8-12', rest: '60s' },
      { name: 'Plank Hold', sets: 2, reps: '30-45s', rest: '60s' }
    ];

    // Add exercises based on available time
    if (additionalMinutes >= 5) {
      for (let i = 0; i < Math.min(baseExerciseCount + 1, 3); i++) {
        const exercise = exercisePool[i % exercisePool.length];
        additionalExercises.push({
          ...exercise,
          completed: false,
          notes: 'Extended workout exercise'
        });
      }
    }

    // Update the workout
    setWorkouts(prev => prev.map(w => {
      if (w.id === workoutId) {
        return {
          ...w,
          duration: w.duration + additionalMinutes,
          exercises: [...w.exercises, ...additionalExercises],
          status: 'in-progress' as const
        };
      }
      return w;
    }));

    setActiveWorkout(workoutId);
    setExtendingWorkout(null);
    setExtendTime("");

    await logActivity('workout_created', `Extended workout by ${additionalMinutes} minutes`, {
      workoutId,
      additionalMinutes,
      addedExercises: additionalExercises.length
    });

    toast({
      title: "Workout Extended!",
      description: `Added ${additionalMinutes} minutes and ${additionalExercises.length} exercises. Workout is now active.`,
    });
  };

  const startWorkout = async (workoutId: string) => {
    setActiveWorkout(workoutId);
    setWorkouts(workouts.map(w => 
      w.id === workoutId ? { ...w, status: "in-progress" as const } : w
    ));
    
    await logActivity('workout_created', 'Started workout session');
    
    toast({
      title: "Workout Started!",
      description: "Good luck with your training session!",
    });
  };

  const completeExercise = (workoutId: string, exerciseIndex: number) => {
    setWorkouts(workouts.map(workout => {
      if (workout.id === workoutId) {
        const updatedExercises = [...workout.exercises];
        updatedExercises[exerciseIndex].completed = !updatedExercises[exerciseIndex].completed;
        return { ...workout, exercises: updatedExercises };
      }
      return workout;
    }));
  };

  const finishWorkout = async (workoutId: string) => {
    const workout = workouts.find(w => w.id === workoutId);
    setWorkouts(workouts.map(w => 
      w.id === workoutId ? { ...w, status: "completed" as const } : w
    ));
    setActiveWorkout(null);

    // Save completed workout to Supabase
    if (workout && user) {
      try {
        await supabase.from('workouts').insert({
          user_id: user.id,
          name: workout.name,
          duration_minutes: workout.duration,
          workout_date: workout.date,
          notes: `Completed: ${workout.exercises.filter(e => e.completed).length}/${workout.exercises.length} exercises`
        });

        await logActivity('workout_completed', `Completed ${workout.name}`, {
          workoutName: workout.name,
          duration: workout.duration,
          completedExercises: workout.exercises.filter(e => e.completed).length
        });
      } catch (error) {
        console.error('Error saving workout:', error);
      }
    }
    
    toast({
      title: "Workout Completed!",
      description: "Great job! Your progress has been saved.",
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getWorkoutProgress = (workout: Workout) => {
    const completedExercises = workout.exercises.filter(e => e.completed).length;
    return (completedExercises / workout.exercises.length) * 100;
  };

  // Get workouts by status and date
  const todaysWorkouts = workouts.filter(w => w.date === new Date().toISOString().split('T')[0]);
  const previousWorkouts = workouts.filter(w => w.date < new Date().toISOString().split('T')[0]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Confirmation Dialog */}
      {showConfirmation && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex flex-col space-y-3">
            <span>You've already completed a workout today. Generate a new plan anyway?</span>
            <div className="flex space-x-2">
              <Button 
                onClick={handleConfirmGeneration}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600"
              >
                Yes, Generate New Plan
              </Button>
              <Button 
                onClick={() => setShowConfirmation(false)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-green-600 to-blue-500 p-2 rounded-lg">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl">AI Workout Plans</CardTitle>
                <CardDescription className="text-sm">
                  Smart workouts based on your history, injuries, and goals
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={() => generateIntelligentWorkout(false)}
              disabled={generating}
              className="bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600"
              size="sm"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 sm:mr-2 animate-spin" />
                  <span className="hidden sm:inline">Generating...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Generate</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Data Overview Card */}
      {(recentWorkouts.length > 0 || activeInjuries.length > 0 || activeGoals.length > 0) && (
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
          <CardHeader className="px-4 sm:px-6 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Your Data Overview</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pt-0">
            <div className="flex flex-wrap gap-2">
              {recentWorkouts.length > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <History className="h-3 w-3 mr-1" />
                  {recentWorkouts.length} recent workouts
                </Badge>
              )}
              {activeInjuries.length > 0 && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {activeInjuries.length} active injuries
                </Badge>
              )}
              {activeGoals.length > 0 && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Zap className="h-3 w-3 mr-1" />
                  {activeGoals.length} active goals
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="today" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {todaysWorkouts.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent className="px-4 sm:px-6">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
                <p className="text-gray-500 mb-4">No workout planned for today</p>
                <Button 
                  onClick={() => generateIntelligentWorkout(false)} 
                  disabled={generating}
                  className="bg-gradient-to-r from-green-600 to-blue-500"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating Smart Workout...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Smart Workout
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            todaysWorkouts.map((workout) => (
              <Card key={workout.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="px-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                        <span>{workout.name}</span>
                        <Badge className={getDifficultyColor(workout.difficulty)}>
                          {workout.difficulty}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-4 mt-2 text-xs sm:text-sm">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{workout.duration} min</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Today</span>
                        </span>
                        {workout.basedOnData && (
                          <span className="text-blue-600 text-xs">
                            Based on your data
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      {workout.status === 'scheduled' && (
                        <>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Extend</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Extend Workout</DialogTitle>
                                <DialogDescription>
                                  Add additional time to your workout. This will add extra exercises and mark the workout as active.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <label htmlFor="extend-time" className="text-right text-sm font-medium">
                                    Minutes
                                  </label>
                                  <Input
                                    id="extend-time"
                                    type="number"
                                    placeholder="15"
                                    value={extendTime}
                                    onChange={(e) => setExtendTime(e.target.value)}
                                    className="col-span-3"
                                    min="5"
                                    max="60"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={() => extendWorkout(workout.id)}
                                  className="bg-gradient-to-r from-green-600 to-blue-500"
                                  disabled={!extendTime || isNaN(parseInt(extendTime))}
                                >
                                  Extend & Start Workout
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            onClick={() => generateIntelligentWorkout(true)}
                            disabled={generating}
                            variant="outline" 
                            size="sm"
                          >
                            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${generating ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Regenerate</span>
                          </Button>
                          <Button onClick={() => startWorkout(workout.id)} className="bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600" size="sm">
                            <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Start</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {workout.focus.map((focus) => (
                        <Badge key={focus} variant="secondary" className="text-xs">{focus}</Badge>
                      ))}
                    </div>
                    
                    {workout.basedOnData && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-blue-700 font-medium mb-1">Generated using:</p>
                        <div className="flex flex-wrap gap-2 text-xs text-blue-600">
                          <span>• {workout.basedOnData.recentWorkouts} recent workouts</span>
                          {workout.basedOnData.activeInjuries > 0 && (
                            <span>• {workout.basedOnData.activeInjuries} injury considerations</span>
                          )}
                          {workout.basedOnData.activeGoals > 0 && (
                            <span>• {workout.basedOnData.activeGoals} active goals</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm sm:text-base">Exercises</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {workout.exercises.map((exercise, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <span className="text-xs sm:text-sm font-medium">{exercise.name}</span>
                              {exercise.notes && (
                                <p className="text-xs text-blue-600 mt-1">💡 {exercise.notes}</p>
                              )}
                            </div>
                            <span className="text-xs text-gray-600">{exercise.sets} × {exercise.reps}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {workouts.filter(w => w.status === "in-progress").map((workout) => (
            <Card key={workout.id} className="border-l-4 border-l-orange-500">
              <CardHeader className="px-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                      <span>{workout.name}</span>
                      <Badge className="bg-orange-100 text-orange-800">In Progress</Badge>
                    </CardTitle>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                        <span>Progress</span>
                        <span>{Math.round(getWorkoutProgress(workout))}%</span>
                      </div>
                      <Progress value={getWorkoutProgress(workout)} className="h-2" />
                    </div>
                  </div>
                  <Button onClick={() => finishWorkout(workout.id)} variant="outline" size="sm">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Finish</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="space-y-3">
                  {workout.exercises.map((exercise, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${exercise.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center space-x-3">
                        <Button
                          size="sm"
                          variant={exercise.completed ? "default" : "outline"}
                          onClick={() => completeExercise(workout.id, index)}
                          className={exercise.completed ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <div className="flex-1">
                          <h5 className={`font-medium text-sm sm:text-base ${exercise.completed ? 'line-through text-gray-600' : ''}`}>
                            {exercise.name}
                          </h5>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {exercise.sets} sets × {exercise.reps} | Rest: {exercise.rest}
                          </p>
                          {exercise.notes && (
                            <p className="text-xs text-blue-600 mt-1">💡 {exercise.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {workouts.filter(w => w.status === "in-progress").length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active workouts. Start a scheduled workout to begin training!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {previousWorkouts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No previous workouts yet. Complete your first workout to see history!</p>
            </div>
          ) : (
            previousWorkouts.map((workout) => (
              <Card key={workout.id} className={`border-l-4 ${workout.status === 'completed' ? 'border-l-green-500' : 'border-l-gray-300'}`}>
                <CardHeader className="px-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                        <span>{workout.name}</span>
                        <Badge className={workout.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {workout.status === 'completed' ? 'Completed' : 'Missed'}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-4 mt-2 text-xs sm:text-sm">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{new Date(workout.date).toLocaleDateString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{workout.duration} min</span>
                        </span>
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Repeat</span>
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {workouts.filter(w => w.status === "completed").map((workout) => (
            <Card key={workout.id} className="border-l-4 border-l-green-500">
              <CardHeader className="px-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                      <span>{workout.name}</span>
                      <Badge className="bg-green-100 text-green-800">Completed</Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-4 mt-2 text-xs sm:text-sm">
                      <span className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                        <span>100% Complete</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{new Date(workout.date).toLocaleDateString()}</span>
                      </span>
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Repeat</span>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
          
          {workouts.filter(w => w.status === "completed").length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No completed workouts yet. Finish your first workout to see it here!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkoutPlan;
