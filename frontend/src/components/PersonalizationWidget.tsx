// PersonalizationWidget.tsx - Right sidebar personalization components

import { Target, Settings, TrendingUp, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface PersonalizedWidgetProps {
  interests?: string[];
  fundingPreference?: string | null;
  riskTolerance?: string | null;
}

export const PersonalizedWidget = ({ interests, fundingPreference, riskTolerance }: PersonalizedWidgetProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-green-600" />
          Personalized For You
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {interests && interests.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Based on your interests:</p>
            <div className="flex flex-wrap gap-1.5">
              {interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="text-xs capitalize">
                  {interest.replace('-', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {(fundingPreference || riskTolerance) && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Preferences:</p>
            <div className="space-y-1 text-sm">
              {fundingPreference && (
                <p className="text-gray-700">• {fundingPreference.charAt(0).toUpperCase() + fundingPreference.slice(1)} campaigns</p>
              )}
              {riskTolerance && (
                <p className="text-gray-700">• {riskTolerance.charAt(0).toUpperCase() + riskTolerance.slice(1)} risk tolerance</p>
              )}
            </div>
          </div>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          onClick={() => navigate('/preferences')}
        >
          <Settings className="h-3.5 w-3.5 mr-1.5" />
          Edit Preferences
        </Button>
      </CardContent>
    </Card>
  );
};

export const PromptWidget = () => {
  const navigate = useNavigate();

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-green-600" />
          Get Personalized
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Set your interests to see campaigns you'll love!
        </p>
        <p className="text-xs text-gray-500">
          Takes only 30 seconds
        </p>
        <Button 
          variant="default" 
          size="sm" 
          className="w-full bg-green-600 hover:bg-green-700" 
          onClick={() => navigate('/preferences')}
        >
          Set Preferences Now
        </Button>
      </CardContent>
    </Card>
  );
};

interface StatsWidgetProps {
  backedCount?: number;
  totalContributed?: number;
  viewedCount?: number;
  savedCount?: number;
}

export const StatsWidget = ({ backedCount = 0, totalContributed = 0, viewedCount = 0, savedCount = 0 }: StatsWidgetProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          Your Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Campaigns Backed</span>
            <span className="font-medium">{backedCount}</span>
          </div>
          {totalContributed > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Contributed</span>
              <span className="font-medium">${totalContributed.toLocaleString()}</span>
            </div>
          )}
          {viewedCount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Campaigns Viewed</span>
              <span className="font-medium">{viewedCount}</span>
            </div>
          )}
          {savedCount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Campaigns Saved</span>
              <span className="font-medium">{savedCount}</span>
            </div>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          onClick={() => navigate('/dashboard')}
        >
          View Dashboard
        </Button>
      </CardContent>
    </Card>
  );
};

export const TrendingWidget = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-orange-600" />
          Trending Now
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Most popular campaigns in the last 7 days
        </p>
        <Button 
          variant="default" 
          size="sm" 
          className="w-full" 
          onClick={() => navigate('/login')}
        >
          Login for Personalized
        </Button>
      </CardContent>
    </Card>
  );
};
