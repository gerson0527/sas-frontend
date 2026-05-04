import { lazy, Suspense } from 'react';
import { ProtectedRoute } from './ProtectedRoute';

const Products = lazy(() => import('@/pages/Products'));

export default function ProductsRoute() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <Products />
      </Suspense>
    </ProtectedRoute>
  );
}