
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, MapPin, Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState({
    name: user?.user_metadata?.full_name || "John Doe",
    email: user?.email || "john@example.com",
    phone: "+1 (555) 123-4567",
    location: "New York, NY",
    bio: "Fitness enthusiast passionate about strength training and healthy living.",
    joinDate: "January 2024",
    age: "",
    weight: "",
    height: "",
    fitness_level: "",
    preferred_time: "",
    max_workout_time: "",
    min_workout_time: "",
    weekly_goal: "",
    experience_years: "",
    preferred_workout_types: "",
    availability: "",
    preferences: "",
    limitations: ""
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileData) {
        setProfile(prev => ({
          ...prev,
          age: profileData.age?.toString() || "",
          weight: profileData.weight?.toString() || "",
          height: profileData.height || "",
          fitness_level: profileData.fitness_level || "",
          preferred_time: profileData.preferred_time?.toString() || "",
          max_workout_time: profileData.max_workout_time?.toString() || "",
          min_workout_time: profileData.min_workout_time?.toString() || "",
          weekly_goal: profileData.weekly_goal?.toString() || "",
          experience_years: profileData.experience_years?.toString() || "",
          preferred_workout_types: profileData.preferred_workout_types || "",
          availability: profileData.availability || "",
          preferences: profileData.preferences || "",
          limitations: profileData.limitations || ""
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          full_name: profile.name,
          age: profile.age ? parseInt(profile.age) : null,
          weight: profile.weight ? parseFloat(profile.weight) : null,
          height: profile.height,
          fitness_level: profile.fitness_level,
          preferred_time: profile.preferred_time ? parseInt(profile.preferred_time) : null,
          max_workout_time: profile.max_workout_time ? parseInt(profile.max_workout_time) : null,
          min_workout_time: profile.min_workout_time ? parseInt(profile.min_workout_time) : null,
          weekly_goal: profile.weekly_goal ? parseInt(profile.weekly_goal) : null,
          experience_years: profile.experience_years ? parseInt(profile.experience_years) : null,
          preferred_workout_types: profile.preferred_workout_types,
          availability: profile.availability,
          preferences: profile.preferences,
          limitations: profile.limitations,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error saving profile",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadProfile(); // Reset form to original values
  };

  const getUserInitials = () => {
    return profile.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl sm:text-2xl">Profile</CardTitle>
              <CardDescription>
                Manage your personal information and fitness preferences
              </CardDescription>
            </div>
            <Button
              variant={isEditing ? "outline" : "default"}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="shrink-0"
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture and Basic Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm text-gray-600">{profile.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      disabled
                    />
                  ) : (
                    <p className="text-sm text-gray-600">{profile.email}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Fitness Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              {isEditing ? (
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  value={profile.age}
                  onChange={(e) => setProfile({...profile, age: e.target.value})}
                />
              ) : (
                <p className="text-sm text-gray-600">{profile.age || 'Not set'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              {isEditing ? (
                <Input
                  id="weight"
                  type="number"
                  placeholder="70"
                  value={profile.weight}
                  onChange={(e) => setProfile({...profile, weight: e.target.value})}
                />
              ) : (
                <p className="text-sm text-gray-600">{profile.weight ? `${profile.weight} kg` : 'Not set'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              {isEditing ? (
                <Input
                  id="height"
                  placeholder="5'10&quot; or 178cm"
                  value={profile.height}
                  onChange={(e) => setProfile({...profile, height: e.target.value})}
                />
              ) : (
                <p className="text-sm text-gray-600">{profile.height || 'Not set'}</p>
              )}
            </div>
          </div>

          {/* Fitness Level and Time Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fitness_level">Fitness Level</Label>
              {isEditing ? (
                <Select value={profile.fitness_level} onValueChange={(value) => setProfile({...profile, fitness_level: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-gray-600 capitalize">{profile.fitness_level || 'Not set'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferred_time">Preferred Workout Time (min)</Label>
              {isEditing ? (
                <Input
                  id="preferred_time"
                  type="number"
                  placeholder="45"
                  value={profile.preferred_time}
                  onChange={(e) => setProfile({...profile, preferred_time: e.target.value})}
                />
              ) : (
                <p className="text-sm text-gray-600">{profile.preferred_time ? `${profile.preferred_time} minutes` : 'Not set'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_workout_time">Maximum Workout Time (min)</Label>
              {isEditing ? (
                <Input
                  id="max_workout_time"
                  type="number"
                  placeholder="90"
                  value={profile.max_workout_time}
                  onChange={(e) => setProfile({...profile, max_workout_time: e.target.value})}
                />
              ) : (
                <p className="text-sm text-gray-600">{profile.max_workout_time ? `${profile.max_workout_time} minutes` : 'Not set'}</p>
              )}
            </div>
          </div>

          {/* Additional Fitness Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_workout_time">Minimum Workout Time (min)</Label>
              {isEditing ? (
                <Input
                  id="min_workout_time"
                  type="number"
                  placeholder="15"
                  value={profile.min_workout_time}
                  onChange={(e) => setProfile({...profile, min_workout_time: e.target.value})}
                />
              ) : (
                <p className="text-sm text-gray-600">{profile.min_workout_time ? `${profile.min_workout_time} minutes` : 'Not set'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekly_goal">Weekly Workout Goal</Label>
              {isEditing ? (
                <Input
                  id="weekly_goal"
                  type="number"
                  placeholder="4"
                  value={profile.weekly_goal}
                  onChange={(e) => setProfile({...profile, weekly_goal: e.target.value})}
                />
              ) : (
                <p className="text-sm text-gray-600">{profile.weekly_goal ? `${profile.weekly_goal} times per week` : 'Not set'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience_years">Years of Experience</Label>
              {isEditing ? (
                <Input
                  id="experience_years"
                  type="number"
                  placeholder="2"
                  value={profile.experience_years}
                  onChange={(e) => setProfile({...profile, experience_years: e.target.value})}
                />
              ) : (
                <p className="text-sm text-gray-600">{profile.experience_years ? `${profile.experience_years} years` : 'Not set'}</p>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-600">{profile.phone}</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              {isEditing ? (
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => setProfile({...profile, location: e.target.value})}
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-600">{profile.location}</p>
                </div>
              )}
            </div>
          </div>

          {/* Workout Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferred_workout_types">Preferred Workout Types</Label>
              {isEditing ? (
                <Textarea
                  id="preferred_workout_types"
                  rows={3}
                  value={profile.preferred_workout_types}
                  onChange={(e) => setProfile({...profile, preferred_workout_types: e.target.value})}
                  placeholder="e.g., Strength training, cardio, yoga, swimming..."
                />
              ) : (
                <p className="text-sm text-gray-600">{profile.preferred_workout_types || 'Not specified'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="availability">Availability</Label>
              {isEditing ? (
                <Textarea
                  id="availability"
                  rows={3}
                  value={profile.availability}
                  onChange={(e) => setProfile({...profile, availability: e.target.value})}
                  placeholder="e.g., Morning person, evenings after work, weekend warrior..."
                />
              ) : (
                <p className="text-sm text-gray-600">{profile.availability || 'Not specified'}</p>
              )}
            </div>
          </div>

          {/* Preferences and Limitations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferences">Additional Preferences</Label>
              {isEditing ? (
                <Textarea
                  id="preferences"
                  rows={3}
                  value={profile.preferences}
                  onChange={(e) => setProfile({...profile, preferences: e.target.value})}
                  placeholder="e.g., Music preferences, equipment preferences..."
                />
              ) : (
                <p className="text-sm text-gray-600">{profile.preferences || 'Not specified'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="limitations">Physical Limitations</Label>
              {isEditing ? (
                <Textarea
                  id="limitations"
                  rows={3}
                  value={profile.limitations}
                  onChange={(e) => setProfile({...profile, limitations: e.target.value})}
                  placeholder="e.g., Knee injury, back problems..."
                />
              ) : (
                <p className="text-sm text-gray-600">{profile.limitations || 'None specified'}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            {isEditing ? (
              <Textarea
                id="bio"
                rows={3}
                value={profile.bio}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-sm text-gray-600">{profile.bio}</p>
            )}
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}

          {/* Member Since */}
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500">
              Member since {profile.joinDate}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contact Support Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
          <CardDescription>
            Get in touch with our support team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Contact Support</p>
              <p className="text-sm text-gray-600">contact@gymtuner.app</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
