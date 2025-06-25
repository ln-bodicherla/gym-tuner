
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, User, MapPin, Phone, Target, Clock, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfileData {
  full_name?: string;
  age?: number;
  weight?: number;
  height?: string;
  fitness_level?: string;
  experience_years?: number;
  max_workout_time?: number;
  min_workout_time?: number;
  weekly_goal?: number;
  preferred_workout_types?: string;
  availability?: string;
  limitations?: string;
  preferences?: string;
  workout_schedule?: string[];
}

interface ProfileCompletionCheckProps {
  profile: ProfileData | null;
  onCompleteProfile: () => void;
  showMinimal?: boolean;
}

const ProfileCompletionCheck: React.FC<ProfileCompletionCheckProps> = ({
  profile,
  onCompleteProfile,
  showMinimal = false
}) => {
  const checkProfileCompleteness = () => {
    if (!profile) return { isComplete: false, missingFields: ['All profile information'], completionPercentage: 0 };

    const requiredFields = [
      { key: 'full_name', label: 'Full Name', icon: User },
      { key: 'age', label: 'Age', icon: User },
      { key: 'fitness_level', label: 'Fitness Level', icon: Dumbbell },
      { key: 'max_workout_time', label: 'Max Workout Time', icon: Clock },
      { key: 'weekly_goal', label: 'Weekly Goal', icon: Target },
      { key: 'workout_schedule', label: 'Workout Schedule', icon: Target }
    ];

    const missingFields: string[] = [];
    let filledFields = 0;

    requiredFields.forEach(field => {
      const value = profile[field.key as keyof ProfileData];
      if (field.key === 'workout_schedule') {
        // Special handling for workout_schedule array
        if (Array.isArray(value) && value.length > 0) {
          filledFields++;
        } else {
          missingFields.push(field.label);
        }
      } else if (!value || (typeof value === 'string' && value.trim() === '')) {
        missingFields.push(field.label);
      } else {
        filledFields++;
      }
    });

    const completionPercentage = Math.round((filledFields / requiredFields.length) * 100);
    const isComplete = missingFields.length === 0;

    return { isComplete, missingFields, completionPercentage };
  };

  const { isComplete, missingFields, completionPercentage } = checkProfileCompleteness();

  if (isComplete) {
    return null; // Don't show anything if profile is complete
  }

  if (showMinimal) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-700 font-medium">
            Profile {completionPercentage}% complete
          </span>
          <Button 
            onClick={onCompleteProfile}
            variant="outline" 
            size="sm"
            className="ml-auto text-xs"
          >
            Complete Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-2 rounded-lg">
            <AlertCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg text-amber-800">Complete Your Profile</CardTitle>
            <CardDescription className="text-amber-600">
              AI workout generation requires your complete profile information
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-amber-700">Profile Completion</span>
          <Badge 
            variant="secondary" 
            className="bg-amber-100 text-amber-800 border-amber-300"
          >
            {completionPercentage}%
          </Badge>
        </div>
        
        <div className="bg-amber-100 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-amber-800 mb-2">Missing Information:</p>
          <div className="grid grid-cols-1 gap-2">
            {missingFields.map((field, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm text-amber-700">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span>{field}</span>
              </div>
            ))}
          </div>
        </div>

        <Button 
          onClick={onCompleteProfile}
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
        >
          <User className="h-4 w-4 mr-2" />
          Complete Profile Now
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionCheck;
