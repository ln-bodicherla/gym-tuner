
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { User, Clock, Target, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const UserProfile = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    name: "John Doe",
    age: "28",
    weight: "175",
    height: "5'10\"",
    fitnessLevel: "intermediate",
    availableTime: "60",
    maxWorkoutTime: "90", // New field for maximum workout time
    preferences: "Strength training, Cardio",
    limitations: "Lower back sensitivity"
  });

  const handleSaveProfile = () => {
    // Save to localStorage for persistence
    localStorage.setItem('userProfile', JSON.stringify(profile));
    toast({
      title: "Profile Updated!",
      description: "Your profile has been saved successfully.",
    });
  };

  const fitnessLevels = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
    { value: "expert", label: "Expert" }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-2 rounded-lg">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl">Personal Profile</CardTitle>
              <CardDescription className="text-sm">Your basic information and fitness details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
                className="h-10 sm:h-10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="age" className="text-sm font-medium">Age</Label>
              <Input
                id="age"
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({...profile, age: e.target.value})}
                className="h-10 sm:h-10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-sm font-medium">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                value={profile.weight}
                onChange={(e) => setProfile({...profile, weight: e.target.value})}
                className="h-10 sm:h-10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="height" className="text-sm font-medium">Height</Label>
              <Input
                id="height"
                value={profile.height}
                onChange={(e) => setProfile({...profile, height: e.target.value})}
                className="h-10 sm:h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-green-600 to-teal-500 p-2 rounded-lg">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl">Fitness Information</CardTitle>
              <CardDescription className="text-sm">Your current fitness level and workout preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Fitness Level</Label>
              <Select value={profile.fitnessLevel} onValueChange={(value) => setProfile({...profile, fitnessLevel: value})}>
                <SelectTrigger className="h-10 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fitnessLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm font-medium">Preferred Daily Time (minutes)</Label>
              <Input
                id="time"
                type="number"
                value={profile.availableTime}
                onChange={(e) => setProfile({...profile, availableTime: e.target.value})}
                className="h-10 sm:h-10"
                placeholder="e.g., 45"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="maxTime" className="text-sm font-medium">Maximum Workout Time (minutes)</Label>
              <Input
                id="maxTime"
                type="number"
                value={profile.maxWorkoutTime}
                onChange={(e) => setProfile({...profile, maxWorkoutTime: e.target.value})}
                className="h-10 sm:h-10"
                placeholder="e.g., 90"
              />
              <p className="text-xs text-gray-500">Maximum time you can dedicate to a single workout session</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="preferences" className="text-sm font-medium">Workout Preferences</Label>
            <Textarea
              id="preferences"
              placeholder="e.g., Strength training, Cardio, Yoga, etc."
              value={profile.preferences}
              onChange={(e) => setProfile({...profile, preferences: e.target.value})}
              className="min-h-[80px] resize-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="limitations" className="text-sm font-medium">Physical Limitations</Label>
            <Textarea
              id="limitations"
              placeholder="Any physical limitations or areas to avoid"
              value={profile.limitations}
              onChange={(e) => setProfile({...profile, limitations: e.target.value})}
              className="min-h-[80px] resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-50 to-orange-50 border-blue-200">
        <CardHeader className="px-4 sm:px-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-2 rounded-lg">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl">Quick Stats</CardTitle>
              <CardDescription className="text-sm">Your profile at a glance</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-2 py-1">
              <Clock className="h-3 w-3 mr-1" />
              {profile.availableTime} min/day
            </Badge>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 px-2 py-1">
              <Clock className="h-3 w-3 mr-1" />
              Max: {profile.maxWorkoutTime} min
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800 px-2 py-1">
              <Activity className="h-3 w-3 mr-1" />
              {profile.fitnessLevel}
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 px-2 py-1">
              <User className="h-3 w-3 mr-1" />
              {profile.age} years old
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center sm:justify-end px-4 sm:px-0">
        <Button 
          onClick={handleSaveProfile} 
          className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 w-full sm:w-auto"
        >
          Save Profile
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
