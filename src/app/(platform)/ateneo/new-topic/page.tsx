import Link from "next/link";
import { TopBar } from "../../_components/TopBar";
import { navItems } from "../../_lib/constants";
import { AteneoExploreGroups } from "../_components/AteneoExploreGroups";
import { AteneoThreeColumnLayout } from "../_components/AteneoThreeColumnLayout";
import { DiscoverMathesis } from "../_components/DiscoverMathesis";
import { AteneoGroupLeftColumn } from "../_components/AteneoGroupLeftColumn";
import { AteneoGroupMiddleColumn } from "../_components/AteneoGroupMiddleColumn";
import { AteneoGroupRightColumn } from "../_components/AteneoGroupRightColumn";
import { AteneoNewTopicForm } from "../_components/AteneoNewTopicForm";

export default function AteneoGlobalNewTopicPage() {
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
                  href="/ateneo"
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
