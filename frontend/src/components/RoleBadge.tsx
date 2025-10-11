import { Badge } from "@/components/ui/badge";

interface RoleBadgeProps {
  role: string;
  size?: 'sm' | 'md' | 'lg';
}

const RoleBadge = ({ role, size = 'sm' }: RoleBadgeProps) => {
  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          label: 'Super Admin',
          className: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200'
        };
      case 'ADMIN':
        return {
          label: 'Admin',
          className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
        };
      case 'MODERATOR':
        return {
          label: 'Moderator',
          className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200'
        };
      case 'CREATOR':
        return {
          label: 'Creator',
          className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
        };
      case 'BACKER':
        return {
          label: 'Backer',
          className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
        };
      case 'USER':
        return {
          label: 'User',
          className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
        };
      default:
        return {
          label: role,
          className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
        };
    }
  };

  const { label, className } = getRoleConfig(role);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge 
      variant="outline" 
      className={`${className} ${sizeClasses[size]} font-medium`}
    >
      {label}
    </Badge>
  );
};

export default RoleBadge; 