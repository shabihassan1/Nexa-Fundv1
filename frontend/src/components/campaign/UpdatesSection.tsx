import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  AlertCircle
} from 'lucide-react';
import { fetchUpdatesByCampaign, createUpdate, updateUpdate, deleteUpdate, Update } from '@/services/updateService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import StoredImage from '@/components/ui/StoredImage';

interface UpdatesSectionProps {
  campaignId: string;
  isCreator: boolean;
}

// UpdatesSection component for displaying and managing campaign updates
const UpdatesSection: React.FC<UpdatesSectionProps> = ({ campaignId, isCreator }) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<Update | null>(null);
  const [newUpdate, setNewUpdate] = useState({
    title: '',
    content: '',
    imageUrl: ''
  });

  // Fetch updates
  const { data: updates = [], isLoading, error } = useQuery({
    queryKey: ['updates', campaignId],
    queryFn: () => fetchUpdatesByCampaign(campaignId),
    enabled: !!campaignId
  });

  // Create update mutation
  const createUpdateMutation = useMutation({
    mutationFn: (updateData: { title: string; content: string; imageUrl?: string }) =>
      createUpdate({ ...updateData, campaignId }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['updates', campaignId] });
      setIsCreateModalOpen(false);
      setNewUpdate({ title: '', content: '', imageUrl: '' });
      toast({
        title: "Update posted",
        description: "Your update has been posted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to post update",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update update mutation
  const updateUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; content?: string; imageUrl?: string } }) =>
      updateUpdate(id, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['updates', campaignId] });
      setIsEditModalOpen(false);
      setEditingUpdate(null);
      toast({
        title: "Update edited",
        description: "Your update has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to edit update",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete update mutation
  const deleteUpdateMutation = useMutation({
    mutationFn: (updateId: string) => deleteUpdate(updateId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['updates', campaignId] });
      toast({
        title: "Update deleted",
        description: "The update has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete update",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCreateUpdate = () => {
    if (!newUpdate.title.trim() || !newUpdate.content.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in both title and content.",
        variant: "destructive",
      });
      return;
    }

    createUpdateMutation.mutate({
      title: newUpdate.title,
      content: newUpdate.content,
      imageUrl: newUpdate.imageUrl || undefined
    });
  };

  const handleEditUpdate = () => {
    if (!editingUpdate) return;

    updateUpdateMutation.mutate({
      id: editingUpdate.id,
      data: {
        title: editingUpdate.title,
        content: editingUpdate.content,
        imageUrl: editingUpdate.imageUrl || undefined
      }
    });
  };

  const handleDeleteUpdate = (updateId: string) => {
    if (window.confirm('Are you sure you want to delete this update? This action cannot be undone.')) {
      deleteUpdateMutation.mutate(updateId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-gray-500">Loading updates...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600">Failed to load updates</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with create button for creators */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <TrendingUp className="h-6 w-6 mr-2" />
          Updates
        </h2>
        {isCreator && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-500 hover:bg-green-600">
                <Plus className="h-4 w-4 mr-2" />
                Post Update
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Post New Update</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    value={newUpdate.title}
                    onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
                    placeholder="Update title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <Textarea
                    value={newUpdate.content}
                    onChange={(e) => setNewUpdate({ ...newUpdate, content: e.target.value })}
                    placeholder="Share what's new with your backers..."
                    rows={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Image URL (optional)</label>
                  <Input
                    value={newUpdate.imageUrl}
                    onChange={(e) => setNewUpdate({ ...newUpdate, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateUpdate}
                    disabled={createUpdateMutation.isPending}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    {createUpdateMutation.isPending ? 'Posting...' : 'Post Update'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Updates list */}
      {updates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No updates yet</h3>
            <p className="text-gray-600">
              {isCreator 
                ? "Post your first update to keep your backers informed!" 
                : "The creator hasn't posted any updates yet."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {updates.map((update) => (
            <Card key={update.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{update.title}</CardTitle>
                    <div className="flex items-center text-sm text-gray-500 gap-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {update.creator.name || 'Campaign Creator'}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(update.createdAt)}
                      </div>
                      {update.createdAt !== update.updatedAt && (
                        <Badge variant="secondary" className="text-xs">
                          Edited
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isCreator && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingUpdate(update);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUpdate(update.id)}
                        disabled={deleteUpdateMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700">{update.content}</p>
                  {update.imageUrl && (
                    <div className="mt-4">
                      <StoredImage
                        storageKey={update.imageUrl}
                        alt="Update image"
                        className="w-full max-w-lg rounded-lg"
                        fallbackSrc="/placeholder.svg"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Update Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Update</DialogTitle>
          </DialogHeader>
          {editingUpdate && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  value={editingUpdate.title}
                  onChange={(e) => setEditingUpdate({ ...editingUpdate, title: e.target.value })}
                  placeholder="Update title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <Textarea
                  value={editingUpdate.content}
                  onChange={(e) => setEditingUpdate({ ...editingUpdate, content: e.target.value })}
                  placeholder="Share what's new with your backers..."
                  rows={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Image URL (optional)</label>
                <Input
                  value={editingUpdate.imageUrl || ''}
                  onChange={(e) => setEditingUpdate({ ...editingUpdate, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleEditUpdate}
                  disabled={updateUpdateMutation.isPending}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {updateUpdateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UpdatesSection; 