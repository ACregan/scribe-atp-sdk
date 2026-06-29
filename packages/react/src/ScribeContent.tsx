import type { HTMLAttributes } from "react";

type ScribeContentProps = Omit<HTMLAttributes<HTMLDivElement>, "dangerouslySetInnerHTML"> & {
  html: string;
};

export function ScribeContent({ html, className, ...props }: ScribeContentProps) {
  return (
    <div
      {...props}
      className={className ? `scribe-content ${className}` : "scribe-content"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
