import { lazy, Suspense } from 'react';
import { ProtectedRoute } from './ProtectedRoute';

const Reports = lazy(() => import('@/pages/Reports'));

export default function ReportsRoute() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <Reports />
      </Suspense>
    </ProtectedRoute>
  );
}