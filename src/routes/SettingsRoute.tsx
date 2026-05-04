import { lazy, Suspense } from 'react';
import { ProtectedRoute } from './ProtectedRoute';

const Settings = lazy(() => import('@/pages/Settings'));

export default function SettingsRoute() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <Settings />
      </Suspense>
    </ProtectedRoute>
  );
}