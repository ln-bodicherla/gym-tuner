
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Crown } from "lucide-react";
import SubscriptionCard from './SubscriptionCard';

interface LockedFeatureProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  onUpgrade: () => void;
}

const LockedFeature = ({ title, description, icon, onUpgrade }: LockedFeatureProps) => {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-2 rounded-lg">
            {icon || <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />}
          </div>
          <div>
            <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
              <span>{title}</span>
              <Crown className="h-4 w-4 text-yellow-500" />
            </CardTitle>
            <CardDescription className="text-sm">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Lock className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-orange-800 mb-2">Pro Feature</h3>
          <p className="text-orange-700 mb-6">
            This feature is available with Gym Tuner Pro subscription.
          </p>
          <SubscriptionCard 
            hasAccess={false} 
            onUpgrade={onUpgrade} 
            compact={true}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default LockedFeature;
