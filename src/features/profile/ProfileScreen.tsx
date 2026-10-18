import { useRoute } from "@/app/router";
import { useProfileEpoch } from "@/app/samples";
import { Page } from "@/ui";
import { isPart } from "./constants";
import { Overview } from "./Overview";
import { PartRun } from "./run/PartRun";

/* #profile: the overview with the results. #profile/<part>: that part, running. A run is keyed by part and
   profile epoch, so its per-visit state starts fresh on every visit and when another profile opens. */
export default function ProfileScreen() {
  const { params } = useRoute();
  const epoch = useProfileEpoch((s) => s.epoch);
  const part = params[0];
  if (!isPart(part)) return <Overview key={epoch} />;
  return (
    <Page>
      <PartRun key={`${part}:${epoch}`} part={part} />
    </Page>
  );
}
