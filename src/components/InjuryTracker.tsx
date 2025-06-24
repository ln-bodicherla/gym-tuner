
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, Calendar, MapPin, Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Injury {
  id: string;
  bodyPart: string;
  severity: string;
  description: string;
  date: string;
  status: string;
}

const InjuryTracker = () => {
  const { toast } = useToast();
  const [injuries, setInjuries] = useState<Injury[]>([
    {
      id: "1",
      bodyPart: "Lower Back",
      severity: "mild",
      description: "Slight discomfort during deadlifts",
      date: "2024-01-15",
      status: "active"
    }
  ]);
  
  const [newInjury, setNewInjury] = useState({
    bodyPart: "",
    severity: "",
    description: "",
    date: new Date().toISOString().split('T')[0]
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

  const handleAddInjury = () => {
    if (!newInjury.bodyPart || !newInjury.severity) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const injury: Injury = {
      id: Date.now().toString(),
      ...newInjury,
      status: "active"
    };

    setInjuries([...injuries, injury]);
    setNewInjury({
      bodyPart: "",
      severity: "",
      description: "",
      date: new Date().toISOString().split('T')[0]
    });

    toast({
      title: "Injury Added",
      description: "Injury has been recorded and will be considered in your workout plans.",
    });
  };

  const handleEditInjury = (injury: Injury) => {
    setEditingInjury(injury.id);
    setEditData({ ...injury });
  };

  const handleSaveEdit = () => {
    if (!editData) return;

    if (!editData.bodyPart || !editData.severity) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setInjuries(injuries.map(injury => 
      injury.id === editData.id ? editData : injury
    ));

    setEditingInjury(null);
    setEditData(null);

    toast({
      title: "Injury Updated",
      description: "Injury details have been updated successfully.",
    });
  };

  const handleCancelEdit = () => {
    setEditingInjury(null);
    setEditData(null);
  };

  const handleUpdateStatus = (id: string, status: string) => {
    setInjuries(injuries.map(injury => 
      injury.id === id ? { ...injury, status } : injury
    ));
    
    toast({
      title: "Status Updated",
      description: `Injury status has been updated to ${status}.`,
    });
  };

  const getSeverityColor = (severity: string) => {
    const level = severityLevels.find(l => l.value === severity);
    return level?.color || "bg-gray-100 text-gray-800";
  };

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
            {/* Mobile-First: Report New Injury Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base sm:text-lg">Report New Injury</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Body Part *</Label>
                  <Select value={newInjury.bodyPart} onValueChange={(value) => setNewInjury({...newInjury, bodyPart: value})}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select body part" />
                    </SelectTrigger>
                    <SelectContent>
                      {bodyParts.map((part) => (
                        <SelectItem key={part} value={part}>
                          {part}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Severity *</Label>
                  <Select value={newInjury.severity} onValueChange={(value) => setNewInjury({...newInjury, severity: value})}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      {severityLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newInjury.date}
                  onChange={(e) => setNewInjury({...newInjury, date: e.target.value})}
                  className="h-10"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the injury and any relevant details"
                  value={newInjury.description}
                  onChange={(e) => setNewInjury({...newInjury, description: e.target.value})}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Body Part *</Label>
                                <Select value={editData.bodyPart} onValueChange={(value) => setEditData({...editData, bodyPart: value})}>
                                  <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select body part" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {bodyParts.map((part) => (
                                      <SelectItem key={part} value={part}>
                                        {part}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Severity *</Label>
                                <Select value={editData.severity} onValueChange={(value) => setEditData({...editData, severity: value})}>
                                  <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select severity" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {severityLevels.map((level) => (
                                      <SelectItem key={level.value} value={level.value}>
                                        {level.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`edit-date-${injury.id}`} className="text-sm font-medium">Date</Label>
                              <Input
                                id={`edit-date-${injury.id}`}
                                type="date"
                                value={editData.date}
                                onChange={(e) => setEditData({...editData, date: e.target.value})}
                                className="h-10"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`edit-description-${injury.id}`} className="text-sm font-medium">Description</Label>
                              <Textarea
                                id={`edit-description-${injury.id}`}
                                placeholder="Describe the injury and any relevant details"
                                value={editData.description}
                                onChange={(e) => setEditData({...editData, description: e.target.value})}
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
                                  <span className="font-medium text-sm sm:text-base truncate">{injury.bodyPart}</span>
                                  <Badge className={`${getSeverityColor(injury.severity)} text-xs flex-shrink-0`}>
                                    {injury.severity}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                  <span>{new Date(injury.date).toLocaleDateString()}</span>
                                </div>
                                
                                {injury.description && (
                                  <p className="text-xs sm:text-sm text-gray-700 break-words">{injury.description}</p>
                                )}
                              </div>
                              
                              <div className="flex flex-col space-y-2 ml-3 flex-shrink-0">
                                <Badge 
                                  variant={injury.status === "active" ? "destructive" : "secondary"}
                                  className="text-xs whitespace-nowrap"
                                >
                                  {injury.status}
                                </Badge>
                                
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
                                      onClick={() => handleUpdateStatus(injury.id, "recovered")}
                                      className="text-xs px-2 py-1 h-auto whitespace-nowrap"
                                    >
                                      Mark Recovered
                                    </Button>
                                  )}
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

      {/* Workout Adjustments Info - Mobile Optimized */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-yellow-800 text-base sm:text-lg">Workout Adjustments</CardTitle>
          <CardDescription className="text-yellow-700 text-sm">
            How your injuries affect your workout recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-yellow-200">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-yellow-800 text-sm sm:text-base">Lower Back (Mild)</p>
                <p className="text-xs sm:text-sm text-yellow-700 break-words">Avoiding: Heavy deadlifts, squats. Modified: Core exercises with reduced intensity.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InjuryTracker;
