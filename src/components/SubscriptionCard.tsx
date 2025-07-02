
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Check, Clock } from "lucide-react";
import { PRO_FEATURES } from "@/config/subscriptionFeatures";

interface SubscriptionCardProps {
  hasAccess: boolean;
  onUpgrade: () => void;
  compact?: boolean;
  isInTrial?: boolean;
  trialDaysRemaining?: number;
}

const SubscriptionCard = ({ 
  hasAccess, 
  onUpgrade, 
  compact = false, 
  isInTrial = false, 
  trialDaysRemaining = 0 
}: SubscriptionCardProps) => {
  if (hasAccess && compact) {
    return (
      <div className="flex items-center space-x-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
        {isInTrial ? (
          <>
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Trial ({trialDaysRemaining} days left)</span>
          </>
        ) : (
          <>
            <Crown className="h-4 w-4 text-green-600" />
            <span className="font-medium">Pro Active</span>
          </>
        )}
      </div>
    );
  }

  if (hasAccess) {
    return (
      <Card className={isInTrial ? "border-blue-200 bg-blue-50" : "border-green-200 bg-green-50"}>
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            {isInTrial ? (
              <Clock className="h-5 w-5 text-blue-600" />
            ) : (
              <Crown className="h-5 w-5 text-green-600" />
            )}
            <CardTitle className={isInTrial ? "text-blue-800" : "text-green-800"}>
              {isInTrial ? `Trial Active (${trialDaysRemaining} days left)` : 'Pro Active'}
            </CardTitle>
          </div>
          <CardDescription className={isInTrial ? "text-blue-600" : "text-green-600"}>
            {isInTrial 
              ? `Enjoying your free trial with ${trialDaysRemaining} days remaining`
              : 'You have access to all premium features'
            }
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
          Start with a 14-day free trial
        </CardDescription>
        <div className="text-center space-y-1">
          <div className="text-2xl font-bold text-green-600">Free for 14 Days</div>
          <div className="text-gray-600">Then $2.99/month</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {PRO_FEATURES.map((feature, index) => (
            <div key={index} className="flex items-center space-x-3">
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
        
        <Button 
          onClick={onUpgrade}
          className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
          size={compact ? "sm" : "lg"}
        >
          <Clock className="h-4 w-4 mr-2" />
          Start Free Trial
        </Button>
        
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">
            No payment required today
          </p>
          <p className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
            💰 Cancel anytime during trial
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;
