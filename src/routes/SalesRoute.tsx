import { lazy, Suspense } from 'react';
import { ProtectedRoute } from './ProtectedRoute';

const Sales = lazy(() => import('@/pages/Sales'));

export default function SalesRoute() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <Sales />
      </Suspense>
    </ProtectedRoute>
  );
}