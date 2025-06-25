
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Dumbbell, Clock, Target, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

interface Exercise {
  name: string;
  sets?: number;
  reps?: string;
  duration?: string;
  notes?: string;
}

interface WorkoutPlan {
  name: string;
  exercises: Exercise[];
  duration_minutes: number;
  difficulty_level: string;
}

const WorkoutPlan = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { logActivity } = useActivityLogger();
  const [isGenerating, setIsGenerating] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [isLogging, setIsLogging] = useState(false);

  // PST timezone constant
  const PST_TIMEZONE = 'America/Los_Angeles';

  // Helper function to get current PST date as string (YYYY-MM-DD)
  const getCurrentPSTDateString = () => {
    const now = new Date();
    const pstDate = toZonedTime(now, PST_TIMEZONE);
    return format(pstDate, 'yyyy-MM-dd');
  };

  // Helper function to get current PST time as string (HH:mm)
  const getCurrentPSTTimeString = () => {
    const now = new Date();
    const pstDate = toZonedTime(now, PST_TIMEZONE);
    return format(pstDate, 'HH:mm');
  };

  const generateWorkout = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate a workout plan.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('Calling AI service for workout generation...');
      
      const { data, error } = await supabase.functions.invoke('generate-workout', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;

      if (data && data.workout) {
        setWorkoutPlan(data.workout);
        await logActivity('workout_plan_generated', `Generated workout plan: ${data.workout.name}`);
        
        toast({
          title: "Workout Generated!",
          description: "Your personalized workout plan is ready.",
        });
      } else {
        throw new Error('No workout data received');
      }
    } catch (error) {
      console.error('Error generating workout:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate workout plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveAndLogWorkout = async () => {
    if (!workoutPlan || !user) return;

    setIsLogging(true);
    
    try {
      const currentPSTDate = getCurrentPSTDateString();
      const currentPSTTime = getCurrentPSTTimeString();
      
      console.log('Saving workout plan with PST date:', currentPSTDate, 'time:', currentPSTTime);

      // First, save the workout plan
      const { data: savedPlan, error: planError } = await supabase
        .from('workout_plans')
        .insert({
          user_id: user.id,
          name: workoutPlan.name,
          description: `Generated workout plan with ${workoutPlan.exercises.length} exercises`,
          exercises: workoutPlan.exercises,
          duration_minutes: workoutPlan.duration_minutes,
          difficulty_level: workoutPlan.difficulty_level,
          status: 'completed',
          scheduled_date: currentPSTDate,
          completed_date: currentPSTDate
        })
        .select()
        .single();

      if (planError) throw planError;

      // Then log each exercise as a separate workout entry
      const workoutEntries = workoutPlan.exercises.map((exercise, index) => {
        const exerciseDuration = Math.ceil(workoutPlan.duration_minutes / workoutPlan.exercises.length);
        
        // Calculate start time for each exercise (spread throughout the total duration)
        const startTimeMinutes = Math.floor(index * (workoutPlan.duration_minutes / workoutPlan.exercises.length));
        const startHour = Math.floor(startTimeMinutes / 60);
        const startMin = startTimeMinutes % 60;
        
        const [currentHour, currentMinute] = currentPSTTime.split(':').map(Number);
        const exerciseStartHour = currentHour + startHour;
        const exerciseStartMinute = currentMinute + startMin;
        
        const finalStartTime = `${String(exerciseStartHour).padStart(2, '0')}:${String(exerciseStartMinute).padStart(2, '0')}`;
        
        // Calculate end time
        const endTimeMinutes = startTimeMinutes + exerciseDuration;
        const endHour = Math.floor(endTimeMinutes / 60);
        const endMin = endTimeMinutes % 60;
        const exerciseEndHour = currentHour + endHour;
        const exerciseEndMinute = currentMinute + endMin;
        const finalEndTime = `${String(exerciseEndHour).padStart(2, '0')}:${String(exerciseEndMinute).padStart(2, '0')}`;

        return {
          user_id: user.id,
          name: exercise.name,
          workout_date: currentPSTDate,
          start_time: finalStartTime,
          end_time: finalEndTime,
          duration_minutes: exerciseDuration,
          notes: `${exercise.sets ? `${exercise.sets} sets` : ''} ${exercise.reps ? `of ${exercise.reps}` : ''} ${exercise.duration ? `for ${exercise.duration}` : ''} ${exercise.notes ? `- ${exercise.notes}` : ''}`.trim(),
          source_plan_name: workoutPlan.name,
          plan_id: savedPlan.id
        };
      });

      const { error: workoutsError } = await supabase
        .from('workouts')
        .insert(workoutEntries);

      if (workoutsError) throw workoutsError;

      await logActivity('workout_plan_completed', `Completed and logged workout plan: ${workoutPlan.name}`);

      toast({
        title: "Workout Logged!",
        description: `Successfully logged ${workoutPlan.exercises.length} exercises from your workout plan.`,
      });

      // Clear the current plan
      setWorkoutPlan(null);

    } catch (error) {
      console.error('Error saving workout:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save workout plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-500 p-2 rounded-lg">
              <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl">AI Workout Plan</CardTitle>
              <CardDescription className="text-sm">Get a personalized workout plan generated just for you</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="space-y-6">
            {!workoutPlan ? (
              <div className="text-center py-8">
                <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Ready for your next workout?</h3>
                <p className="text-gray-600 mb-6">Generate a personalized workout plan based on your profile, goals, and preferences.</p>
                <Button 
                  onClick={generateWorkout} 
                  disabled={isGenerating}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-500 hover:from-blue-700 hover:to-purple-600"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Plan...
                    </>
                  ) : (
                    <>
                      <Dumbbell className="h-4 w-4 mr-2" />
                      Generate Workout Plan
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Workout Plan Header */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{workoutPlan.name}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span>{workoutPlan.duration_minutes} minutes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      <span className="capitalize">{workoutPlan.difficulty_level}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span>{workoutPlan.exercises.length} exercises</span>
                    </div>
                  </div>
                </div>

                {/* Exercises List */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800">Exercises</h4>
                  {workoutPlan.exercises.map((exercise, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-800 mb-1">{exercise.name}</h5>
                          <div className="text-sm text-gray-600 space-y-1">
                            {exercise.sets && (
                              <p><span className="font-medium">Sets:</span> {exercise.sets}</p>
                            )}
                            {exercise.reps && (
                              <p><span className="font-medium">Reps:</span> {exercise.reps}</p>
                            )}
                            {exercise.duration && (
                              <p><span className="font-medium">Duration:</span> {exercise.duration}</p>
                            )}
                            {exercise.notes && (
                              <p><span className="font-medium">Notes:</span> {exercise.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium ml-3">
                          #{index + 1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={saveAndLogWorkout}
                    disabled={isLogging}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isLogging ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Logging Workout...
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4 mr-2" />
                        Complete & Log Workout
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={generateWorkout}
                    disabled={isGenerating}
                    variant="outline"
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Dumbbell className="h-4 w-4 mr-2" />
                        Generate New Plan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkoutPlan;
