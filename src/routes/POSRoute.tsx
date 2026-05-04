import { lazy, Suspense } from 'react';
import { ProtectedRoute } from './ProtectedRoute';

const POS = lazy(() => import('@/pages/POS'));

export default function POSRoute() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <POS />
      </Suspense>
    </ProtectedRoute>
  );
}