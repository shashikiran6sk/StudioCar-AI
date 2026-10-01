"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

import { Button } from "./button";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;

export interface SheetContentProps {
  children: ReactNode;
  /** The accessible name of the close control. */
  closeLabel: string;
  description: string;
  /** Rendered beside the close control, such as a brand or a heading. */
  header?: ReactNode;
  title: string;
}

/**
 * A panel that slides in from the inline start edge over a backdrop. It is a
 * modal dialog: focus is trapped inside, the page behind cannot scroll, and
 * Escape, the backdrop, and the close control all dismiss it.
 */
export function SheetContent({
  children,
  closeLabel,
  description,
  header,
  title,
}: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="sc-sheet__overlay" />
      <DialogPrimitive.Content className="sc-sheet__content">
        <DialogPrimitive.Title className="sc-visually-hidden">{title}</DialogPrimitive.Title>
        <DialogPrimitive.Description className="sc-visually-hidden">
          {description}
        </DialogPrimitive.Description>
        <header className="sc-sheet__header">
          {header}
          <DialogPrimitive.Close asChild>
            <Button aria-label={closeLabel} className="sc-sheet__close" size="icon" variant="ghost">
              ×
            </Button>
          </DialogPrimitive.Close>
        </header>
        <div className="sc-sheet__body">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
