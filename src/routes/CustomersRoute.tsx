import { lazy, Suspense } from 'react';
import { ProtectedRoute } from './ProtectedRoute';

const Customers = lazy(() => import('@/pages/Customers'));

export default function CustomersRoute() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <Customers />
      </Suspense>
    </ProtectedRoute>
  );
}