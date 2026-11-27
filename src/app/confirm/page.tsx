import { ConfirmClient } from "./ConfirmClient";

type PageProps = {
  searchParams?: Promise<{
    token?: string | string[];
  }>;
};

function resolveToken(searchToken: string | string[] | undefined): string {
  const value = Array.isArray(searchToken) ? searchToken[0] : searchToken;
  return typeof value === "string" ? value : "";
}

export default async function ConfirmPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return <ConfirmClient token={resolveToken(resolvedSearchParams?.token)} />;
}
