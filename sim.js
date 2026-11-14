// Headless balance simulator. Usage:
//   node sim.js class <classId> <hours>     -> combat: minutes per class level
//   node sim.js prof <profId> <hours>       -> hero works one profession: minutes per profession level
const fs=require('fs'),vm=require('vm');
const ctx={console,Math,Date,JSON,performance:{now:()=>0},localStorage:{getItem(){},setItem(){}}};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname+'/data.js','utf8')+'\n'+fs.readFileSync(__dirname+'/engine.js','utf8')+
 '\n;this.G=G;this.D=D;this.api={newState,recalc,newHero,tick,checkAch,buyQol,buyGuild,spendPoint,setZone,assign,syncSlots,giveStarter,fmt,fmtTime,buyMastery,masteryCost,townCost,dailyCheck};',ctx);
const {G,D,api}=ctx;
const mode=process.argv[2]||'class',id=process.argv[3]||'fighter',hours=+(process.argv[4]||10),spendAP=process.argv[5]!=='noap';
G.fx=false;G.S=api.newState();G.S.started=true;G.S.cls=mode==='class'?id:'fighter';G.S.unlockedCls[G.S.cls]=1;api.giveStarter();api.recalc();api.newHero();api.dailyCheck();
if(mode==='prof')api.assign(0,{type:'prof',p:id});
const S=()=>G.S;let t=0;const step=0.5;
function spend(){const s=S();
  for(let k=0;k<50;k++){let best=null,bc=1e300,tree,key;
    const consider=(tr,ky,list,ranks,pool)=>{for(const n of list){const r=(ranks||{})[n.id]||0;if(r>=n.max)continue;const c=api.masteryCost(n,r);if(c<=pool&&c<bc){bc=c;best=n;tree=tr;key=ky}}};
    consider('gen',null,D.AP_GEN,s.mastery.gen,s.ap.gen);
    consider('cls',s.cls,D.AP_CLASS,s.mastery.cls[s.cls],s.ap.cls[s.cls]||0);
    if(mode==='prof')consider('prof',id,D.AP_PROF,s.mastery.prof[id],s.ap.prof[id]||0);
    if(!best)break;api.buyMastery(tree,key,best.id)}}
function bot(){const s=S(),cl=s.classes[s.cls],cd=D.CLASSES[s.cls];
  for(const q of D.QOL)if(!s.qol[q.id]&&s.gold>=api.townCost(q.cost))api.buyQol(q.id);
  for(let k=0;k<20;k++){let best=null,bc=1e300;for(const g of ['armory','barracks','bank','library']){const gd=D.GUILD.find(x=>x.id===g);const c=Math.ceil(gd.base*Math.pow(gd.mult,s.guild[g]||0));if(c<bc){bc=c;best=g}}if(s.gold>bc*2)api.buyGuild(best);else break}
  while(cl.pts>0){const all=[...cd.skills,...cd.passives].filter(x=>x.lv<=cl.lvl&&(cl.ranks[x.id]||0)<x.max);if(!all.length)break;all.sort((a,b)=>(cl.ranks[a.id]||0)-(cl.ranks[b.id]||0));api.spendPoint(all[0].id)}
  if(cl.lvl>=20&&!cl.sub){cl.sub=cd.subs[0].id;G.dirty=true}
  if(mode==='class'){if(s.zones[s.zone].kills>=25&&s.bossRetry<=0)s.bossReq=true;let hi=0;s.zones.forEach((z,i)=>{if(z.unlocked)hi=i});
    // fight the highest zone whose min level is not far above us
    let best=0;s.zones.forEach((z,i)=>{if(z.unlocked&&D.ZONES[i].min<=cl.lvl+2)best=i});if(s.zone!==best&&s.bossRetry<=0)api.setZone(best)}
  else{ // pick best unlocked target for the profession
    const lv=s.profs[id].lvl;const pick=(arr,set)=>{let b=null;for(const x of arr)if(x.lv<=lv)b=x;if(b)set(b.id)};
    if(id==='mining')pick(D.PROFS.mining.nodes,v=>{if(s.ps.mining.node!==v){s.ps.mining.node=v;s.ps.mining.streak=0}});
    if(id==='herbalism')pick(D.PROFS.herbalism.seeds,v=>s.ps.herbalism.seed=v);
    if(id==='fishing')pick(D.FISHING,v=>s.ps.fishing.target=v);
    if(id==='dancing')pick(D.DANCES,v=>s.ps.dancing.target=v);
    if(id==='praying')pick(D.DEITIES,v=>s.ps.praying.target=v);
    if(id==='advising')pick(D.PETITIONERS,v=>s.ps.advising.target=v);
    if(id==='bard')pick(D.SONGS,v=>{s.ps.bard.target=v;s.ps.bard.anthem=v});
    if(id==='summoning')s.ps.summoning.target='wisp';
    // crafting: simulate a steady material supply (gatherers/combat feeding the crafter)
    if(['smithing','alchemy','cooking','enchanting'].includes(id)){for(const k in D.MATS)s.mats[k]=9999;
      if(id==='smithing')pick(D.PROFS.smithing.tiers,v=>s.ps.smithing.tier=v);
      if(id==='alchemy')pick(D.PROFS.alchemy.recipes,v=>s.ps.alchemy.recipe=v);
      if(id==='cooking')pick(D.PROFS.cooking.recipes,v=>s.ps.cooking.recipe=v);
      if(id==='enchanting'){const it=s.equip[s.ps.enchanting.slot];if(it&&(it.ench||0)>=Math.min(15,2+Math.floor(lv/5)))it.ench=0}}
    if(s.inv.length>40)s.inv.length=0;
  }
  if(spendAP)spend();
}
const lvlOf=()=>mode==='class'?S().classes[S().cls].lvl:S().profs[id].lvl;
let last=lvlOf(),lastT=0;const times=[];
while(t<hours*3600){api.tick(step);t+=step;if(t%5<step){bot();api.checkAch()}
  const L=lvlOf();if(L>last){for(let l=last;l<L;l++)times.push([l,(t-lastT)/60/(L-last)]);last=L;lastT=t}}
const s=S();
console.log(`${mode} ${id} — ${hours}h sim${spendAP?'':' (no AP spending)'}: reached level ${last}; current level ${(( t-lastT)/60).toFixed(0)} min in progress`);
console.log(times.map(([l,m])=>`L${l}→${l+1}: ${m.toFixed(1)}m`).join(' | '));
console.log(`kills ${s.stats.kills} (${(s.stats.kills/hours/60).toFixed(1)}/min) bosses ${s.stats.bosses} elites ${s.stats.elites} · `+`min level time ${Math.min(...times.map(x=>x[1])).toFixed(1)} min · AP gen ${s.ap.gen.toFixed(0)} spent ${s.stats.apSpent} · cleared zones ${s.stats.everCleared} · deaths ${s.stats.deaths}`);
if(process.env.CUM){let c=0;const a=[0,0];for(const [l,m] of times){c+=m;a[l+1]=+(c/60).toFixed(3)}console.log('CUM '+JSON.stringify(a))}
