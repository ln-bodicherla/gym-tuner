
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
    preferences: "Strength training, Cardio",
    limitations: "Lower back sensitivity"
  });

  const handleSaveProfile = () => {
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-2 rounded-lg">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Personal Profile</CardTitle>
              <CardDescription>Your basic information and fitness details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({...profile, age: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                value={profile.weight}
                onChange={(e) => setProfile({...profile, weight: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                value={profile.height}
                onChange={(e) => setProfile({...profile, height: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-green-600 to-teal-500 p-2 rounded-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Fitness Information</CardTitle>
              <CardDescription>Your current fitness level and preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Fitness Level</Label>
              <Select value={profile.fitnessLevel} onValueChange={(value) => setProfile({...profile, fitnessLevel: value})}>
                <SelectTrigger>
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
              <Label htmlFor="time">Available Time (minutes/day)</Label>
              <Input
                id="time"
                type="number"
                value={profile.availableTime}
                onChange={(e) => setProfile({...profile, availableTime: e.target.value})}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="preferences">Workout Preferences</Label>
            <Textarea
              id="preferences"
              placeholder="e.g., Strength training, Cardio, Yoga, etc."
              value={profile.preferences}
              onChange={(e) => setProfile({...profile, preferences: e.target.value})}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="limitations">Physical Limitations</Label>
            <Textarea
              id="limitations"
              placeholder="Any physical limitations or areas to avoid"
              value={profile.limitations}
              onChange={(e) => setProfile({...profile, limitations: e.target.value})}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-50 to-orange-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-2 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Your profile at a glance</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Clock className="h-3 w-3 mr-1" />
              {profile.availableTime} min/day
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Activity className="h-3 w-3 mr-1" />
              {profile.fitnessLevel}
            </Badge>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              <User className="h-3 w-3 mr-1" />
              {profile.age} years old
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveProfile} className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600">
          Save Profile
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
