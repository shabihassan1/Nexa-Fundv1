import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Loader2, Save, RotateCcw, Target } from 'lucide-react';
import { preferencesService, UserPreferences } from '@/services/preferencesService';
import { toast } from '@/hooks/use-toast';

const PreferencesEditor = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<UserPreferences>>({
    interests: [],
    fundingPreference: null,
    riskTolerance: null,
    interestKeywords: [],
  });
  const [keywordsText, setKeywordsText] = useState('');

  // Fetch available categories
  const { data: categories } = useQuery({
    queryKey: ['preferences-categories'],
    queryFn: () => preferencesService.getCategories(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch user's current preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['my-preferences'],
    queryFn: () => preferencesService.getMyPreferences(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Update form when preferences load
  useEffect(() => {
    if (preferences) {
      setFormData({
        interests: preferences.interests || [],
        fundingPreference: preferences.fundingPreference,
        riskTolerance: preferences.riskTolerance,
        interestKeywords: preferences.interestKeywords || [],
      });
      setKeywordsText(preferences.interestKeywords?.join(', ') || '');
    }
  }, [preferences]);

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<UserPreferences>) => preferencesService.updateMyPreferences(data),
    onSuccess: () => {
      toast({
        title: 'Preferences saved',
        description: 'Your personalization preferences have been updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['my-preferences'] });
    },
    onError: () => {
      toast({
        title: 'Failed to save',
        description: 'Could not update your preferences. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Reset preferences mutation
  const resetMutation = useMutation({
    mutationFn: () => preferencesService.resetMyPreferences(),
    onSuccess: () => {
      toast({
        title: 'Preferences reset',
        description: 'Your preferences have been reset to defaults.',
      });
      queryClient.invalidateQueries({ queryKey: ['my-preferences'] });
    },
  });

  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => {
      const interests = prev.interests || [];
      const newInterests = interests.includes(interest)
        ? interests.filter((i) => i !== interest)
        : [...interests, interest];
      return { ...prev, interests: newInterests };
    });
  };

  const handleSliderChange = (field: keyof UserPreferences, value: number) => {
    const options = {
      fundingPreference: ['small', 'medium', 'large'],
      riskTolerance: ['low', 'medium', 'high'],
    };
    
    const selectedValue = options[field as keyof typeof options]?.[value];
    setFormData((prev) => ({ ...prev, [field]: selectedValue }));
  };

  const handleSave = () => {
    // Parse keywords from text
    const keywords = keywordsText
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    updateMutation.mutate({
      ...formData,
      interestKeywords: keywords,
    });
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset your preferences? This cannot be undone.')) {
      resetMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Personalization Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSliderValue = (field: keyof UserPreferences) => {
    const value = formData[field];
    const options = {
      fundingPreference: ['small', 'medium', 'large'],
      riskTolerance: ['low', 'medium', 'high'],
    };
    return options[field as keyof typeof options]?.indexOf(value as string) || 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Personalization Preferences
        </CardTitle>
        <CardDescription>
          Help us recommend campaigns that match your interests. This will personalize your browse
          experience.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Interest Categories */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Select Your Interests</Label>
          <p className="text-sm text-muted-foreground">Choose all categories that interest you</p>
          <div className="grid grid-cols-2 gap-3">
            {categories?.categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={category}
                  checked={formData.interests?.includes(category)}
                  onCheckedChange={() => handleInterestToggle(category)}
                />
                <label
                  htmlFor={category}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
                >
                  {category.replace('-', ' ')}
                </label>
              </div>
            ))}
          </div>
          {formData.interests && formData.interests.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {formData.interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="capitalize">
                  {interest.replace('-', ' ')}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Funding Goal Preference */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Funding Goal Preference</Label>
          <p className="text-sm text-muted-foreground">
            What size campaigns do you prefer to support?
          </p>
          <div className="space-y-2">
            <Slider
              value={[getSliderValue('fundingPreference')]}
              max={2}
              step={1}
              onValueChange={(value) => handleSliderChange('fundingPreference', value[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Small ($100-1k)</span>
              <span>Medium ($1k-10k)</span>
              <span>Large ($10k+)</span>
            </div>
            {formData.fundingPreference && (
              <Badge variant="outline" className="mt-2 capitalize">
                {formData.fundingPreference} campaigns
              </Badge>
            )}
          </div>
        </div>

        {/* Risk Tolerance */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Risk Tolerance</Label>
          <p className="text-sm text-muted-foreground">
            Do you prefer established creators or are you open to new creators?
          </p>
          <div className="space-y-2">
            <Slider
              value={[getSliderValue('riskTolerance')]}
              max={2}
              step={1}
              onValueChange={(value) => handleSliderChange('riskTolerance', value[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Established creators</span>
              <span>Balanced</span>
              <span>New creators</span>
            </div>
            {formData.riskTolerance && (
              <Badge variant="outline" className="mt-2 capitalize">
                {formData.riskTolerance} risk
              </Badge>
            )}
          </div>
        </div>

        {/* Keywords */}
        <div className="space-y-3">
          <Label htmlFor="keywords" className="text-base font-semibold">
            Interest Keywords (Optional)
          </Label>
          <p className="text-sm text-muted-foreground">
            Add specific causes or topics you care about (comma-separated)
          </p>
          <Textarea
            id="keywords"
            placeholder="e.g., climate change, mental health, education access, clean water"
            value={keywordsText}
            onChange={(e) => setKeywordsText(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">Maximum 200 characters</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex-1"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={resetMutation.isPending}
          >
            {resetMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Status Message */}
        {preferences?.preferencesSet && (
          <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3 text-sm text-green-800 dark:text-green-200">
            ✓ Your preferences are set! Browse page will show personalized recommendations.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PreferencesEditor;
