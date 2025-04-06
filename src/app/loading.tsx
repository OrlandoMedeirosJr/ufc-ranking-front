export default function Loading() {
  return (
    <div className="flex items-center justify-center h-[70vh]">
      <div className="relative flex flex-col items-center gap-2">
        <div className="h-16 w-16 rounded-full border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent animate-spin" />
        <span className="font-medium text-gray-500 animate-pulse">Carregando...</span>
      </div>
    </div>
  );
} 