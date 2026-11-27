"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

// Last-resort boundary for errors thrown in the root layout. Reports to Sentry and shows Next's default page.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        {/* The App Router does not expose status codes for errors, so pass 0 to render a generic message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
