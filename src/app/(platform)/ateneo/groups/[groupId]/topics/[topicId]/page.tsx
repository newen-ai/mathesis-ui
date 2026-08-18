import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "../../../../../_components/TopBar";
import { navItems } from "../../../../../_lib/constants";
import { AteneoExploreGroups } from "../../../../../ateneo/_components/AteneoExploreGroups";
import { AteneoTopicDiscussion } from "../../../../../ateneo/_components/AteneoTopicDiscussion";
import { AteneoThreeColumnLayout } from "../../../../../ateneo/_components/AteneoThreeColumnLayout";
import { DiscoverMathesis } from "../../../../../ateneo/_components/DiscoverMathesis";
import { AteneoGroupLeftColumn } from "../../../../../ateneo/_components/AteneoGroupLeftColumn";
import { AteneoGroupMiddleColumn } from "../../../../../ateneo/_components/AteneoGroupMiddleColumn";
import { AteneoGroupRightColumn } from "../../../../../ateneo/_components/AteneoGroupRightColumn";
import { popularTopics } from "../../../../../ateneo/_lib/group-topics";
import { ateneoGroupsFlat, getAteneoGroupById } from "../../../../../ateneo/_lib/mock-data";

type TopicDetailPageProps = {
  params: Promise<{ groupId: string; topicId: string }>;
};

export function generateStaticParams() {
  return ateneoGroupsFlat
    .filter((group) => group.isMember)
    .flatMap((group) =>
      popularTopics.map((topic) => ({
        groupId: group.id,
        topicId: topic.id,
      }))
    );
}

export default async function AteneoTopicDetailPage({ params }: TopicDetailPageProps) {
  const { groupId, topicId } = await params;
  const decodedGroupId = decodeURIComponent(groupId);
  const decodedTopicId = decodeURIComponent(topicId);
  const group = getAteneoGroupById(decodedGroupId);
  const topic = popularTopics.find((item) => item.id === decodedTopicId);

  if (!group || !group.isMember || !topic) {
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
              <AteneoTopicDiscussion group={group} topic={topic} />
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
