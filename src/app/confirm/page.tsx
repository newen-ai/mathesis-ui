import { ConfirmClient } from "./ConfirmClient";

type PageProps = {
  searchParams?: {
    token?: string | string[];
  };
};

function resolveToken(searchToken: string | string[] | undefined): string {
  const value = Array.isArray(searchToken) ? searchToken[0] : searchToken;
  return typeof value === "string" ? value : "";
}

export default function ConfirmPage({ searchParams }: PageProps) {
  return <ConfirmClient token={resolveToken(searchParams?.token)} />;
}
