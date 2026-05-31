type SkeletonVariant = "text" | "circular" | "rectangular";

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({
  variant = "text",
  width,
  height,
  className = "",
}: SkeletonProps) {
  const baseStyles = "animate-pulse rounded bg-neutral-800";

  const variantStyles: Record<SkeletonVariant, string> = {
    text: "h-4 w-full rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  const defaultDims: Record<SkeletonVariant, { width: string; height: string }> = {
    text: { width: "100%", height: "" },
    circular: { width: "40px", height: "40px" },
    rectangular: { width: "100%", height: "100px" },
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={{
        ...style,
        ...(Object.keys(style).length === 0 ? defaultDims[variant] : {}),
      }}
      aria-hidden="true"
    />
  );
}
