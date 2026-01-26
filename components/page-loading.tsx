import { Spinner } from '@/components/skeleton';

export function PageLoading() {
  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-gray-600 animate-pulse">Ачаалж байна...</p>
      </div>
    </div>
  );
}
