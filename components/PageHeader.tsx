import type { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}

/** Consistent page title block: eyebrow / title / description / optional actions. */
export function PageHeader({ eyebrow, title, description, children }: Props) {
  return (
    <div className="container-page pt-12 pb-8 sm:pt-16">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h1 className="heading-xl animate-fade-up">{title}</h1>
      {description && <p className="mt-4 max-w-2xl text-lg text-muted">{description}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
