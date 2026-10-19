import { NeedCatalog } from "@/app/NeedCatalog";
import { useRoute } from "@/app/router";
import { Ideas } from "./Ideas";
import { JobPage } from "./JobPage";
import { Overview } from "./Overview";
import { Quilt } from "@/features/routes/Quilt";

/* =================== GOALS ===================
   #goals: the board, goals, shortlist and job ideas · #goals/ideas: the idea deck
   #goals/job/<id>: a saved job · #goals/compare: the routes side by side */
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
        <Quilt />
      ) : (
        <Overview />
      )}
    </NeedCatalog>
  );
}
