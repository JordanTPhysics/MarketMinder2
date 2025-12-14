export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px] w-full">
      <div className="relative w-10 h-10">
        <div className="w-10 h-10 rounded-full absolute border-4 border-solid border-gray-200"></div>
        <div className="w-10 h-10 rounded-full animate-spin absolute border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    </div>
  );
} 