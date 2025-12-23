import { cn } from "@/lib/utils";

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export function Card({ children, className }: CardProps) {
    return (
        <div
            className={cn(
                "rounded-lg border border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-lg",
                className
            )}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className }: CardProps) {
    return (
        <div className={cn("flex flex-col space-y-1.5 p-6", className)}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className }: CardProps) {
    return (
        <h3 className={cn("text-2xl font-semibold leading-none tracking-tight", className)}>
            {children}
        </h3>
    );
}

export function CardDescription({ children, className }: CardProps) {
    return (
        <p className={cn("text-sm text-slate-400", className)}>
            {children}
        </p>
    );
}

export function CardContent({ children, className }: CardProps) {
    return <div className={cn("p-6 pt-0", className)}>{children}</div>;
}
