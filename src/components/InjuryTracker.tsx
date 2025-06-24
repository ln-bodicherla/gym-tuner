
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, Calendar, MapPin } from "lucide-react";
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-red-600 to-orange-500 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Injury Tracker</CardTitle>
                <CardDescription>Monitor and manage your injuries to ensure safe workouts</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add New Injury */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Report New Injury</h3>
              
              <div className="space-y-2">
                <Label>Body Part *</Label>
                <Select value={newInjury.bodyPart} onValueChange={(value) => setNewInjury({...newInjury, bodyPart: value})}>
                  <SelectTrigger>
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
                <Label>Severity *</Label>
                <Select value={newInjury.severity} onValueChange={(value) => setNewInjury({...newInjury, severity: value})}>
                  <SelectTrigger>
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
              
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newInjury.date}
                  onChange={(e) => setNewInjury({...newInjury, date: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the injury and any relevant details"
                  value={newInjury.description}
                  onChange={(e) => setNewInjury({...newInjury, description: e.target.value})}
                />
              </div>
              
              <Button onClick={handleAddInjury} className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Injury
              </Button>
            </div>

            {/* Current Injuries */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Current Injuries</h3>
              
              {injuries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No injuries recorded. Great job staying safe!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {injuries.map((injury) => (
                    <Card key={injury.id} className="border-l-4 border-l-red-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">{injury.bodyPart}</span>
                              <Badge className={getSeverityColor(injury.severity)}>
                                {injury.severity}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(injury.date).toLocaleDateString()}</span>
                            </div>
                            
                            {injury.description && (
                              <p className="text-sm text-gray-700">{injury.description}</p>
                            )}
                          </div>
                          
                          <div className="flex flex-col space-y-2">
                            <Badge 
                              variant={injury.status === "active" ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {injury.status}
                            </Badge>
                            
                            {injury.status === "active" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(injury.id, "recovered")}
                                className="text-xs"
                              >
                                Mark Recovered
                              </Button>
                            )}
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

      {/* Workout Adjustments Info */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-800">Workout Adjustments</CardTitle>
          <CardDescription className="text-yellow-700">
            How your injuries affect your workout recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-yellow-200">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Lower Back (Mild)</p>
                <p className="text-sm text-yellow-700">Avoiding: Heavy deadlifts, squats. Modified: Core exercises with reduced intensity.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InjuryTracker;
