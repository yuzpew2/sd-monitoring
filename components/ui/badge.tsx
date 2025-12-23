import { cn } from "@/lib/utils";

interface BadgeProps {
    children: React.ReactNode;
    variant?: "success" | "warning" | "error" | "default";
    className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
                {
                    "bg-green-500/10 text-green-500": variant === "success",
                    "bg-yellow-500/10 text-yellow-500": variant === "warning",
                    "bg-red-500/10 text-red-500": variant === "error",
                    "bg-slate-500/10 text-slate-300": variant === "default",
                },
                className
            )}
        >
            {children}
        </span>
    );
}
