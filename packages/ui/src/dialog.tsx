"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

import { Button } from "./button";
import { Stepper } from "./stepper";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export interface DialogContentProps {
  children: ReactNode;
  description: string;
  eyebrow?: string;
  footer?: ReactNode;
  step?: { current: number; total: number };
  title: string;
}

export function DialogContent({ children, description, eyebrow, footer, step, title }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="sc-dialog__overlay" />
      <DialogPrimitive.Content className="sc-dialog__content">
        <header className="sc-dialog__header">
          <div className="sc-dialog__heading">
            {eyebrow ? <p className="sc-dialog__eyebrow">{eyebrow}</p> : null}
            <DialogPrimitive.Title className="sc-dialog__title">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sc-visually-hidden">
              {description}
            </DialogPrimitive.Description>
            {step ? <Stepper current={step.current} total={step.total} /> : null}
          </div>
          <DialogPrimitive.Close asChild>
            <Button aria-label="Close dialog" size="icon">
              ×
            </Button>
          </DialogPrimitive.Close>
        </header>
        <div className="sc-dialog__body">{children}</div>
        {footer ? <footer className="sc-dialog__footer">{footer}</footer> : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
