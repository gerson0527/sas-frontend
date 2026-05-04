import { lazy, Suspense } from 'react';
import { ProtectedRoute } from './ProtectedRoute';

const Finance = lazy(() => import('@/pages/Finance'));

export default function FinanceRoute() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <Finance />
      </Suspense>
    </ProtectedRoute>
  );
}