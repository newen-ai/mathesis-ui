import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";

export const metadata: Metadata = {
  title: "Política de Privacidad | Sophium",
};

export default function PrivacyPage() {
  return <LegalDocumentPage slug="privacy" />;
}
