import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";

export const metadata: Metadata = {
  title: "Términos y Condiciones | Sophium",
};

export default function TermsPage() {
  return <LegalDocumentPage slug="terms" />;
}
