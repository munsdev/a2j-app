import { NeedCatalog } from "@/app/NeedCatalog";
import { useRoute } from "@/app/router";
import { Compare } from "./Compare";
import { Ideas } from "./Ideas";
import { JobPage } from "./JobPage";
import { Overview } from "./Overview";

/* =================== GOALS ===================
   #goals: the board, goals, shortlist and job ideas · #goals/ideas: the idea deck
   #goals/job/<id>: a saved job · #goals/compare: up to three jobs side by side */
export default function GoalsScreen() {
  const { params } = useRoute();
  const [sub, id] = params;
  return (
    <NeedCatalog>
      {sub === "ideas" ? (
        <Ideas />
      ) : sub === "job" && id ? (
        <JobPage key={id} id={id} />
      ) : sub === "compare" ? (
        <Compare />
      ) : (
        <Overview />
      )}
    </NeedCatalog>
  );
}
