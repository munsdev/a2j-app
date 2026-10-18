/* Converts the sample profiles from the first data format (tools/examples/examples-v1.js, built by build.mjs
   from spec.mjs with the old app) to format version 2 and writes public/examples.js.
   Usage: node tools/examples/to-v2.mjs (from the repository root). */
import fs from "fs";
const src=fs.readFileSync("tools/examples/examples-v1.js","utf8");
const {EXAMPLES,EXAMPLE_PICK}=new Function(src+";return {EXAMPLES,EXAMPLE_PICK};")();
const LAB={en:JSON.parse(fs.readFileSync("public/esco/en.json","utf8")),de:JSON.parse(fs.readFileSync("public/esco/de.json","utf8"))};
const lc=s=>String(s||"").trim().toLowerCase();
const ROLE={past:"done",current:"done",goal:"goal",explore:"maybe",fallback:"maybe",secondary:"maybe"};
function conv(x,lang){
  const i=x.intake||{},P=x.profile||{},labs=LAB[lang];
  const profile={coursePrefs:null};
  ["name","location","languages","contact","german","computer"].forEach(k=>profile[k]=P[k]||i[k]||"");
  ["situation","current","want","avoid","hours","place","limits","hobbies","projects"].forEach(k=>profile[k]=i[k]||"");
  const jobs=x.esco.jobs.map((j,n)=>{const c=x.careers.find(c=>lc(c.name)===lc(j.title))||{};
    return {id:"j"+(n+1),title:j.title,occ:j.occ==null?-1:j.occ,role:ROLE[j.role]||"maybe",org:j.org||c.org||"",when:j.when||c.when||"",current:j.role==="current"};});
  const byTitle=t=>jobs.find(j=>lc(j.title)===lc(t));
  const main=jobs.find(j=>j.role==="goal");
  /* a skill name from the old format: its catalogue id where the old data or the labels know it, else the name */
  const named=n=>{const s=(x.skills||[]).concat(x.gaps||[]).find(k=>lc(k.name)===lc(n));if(s&&s.esco!=null)return s.esco;
    const i=labs.sk.findIndex(l=>lc(l)===lc(n));return i>=0?i:String(n);};
  const courses=(x.courses||[]).map((c,n)=>{const o={id:"c"+(n+1)};
    ["name","provider","url","start","length","schedule","format","language","price","funding","cert","notes","status"].forEach(k=>{if(c[k])o[k]=c[k];});
    if(/azav/i.test((c.funding||"")+" "+(c.cert||"")))o.azav="provider";
    o.goals=(c.qualifies||[]).map(byTitle).filter(Boolean).map(j=>j.id);o.covers=(c.covers||[]).map(named);o.source="sample";return o;});
  const jobads=(x.jobads||[]).map((a,n)=>{const o={id:"a"+(n+1)};["name","org","place","url","hours","pay","deadline","reqs","notes","status"].forEach(k=>{if(a[k])o[k]=a[k];});
    o.goals=(a.for||[]).map(byTitle).filter(Boolean).map(j=>j.id);return o;});
  /* needs that are not in the catalogue (a computer course, German B1) belong to the jobs whose courses cover them */
  (x.gaps||[]).filter(g=>g.esco==null).forEach(g=>{
    const c=courses.find(c=>c.covers.some(v=>typeof v==="string"&&lc(v)===lc(g.name)));
    const targets=c&&c.goals.length?c.goals.map(id=>jobs.find(j=>j.id===id)):main?[main]:[];
    targets.forEach(j=>{j.extra=j.extra||[];if(!j.extra.some(e=>lc(e)===lc(g.name)))j.extra.push(g.name);});
  });
  const own=(x.skills||[]).filter(s=>s.esco==null).map(s=>({name:s.name,level:s.level||3}));
  const assess=JSON.parse(JSON.stringify(x.assess||{}));assess.done=assess.done||{};
  const day=Object.values(assess.done)[0]||"2026-10-01";
  if(x.intake)assess.done.story=day;if(Object.keys(x.esco.rated||{}).length)assess.done.skills=day;
  const s=x.summary||{},g=s.goal?byTitle(s.goal):main,co=s.course?courses.find(c=>lc(c.name)===lc(s.course)):null;
  const summary={lang:lang,inc:s.inc||{},goal:g?g.id:"",course:co?co.id:"",why:s.why||"",other:s.other||"",next:s.next||""};
  return {app:"a2j",version:2,profile,jobs,mainGoal:main?main.id:null,
    esco:{rated:x.esco.rated||{},own,want:x.esco.want||{},votes:x.esco.votes||[],hidden:x.esco.hidden||[],more:!!x.esco.more},
    assess,courses,jobads,summary,seen:{}};
}
const out={};
for(const id of Object.keys(EXAMPLES)){out[id]={};for(const l of ["en","de"])if(EXAMPLES[id][l])out[id][l]=conv(EXAMPLES[id][l],l);}
fs.writeFileSync("public/examples.js","/* Sample profiles, data format version 2 (converted by tools/examples/to-v2.mjs). Fictional and public domain characters. */\nconst EXAMPLE_PICK="+JSON.stringify(EXAMPLE_PICK)+";\nconst EXAMPLES="+JSON.stringify(out)+";\n");
console.log("written",Object.keys(out).map(k=>k+": "+out[k].en.jobs.length+" jobs, "+out[k].en.courses.length+" courses, extra "+JSON.stringify(out[k].en.jobs.filter(j=>j.extra).map(j=>[j.title,j.extra]))).join("\n"));
