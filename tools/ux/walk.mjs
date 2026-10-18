/* Walks the main flows from an empty browser and with a sample profile, takes a screenshot of each screen
   and reports script errors. Usage: serve public/ on port 8765, then from a folder with puppeteer-core,
   @sparticuz/chromium and ../examples/lib.mjs:
   node walk.mjs 390 844 en   (phone)   or   node walk.mjs 1280 860 de   (desktop, German). Output goes to ux/. */
import {open,sleep} from "../examples/lib.mjs";import fs from "fs";
const W=+process.argv[2]||390,H=+process.argv[3]||844,L=process.argv[4]||"en",T=(W<500?"m":"d")+"-"+L;
fs.mkdirSync("ux",{recursive:true});
const {b,p,errs}=await open(W,H);
let n=0;const shot=async(name,full)=>{n++;await sleep(350);await p.screenshot({path:`ux/${T}-${String(n).padStart(2,"0")}-${name}.png`,fullPage:!!full});};
const ev=(f,...a)=>p.evaluate(f,...a);
const fill=async(sel,v)=>{await ev(o=>{const el=document.querySelector(o.sel);el.value=o.v;el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));},{sel,v});};
await p.goto("http://localhost:8765/",{waitUntil:"networkidle0"});await ev(l=>{localStorage.clear();localStorage.setItem("a2j:lang",l);},L);await p.reload({waitUntil:"networkidle0"});await sleep(400);
await shot("home",true);
/* profile, parts 1 to 6 */
await p.click('.hero [data-part="apt"]');await sleep(300);await shot("q1");
for(let i=0;i<45;i++){await p.click(`.ans[data-ans="${[4,3,5,2,4][i%5]}"]`);await sleep(20);}
await shot("part1-done");await p.click('.donebox [data-part]');await sleep(300);
for(let i=0;i<18;i++){await p.click(`.ans[data-ans="${[5,2,3,4,1,3][i%6]}"]`);await sleep(20);}
await p.click('.donebox [data-part]');await sleep(300);await shot("setting");
for(let i=0;i<6;i++){await p.click(`[data-set="${[1,3,0,5,2,4][i]}"]`);await sleep(60);}
await shot("ruled-out");await p.click('[data-out="nights"]');await p.click('[data-run="setsave"]');await sleep(300);
await p.click('.donebox [data-part]');await sleep(300);
for(const v of ["achievement","support","relationships"])await p.click(`[data-val="${v}"]`);await shot("values");await p.click('[data-run="valsave"]');await sleep(300);
await p.click('.donebox [data-part]');await sleep(400);
await fill("#w_name","Mara Test");await fill("#w_location","Augsburg");await shot("story-you");
await p.click('#storyForm button[type=submit]');await sleep(300);
await p.click('input[name="w_sit"][value="seeking"]');await p.click('#storyForm button[type=submit]');await sleep(1500);
await fill(".jt","Verkäuferin");await sleep(500);await shot("story-jobs");
await p.click('#storyForm button[type=submit]');await sleep(500);
await fill(".jt","Kauffrau für Büromanagement");await sleep(500);await shot("story-goals");
await p.click('#storyForm button[type=submit]');await sleep(300);await p.click('#storyForm button[type=submit]');await sleep(500);
await p.click('.donebox [data-part]');await sleep(2500);await shot("skill-card");
for(let i=0;i<60;i++){const has=await ev(()=>!!document.querySelector('.skcard'));if(!has)break;await p.click(`[data-rate="${[4,3,0,5,2][i%5]}"]`);await sleep(20);}
await p.click('[data-run="skdone"]');await sleep(400);await shot("all-done");
await ev(()=>go("profile"));await sleep(500);await shot("profile",true);
/* goals: ideas, shortlist, goal, course search with a pasted answer */
await ev(()=>go("goals"));await sleep(2500);await shot("goals",true);
await ev(()=>go("goals/ideas"));await sleep(800);await shot("idea");
await p.click('[data-idea="yes"]');await sleep(400);await shot("idea-rating");await p.click('[data-idea="next"]');await sleep(300);
await p.click('[data-idea="no"]');await sleep(300);await p.click('[data-idea="next"]');await sleep(300);
const gid=await ev(()=>mainGoal().id);
await ev(id=>go("goals/job/"+id),gid);await sleep(600);await shot("goal",true);
await p.click('.actionbar [data-find="course"]');await sleep(600);await shot("find-course");
const sk=await ev(id=>jobTiles(jobById(id).occ,jobById(id)).filter(t=>t.state==="learn").slice(0,2).map(t=>t.name),gid);
await fill("#findBack",`Two courses.\n\`\`\`json\n{"courses":[{"name":"Test course","provider":"VHS","url":"https://example.org/a","azav":"yes","covers":${JSON.stringify(sk)}},{"name":"Second course","url":"https://example.org/b","covers":[]}]}\n\`\`\``);
await p.click('[data-fread]');await sleep(300);await shot("found");await p.click('[data-fkeep]');await sleep(600);
await ev(()=>closeSheet());await ev(()=>go("goals/compare"));await sleep(500);await shot("compare",true);
await ev(()=>go("plan"));await sleep(800);await shot("plan",true);
/* sample, menu, prompts, backup */
await ev(()=>openPicker());await sleep(300);await shot("samples");await p.click('[data-pick="geppetto"]');await sleep(1800);await shot("sample-home",true);
await ev(()=>openPrompts());await sleep(300);await p.click('[data-plopen="meeting"]');await sleep(300);await shot("prompt");await ev(()=>closeSheet());
await ev(()=>go("backup"));await sleep(400);await shot("backup",true);
fs.writeFileSync(`ux/${T}-errors.txt`,errs.join("\n"));
console.log(errs.join("\n")||"no errors");await b.close();
