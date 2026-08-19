import Link from "next/link";
import { TopBar } from "../../../../../_components/TopBar";
import { navItems } from "../../../../../_lib/constants";
import { AteneoExploreGroups } from "../../../../../ateneo/_components/AteneoExploreGroups";
import { AteneoTopicDiscussion } from "../../../../../ateneo/_components/AteneoTopicDiscussion";
import { AteneoThreeColumnLayout } from "../../../../../ateneo/_components/AteneoThreeColumnLayout";
import { DiscoverMathesis } from "../../../../../ateneo/_components/DiscoverMathesis";
import { AteneoGroupLeftColumn } from "../../../../../ateneo/_components/AteneoGroupLeftColumn";
import { AteneoGroupMiddleColumn } from "../../../../../ateneo/_components/AteneoGroupMiddleColumn";
import { AteneoGroupRightColumn } from "../../../../../ateneo/_components/AteneoGroupRightColumn";

type TopicDetailPageProps = {
  params: Promise<{ groupId: string; topicId: string }>;
};

export default async function AteneoTopicDetailPage({ params }: TopicDetailPageProps) {
  const { groupId, topicId } = await params;
  const decodedGroupId = decodeURIComponent(groupId);
  const decodedTopicId = decodeURIComponent(topicId);

  return (
    <div className="mathesis-shell min-h-screen bg-[var(--background)]">
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
                  className="inline-flex items-center gap-2 text-scale-3 font-semibold mathesis-link-accent"
                >
                  <span aria-hidden="true">&lt;</span>
                  Volver
                </Link>
              }
            >
              <AteneoTopicDiscussion groupId={decodedGroupId} topicId={decodedTopicId} />
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
