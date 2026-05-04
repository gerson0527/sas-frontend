import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import POS from '@/pages/POS';
import Products from '@/pages/Products';
import Categories from '@/pages/Categories';
import Customers from '@/pages/Customers';
import Suppliers from '@/pages/Suppliers';
import Invoices from '@/pages/Invoices';
import Finance from '@/pages/Finance';
import Reports from '@/pages/Reports';
import Returns from '@/pages/Returns';
import Store from '@/pages/Store';
import StoreSetup from '@/pages/StoreSetup';
import Registers from '@/pages/Registers';
import Roles from '@/pages/Roles';
import Team from '@/pages/Team';

function getUserPermissions(user: unknown): string[] {
  const permissionSources = [
    (user as any)?.customRole?.permissions,
    (user as any)?.role?.permissions,
    (user as any)?.permissions,
  ]

  const source = permissionSources.find((permissions) => Array.isArray(permissions))
  if (!Array.isArray(source)) return []

  return source
    .map((permission: any) => (typeof permission === 'string' ? permission : permission?.name))
    .filter(Boolean)
}

function ProtectedRoute({
  children,
  requiredPermission,
  allowWithoutStore,
}: {
  children: React.ReactNode
  requiredPermission?: string
  allowWithoutStore?: boolean
}) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }

  const hasStore = Boolean((user as any)?.stores?.[0]?.store?.id);
  if (!hasStore && !allowWithoutStore) {
    return <Navigate to="/store-setup" replace />;
  }

  if (hasStore && allowWithoutStore) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredPermission) {
    const permissions = getUserPermissions(user)
    if (permissions.length > 0 && !permissions.includes(requiredPermission)) {
      return <Navigate to="/dashboard" replace />
    }
  }
  
  return <>{children}</>;
}

function LoginPage() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (user) {
    const hasStore = Boolean((user as any)?.stores?.[0]?.store?.id);
    return <Navigate to={hasStore ? "/dashboard" : "/store-setup"} replace />;
  }
  
  return <Login />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/store-setup',
    element: <ProtectedRoute allowWithoutStore><StoreSetup /></ProtectedRoute>,
  },
  {
    element: <MainLayout />,
    children: [
      {
        path: '/dashboard',
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
      },
      {
        path: '/pos',
        element: <ProtectedRoute requiredPermission="process_sales"><POS /></ProtectedRoute>,
      },
      {
        path: '/products',
        element: <ProtectedRoute requiredPermission="manage_products"><Products /></ProtectedRoute>,
      },
      {
        path: '/categories',
        element: <ProtectedRoute requiredPermission="manage_categories"><Categories /></ProtectedRoute>,
      },
      {
        path: '/customers',
        element: <ProtectedRoute requiredPermission="manage_customers"><Customers /></ProtectedRoute>,
      },
      {
        path: '/suppliers',
        element: <ProtectedRoute requiredPermission="manage_suppliers"><Suppliers /></ProtectedRoute>,
      },
      {
        path: '/sales',
        element: <ProtectedRoute requiredPermission="view_invoices"><Invoices /></ProtectedRoute>,
      },
      {
        path: '/invoices',
        element: <ProtectedRoute requiredPermission="view_invoices"><Invoices /></ProtectedRoute>,
      },
      {
        path: '/finance',
        element: <ProtectedRoute><Finance /></ProtectedRoute>,
      },
      {
        path: '/reports',
        element: <ProtectedRoute requiredPermission="view_reports"><Reports /></ProtectedRoute>,
      },
      {
        path: '/returns',
        element: <ProtectedRoute requiredPermission="manage_returns"><Returns /></ProtectedRoute>,
      },
      {
        path: '/store',
        element: <ProtectedRoute><Store /></ProtectedRoute>,
      },
      {
        path: '/settings/team',
        element: <ProtectedRoute requiredPermission="manage_users"><Team /></ProtectedRoute>,
      },
      {
        path: '/settings/roles',
        element: <ProtectedRoute requiredPermission="manage_roles"><Roles /></ProtectedRoute>,
      },
      {
        path: '/settings/registers',
        element: <ProtectedRoute requiredPermission="manage_registers"><Registers /></ProtectedRoute>,
      },
    ],
  },
]);