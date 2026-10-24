import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  as: Tag = "section",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "aside";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={`rounded-card border border-border bg-surface p-4 shadow-card sm:p-6 ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
