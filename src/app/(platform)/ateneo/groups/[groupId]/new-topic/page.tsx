import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "../../../../_components/TopBar";
import { navItems } from "../../../../_lib/constants";
import { AteneoExploreGroups } from "../../../_components/AteneoExploreGroups";
import { AteneoThreeColumnLayout } from "../../../_components/AteneoThreeColumnLayout";
import { DiscoverMathesis } from "../../../_components/DiscoverMathesis";
import { AteneoGroupLeftColumn } from "../../../_components/AteneoGroupLeftColumn";
import { AteneoGroupMiddleColumn } from "../../../_components/AteneoGroupMiddleColumn";
import { AteneoGroupRightColumn } from "../../../_components/AteneoGroupRightColumn";
import { AteneoNewTopicForm } from "../../../_components/AteneoNewTopicForm";
import { ateneoGroupsFlat, getAteneoGroupById } from "../../../_lib/mock-data";

type AteneoNewTopicPageProps = {
  params: Promise<{ groupId: string }>;
};

export function generateStaticParams() {
  return ateneoGroupsFlat
    .filter((group) => group.isMember)
    .map((group) => ({ groupId: group.id }));
}

export default async function AteneoNewTopicPage({ params }: AteneoNewTopicPageProps) {
  const { groupId } = await params;
  const decodedGroupId = decodeURIComponent(groupId);
  const group = getAteneoGroupById(decodedGroupId);

  if (!group || !group.isMember) {
    notFound();
  }

  return (
    <div className="mathesis-shell min-h-screen bg-[var(--background)]">
      <TopBar navItems={navItems} />

      <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-8">
        <AteneoThreeColumnLayout
          left={
            <AteneoGroupLeftColumn>
              <AteneoExploreGroups />
            </AteneoGroupLeftColumn>
          }
          middle={
            <AteneoGroupMiddleColumn
              topRow={
                <Link
                  href={`/ateneo/groups/${encodeURIComponent(decodedGroupId)}`}
                  className="inline-flex items-center gap-2 text-scale-3 font-semibold mathesis-link-accent"
                >
                  <span aria-hidden="true">&lt;</span>
                  Volver
                </Link>
              }
            >
              <AteneoNewTopicForm />
            </AteneoGroupMiddleColumn>
          }
          right={
            <AteneoGroupRightColumn>
              <DiscoverMathesis />
            </AteneoGroupRightColumn>
          }
        />
      </main>
    </div>
  );
}
