import Link from "next/link";
import { TopBar } from "../../../../_components/TopBar";
import { navItems } from "../../../../_lib/constants";
import { AteneoExploreGroups } from "../../../../ateneo/_components/AteneoExploreGroups";
import { AteneoThreeColumnLayout } from "../../../../ateneo/_components/AteneoThreeColumnLayout";
import { DiscoverSophium } from "../../../../ateneo/_components/DiscoverSophium";
import { AteneoGroupLeftColumn } from "../../../../ateneo/_components/AteneoGroupLeftColumn";
import { AteneoGroupMiddleColumn } from "../../../../ateneo/_components/AteneoGroupMiddleColumn";
import { AteneoGroupRightColumn } from "../../../../ateneo/_components/AteneoGroupRightColumn";
import { AteneoGroupEditPanel } from "../../../../ateneo/_components/AteneoGroupEditPanel";

type AteneoGroupEditPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function AteneoGroupEditPage({ params }: AteneoGroupEditPageProps) {
  const { groupId } = await params;
  const decodedGroupId = decodeURIComponent(groupId);

  return (
    <div className="sophium-shell min-h-screen bg-[var(--background)]">
      <TopBar navItems={navItems} />

      <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-8">
        <AteneoThreeColumnLayout
          left={
            <AteneoGroupLeftColumn>
              <AteneoExploreGroups currentGroupId={decodedGroupId} />
            </AteneoGroupLeftColumn>
          }
          middle={
            <AteneoGroupMiddleColumn
              topRow={
                <Link
                  href={`/ateneo/groups/${encodeURIComponent(decodedGroupId)}`}
                  className="inline-flex items-center gap-2 text-scale-3 font-semibold sophium-link-accent"
                >
                  <span aria-hidden="true">&lt;</span>
                  Volver al grupo
                </Link>
              }
            >
              <AteneoGroupEditPanel groupId={decodedGroupId} />
            </AteneoGroupMiddleColumn>
          }
          right={
            <AteneoGroupRightColumn>
              <DiscoverSophium />
            </AteneoGroupRightColumn>
          }
        />
      </main>
    </div>
  );
}
