
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Play, CheckCircle, RotateCcw, Calendar, Zap } from "lucide-react";
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
}

const WorkoutPlan = () => {
  const { toast } = useToast();
  const [workouts, setWorkouts] = useState<Workout[]>([
    {
      id: "1",
      name: "Upper Body Strength",
      duration: 45,
      difficulty: "intermediate",
      focus: ["Chest", "Back", "Shoulders"],
      date: "2024-01-20",
      status: "scheduled",
      exercises: [
        { name: "Push-ups", sets: 3, reps: "12-15", rest: "60s", completed: false, notes: "Modified due to wrist sensitivity" },
        { name: "Dumbbell Rows", sets: 3, reps: "10-12", rest: "90s", completed: false },
        { name: "Overhead Press", sets: 3, reps: "8-10", rest: "90s", completed: false },
        { name: "Lat Pulldowns", sets: 3, reps: "10-12", rest: "90s", completed: false },
        { name: "Chest Flyes", sets: 2, reps: "12-15", rest: "60s", completed: false }
      ]
    },
    {
      id: "2",
      name: "Lower Body & Core",
      duration: 50,
      difficulty: "intermediate",
      focus: ["Legs", "Glutes", "Core"],
      date: "2024-01-22",
      status: "scheduled",
      exercises: [
        { name: "Goblet Squats", sets: 3, reps: "12-15", rest: "90s", completed: false, notes: "Avoiding heavy back squats due to lower back" },
        { name: "Romanian Deadlifts", sets: 3, reps: "10-12", rest: "90s", completed: false },
        { name: "Walking Lunges", sets: 3, reps: "10 each leg", rest: "60s", completed: false },
        { name: "Plank", sets: 3, reps: "30-45s", rest: "60s", completed: false },
        { name: "Glute Bridges", sets: 3, reps: "15-20", rest: "60s", completed: false }
      ]
    }
  ]);

  const [activeWorkout, setActiveWorkout] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-green-600 to-blue-500 p-2 rounded-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Workout Plans</CardTitle>
              <CardDescription>Personalized workouts based on your profile, goals, and injuries</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="scheduled" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="active">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="space-y-4">
          {workouts.filter(w => w.status === "scheduled").map((workout) => (
            <Card key={workout.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{workout.name}</span>
                      <Badge className={getDifficultyColor(workout.difficulty)}>
                        {workout.difficulty}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-4 mt-2">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{workout.duration} min</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(workout.date).toLocaleDateString()}</span>
                      </span>
                    </CardDescription>
                  </div>
                  <Button onClick={() => startWorkout(workout.id)} className="bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600">
                    <Play className="h-4 w-4 mr-2" />
                    Start Workout
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {workout.focus.map((focus) => (
                      <Badge key={focus} variant="secondary">{focus}</Badge>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Exercises</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {workout.exercises.map((exercise, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">{exercise.name}</span>
                          <span className="text-xs text-gray-600">{exercise.sets} × {exercise.reps}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {workouts.filter(w => w.status === "in-progress").map((workout) => (
            <Card key={workout.id} className="border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{workout.name}</span>
                      <Badge className="bg-orange-100 text-orange-800">In Progress</Badge>
                    </CardTitle>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{Math.round(getWorkoutProgress(workout))}%</span>
                      </div>
                      <Progress value={getWorkoutProgress(workout)} className="h-2" />
                    </div>
                  </div>
                  <Button onClick={() => finishWorkout(workout.id)} variant="outline">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finish
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workout.exercises.map((exercise, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${exercise.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <Button
                              size="sm"
                              variant={exercise.completed ? "default" : "outline"}
                              onClick={() => completeExercise(workout.id, index)}
                              className={exercise.completed ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <div>
                              <h5 className={`font-medium ${exercise.completed ? 'line-through text-gray-600' : ''}`}>
                                {exercise.name}
                              </h5>
                              <p className="text-sm text-gray-600">
                                {exercise.sets} sets × {exercise.reps} | Rest: {exercise.rest}
                              </p>
                              {exercise.notes && (
                                <p className="text-xs text-blue-600 mt-1">💡 {exercise.notes}</p>
                              )}
                            </div>
                          </div>
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

        <TabsContent value="completed" className="space-y-4">
          {workouts.filter(w => w.status === "completed").map((workout) => (
            <Card key={workout.id} className="border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{workout.name}</span>
                      <Badge className="bg-green-100 text-green-800">Completed</Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-4 mt-2">
                      <span className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>100% Complete</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(workout.date).toLocaleDateString()}</span>
                      </span>
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Repeat
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
