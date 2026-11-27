"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      richColors
      expand
      visibleToasts={5}
      duration={2200}
      closeButton
    />
  );
}
