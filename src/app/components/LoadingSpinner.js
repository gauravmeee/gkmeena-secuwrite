export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse"></div>
        <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-150"></div>
        <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse delay-300"></div>
      </div>
    </div>
  );
} 