import { BrandMark } from "@studiocar/ui";
import type { ReactNode } from "react";

const AUTH_EYEBROW = "Secure workspace access";

export interface AuthCardProps {
  children: ReactNode;
  description: string;
  footer?: ReactNode;
  title: string;
}

export function AuthCard({ children, description, footer, title }: AuthCardProps) {
  return (
    <main className="auth-page">
      <section aria-labelledby="auth-title" className="auth-card">
        <BrandMark className="auth-card__brand" withName />
        <div className="auth-card__heading">
          <p className="eyebrow">{AUTH_EYEBROW}</p>
          <h1 id="auth-title">{title}</h1>
          <p>{description}</p>
        </div>
        {children}
        {footer ? <footer className="auth-card__footer">{footer}</footer> : null}
      </section>
    </main>
  );
}
