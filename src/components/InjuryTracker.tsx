
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, Calendar, MapPin, Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLogger } from "@/hooks/useActivityLogger";

interface Injury {
  id: string;
  name: string;
  status: string;
  notes: string;
  start_date: string;
  created_at?: string;
  updated_at?: string;
}

const InjuryTracker = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { logActivity } = useActivityLogger();
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newInjury, setNewInjury] = useState({
    name: "",
    status: "active",
    notes: "",
    start_date: new Date().toISOString().split('T')[0]
  });

  const [editingInjury, setEditingInjury] = useState<string | null>(null);
  const [editData, setEditData] = useState<Injury | null>(null);

  const bodyParts = [
    "Neck", "Shoulders", "Upper Back", "Lower Back", "Chest", 
    "Arms", "Forearms", "Wrists", "Hips", "Thighs", "Knees", 
    "Calves", "Ankles", "Feet"
  ];

  const severityLevels = [
    { value: "mild", label: "Mild", color: "bg-yellow-100 text-yellow-800" },
    { value: "moderate", label: "Moderate", color: "bg-orange-100 text-orange-800" },
    { value: "severe", label: "Severe", color: "bg-red-100 text-red-800" }
  ];

  // Load injuries from database
  const loadInjuries = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('injuries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInjuries(data || []);
    } catch (error) {
      console.error('Error loading injuries:', error);
      toast({
        title: "Error",
        description: "Failed to load injuries.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInjuries();
  }, [user]);

  const handleAddInjury = async () => {
    if (!user || !newInjury.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in injury name.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('injuries')
        .insert({
          user_id: user.id,
          name: newInjury.name,
          status: newInjury.status,
          notes: newInjury.notes,
          start_date: newInjury.start_date
        });

      if (error) throw error;

      setNewInjury({
        name: "",
        status: "active",
        notes: "",
        start_date: new Date().toISOString().split('T')[0]
      });

      await logActivity('injury_added', `Added injury: ${newInjury.name}`);
      
      toast({
        title: "Injury Added",
        description: "Injury has been recorded and will be considered in your workout plans.",
      });

      loadInjuries();
    } catch (error) {
      console.error('Error adding injury:', error);
      toast({
        title: "Error",
        description: "Failed to add injury.",
        variant: "destructive"
      });
    }
  };

  const handleEditInjury = (injury: Injury) => {
    setEditingInjury(injury.id);
    setEditData({ ...injury });
  };

  const handleSaveEdit = async () => {
    if (!editData || !user) return;

    if (!editData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in injury name.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('injuries')
        .update({
          name: editData.name,
          status: editData.status,
          notes: editData.notes,
          start_date: editData.start_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', editData.id);

      if (error) throw error;

      setEditingInjury(null);
      setEditData(null);

      await logActivity('injury_updated', `Updated injury: ${editData.name}`);

      toast({
        title: "Injury Updated",
        description: "Injury details have been updated successfully.",
      });

      loadInjuries();
    } catch (error) {
      console.error('Error updating injury:', error);
      toast({
        title: "Error",
        description: "Failed to update injury.",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingInjury(null);
    setEditData(null);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('injuries')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      const injury = injuries.find(i => i.id === id);
      if (injury) {
        await logActivity('injury_updated', `Marked injury "${injury.name}" as ${status}`);
      }
      
      toast({
        title: "Status Updated",
        description: `Injury status has been updated to ${status}.`,
      });

      loadInjuries();
    } catch (error) {
      console.error('Error updating injury status:', error);
      toast({
        title: "Error",
        description: "Failed to update injury status.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteInjury = async (id: string) => {
    if (!user) return;

    try {
      const injury = injuries.find(i => i.id === id);
      
      const { error } = await supabase
        .from('injuries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (injury) {
        await logActivity('injury_deleted', `Deleted injury: ${injury.name}`);
      }

      toast({
        title: "Injury Deleted",
        description: "Injury has been removed successfully.",
      });

      loadInjuries();
    } catch (error) {
      console.error('Error deleting injury:', error);
      toast({
        title: "Error",
        description: "Failed to delete injury.",
        variant: "destructive"
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    const level = severityLevels.find(l => l.value === severity);
    return level?.color || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-red-600 to-orange-500 p-2 rounded-lg">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl">Injury Tracker</CardTitle>
                <CardDescription className="text-sm">Monitor and manage your injuries to ensure safe workouts</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="space-y-6">
            {/* Report New Injury Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base sm:text-lg">Report New Injury</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Body Part / Injury Name *</Label>
                  <Select value={newInjury.name} onValueChange={(value) => setNewInjury({...newInjury, name: value})}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select body part or enter custom" />
                    </SelectTrigger>
                    <SelectContent>
                      {bodyParts.map((part) => (
                        <SelectItem key={part} value={part}>
                          {part}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Or enter custom injury name"
                    value={newInjury.name}
                    onChange={(e) => setNewInjury({...newInjury, name: e.target.value})}
                    className="h-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Select value={newInjury.status} onValueChange={(value) => setNewInjury({...newInjury, status: value})}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="recovering">Recovering</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">Start Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newInjury.start_date}
                  onChange={(e) => setNewInjury({...newInjury, start_date: e.target.value})}
                  className="h-10"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Notes</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the injury and any relevant details"
                  value={newInjury.notes}
                  onChange={(e) => setNewInjury({...newInjury, notes: e.target.value})}
                  className="min-h-[80px] resize-none"
                />
              </div>
              
              <Button onClick={handleAddInjury} className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Injury
              </Button>
            </div>

            {/* Current Injuries Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base sm:text-lg">Current Injuries</h3>
              
              {injuries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">No injuries recorded. Great job staying safe!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {injuries.map((injury) => (
                    <Card key={injury.id} className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        {editingInjury === injury.id && editData ? (
                          // Edit Mode
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Injury Name *</Label>
                              <Input
                                value={editData.name}
                                onChange={(e) => setEditData({...editData, name: e.target.value})}
                                className="h-10"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Status</Label>
                              <Select value={editData.status} onValueChange={(value) => setEditData({...editData, status: value})}>
                                <SelectTrigger className="h-10">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="recovering">Recovering</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Start Date</Label>
                              <Input
                                type="date"
                                value={editData.start_date}
                                onChange={(e) => setEditData({...editData, start_date: e.target.value})}
                                className="h-10"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Notes</Label>
                              <Textarea
                                placeholder="Describe the injury and any relevant details"
                                value={editData.notes}
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
                                  <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                  <span className="font-medium text-sm sm:text-base truncate">{injury.name}</span>
                                  <Badge 
                                    variant={injury.status === "active" ? "destructive" : injury.status === "recovering" ? "default" : "secondary"}
                                    className="text-xs flex-shrink-0"
                                  >
                                    {injury.status}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                  <span>{new Date(injury.start_date).toLocaleDateString()}</span>
                                </div>
                                
                                {injury.notes && (
                                  <p className="text-xs sm:text-sm text-gray-700 break-words">{injury.notes}</p>
                                )}
                              </div>
                              
                              <div className="flex flex-col space-y-2 ml-3 flex-shrink-0">
                                <div className="flex flex-col space-y-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditInjury(injury)}
                                    className="text-xs px-2 py-1 h-auto whitespace-nowrap"
                                  >
                                    <Edit2 className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  
                                  {injury.status === "active" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleUpdateStatus(injury.id, "resolved")}
                                      className="text-xs px-2 py-1 h-auto whitespace-nowrap"
                                    >
                                      Mark Recovered
                                    </Button>
                                  )}
                                  
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteInjury(injury.id)}
                                    className="text-xs px-2 py-1 h-auto whitespace-nowrap"
                                  >
                                    Delete
                                  </Button>
                                </div>
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

      {/* Workout Adjustments Info */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-yellow-800 text-base sm:text-lg">Workout Adjustments</CardTitle>
          <CardDescription className="text-yellow-700 text-sm">
            How your injuries affect your workout recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="space-y-3">
            {injuries.filter(injury => injury.status === 'active').map(injury => (
              <div key={injury.id} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-yellow-200">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-yellow-800 text-sm sm:text-base">{injury.name}</p>
                  <p className="text-xs sm:text-sm text-yellow-700 break-words">
                    Consider avoiding exercises that may aggravate this injury. Consult with a healthcare professional for specific recommendations.
                  </p>
                </div>
              </div>
            ))}
            {injuries.filter(injury => injury.status === 'active').length === 0 && (
              <div className="text-center py-4 text-yellow-700">
                <p className="text-sm">No active injuries affecting your workouts!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InjuryTracker;
