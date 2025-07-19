import { useState, useEffect, lazy, Suspense } from 'react';
import type { Restaurant } from '~/types/restaurant';

interface MapProps {
  restaurants: Restaurant[];
  onRestaurantClick?: (restaurant: Restaurant) => void;
  center?: [number, number];
  zoom?: number;
}

// Lazy load the map component to avoid SSR issues
const MapClient = lazy(() => import('./MapClient').then(module => ({ default: module.MapClient })));

export function Map(props: MapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-600">
          <div className="text-4xl mb-2">🗺️</div>
          <p>地図を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-600">
          <div className="text-4xl mb-2">🗺️</div>
          <p>地図を読み込み中...</p>
        </div>
      </div>
    }>
      <MapClient {...props} />
    </Suspense>
  );
}