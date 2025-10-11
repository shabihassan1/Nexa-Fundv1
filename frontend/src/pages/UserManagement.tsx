import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Users, 
  Search, 
  Filter,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  UserCheck,
  UserX,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import RoleBadge from '@/components/RoleBadge';
import { API_URL } from '@/config';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  isVerified: boolean;
  walletAddress: string;
  createdAt: string;
  _count: {
    campaignsCreated: number;
    contributions: number;
  };
}

interface UserStats {
  totalUsers: number;
  verifiedUsers: number;
  roleDistribution: Array<{
    role: string;
    _count: { id: number };
  }>;
}

const UserManagement = () => {
  const { user, isAuthenticated, token, isLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'role' | 'status' | 'verify' | null>(null);
  const [newRole, setNewRole] = useState('');
  const [newStatus, setNewStatus] = useState('');
  
  // Check if user is admin or super admin
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Show loading spinner while auth is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Redirect if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    console.log('UserManagement: Redirecting to home. isAuthenticated:', isAuthenticated, 'isAdmin:', isAdmin, 'userRole:', user?.role);
    return <Navigate to="/" replace />;
  }

  const fetchUsers = async (page = 1, search = '', role = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(role && role !== 'all' && { role })
      });

      const response = await fetch(`${API_URL}/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.pagination.pages);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/users/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        toast.success('User role updated successfully');
        fetchUsers(currentPage, searchTerm, roleFilter);
        fetchStats();
        setSelectedUser(null);
        setActionType(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success('User status updated successfully');
        fetchUsers(currentPage, searchTerm, roleFilter);
        fetchStats();
        setSelectedUser(null);
        setActionType(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const verifyUser = async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('User verified successfully');
        fetchUsers(currentPage, searchTerm, roleFilter);
        fetchStats();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to verify user');
      }
    } catch (error) {
      console.error('Error verifying user:', error);
      toast.error('Failed to verify user');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers(1, searchTerm, roleFilter);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchUsers(page, searchTerm, roleFilter);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-yellow-100 text-yellow-800">Suspended</Badge>;
      case 'BANNED':
        return <Badge className="bg-red-100 text-red-800">Banned</Badge>;
      case 'PENDING_VERIFICATION':
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const canModifyUser = (targetUser: User) => {
    // Super admin can modify anyone except themselves
    if (isSuperAdmin && targetUser.id !== user?.id) return true;
    
    // Regular admin cannot modify super admins or themselves
    if (targetUser.role === 'SUPER_ADMIN' || targetUser.id === user?.id) return false;
    
    return true;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateAddress = (address: string) => {
    if (address.startsWith('temp-')) {
      return 'Temp Address';
    }
    if (address.length > 10) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return address;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/admin" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Admin Panel
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Logged in as</p>
                <p className="font-medium">{user?.name || user?.email}</p>
              </div>
              {user?.role && <RoleBadge role={user.role} size="md" />}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">User Management</h1>
          <p className="text-gray-600 mt-2">Manage user accounts, roles, and permissions</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Verified Users</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.verifiedUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Admin Users</CardTitle>
                <Shield className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.roleDistribution
                    .filter(r => r.role === 'ADMIN' || r.role === 'SUPER_ADMIN')
                    .reduce((sum, r) => sum + r._count.id, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Creators</CardTitle>
                <Settings className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.roleDistribution
                    .find(r => r.role === 'CREATOR')?._count.id || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filter and Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MODERATOR">Moderator</SelectItem>
                  <SelectItem value="CREATOR">Creator</SelectItem>
                  <SelectItem value="BACKER">Backer</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} className="w-full md:w-auto">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
            <CardDescription>
              Manage user accounts, roles, and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No users found matching your criteria
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((userItem) => (
                      <TableRow key={userItem.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{userItem.name}</div>
                            <div className="text-sm text-gray-500">{userItem.email}</div>
                            {userItem.isVerified ? (
                              <div className="flex items-center text-green-600 text-xs mt-1">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </div>
                            ) : (
                              <div className="flex items-center text-gray-400 text-xs mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                Unverified
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <RoleBadge role={userItem.role} size="sm" />
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(userItem.status)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono">
                            {truncateAddress(userItem.walletAddress)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{userItem._count.campaignsCreated} campaigns</div>
                            <div className="text-gray-500">{userItem._count.contributions} contributions</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatDate(userItem.createdAt)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {/* Verify Button */}
                            {!userItem.isVerified && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => verifyUser(userItem.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Role Management */}
                            {canModifyUser(userItem) && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUser(userItem);
                                      setActionType('role');
                                      setNewRole(userItem.role);
                                    }}
                                  >
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Change User Role</DialogTitle>
                                    <DialogDescription>
                                      Update the role for {userItem.name} ({userItem.email})
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <Select value={newRole} onValueChange={setNewRole}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {isSuperAdmin && <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>}
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                        <SelectItem value="MODERATOR">Moderator</SelectItem>
                                        <SelectItem value="CREATOR">Creator</SelectItem>
                                        <SelectItem value="BACKER">Backer</SelectItem>
                                        <SelectItem value="USER">User</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      onClick={() => updateUserRole(userItem.id, newRole)}
                                      disabled={newRole === userItem.role}
                                    >
                                      Update Role
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}

                            {/* Status Management */}
                            {canModifyUser(userItem) && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUser(userItem);
                                      setActionType('status');
                                      setNewStatus(userItem.status);
                                    }}
                                  >
                                    {userItem.status === 'BANNED' ? (
                                      <UserX className="h-4 w-4 text-red-600" />
                                    ) : userItem.status === 'SUSPENDED' ? (
                                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    )}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Change User Status</DialogTitle>
                                    <DialogDescription>
                                      Update the status for {userItem.name} ({userItem.email})
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <Select value={newStatus} onValueChange={setNewStatus}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                                        <SelectItem value="BANNED">Banned</SelectItem>
                                        <SelectItem value="PENDING_VERIFICATION">Pending Verification</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      onClick={() => updateUserStatus(userItem.id, newStatus)}
                                      disabled={newStatus === userItem.status}
                                      variant={newStatus === 'BANNED' ? 'destructive' : 'default'}
                                    >
                                      Update Status
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement; 