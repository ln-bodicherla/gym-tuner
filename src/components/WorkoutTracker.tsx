import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Plus, Edit2, Save, X, Trash2, Calendar, Clock, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLogger } from "@/hooks/useActivityLogger";

interface Workout {
  id: string;
  name: string;
  workout_date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  notes?: string;
  calories_burned?: number;
  equipment_image_url?: string;
  source_plan_name?: string;
  created_at?: string;
  updated_at?: string;
}

const WorkoutTracker = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { logActivity } = useActivityLogger();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');
  
  const [newWorkout, setNewWorkout] = useState({
    name: "",
    workout_date: new Date().toISOString().split('T')[0],
    start_time: "",
    duration_minutes: "",
    notes: "",
    calories_burned: ""
  });

  const [editingWorkout, setEditingWorkout] = useState<string | null>(null);
  const [editData, setEditData] = useState<Workout | null>(null);

  // Load workouts from database
  const loadWorkouts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('workout_date', { ascending: false })
        .order('start_time', { ascending: false });

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error) {
      console.error('Error loading workouts:', error);
      toast({
        title: "Error",
        description: "Failed to load workouts.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, [user]);

  // Filter workouts based on selected filter
  const filteredWorkouts = workouts.filter(workout => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const workoutDate = new Date(workout.workout_date);
    workoutDate.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'today':
        return workoutDate.getTime() === today.getTime();
      case '7days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
        return workoutDate.getTime() >= sevenDaysAgo.getTime() && workoutDate.getTime() <= today.getTime();
      case '30days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 29);
        return workoutDate.getTime() >= thirtyDaysAgo.getTime() && workoutDate.getTime() <= today.getTime();
      default:
        return true;
    }
  });

  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    if (!startTime || !durationMinutes) return '';
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    startDate.setMinutes(startDate.getMinutes() + durationMinutes);
    
    return `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
  };

  const handleAddWorkout = async () => {
    if (!user || !newWorkout.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in workout name.",
        variant: "destructive"
      });
      return;
    }

    try {
      const durationMinutes = newWorkout.duration_minutes ? parseInt(newWorkout.duration_minutes) : null;
      const endTime = newWorkout.start_time && durationMinutes ? 
        calculateEndTime(newWorkout.start_time, durationMinutes) : null;

      const workoutData = {
        user_id: user.id,
        name: newWorkout.name,
        workout_date: newWorkout.workout_date,
        start_time: newWorkout.start_time || null,
        end_time: endTime,
        duration_minutes: durationMinutes,
        notes: newWorkout.notes || null,
        calories_burned: newWorkout.calories_burned ? parseInt(newWorkout.calories_burned) : null
      };

      const { error } = await supabase
        .from('workouts')
        .insert(workoutData);

      if (error) throw error;

      setNewWorkout({
        name: "",
        workout_date: new Date().toISOString().split('T')[0],
        start_time: "",
        duration_minutes: "",
        notes: "",
        calories_burned: ""
      });

      await logActivity('workout_created', `Created workout: ${newWorkout.name}`);

      toast({
        title: "Workout Added",
        description: "Your workout has been logged successfully.",
      });

      loadWorkouts();
    } catch (error) {
      console.error('Error adding workout:', error);
      toast({
        title: "Error",
        description: "Failed to add workout.",
        variant: "destructive"
      });
    }
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout.id);
    setEditData({ ...workout });
  };

  const handleSaveEdit = async () => {
    if (!editData || !user) return;

    if (!editData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in workout name.",
        variant: "destructive"
      });
      return;
    }

    try {
      const durationMinutes = editData.duration_minutes;
      const endTime = editData.start_time && durationMinutes ? 
        calculateEndTime(editData.start_time, durationMinutes) : null;

      const { error } = await supabase
        .from('workouts')
        .update({
          name: editData.name,
          workout_date: editData.workout_date,
          start_time: editData.start_time || null,
          end_time: endTime,
          duration_minutes: durationMinutes,
          notes: editData.notes || null,
          calories_burned: editData.calories_burned,
          updated_at: new Date().toISOString()
        })
        .eq('id', editData.id);

      if (error) throw error;

      setEditingWorkout(null);
      setEditData(null);

      await logActivity('workout_completed', `Updated workout: ${editData.name}`);

      toast({
        title: "Workout Updated",
        description: "Workout details have been updated successfully.",
      });

      loadWorkouts();
    } catch (error) {
      console.error('Error updating workout:', error);
      toast({
        title: "Error",
        description: "Failed to update workout.",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingWorkout(null);
    setEditData(null);
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!user) return;

    try {
      const workout = workouts.find(w => w.id === id);
      
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (workout) {
        await logActivity('workout_completed', `Deleted workout: ${workout.name}`);
      }

      toast({
        title: "Workout Deleted",
        description: "Workout has been removed successfully.",
      });

      loadWorkouts();
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast({
        title: "Error",
        description: "Failed to delete workout.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-2 rounded-lg">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl">Workout Tracker</CardTitle>
                <CardDescription className="text-sm">Log and track your fitness activities</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="space-y-6">
            {/* Add New Workout Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base sm:text-lg">Log New Workout</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Workout Name *</Label>
                  <Input
                    placeholder="e.g., Morning Run, Chest & Arms"
                    value={newWorkout.name}
                    onChange={(e) => setNewWorkout({...newWorkout, name: e.target.value})}
                    className="h-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date</Label>
                  <Input
                    type="date"
                    value={newWorkout.workout_date}
                    onChange={(e) => setNewWorkout({...newWorkout, workout_date: e.target.value})}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Start Time</Label>
                  <Input
                    type="time"
                    value={newWorkout.start_time}
                    onChange={(e) => setNewWorkout({...newWorkout, start_time: e.target.value})}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Duration (minutes)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 45"
                    value={newWorkout.duration_minutes}
                    onChange={(e) => setNewWorkout({...newWorkout, duration_minutes: e.target.value})}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Calories Burned</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 300"
                    value={newWorkout.calories_burned}
                    onChange={(e) => setNewWorkout({...newWorkout, calories_burned: e.target.value})}
                    className="h-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Notes</Label>
                <Textarea
                  placeholder="How did the workout go? Any observations or achievements?"
                  value={newWorkout.notes}
                  onChange={(e) => setNewWorkout({...newWorkout, notes: e.target.value})}
                  className="min-h-[80px] resize-none"
                />
              </div>
              
              <Button onClick={handleAddWorkout} className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
                <Plus className="h-4 w-4 mr-2" />
                Log Workout
              </Button>
            </div>

            {/* Workout History Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base sm:text-lg">Workout History</h3>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="7days">7 Days</SelectItem>
                    <SelectItem value="30days">30 Days</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {filteredWorkouts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">No workouts found for this period.</p>
                  <p className="text-xs sm:text-sm text-gray-400">Start logging your workouts to see them here!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredWorkouts.map((workout) => (
                    <Card key={workout.id} className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        {editingWorkout === workout.id && editData ? (
                          // Edit Mode
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Workout Name *</Label>
                                <Input
                                  value={editData.name}
                                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                                  className="h-10"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Date</Label>
                                <Input
                                  type="date"
                                  value={editData.workout_date}
                                  onChange={(e) => setEditData({...editData, workout_date: e.target.value})}
                                  className="h-10"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Start Time</Label>
                                <Input
                                  type="time"
                                  value={editData.start_time || ''}
                                  onChange={(e) => setEditData({...editData, start_time: e.target.value})}
                                  className="h-10"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Duration (minutes)</Label>
                                <Input
                                  type="number"
                                  value={editData.duration_minutes || ''}
                                  onChange={(e) => setEditData({...editData, duration_minutes: parseInt(e.target.value) || undefined})}
                                  className="h-10"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Calories</Label>
                                <Input
                                  type="number"
                                  value={editData.calories_burned || ''}
                                  onChange={(e) => setEditData({...editData, calories_burned: parseInt(e.target.value) || undefined})}
                                  className="h-10"
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Notes</Label>
                              <Textarea
                                value={editData.notes || ''}
                                onChange={(e) => setEditData({...editData, notes: e.target.value})}
                                className="min-h-[80px] resize-none"
                              />
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button onClick={handleSaveEdit} size="sm" className="flex-1">
                                <Save className="h-4 w-4 mr-2" />
                                Save
                              </Button>
                              <Button onClick={handleCancelEdit} variant="outline" size="sm" className="flex-1">
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2 flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-sm sm:text-base truncate">{workout.name}</h4>
                                  {workout.source_plan_name && (
                                    <Badge variant="secondary" className="text-xs">
                                      From Plan
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-center space-x-4 text-xs sm:text-sm text-gray-600">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(workout.workout_date).toLocaleDateString()}</span>
                                  </div>
                                  
                                  {workout.start_time && (
                                    <div className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{workout.start_time}</span>
                                    </div>
                                  )}
                                  
                                  {workout.duration_minutes && (
                                    <div className="flex items-center space-x-1">
                                      <Target className="h-3 w-3" />
                                      <span>{workout.duration_minutes}min</span>
                                    </div>
                                  )}
                                </div>

                                {workout.calories_burned && (
                                  <p className="text-xs sm:text-sm text-gray-600">
                                    🔥 {workout.calories_burned} calories burned
                                  </p>
                                )}
                                
                                {workout.notes && (
                                  <p className="text-xs sm:text-sm text-gray-700 break-words">{workout.notes}</p>
                                )}
                              </div>
                              
                              <div className="flex flex-col space-y-1 ml-3 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditWorkout(workout)}
                                  className="text-xs px-2 py-1 h-auto whitespace-nowrap"
                                >
                                  <Edit2 className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteWorkout(workout.id)}
                                  className="text-xs px-2 py-1 h-auto whitespace-nowrap"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
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

export default WorkoutTracker;
