import { startSpan } from "@sentry/nextjs";

// Named span around a key user action (login, publish, credential). The fetches inside become child
// spans and continue into the backend trace. A no-op when Sentry is not initialized.
export function traceUiAction<T>(name: string, action: () => Promise<T>): Promise<T> {
  return startSpan({ name, op: "ui.action" }, action);
}
