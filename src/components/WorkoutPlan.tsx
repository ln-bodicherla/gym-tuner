import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Play, CheckCircle, RotateCcw, Calendar, Zap, Plus, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
}

const WorkoutPlan = () => {
  const { toast } = useToast();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Load user profile and workouts on component mount
  useEffect(() => {
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      setUserProfile(JSON.parse(profile));
    }

    const savedWorkouts = localStorage.getItem('workoutPlans');
    if (savedWorkouts) {
      setWorkouts(JSON.parse(savedWorkouts));
    }
  }, []);

  // Save workouts to localStorage whenever workouts change
  useEffect(() => {
    localStorage.setItem('workoutPlans', JSON.stringify(workouts));
  }, [workouts]);

  const generateDailyWorkout = () => {
    if (!userProfile) {
      toast({
        title: "Profile Required",
        description: "Please complete your profile first to generate personalized workouts.",
        variant: "destructive"
      });
      return;
    }

    const maxTime = parseInt(userProfile.maxWorkoutTime) || 60;
    const fitnessLevel = userProfile.fitnessLevel || 'intermediate';
    const limitations = userProfile.limitations || '';
    
    // Check if there's already a workout for today
    const today = new Date().toISOString().split('T')[0];
    const existingTodayWorkout = workouts.find(w => w.date === today);
    
    if (existingTodayWorkout) {
      toast({
        title: "Today's Workout Exists",
        description: "You already have a workout plan for today. Complete it or wait for tomorrow.",
        variant: "destructive"
      });
      return;
    }

    // Generate workout based on user profile
    const workoutTypes = ['Upper Body Strength', 'Lower Body Power', 'Full Body Circuit', 'Core & Cardio', 'Flexibility & Recovery'];
    const randomType = workoutTypes[Math.floor(Math.random() * workoutTypes.length)];
    
    let exercises: Exercise[] = [];
    let focus: string[] = [];
    let duration = Math.min(maxTime, 45); // Default to 45 min or user's max

    // Adjust workout based on limitations
    const hasBackIssues = limitations.toLowerCase().includes('back');
    const hasKneeIssues = limitations.toLowerCase().includes('knee');

    switch (randomType) {
      case 'Upper Body Strength':
        focus = ['Chest', 'Back', 'Shoulders', 'Arms'];
        exercises = [
          { name: hasBackIssues ? 'Push-ups (Modified)' : 'Push-ups', sets: 3, reps: '10-12', rest: '60s', completed: false, notes: hasBackIssues ? 'Modified for back safety' : '' },
          { name: 'Dumbbell Rows', sets: 3, reps: '10-12', rest: '90s', completed: false },
          { name: 'Shoulder Press', sets: 3, reps: '8-10', rest: '90s', completed: false },
          { name: 'Bicep Curls', sets: 2, reps: '12-15', rest: '60s', completed: false },
          { name: 'Tricep Dips', sets: 2, reps: '10-12', rest: '60s', completed: false }
        ];
        break;
      case 'Lower Body Power':
        focus = ['Legs', 'Glutes'];
        exercises = [
          { name: hasKneeIssues ? 'Wall Sits' : 'Squats', sets: 3, reps: hasKneeIssues ? '30-45s' : '12-15', rest: '90s', completed: false, notes: hasKneeIssues ? 'Modified for knee safety' : '' },
          { name: 'Glute Bridges', sets: 3, reps: '15-20', rest: '60s', completed: false },
          { name: hasKneeIssues ? 'Calf Raises' : 'Lunges', sets: 3, reps: '10 each leg', rest: '60s', completed: false },
          { name: 'Deadlifts (Light)', sets: 2, reps: '8-10', rest: '90s', completed: false, notes: hasBackIssues ? 'Use very light weight' : '' }
        ];
        break;
      default:
        focus = ['Full Body'];
        exercises = [
          { name: 'Jumping Jacks', sets: 3, reps: '30s', rest: '30s', completed: false },
          { name: hasBackIssues ? 'Modified Burpees' : 'Burpees', sets: 2, reps: '5-8', rest: '90s', completed: false },
          { name: 'Mountain Climbers', sets: 3, reps: '30s', rest: '30s', completed: false },
          { name: 'Plank', sets: 3, reps: '30-45s', rest: '60s', completed: false }
        ];
    }

    // Adjust duration based on fitness level
    if (fitnessLevel === 'beginner') {
      duration = Math.min(maxTime, 30);
    } else if (fitnessLevel === 'advanced' || fitnessLevel === 'expert') {
      duration = Math.min(maxTime, 60);
    }

    const newWorkout: Workout = {
      id: `workout_${Date.now()}`,
      name: `${randomType} - ${new Date().toLocaleDateString()}`,
      duration,
      difficulty: fitnessLevel,
      focus,
      exercises,
      date: today,
      status: 'scheduled',
      generatedAt: new Date().toISOString()
    };

    setWorkouts([...workouts, newWorkout]);
    
    toast({
      title: "Workout Generated!",
      description: `A ${duration}-minute ${randomType.toLowerCase()} workout has been created for today.`,
    });
  };

  const startWorkout = (workoutId: string) => {
    setActiveWorkout(workoutId);
    setWorkouts(workouts.map(w => 
      w.id === workoutId ? { ...w, status: "in-progress" as const } : w
    ));
    
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

  const finishWorkout = (workoutId: string) => {
    setWorkouts(workouts.map(w => 
      w.id === workoutId ? { ...w, status: "completed" as const } : w
    ));
    setActiveWorkout(null);
    
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-green-600 to-blue-500 p-2 rounded-lg">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl">Daily Workout Plans</CardTitle>
                <CardDescription className="text-sm">Personalized workouts based on your profile and available time</CardDescription>
              </div>
            </div>
            <Button 
              onClick={generateDailyWorkout}
              className="bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Generate</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

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
                <Button onClick={generateDailyWorkout} className="bg-gradient-to-r from-green-600 to-blue-500">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Today's Workout
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
                      </CardDescription>
                    </div>
                    {workout.status === 'scheduled' && (
                      <Button onClick={() => startWorkout(workout.id)} className="bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600" size="sm">
                        <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Start</span>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {workout.focus.map((focus) => (
                        <Badge key={focus} variant="secondary" className="text-xs">{focus}</Badge>
                      ))}
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm sm:text-base">Exercises</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {workout.exercises.map((exercise, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-xs sm:text-sm font-medium">{exercise.name}</span>
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
