import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
export async function open(w=1280,h=860){
  const b=await puppeteer.launch({executablePath:await chromium.executablePath(),args:chromium.args,headless:true});
  const p=await b.newPage();await p.setViewport({width:w,height:h,deviceScaleFactor:1});
  const errs=[];p.on("pageerror",e=>errs.push("pageerror: "+e.message));p.on("console",m=>{if(m.type()==="error")errs.push("console: "+m.text());});
  return {b,p,errs};
}
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
