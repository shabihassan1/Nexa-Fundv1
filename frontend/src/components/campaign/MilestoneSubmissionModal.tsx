import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Link as LinkIcon, 
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle,
  Calendar,
  DollarSign,
  X,
  Plus
} from 'lucide-react';
import { uploadMultipleFiles } from '@/services/uploadService';

interface MilestoneSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (submissionData: {
    description: string;
    evidence: {
      files: string[];
      links: string[];
      textItems?: Array<{ title: string; content: string }>;
    };
  }) => Promise<void>;
  milestone?: {
    id: string;
    title: string;
    description: string;
    amount: number;
    order: number;
    deadline: string;
    status: string;
  };
  isLoading?: boolean;
}

interface EvidenceItem {
  type: 'link' | 'file' | 'text';
  title: string;
  content: string | File;
  description?: string;
}

const MilestoneSubmissionModal: React.FC<MilestoneSubmissionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  milestone,
  isLoading = false
}) => {
  const [description, setDescription] = useState('');
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [uploading, setUploading] = useState(false);

  // Local formatCurrency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const addEvidenceItem = (type: 'link' | 'file' | 'text') => {
    const newItem: EvidenceItem = {
      type,
      title: '',
      content: type === 'file' ? '' : '',
      description: ''
    };
    setEvidenceItems([...evidenceItems, newItem]);
  };

  const removeEvidenceItem = (index: number) => {
    setEvidenceItems(evidenceItems.filter((_, i) => i !== index));
  };

  const updateEvidenceItem = (index: number, field: keyof EvidenceItem, value: any) => {
    const updated = [...evidenceItems];
    updated[index] = { ...updated[index], [field]: value };
    setEvidenceItems(updated);
  };

  const handleFileChange = (index: number, file: File | null) => {
    if (file) {
      updateEvidenceItem(index, 'content', file);
      if (!evidenceItems[index].title) {
        updateEvidenceItem(index, 'title', file.name);
      }
      // Clear the error for this specific field
      const errorKey = `evidence.${index}.content`;
      if (errors[errorKey]) {
        const newErrors = { ...errors };
        delete newErrors[errorKey];
        setErrors(newErrors);
      }
    }
  };

  const validateSubmission = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    // Description validation
    if (!description.trim()) {
      newErrors.description = 'Submission description is required';
      isValid = false;
    } else if (description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
      isValid = false;
    }

    // Evidence validation
    if (evidenceItems.length === 0) {
      newErrors.evidence = 'At least one piece of evidence is required';
      isValid = false;
    }

    evidenceItems.forEach((item, index) => {
      if (!item.title.trim()) {
        newErrors[`evidence.${index}.title`] = 'Title is required';
        isValid = false;
      }

      if (item.type === 'link') {
        if (!item.content || typeof item.content !== 'string' || !item.content.trim()) {
          newErrors[`evidence.${index}.content`] = 'URL is required';
          isValid = false;
        } else {
          try {
            new URL(item.content as string);
          } catch {
            newErrors[`evidence.${index}.content`] = 'Please enter a valid URL';
            isValid = false;
          }
        }
      } else if (item.type === 'file') {
        if (!item.content) {
          newErrors[`evidence.${index}.content`] = 'File is required';
          isValid = false;
        }
      } else if (item.type === 'text') {
        if (!item.content || typeof item.content !== 'string' || !item.content.trim()) {
          newErrors[`evidence.${index}.content`] = 'Text content is required';
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateSubmission()) return;
    
    setUploading(true);
    
    try {
      // Collect all files to upload
      const filesToUpload = evidenceItems
        .filter(item => item.type === 'file' && item.content instanceof File)
        .map(item => item.content as File);
      
      // Upload all files to backend
      const uploadedUrls = filesToUpload.length > 0 
        ? await uploadMultipleFiles(filesToUpload)
        : [];
      
      // Collect all links
      const links = evidenceItems
        .filter(item => item.type === 'link')
        .map(item => ({
          url: item.content as string,
          title: item.title.trim(),
          description: item.description?.trim() || ''
        }));
      
      // Include text evidence in description with proper formatting
      const textEvidence = evidenceItems
        .filter(item => item.type === 'text')
        .map(item => `\n\n### ${item.title}\n${item.content}`)
        .join('');
      
      const fullDescription = description.trim() + textEvidence;
      
      // Backend expects { evidence: {...}, description: "..." }
      const submissionData = {
        description: fullDescription,
        evidence: {
          files: uploadedUrls,
          links: links.map(l => l.url),
          textItems: evidenceItems
            .filter(item => item.type === 'text')
            .map(item => ({
              title: item.title,
              content: item.content as string
            }))
        }
      };

      await onSubmit(submissionData);
    } catch (error) {
      console.error('Error submitting milestone:', error);
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to submit milestone' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setDescription('');
    setEvidenceItems([]);
    setErrors({});
    onClose();
  };

  if (!milestone) return null;

  const isOverdue = new Date(milestone.deadline) < new Date();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Submit Milestone Evidence
          </DialogTitle>
          <DialogDescription>
            Provide evidence that this milestone has been completed. This will initiate community voting for fund release.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Milestone Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    Milestone {milestone.order}
                  </Badge>
                  <Badge 
                    variant={milestone.status === 'PENDING' ? 'outline' : 'default'}
                    className={milestone.status === 'PENDING' ? 'border-yellow-500 text-yellow-700' : ''}
                  >
                    {milestone.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {formatCurrency(milestone.amount)}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Due: {new Date(milestone.deadline).toLocaleDateString()}
                    {isOverdue && (
                      <span className="ml-1 text-red-600 font-medium">(Overdue)</span>
                    )}
                  </div>
                </div>
              </div>
              
              <h3 className="font-medium text-lg mb-2">{milestone.title}</h3>
              <p className="text-gray-700">{milestone.description}</p>
              
              {isOverdue && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-red-800 text-sm">
                      This milestone is overdue. Please provide explanation in your submission.
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submission Description */}
          <div>
            <Label htmlFor="description">Submission Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                // Clear description error when user types enough
                if (e.target.value.trim().length >= 20 && errors.description) {
                  const newErrors = { ...errors };
                  delete newErrors.description;
                  setErrors(newErrors);
                }
              }}
              placeholder="Describe how you completed this milestone. Include details about what was accomplished, any challenges faced, and how the goals were met..."
              rows={4}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/1000 characters (minimum 20 required)
            </p>
          </div>

          {/* Evidence Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label>Evidence *</Label>
                <p className="text-sm text-gray-600">
                  Provide proof of milestone completion (links, files, screenshots, etc.)
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addEvidenceItem('link')}
                >
                  <LinkIcon className="h-4 w-4 mr-1" />
                  Add Link
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addEvidenceItem('file')}
                >
                  <ImageIcon className="h-4 w-4 mr-1" />
                  Add File
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addEvidenceItem('text')}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Add Text
                </Button>
              </div>
            </div>

            {errors.evidence && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-red-800 text-sm">{errors.evidence}</span>
                </div>
              </div>
            )}

            {/* Evidence Items */}
            <div className="space-y-4">
              {evidenceItems.map((item, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {item.type === 'link' && <LinkIcon className="h-4 w-4 text-blue-600" />}
                        {item.type === 'file' && <ImageIcon className="h-4 w-4 text-green-600" />}
                        {item.type === 'text' && <FileText className="h-4 w-4 text-purple-600" />}
                        <span className="text-sm font-medium capitalize">{item.type}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeEvidenceItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`evidence-title-${index}`}>Title *</Label>
                        <Input
                          id={`evidence-title-${index}`}
                          value={item.title}
                          onChange={(e) => {
                            updateEvidenceItem(index, 'title', e.target.value);
                            // Clear title error when user starts typing
                            if (e.target.value.trim() && errors[`evidence.${index}.title`]) {
                              const newErrors = { ...errors };
                              delete newErrors[`evidence.${index}.title`];
                              setErrors(newErrors);
                            }
                          }}
                          placeholder="e.g., Demo Video, Screenshots, Repository Link"
                          className={errors[`evidence.${index}.title`] ? 'border-red-500' : ''}
                        />
                        {errors[`evidence.${index}.title`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`evidence.${index}.title`]}</p>
                        )}
                      </div>

                      <div>
                        {item.type === 'link' && (
                          <>
                            <Label htmlFor={`evidence-url-${index}`}>URL *</Label>
                            <Input
                              id={`evidence-url-${index}`}
                              type="url"
                              value={item.content as string}
                              onChange={(e) => {
                                updateEvidenceItem(index, 'content', e.target.value);
                                // Clear URL error when user starts typing
                                if (e.target.value.trim() && errors[`evidence.${index}.content`]) {
                                  const newErrors = { ...errors };
                                  delete newErrors[`evidence.${index}.content`];
                                  setErrors(newErrors);
                                }
                              }}
                              placeholder="https://example.com"
                              className={errors[`evidence.${index}.content`] ? 'border-red-500' : ''}
                            />
                            {errors[`evidence.${index}.content`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`evidence.${index}.content`]}</p>
                            )}
                          </>
                        )}

                        {item.type === 'file' && (
                          <>
                            <Label htmlFor={`evidence-file-${index}`}>File *</Label>
                            <Input
                              id={`evidence-file-${index}`}
                              type="file"
                              onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
                              accept="image/*,.pdf,.doc,.docx,.txt"
                              className={errors[`evidence.${index}.content`] ? 'border-red-500' : ''}
                            />
                            {item.content instanceof File && (
                              <div className="flex items-center mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                                <span className="text-sm text-green-800">
                                  Selected: {(item.content as File).name} ({Math.round((item.content as File).size / 1024)}KB)
                                </span>
                              </div>
                            )}
                            {errors[`evidence.${index}.content`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`evidence.${index}.content`]}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Supported: Images, PDF, Word documents, Text files (max 10MB)
                            </p>
                          </>
                        )}

                        {item.type === 'text' && (
                          <>
                            <Label htmlFor={`evidence-text-${index}`}>Content *</Label>
                            <Textarea
                              id={`evidence-text-${index}`}
                              value={item.content as string}
                              onChange={(e) => {
                                updateEvidenceItem(index, 'content', e.target.value);
                                // Clear text error when user starts typing
                                if (e.target.value.trim() && errors[`evidence.${index}.content`]) {
                                  const newErrors = { ...errors };
                                  delete newErrors[`evidence.${index}.content`];
                                  setErrors(newErrors);
                                }
                              }}
                              placeholder="Provide detailed text evidence..."
                              rows={3}
                              className={errors[`evidence.${index}.content`] ? 'border-red-500' : ''}
                            />
                            {errors[`evidence.${index}.content`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`evidence.${index}.content`]}</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      <Label htmlFor={`evidence-desc-${index}`}>Description (Optional)</Label>
                      <Input
                        id={`evidence-desc-${index}`}
                        value={item.description || ''}
                        onChange={(e) => updateEvidenceItem(index, 'description', e.target.value)}
                        placeholder="Additional context about this evidence..."
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {evidenceItems.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No evidence added yet</h3>
                    <p className="text-gray-600 mb-4">
                      Add links, files, or text to demonstrate milestone completion
                    </p>
                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => addEvidenceItem('link')}
                      >
                        <LinkIcon className="h-4 w-4 mr-1" />
                        Add Link
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => addEvidenceItem('file')}
                      >
                        <ImageIcon className="h-4 w-4 mr-1" />
                        Add File
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => addEvidenceItem('text')}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Add Text
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Important Notice */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">What happens after submission?</h4>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>• Your evidence will be reviewed by the community</li>
                    <li>• Backers will vote to approve or reject the milestone</li>
                    <li>• If approved, funds will be released to your wallet</li>
                    <li>• The voting period typically lasts 7 days</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-red-800 text-sm">{errors.submit}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleClose} disabled={isLoading || uploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || uploading || !description.trim() || evidenceItems.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {(isLoading || uploading) && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
              {uploading ? 'Uploading Files...' : 'Submit for Review'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MilestoneSubmissionModal; 