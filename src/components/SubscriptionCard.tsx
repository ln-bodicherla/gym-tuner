
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Check, Lock } from "lucide-react";

interface SubscriptionCardProps {
  hasAccess: boolean;
  onUpgrade: () => void;
  compact?: boolean;
}

const SubscriptionCard = ({ hasAccess, onUpgrade, compact = false }: SubscriptionCardProps) => {
  if (hasAccess && compact) {
    return (
      <div className="flex items-center space-x-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
        <Crown className="h-4 w-4 text-green-600" />
        <span className="font-medium">Pro Active</span>
      </div>
    );
  }

  if (hasAccess) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-800">Pro Active</CardTitle>
          </div>
          <CardDescription className="text-green-600">
            You have access to all premium features
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mb-3">
          <Crown className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-xl">Gym Tuner Pro</CardTitle>
        <CardDescription>
          Unlock all premium features with one subscription
        </CardDescription>
        <div className="text-center space-y-1">
          <div className="text-3xl font-bold text-gray-900">$9.99</div>
          <div className="text-gray-600">/month</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-sm">Unlimited AI-generated workout plans</span>
          </div>
          <div className="flex items-center space-x-3">
            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-sm">AI-powered insights & analytics</span>
          </div>
          <div className="flex items-center space-x-3">
            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-sm">Advanced workout tracking</span>
          </div>
          <div className="flex items-center space-x-3">
            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-sm">Personalized injury management</span>
          </div>
          <div className="flex items-center space-x-3">
            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-sm">Priority customer support</span>
          </div>
        </div>
        
        <Button 
          onClick={onUpgrade}
          className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
          size={compact ? "sm" : "lg"}
        >
          <Crown className="h-4 w-4 mr-2" />
          Upgrade to Pro
        </Button>
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;
