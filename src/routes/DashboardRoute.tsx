import { lazy, Suspense } from 'react';
import { ProtectedRoute } from './ProtectedRoute';

const Dashboard = lazy(() => import('@/pages/Dashboard'));

export default function DashboardRoute() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <Dashboard />
      </Suspense>
    </ProtectedRoute>
  );
}