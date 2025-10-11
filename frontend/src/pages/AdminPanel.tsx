import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, Flag, BarChart3, Settings, Shield, Home } from 'lucide-react';
import RoleBadge from '@/components/RoleBadge';

const AdminPanel = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin or super admin
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Redirect if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const adminStats = [
    {
      title: 'Total Users',
      value: '1,234',
      description: 'Registered users',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Active Campaigns',
      value: '89',
      description: 'Currently running',
      icon: FileText,
      color: 'text-green-600'
    },
    {
      title: 'Pending Reports',
      value: '12',
      description: 'Need review',
      icon: Flag,
      color: 'text-orange-600'
    },
    {
      title: 'Total Funding',
      value: '$2.4M',
      description: 'Platform volume',
      icon: BarChart3,
      color: 'text-purple-600'
    }
  ];

  const adminActions = [
    {
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      icon: Users,
      action: 'Manage Users',
      href: '/admin/users'
    },
    {
      title: 'Campaign Management',
      description: 'View, edit, and moderate all campaigns',
      icon: FileText,
      action: 'Manage Campaigns',
      href: '/admin/campaigns'
    },
    {
      title: 'Report Management',
      description: 'Handle user reports and disputes',
      icon: Flag,
      action: 'Review Reports',
      href: '/admin/reports'
    },
    {
      title: 'Platform Analytics',
      description: 'View platform statistics and insights',
      icon: BarChart3,
      action: 'View Analytics',
      href: '/admin/analytics'
    },
    {
      title: 'System Settings',
      description: 'Configure platform settings and policies',
      icon: Settings,
      action: 'Manage Settings',
      href: '/admin/settings'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Top Left Navigation Button */}
      <div className="absolute top-4 left-4 z-10">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 shadow-sm"
        >
          <Home className="h-4 w-4" />
          <span>Back to Home</span>
        </Button>
      </div>

      <div className="container mx-auto px-4 pt-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 mt-2">Manage and monitor the Nexa Fund platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Logged in as</p>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{user?.name || user?.email}</span>
                  <RoleBadge role={user?.role || 'USER'} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {adminStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <IconComponent className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-gray-600 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <IconComponent className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="mt-2">
                    {action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => {
                      if (action.href === '/admin/users') {
                        navigate('/admin/users');
                      } else if (action.href === '/admin/campaigns') {
                        navigate('/admin/campaigns');
                      } else {
                        // For now, just show an alert. In the future, navigate to specific admin pages
                        alert(`${action.title} functionality coming soon!`);
                      }
                    }}
                  >
                    {action.action}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Security Notice */}
        <Card className="mt-8 border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-800">Security Notice</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              You are accessing the admin panel with elevated privileges. All actions are logged and monitored. 
              Please use these tools responsibly and in accordance with platform policies.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel; 