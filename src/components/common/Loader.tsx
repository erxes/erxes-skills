type LoaderProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-[3px]",
};

export default function Loader({ size = "md", className }: LoaderProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100 ${sizeClasses[size]} ${className ?? ""}`}
    />
  );
}

type PageLoaderProps = {
  className?: string;
};

export function PageLoader({ className }: PageLoaderProps) {
  return (
    <div
      className={`flex min-h-64 items-center justify-center ${className ?? ""}`}
    >
      <Loader size="lg" />
    </div>
  );
}
