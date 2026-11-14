const fs=require('fs'),vm=require('vm');
const ctx={console,Math,Date,JSON,performance:{now:()=>0},localStorage:{getItem(){},setItem(){}},btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary')};
vm.createContext(ctx);
const code=fs.readFileSync('data.js','utf8')+'\n'+fs.readFileSync('engine.js','utf8')+'\n;this.G=G;this.D=D;this.api={newState,recalc,newHero,tick,checkAch,buyQol,buyGuild,spendPoint,setZone,assign,syncSlots,giveStarter,ascend,shardPreview,canAscend,buyAstral,buyTool,fmt,fmtTime,computeStats,switchClass};';
vm.runInContext(code,ctx);
const {G,D,api}=ctx;
const cls=process.argv[2]||'fighter', hours=+(process.argv[3]||10);
G.fx=false;G.S=api.newState();G.S.started=true;G.S.cls=cls;api.giveStarter();api.recalc();api.newHero();
const S=()=>G.S;const marks={};let t=0;const step=0.5;
function bot(){
  const s=S(),cl=s.classes[s.cls],cd=D.CLASSES[s.cls];
  for(const q of D.QOL){if(!s.qol[q.id]&&s.gold>=q.cost*1.0){api.buyQol(q.id)}}
  // guild: buy cheapest of armory/barracks while gold > 2x cost
  for(let k=0;k<20;k++){let best=null,bc=1e300;for(const g of ['armory','barracks','bank','library','smithy']){const gd=D.GUILD.find(x=>x.id===g);const c=Math.ceil(gd.base*Math.pow(gd.mult,s.guild[g]||0));if(c<bc){bc=c;best=g}}if(s.gold>bc*2)api.buyGuild(best);else break}
  while(cl.pts>0){const all=[...cd.skills,...cd.passives].filter(x=>x.lv<=cl.lvl&&(cl.ranks[x.id]||0)<x.max);if(!all.length)break;all.sort((a,b)=>(cl.ranks[a.id]||0)-(cl.ranks[b.id]||0));api.spendPoint(all[0].id)}
  if(cl.lvl>=20&&!cl.sub){cl.sub=cd.subs[0].id;G.dirty=true}
  if(s.zones[s.zone].kills>=25&&s.bossRetry<=0)s.bossReq=true;
  let hi=0;s.zones.forEach((z,i)=>{if(z.unlocked)hi=i});if(s.zone!==hi&&s.bossRetry<=0)api.setZone(hi);
  // if failing boss repeatedly stays
  for(let i=1;i<s.slots.length;i++)if(!s.slots[i].act)api.assign(i,{type:'prof',p:i===1?'mining':i===2?'herbalism':'alchemy'});
}
let lastZone=-1;
while(t<hours*3600){api.tick(step);t+=step;if(Math.floor(t)%5===0&&t%5<step){bot();api.checkAch()}
  const s=S();const ec=s.stats.everCleared;if(ec>lastZone){lastZone=ec;console.log(`t=${api.fmtTime(t)} cleared ${ec} lvl=${s.classes[s.cls].lvl} gold=${api.fmt(s.gold)} power=${api.fmt(G.d.power)} deaths=${s.stats.deaths} weap il=${s.equip.weapon.il} r${s.equip.weapon.r}`)}
  if(Math.floor(t)%1800===0&&t%1800<step){console.log(`  [${api.fmtTime(t)}] zone=${s.zone} kills=${s.zones[s.zone].kills} lvl=${s.classes[s.cls].lvl} dps=${api.fmt(G.d.dps)} hp=${api.fmt(G.d.maxHp)} gold=${api.fmt(s.gold)} deaths=${s.stats.deaths} rift=${s.riftLevel} qol=${Object.keys(s.qol).length} mining=${s.profs.mining.lvl} herb=${s.profs.herbalism.lvl}`)}
}
console.log('shards preview',api.shardPreview(),'ach',Object.keys(S().ach).length);
