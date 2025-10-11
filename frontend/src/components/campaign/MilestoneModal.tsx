import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  Target,
  CheckCircle
} from 'lucide-react';

interface Milestone {
  id?: string;
  title: string;
  description: string;
  amount: number;
  deadline: string;
  order: number;
}

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (milestones: Omit<Milestone, 'id'>[]) => void;
  campaignTargetAmount?: number;
  existingMilestones?: Milestone[];
  isLoading?: boolean;
  mode?: 'create' | 'edit';
  title?: string;
}

const MilestoneModal: React.FC<MilestoneModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  campaignTargetAmount = 0,
  existingMilestones = [],
  isLoading = false,
  mode = 'create',
  title
}) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Local formatCurrency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Create a stable reference for existingMilestones to prevent infinite re-renders
  const stableExistingMilestones = useMemo(() => {
    return JSON.stringify(existingMilestones);
  }, [existingMilestones]);

  // Prevent Enter key from causing page refresh
  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log('handleKeyDown triggered:', e.key, e.target);
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      console.log('Enter key prevented');
    }
  };

  // Add debugging to milestone initialization
  useEffect(() => {
    console.log('MilestoneModal useEffect triggered:', { isOpen, mode, existingMilestones, milestones });
    if (isOpen) {
      if (mode === 'edit' && existingMilestones.length > 0) {
        setMilestones(existingMilestones.map(m => ({
          ...m,
          deadline: m.deadline.split('T')[0] // Convert to date input format
        })));
      } else if (mode === 'create') {
        setMilestones([
          {
            title: '',
            description: '',
            amount: 0,
            deadline: '',
            order: 1
          }
        ]);
      }
      setErrors({});
    }
  }, [isOpen, mode, stableExistingMilestones]);

  const addMilestone = () => {
    const newMilestone: Milestone = {
      title: '',
      description: '',
      amount: 0,
      deadline: '',
      order: milestones.length + 1
    };
    setMilestones([...milestones, newMilestone]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length <= 1) return;
    const updated = milestones.filter((_, i) => i !== index);
    // Reorder remaining milestones
    const reordered = updated.map((m, i) => ({ ...m, order: i + 1 }));
    setMilestones(reordered);
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: string | number) => {
    console.log('updateMilestone called:', { index, field, value, currentMilestones: milestones });
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
    
    // Clear field-specific errors
    const errorKey = `${index}.${field}`;
    if (errors[errorKey]) {
      setErrors({ ...errors, [errorKey]: '' });
    }
  };

  const validateMilestones = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    // Check if at least one milestone exists
    if (milestones.length === 0) {
      newErrors.general = 'At least one milestone is required';
      isValid = false;
    }

    milestones.forEach((milestone, index) => {
      // Title validation
      if (!milestone.title.trim()) {
        newErrors[`${index}.title`] = 'Title is required';
        isValid = false;
      } else if (milestone.title.trim().length < 3) {
        newErrors[`${index}.title`] = 'Title must be at least 3 characters';
        isValid = false;
      }

      // Description validation
      if (!milestone.description.trim()) {
        newErrors[`${index}.description`] = 'Description is required';
        isValid = false;
      } else if (milestone.description.trim().length < 10) {
        newErrors[`${index}.description`] = 'Description must be at least 10 characters';
        isValid = false;
      }

      // Amount validation
      if (!milestone.amount || milestone.amount <= 0) {
        newErrors[`${index}.amount`] = 'Amount must be greater than 0';
        isValid = false;
      }

      // Deadline validation
      if (!milestone.deadline) {
        newErrors[`${index}.deadline`] = 'Deadline is required';
        isValid = false;
      } else {
        const deadlineDate = new Date(milestone.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (deadlineDate <= today) {
          newErrors[`${index}.deadline`] = 'Deadline must be in the future';
          isValid = false;
        }
      }
    });

    // Check total amount doesn't exceed campaign target
    const totalAmount = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
    if (campaignTargetAmount > 0 && totalAmount > campaignTargetAmount) {
      newErrors.totalAmount = `Total milestone amount (${formatCurrency(totalAmount)}) cannot exceed campaign target (${formatCurrency(campaignTargetAmount)})`;
      isValid = false;
    }

    // Check for duplicate titles
    const titles = milestones.map(m => m.title.trim().toLowerCase());
    const duplicates = titles.filter((title, index) => title && titles.indexOf(title) !== index);
    if (duplicates.length > 0) {
      newErrors.duplicateTitles = 'Milestone titles must be unique';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (!validateMilestones()) return;

    // Convert dates back to ISO format and remove id for new milestones
    const submissionData = milestones.map(({ id, ...milestone }) => ({
      ...milestone,
      deadline: new Date(milestone.deadline).toISOString()
    }));

    onSubmit(submissionData);
  };

  const totalAmount = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
  const remainingAmount = campaignTargetAmount - totalAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            {title || (mode === 'edit' ? 'Edit Milestones' : 'Create Campaign Milestones')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Update your campaign milestones. Note that milestones that are already submitted or approved cannot be modified.'
              : 'Set up milestones to track your progress and build backer confidence. Funds will be released as you complete each milestone.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Milestones</p>
                  <p className="text-xl font-bold">{milestones.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
                </div>
                {campaignTargetAmount > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Remaining</p>
                    <p className={`text-xl font-bold ${remainingAmount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(remainingAmount)}
                    </p>
                  </div>
                )}
              </div>
              
              {errors.totalAmount && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-red-800 text-sm">{errors.totalAmount}</span>
                  </div>
                </div>
              )}
              
              {errors.duplicateTitles && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-red-800 text-sm">{errors.duplicateTitles}</span>
                  </div>
                </div>
              )}
              
              {errors.general && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-red-800 text-sm">{errors.general}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Milestones */}
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <Card key={`milestone-${index}-${milestone.order}`} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        Milestone {milestone.order}
                      </Badge>
                      {milestones.length > 1 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeMilestone(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      {/* Title */}
                      <div>
                        <Label htmlFor={`title-${index}`}>Title *</Label>
                        <Input
                          id={`title-${index}`}
                          value={milestone.title || ''}
                          onChange={(e) => {
                            console.log('Title input onChange:', e.target.value);
                            updateMilestone(index, 'title', e.target.value);
                          }}
                          placeholder="e.g., Complete MVP Development"
                          className={errors[`${index}.title`] ? 'border-red-500' : ''}
                        />
                        {errors[`${index}.title`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`${index}.title`]}</p>
                        )}
                      </div>

                      {/* Amount */}
                      <div>
                        <Label htmlFor={`amount-${index}`}>Amount *</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id={`amount-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={milestone.amount === 0 ? '0' : (milestone.amount || '')}
                            onChange={(e) => {
                              console.log('Amount input onChange:', e.target.value);
                              updateMilestone(index, 'amount', parseFloat(e.target.value) || 0);
                            }}
                            placeholder="0.00"
                            className={`pl-10 ${errors[`${index}.amount`] ? 'border-red-500' : ''}`}
                          />
                        </div>
                        {errors[`${index}.amount`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`${index}.amount`]}</p>
                        )}
                      </div>

                      {/* Deadline */}
                      <div>
                        <Label htmlFor={`deadline-${index}`}>Deadline *</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id={`deadline-${index}`}
                            type="date"
                            value={milestone.deadline || ''}
                            onChange={(e) => {
                              console.log('Deadline input onChange:', e.target.value);
                              updateMilestone(index, 'deadline', e.target.value);
                            }}
                            min={new Date().toISOString().split('T')[0]}
                            className={`pl-10 ${errors[`${index}.deadline`] ? 'border-red-500' : ''}`}
                          />
                        </div>
                        {errors[`${index}.deadline`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`${index}.deadline`]}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      {/* Description */}
                      <div>
                        <Label htmlFor={`description-${index}`}>Description *</Label>
                        <Textarea
                          id={`description-${index}`}
                          value={milestone.description || ''}
                          onChange={(e) => {
                            console.log('Description textarea onChange:', e.target.value);
                            updateMilestone(index, 'description', e.target.value);
                          }}
                          placeholder="Describe what will be accomplished in this milestone..."
                          rows={6}
                          className={errors[`${index}.description`] ? 'border-red-500' : ''}
                        />
                        {errors[`${index}.description`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`${index}.description`]}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {(milestone.description || '').length}/500 characters
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add Milestone Button */}
          <div className="text-center">
            <Button
              variant="outline"
              onClick={addMilestone}
              className="border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Milestone
            </Button>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || milestones.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
              {mode === 'edit' ? 'Update Milestones' : 'Create Milestones'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MilestoneModal; 