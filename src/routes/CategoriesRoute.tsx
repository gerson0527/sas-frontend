import { lazy, Suspense } from 'react';
import { ProtectedRoute } from './ProtectedRoute';

const Categories = lazy(() => import('@/pages/Categories'));

export default function CategoriesRoute() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <Categories />
      </Suspense>
    </ProtectedRoute>
  );
}