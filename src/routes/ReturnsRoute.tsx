import { lazy, Suspense } from 'react';
import { ProtectedRoute } from './ProtectedRoute';

const Returns = lazy(() => import('@/pages/Returns'));

export default function ReturnsRoute() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <Returns />
      </Suspense>
    </ProtectedRoute>
  );
}