import { TopBar } from "../_components/TopBar";
import { navItems } from "../_lib/constants";
import { AteneoExploreGroups } from "./_components/AteneoExploreGroups";
import { AteneoFeedMiddle } from "./_components/AteneoFeedMiddle";
import { AteneoThreeColumnLayout } from "./_components/AteneoThreeColumnLayout";
import { DiscoverSophium } from "./_components/DiscoverSophium";
import { AteneoGroupLeftColumn } from "./_components/AteneoGroupLeftColumn";
import { AteneoGroupMiddleColumn } from "./_components/AteneoGroupMiddleColumn";
import { AteneoGroupRightColumn } from "./_components/AteneoGroupRightColumn";

export default function AteneoPage() {
  return (
    <div className="sophium-shell min-h-screen bg-[var(--background)]">
      <TopBar navItems={navItems} />

      <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-8">
        <AteneoThreeColumnLayout
          left={
            <AteneoGroupLeftColumn>
              <AteneoExploreGroups feedActive />
            </AteneoGroupLeftColumn>
          }
          middle={
            <AteneoGroupMiddleColumn>
              <AteneoFeedMiddle />
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
