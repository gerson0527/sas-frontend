import { lazy, Suspense } from 'react';
import { ProtectedRoute } from './ProtectedRoute';

const Store = lazy(() => import('@/pages/Store'));

export default function StoreRoute() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <Store />
      </Suspense>
    </ProtectedRoute>
  );
}