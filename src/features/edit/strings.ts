import { defineStrings } from "@/i18n";

/* Edit my data. Copied from the previous app (edit.js); same keys, except w_situation and w_hobbies_s (the
   profile field labels come from i18n/profileFields). Two words the profile and goals screens also use are
   copied here (sk_add_ph from profile.js, k_level from goals.js). New in this app: the skill filter (e_filter*). */
export const editStrings = defineStrings(
  {
    e_title: "Edit my data",
    e_lede: "Everything you entered, in one place. Changes are saved straight away and can be undone.",
    e_profile: "Profile",
    e_jobs: "Jobs",
    e_skills: "Skills",
    e_courses: "Courses",
    e_ads: "Job ads",
    e_role: "Kind",
    e_role_done: "Done before",
    e_role_goal: "Goal",
    e_role_maybe: "Shortlist",
    e_main: "Main goal",
    e_add_job: "Add a job",
    e_rated: "Rated skills",
    e_own: "Skills in your own words",
    e_add_skill: "Add a skill",
    e_none: "Nothing here yet.",
    e_add_course: "Add a course",
    e_add_ad: "Add a job ad",
    e_cat: "In the catalogue",
    t_removed: "Removed",
    e_filter: "Find a skill by name",
    e_filter_none: "No skill with this name.",

    /* from profile.js */
    sk_add_ph: "For example woodturning",
    /* from goals.js */
    k_level: "How well can you do this?",
  },
  {
    e_title: "Meine Daten bearbeiten",
    e_lede:
      "Alles, was Sie eingegeben haben, an einem Ort. Änderungen werden sofort gespeichert und lassen sich rückgängig machen.",
    e_profile: "Profil",
    e_jobs: "Berufe",
    e_skills: "Fähigkeiten",
    e_courses: "Kurse",
    e_ads: "Stellenanzeigen",
    e_role: "Art",
    e_role_done: "Bisherige Stelle",
    e_role_goal: "Ziel",
    e_role_maybe: "Merkliste",
    e_main: "Hauptziel",
    e_add_job: "Beruf hinzufügen",
    e_rated: "Bewertete Fähigkeiten",
    e_own: "Fähigkeiten in eigenen Worten",
    e_add_skill: "Fähigkeit hinzufügen",
    e_none: "Noch nichts da.",
    e_add_course: "Kurs hinzufügen",
    e_add_ad: "Stellenanzeige hinzufügen",
    e_cat: "Im Katalog",
    t_removed: "Entfernt",
    e_filter: "Fähigkeit nach Namen suchen",
    e_filter_none: "Keine Fähigkeit mit diesem Namen.",

    sk_add_ph: "Zum Beispiel Drechseln",
    k_level: "Wie gut können Sie das?",
  },
);
