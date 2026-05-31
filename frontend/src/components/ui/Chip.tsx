import type { ReactNode } from "react";

type ChipVariant = "default" | "active" | "suggestion";

interface ChipProps {
  label: string;
  variant?: ChipVariant;
  onRemove?: () => void;
  onClick?: () => void;
  icon?: ReactNode;
  className?: string;
}

const variantStyles: Record<ChipVariant, string> = {
  default: "bg-neutral-800 text-neutral-300 border-neutral-700",
  active: "bg-blue-600/20 text-blue-300 border-blue-500/40",
  suggestion:
    "bg-neutral-800/50 text-neutral-400 border-neutral-700/50 hover:bg-neutral-700 hover:text-neutral-200",
};

export function Chip({
  label,
  variant = "default",
  onRemove,
  onClick,
  icon,
  className = "",
}: ChipProps) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      onClick={onClick}
      className={`
        inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium
        transition-all duration-150
        ${onClick ? "cursor-pointer" : ""}
        ${variantStyles[variant]}
        ${className}
      `.trim()}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full p-0.5 text-current opacity-60 transition-opacity hover:opacity-100"
          aria-label={`Remove ${label}`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M3 3l6 6M9 3l-6 6" />
          </svg>
        </button>
      )}
    </Tag>
  );
}
