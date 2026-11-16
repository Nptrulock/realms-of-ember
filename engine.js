'use strict';
/* Realms of Ember — simulation engine (no DOM) */
const G = {S:null, d:null, h:null, cb:null, ev:[], fx:true, dirty:true, logCb:null, now:()=>Date.now()};
const R=(a,b)=>a+Math.random()*(b-a), RI=(a,b)=>Math.floor(R(a,b+1)), pick=a=>a[Math.floor(Math.random()*a.length)], chance=p=>Math.random()<p;
const SAVE_KEY='realmsOfEmber.save.v1';

function fmt(n){
  if(n===Infinity)return '∞'; if(n==null||isNaN(n))return '0';
  const neg=n<0; n=Math.abs(n);
  let s;
  if(n<1000) s = n<10&&n%1? n.toFixed(1).replace(/\.0$/,'') : Math.floor(n).toString();
  else if(n>=1e36)s=n.toExponential(2).replace('+','');
  else{const u=['K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];let i=-1;while(n>=1000&&i<u.length-1){n/=1000;i++}
    const tr=(x,k)=>(Math.floor(x*Math.pow(10,k))/Math.pow(10,k)).toFixed(k);
    s = n>=1000? n.toExponential(2).replace('+',''): (n<10?tr(n,2):n<100?tr(n,1):tr(n,0))+u[i];}
  return (neg?'-':'')+s;
}
function fmtTime(sec){sec=Math.max(0,Math.floor(sec));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return h?`${h}h ${m}m`:m?`${m}m ${s}s`:`${s}s`}

/* ---------- state ---------- */
function newClassState(){return {lvl:1,xp:0,pts:1,ranks:{},sub:null,off:{}}}
function newState(){
  const s={v:3,started:false,name:'Hero',created:Date.now(),last:Date.now(),
    cls:'fighter',cls2:null,classes:{},unlockedCls:{fighter:1,wizard:1,rogue:1,worker:1},
    gold:0,shards:0,ascensions:0,
    inv:[],nextId:1,equip:{},locked:{},
    mats:{},potions:{},elixirs:{},food:{},foodP:{},
    profs:{},ps:{mining:{node:'copper',streak:0},herbalism:{seed:'silverleaf',plots:[]},smithing:{tier:'copper',slot:'weapon',target:65},alchemy:{recipe:'pot1',mastery:{}},enchanting:{slot:'weapon',ward:true},cooking:{recipe:'haunch',count:{}},
      summoning:{target:'wisp'},dancing:{target:'jig',combo:0},praying:{target:'solara',favor:{}},advising:{target:'elder',rep:0},bard:{target:'valor',anthem:'valor',mastery:{},fame:0},fishing:{target:'pond'}},
    summons:[],dance:null,ap:{gen:0,cls:{},prof:{}},mastery:{gen:{},cls:{},prof:{}},daily:{date:'',count:0,streak:0,last:''},deeds:{date:'',list:[]},
    slots:[{act:{type:'combat'},prog:0,heat:0}],
    zone:0,zones:D.ZONES.map((z,i)=>({unlocked:i===0,kills:0,cleared:false,bossKills:0})),riftLevel:0,bossReq:false,bossRetry:0,
    qol:{},plotsBought:0,satchel:0,guild:{},tools:{},astral:{},stars:{origin:1},attuned:{},relics:{},relicTries:{},
    ach:{},settings:{speed:1,quaffAt:40,particles:true,numbers:true,autoBoss:true,autoAdvance:true,autoEquip:true,autoEat:true,autoElixir:true,filter:['sell','keep','keep','keep','keep','keep'],shake:true},
    meal:null,elix:{},
    stats:{kills:0,elites:0,bosses:0,deaths:0,gold:0,actions:0,apEarned:0,apSpent:0,deedsDone:0,found:[0,0,0,0,0,0],infused:[0,0,0,0,0,0],c20:{},clsBest:1,maxEnch:0,crafted:0,play:0,everCleared:0,profMax:{}},
    log:[]};
  for(const c of D.CLASS_ORDER)s.classes[c]=newClassState();
  for(const p of D.PROF_ORDER){s.profs[p]={lvl:1,xp:0};s.stats.profMax[p]=1}
  return s;
}
function deepFill(t,src){for(const k in src){if(t[k]===undefined)t[k]=JSON.parse(JSON.stringify(src[k]));else if(src[k]&&typeof src[k]==='object'&&!Array.isArray(src[k])&&typeof t[k]==='object')deepFill(t[k],src[k])}return t}

function log(msg,cat='info'){const S=G.S;S.log.unshift({t:Date.now(),m:msg,c:cat});if(S.log.length>150)S.log.length=150;if(G.logCb)G.logCb()}
function emit(e){if(G.fx){G.ev.push(e);if(G.ev.length>300)G.ev.splice(0,100)}}

/* ---------- curves ---------- */
const xpNeed=L=>Math.floor(monXp(L+2)*138*Math.pow(1.05,L)*(1+L/4)*(1+1.2*Math.exp(-Math.pow((L-10)/7,2))));
const profXpNeed=L=>Math.floor(950*Math.pow(1.1,L-1)*(1+L/40));
const actXp=(req,t)=>t/6*8*Math.pow(1.035,Math.max(0,req-1));
const monHp=m=>14*Math.pow(1.135,m)*(1+m/10);
const monAtk=m=>2.4*Math.pow(1.115,m)*(1+m/25);
const monXp=m=>4*Math.pow(1.1,m);
const monGold=m=>2*Math.pow(1.1,m);
const relicMod=k=>{let v=0;for(const r of D.RELICS)if(G.S.relics[r.id]&&r.mods[k])v+=r.mods[k];return v};
function relicOdds(r){const S=G.S,d=G.d||{relicLuck:0};let b=1+(d.relicLuck||0)/100;if(r.src.prof)b+=pm(r.src.prof,'lucky')*.06;return Math.max(1,Math.round(r.odds/b))}
function pm(p,id){const m=G.S.mastery.prof[p];return m&&m[id]||0}
function priceMult(){const rep=G.S.ps.advising.rep||0;return 1-(rep>=50?.05:0)-(rep>=1000?.10:0)-(star('e3')?.05:0)}
function townCost(c){return Math.ceil(c*priceMult())}
function actionSlotsInfo(){const S=G.S;const a=[{n:'Hero',eff:1,hero:1}];
  ['apprentice1','apprentice2','apprentice3'].forEach((q,i)=>{if(S.qol[q])a.push({n:['Apprentice','Journeyman','Master Artisan'][i],eff:.75})});
  if(star('t5'))a.push({n:'Astral Familiar',eff:1});
  if(S.relics.hourglass)a.push({n:'Hourglass Familiar',eff:1});
  if(S.relics.seal)a.push({n:'Chancellor',eff:1});
  if((S.ps.advising.rep||0)>=10000)a.push({n:'Royal Steward',eff:1});
  return a;}
function syncSlots(){const n=actionSlotsInfo().length;const S=G.S;while(S.slots.length<n)S.slots.push({act:null,prog:0,heat:0});if(S.slots.length>n)S.slots.length=n}
function speedOptions(){return [1]}
function gameSpeed(){return 1}
function offlineCap(){const S=G.S;return (S.qol.hourglass2?43200:S.qol.hourglass1?21600:7200)+(star('t2')?14400:0)+(star('tc')?21600:0)}
function offlineRate(){const S=G.S;return Math.min(.75,.2+.02*((S.mastery&&S.mastery.gen.vigil)||0)+(S.relics.hourglass?.1:0)+(star('t1')?.05:0)+(star('tc')?.1:0))}
function plotsCount(){const S=G.S;return 3+(S.plotsBought||0)+Math.floor(S.profs.herbalism.lvl/20)+(star('g3')?1:0)}
function invCap(){return 30+10*(G.S.satchel||0)+(star('f7')?20:0)}

/* ---------- stats ---------- */
function itemScale(il){return Math.pow(1.11,il)}
function itemBase(it){const f=itemScale(it.il)*D.RARITIES[it.r].mult*(1+.1*(it.ench||0))*gearMult();const b={};
  switch(it.slot){case'weapon':b.weapon=5*f;break;case'offhand':b.armor=3*f;b.hpFlat=3*f;break;case'helm':b.armor=2*f;b.hpFlat=6*f;break;
  case'chest':b.armor=4*f;b.hpFlat=10*f;break;case'gloves':b.armor=1.5*f;break;case'boots':b.armor=1.5*f;break;}
  return b;}
function baseDerived(){return {str:0,dex:0,con:0,int:0,wis:0,cha:0,hpFlat:0,hpPct:0,armor:0,armorPct:0,dmgPct:0,crit:0,critDmg:50,haste:0,lifesteal:0,
  gold:0,xp:0,mf:0,regen:0,regenPct:0,resRegen:0,resGen:0,skillDmg:0,spellDmg:0,aoeDmg:0,dodge:0,petDmg:0,dr:0,healPct:0,weapon:0,
  vs:{},execute:0,riposte:0,poison:0,sneak:50,sneakCrit:0,costMult:1,slotRate:0,slotMax:2,wardMult:1,smiteMult:1,ebMult:1,soulMax:10,
  killHeal:0,permImp:0,double:0,volley:0,petSpeed:0,hpProc:0,lowRegen:0,profSpeed:0,profXp:0,capMult:1,powers:{},echo:0,
  troopMax:5,troopDmg:0,troopSafe:0,presence:0,profApPct:0,apPct:0,profSucc:0,bounty:0,relicLuck:0,dropPct:0,sellMult:1,helperEff:0,actSpeed:0,hit:70,search:0,dailyCap:0,enchSucc:0}}
function computeStats(opt={}){
  const S=G.S,cd=D.CLASSES[S.cls],cl=S.classes[S.cls],L=cl.lvl,d=baseDerived();
  d.crit=cd.crit;
  for(const st of D.STATS)d[st]=8+cd.growth[st]*L;
  const equip=opt.equip||S.equip;
  for(const sl of D.SLOTS){const it=equip[sl];if(!it)continue;const b=itemBase(it);for(const k in b)d[k]+=b[k];
    const em=1+.1*(it.ench||0);for(const a of it.aff)d[a.k]+=a.v*em;for(const p of (it.pw||[]))d.powers[p]=1;}
  for(const p of cd.passives){const r=cl.ranks[p.id]||0;if(r)p.ap(d,r)}
  if(cl.sub){const sb=cd.subs.find(x=>x.id===cl.sub);if(sb)sb.ap(d)}
  if(cd.inherent)cd.inherent(d);
  const mc=S.mastery.cls[S.cls]||{};for(const n of D.AP_CLASS){if(mc[n.id])n.ap(d,mc[n.id])}if(mc.sig&&cd.apNode)cd.apNode.ap(d,mc.sig);
  for(const n of D.AP_GEN){const r=S.mastery.gen[n.id];if(r)n.ap(d,r)}
  {const dv=D.DEITIES.find(x=>x.id===S.ps.praying.target);const t=favorTier(S.ps.praying.favor[dv.id]||0);if(t)for(const k in dv.per){if(k==='vsUndead')d.vs.undead=(d.vs.undead||0)+dv.per[k]*t;else d[k]+=dv.per[k]*t}}
  {const bs=S.ps.bard,lv=S.profs.bard.lvl,am=S.relics.lute?2:1;const songs=D.SONGS.filter(x=>(bs.mastery[x.id]||0)>0);
   const main=D.SONGS.find(x=>x.id===bs.anthem);const apply=(sg,m)=>{for(const k in sg.mods)d[k]+=sg.mods[k]*m};
   if(main)apply(main,(bs.mastery[main.id]||0)/100*(1+lv/100)*am*(star('m6')?1.25:1));
   if(S.relics.lute){const other=songs.filter(x=>x.id!==bs.anthem).sort((a,b)=>(bs.mastery[b.id]||0)-(bs.mastery[a.id]||0))[0];if(other)apply(other,(bs.mastery[other.id]||0)/100*(1+lv/100)*.5)}}
  if(S.dance&&S.dance.t>0){const ds=D.DANCES.find(x=>x.id===S.dance.id);const m=(1+S.profs.dancing.lvl*.02)*(star('m3')?1.25:1);for(const k in ds.buff)d[k]+=ds.buff[k]*m}
  {const rep=S.ps.advising.rep||0;if(rep>=250)d.gold+=10;if(rep>=3000)d.apPct+=10}
  if(S.qol.ledger)d.apPct+=15;
  if(S.cls2&&S.cls2!==S.cls){const c2=D.CLASSES[S.cls2],cl2=S.classes[S.cls2];for(const p of c2.passives){const r=cl2.ranks[p.id]||0;if(r)p.ap(d,r*.5)}
    for(const st of D.STATS)d[st]+=c2.growth[st]*cl2.lvl*.25;}
  for(const g of D.GUILD){const l=S.guild[g.id]||0;if(l)g.ap(d,l)}
  for(const n of D.STARS)if(S.stars[n.id]&&n.ap)n.ap(d);
  const na=Object.keys(S.ach).length;d.dmgPct+=na;d.gold+=na;
  for(const r of D.RELICS)if(S.relics[r.id])for(const k in r.mods){if(k in d&&typeof d[k]==='number'&&k!=='capMult')d[k]+=r.mods[k]}
  if(S.relics.shard)d.capMult*=100;
  // cooking signatures
  for(const rc of D.PROFS.cooking.recipes){const c=S.ps.cooking.count[rc.id]||0;const m=c>=500?3:c>=100?2:c>=25?1:0;if(m)for(const k in rc.sig)d[k]+=rc.sig[k]*m*(m===3?5/3:1)}
  // meal
  if(S.meal){const rc=D.PROFS.cooking.recipes.find(x=>x.id===S.meal.id);if(rc){const m=(S.meal.p?1.5:1)*(S.relics.ladle?2:1);for(const k in rc.buff)d[k]+=rc.buff[k]*m}}
  for(const id in S.elix){const rc=D.PROFS.alchemy.recipes.find(x=>x.id===id);if(rc&&S.elix[id]>0){const pot=1+(S.ps.alchemy.mastery[id]||0)/200;for(const k in rc.elix)d[k]+=rc.elix[k]*pot}}
  if(G.h&&!opt.noBuffs)for(const b of G.h.buffs)for(const k in b.mods)d[k]+=b.mods[k];
  // powers
  const P=d.powers;if(P.vamp)d.lifesteal+=6;if(P.titan)d.hpPct+=25;if(P.midas)d.gold+=50;if(P.exec)d.execute+=60;if(P.swift)d.haste+=20;if(P.echo)d.echo+=15;
  d.echo+=relicMod('echo');
  // derived
  d.mainStat=d[cd.main];d.mainMult=1+d.mainStat*.02;
  d.weaponDmg=Math.max(3,d.weapon);
  d.maxHp=(40+d.con*6+L*8+d.hpFlat)*(1+d.hpPct/100);
  d.armor=d.armor*(1+d.armorPct/100);
  d.crit=Math.min(80,d.crit+d.dex*.04);
  d.gold+=d.cha*.5; d.xp+=d.int*.2;
  d.atkInt=cd.atk/(1+(d.haste+d.actSpeed)/100);
  d.hit=Math.min(98,d.hit+L*.4);d.troopMax+=Math.floor(L/2);
  d.dodge=Math.min(60,d.dodge); d.dr=Math.min(75,d.dr);
  d.cap=S.relics.crown?Infinity:D.BASE_DMG_CAP*d.capMult;
  const rm=D.RARITIES;void rm;
  d.dps=d.hit/100*d.weaponDmg*d.mainMult*(1+d.dmgPct/100)*(1+Math.min(d.crit,80)/100*d.critDmg/100)/d.atkInt*(1+d.skillDmg/300)*(cd.autoMult||1);
  d.ehp=d.maxHp/(1-d.dr/100)*(1+d.armor/(d.armor+12*Math.pow(1.1,L)))/(1-d.dodge/100);
  d.power=Math.sqrt(d.dps*d.ehp);
  return d;
}
function recalc(){G.d=computeStats();G.dirty=false;if(G.h){G.h.hp=Math.min(G.h.hp,G.d.maxHp)}}

/* ---------- items ---------- */
function rollRarity(mfPct,minR=0,bonus=0){
  const ws=rarityWeights(mfPct,bonus);
  let t=ws.reduce((a,b)=>a+b,0),x=Math.random()*t;for(let i=0;i<ws.length;i++){x-=ws[i];if(x<=0)return Math.max(minR,i)}return minR;}
function makeItem(il,r,slot){
  const S=G.S;slot=slot||pick(D.SLOTS);const cd=D.CLASSES[S.cls];
  const it={id:S.nextId++,slot,il:Math.max(1,Math.round(il)),r,aff:[],pw:[],ench:0};
  let n=D.RARITIES[r].affixes+(slot==='ring'||slot==='amulet'?1:0)+(r>=3&&star('fc')?1:0);
  const keys=Object.keys(D.AFFIXES);const used=new Set();
  const weighted=[cd.main,cd.main,'con','dmgPct','crit','critDmg','haste','hpPct','skillDmg',...keys];
  while(it.aff.length<n){const k=pick(weighted);if(used.has(k))continue;used.add(k);let v=D.AFFIXES[k].roll(it.il,D.RARITIES[r].am)*R(.75,1.1);
    v=D.AFFIXES[k].pct?Math.round(v*10)/10:Math.max(1,Math.round(v));it.aff.push({k,v})}
  if(r>=4){const pw=D.LEGENDARY.slice();it.pw.push(pw.splice(RI(0,pw.length-1),1)[0].id);if(r===5)it.pw.push(pick(pw).id)}
  const tier=D.TIER_NAMES[Math.min(D.TIER_NAMES.length-1,Math.floor(it.il/10))];
  const noun=slot==='weapon'?pick(cd.wn):pick(D.SLOT_NOUN[slot]);
  const top=it.aff[0]?D.SUFFIX[it.aff[0].k]:'';
  it.n=(it.pw.length?D.LEGENDARY.find(x=>x.id===it.pw[0]).n+' ':'')+tier+' '+noun+(top?' '+top:'');
  return it;
}
function itemValue(it){return Math.ceil(3*Math.pow(1.1,it.il)*Math.pow(3,it.r))}
function itemDust(it){return Math.ceil(Math.pow(1+it.r,2.5)*(1+it.il/8)*starDustMult())}
function powerWith(slot,it){const eq=Object.assign({},G.S.equip);eq[slot]=it;return computeStats({equip:eq,noBuffs:1}).power}
function isUpgrade(it){const cur=G.S.equip[it.slot];if(!cur)return true;return powerWith(it.slot,it)>powerWith(it.slot,cur)*1.005}
function equipItem(it,fromInv=true){const S=G.S;if(fromInv){const i=S.inv.indexOf(it);if(i>=0)S.inv.splice(i,1)}
  const old=S.equip[it.slot];S.equip[it.slot]=it;if(old){S.inv.push(old)}G.dirty=true;return old}
function sellItem(it){const S=G.S;const i=S.inv.indexOf(it);if(i>=0)S.inv.splice(i,1);const g=itemValue(it)*((G.d&&G.d.sellMult)||1);S.gold+=g;S.stats.gold+=g;return g}
function salvageItem(it){const S=G.S;const i=S.inv.indexOf(it);if(i>=0)S.inv.splice(i,1);const n=itemDust(it);addMat('dust',n);return n}
function addMat(k,n){const S=G.S;S.mats[k]=(S.mats[k]||0)+n}
function gainItem(it,src){
  const S=G.S;S.stats.found[it.r]++;
  if(it.r>=3)log(`${src||'Found'}: <span class="r${it.r}">${it.n}</span> (ilvl ${it.il})`,'loot');
  emit({t:'loot',r:it.r,n:it.n,slot:it.slot});
  if(S.qol.autoEquip&&S.settings.autoEquip&&isUpgrade(it)){S.inv.push(it);const old=equipItem(it);log(`Equipped <span class="r${it.r}">${it.n}</span>`,'loot');if(old)filterItem(old);return}
  S.inv.push(it);filterItem(it);
}
function filterItem(it){
  const S=G.S;if(S.locked[it.id])return;let act='keep';
  if(S.qol.filter)act=S.settings.filter[it.r]||'keep';else if(S.qol.junk&&it.r===0)act='sell';
  if(act==='sell')sellItem(it);else if(act==='salvage')salvageItem(it);
  if(S.inv.length>invCap()){ // overflow: sell the lowest value unlocked item
    let worst=null;for(const x of S.inv)if(!S.locked[x.id]&&(!worst||itemValue(x)<itemValue(worst)))worst=x;if(worst){sellItem(worst)}}
}

/* ---------- XP ---------- */
function addClassXp(x,cid){
  const S=G.S;cid=cid||S.cls;const c=S.classes[cid];c.xp+=x;let up=0;
  while(c.xp>=xpNeed(c.lvl)&&c.lvl<200){c.xp-=xpNeed(c.lvl);c.lvl++;up++;c.pts++;if(S.relics.quill&&c.lvl%5===0)c.pts++;if(star('l2')&&c.lvl%10===0)c.pts++;if(c.lvl>=20)S.stats.c20[cid]=1;S.stats.clsBest=Math.max(S.stats.clsBest||1,c.lvl)}
  if(up&&cid===S.cls){G.dirty=true;emit({t:'lvl'});log(`⬆️ ${D.CLASSES[cid].n} reached level ${c.lvl}!`,'level');checkClassUnlocks()}
}
function gainCombatXp(x){
  const S=G.S;addClassXp(x);
  if(S.cls2&&S.cls2!==S.cls)addClassXp(x*.25,S.cls2);
  const sh=relicMod('shareXp');if(sh)for(const c of D.CLASS_ORDER)if(c!==S.cls&&c!==S.cls2&&S.unlockedCls[c])addClassXp(x*sh/100,c);
}
function addProfXp(p,x,share=true){
  const S=G.S,pr=S.profs[p];const d=G.d||computeStats();if(share)x*=(1+(d.profXp||0)/100+pm(p,'insight')*.04)*(1+relicMod('profXp')/100)*groupBonus(p);pr.xp+=x;
  while(pr.xp>=profXpNeed(pr.lvl)&&pr.lvl<120){pr.xp-=profXpNeed(pr.lvl);pr.lvl++;log(`${D.PROFS[p].i} ${D.PROFS[p].n} reached level ${pr.lvl}`,'prof');S.stats.profMax[p]=Math.max(S.stats.profMax[p]||1,pr.lvl)}
  const dp=relicMod('dualProf');if(share&&dp){const lows=D.PROF_ORDER.filter(q=>q!==p).sort((a,b)=>S.profs[a].lvl-S.profs[b].lvl).slice(0,2);for(const q of lows)addProfXp(q,x*dp/100,false)}
  const sh=relicMod('shareProf');if(share&&sh){let lo=null;for(const q of D.PROF_ORDER)if(q!==p&&(!lo||S.profs[q].lvl<S.profs[lo].lvl))lo=q;if(lo)addProfXp(lo,x*sh/100,false)}
}
function checkClassUnlocks(){const S=G.S;for(const c of D.CLASS_ORDER){if(!S.unlockedCls[c]&&D.CLASS_UNLOCK[c].test&&D.CLASS_UNLOCK[c].test(S)){S.unlockedCls[c]=1;log(`🎭 New class unlocked: <b>${D.CLASSES[c].n}</b>!`,'level')}}}

/* ---------- relics ---------- */
function rollRelics(match){
  const S=G.S;for(const r of D.RELICS){if(S.relics[r.id])continue;const s=r.src;
    if(match.prof!==undefined){if(s.prof!==match.prof)continue}
    else{if(s.zone!==match.zone||s.prof)continue;if(s.boss&&!match.boss)continue;if(s.elite&&!(match.elite||match.boss))continue}
    S.relicTries[r.id]=(S.relicTries[r.id]||0)+1;
    if(Math.random()<1/relicOdds(r)){S.relics[r.id]={t:Date.now(),tries:S.relicTries[r.id]};G.dirty=true;syncSlots();
      log(`🏺 RELIC DISCOVERED: <b class="relic">${r.i} ${r.n}</b> — ${r.d}`,'relic');emit({t:'relic',id:r.id})}}
}

/* ---------- combat ---------- */
function resMax(){const cd=D.CLASSES[G.S.cls];return cd.res.max(G.d)}
function newHero(){const d=G.d;const cd=D.CLASSES[G.S.cls];G.h={hp:d.maxHp,res:cd.res.start?cd.res.max(d):0,combo:0,slots:d.slotMax,slotT:0,souls:0,shield:0,troops:0,troopT:2,sumT:{},atkT:.5,gcd:0,cds:{},buffs:[],dead:false,reviveT:0,petT:1,impT:0,impMult:1,impAtk:0,swT:1.5,acoT:3,potT:0,phoenixT:0}}
function zoneDef(){return D.ZONES[G.S.zone]}
function zoneLevelRange(zi){const z=D.ZONES[zi];if(z.endless){const b=80+G.S.riftLevel*2;return [b,b+2]}return [z.min,z.max]}
function spawnWave(boss){
  const S=G.S,z=zoneDef(),[mn,mx]=zoneLevelRange(S.zone);let uid=(G.cb&&G.cb.uid)||1;const en=[];
  if(boss){const lv=mx+2;en.push(mkEnemy({...z.boss,hp:1,atk:1,spd:2.4},lv,false,true,uid++));}
  else{const n=S.zone===0?RI(1,2):RI(1,3);for(let i=0;i<n;i++){const def=pick(z.mons);const lv=RI(mn,mx);en.push(mkEnemy(def,lv,chance(.06),false,uid++))}}
  G.cb={enemies:en,uid,boss:!!boss,waveT:0};emit({t:'wave',boss:!!boss});
}
function mkEnemy(def,lv,elite,boss,uid){const zi=Math.min(6,G.S.zone);const hp=monHp(lv)*def.hp*(elite?3:1)*(boss?7+zi*1.2:1);
  return {uid,def,lvl:lv,hp,maxHp:hp,atk:monAtk(lv)*def.atk*(elite?1.6:1)*(boss?1.6+zi*.1:1),spd:def.spd,t:def.spd*R(.6,1),elite,boss,dots:[],mark:0,slowT:0,sneak:true,specT:boss?9:0,warn:false}}
const alive=()=>G.cb?G.cb.enemies.filter(e=>e.hp>0):[];
const C={
  get h(){return G.h},get d(){return G.d},
  tgt(){const a=alive();if(!a.length)return null;let m=a.find(e=>e.mark>0);return m||a[0]},
  rnd(){const a=alive();return a.length?pick(a):null},
  enemiesAlive:alive,hpPct(){return G.h.hp/G.d.maxHp},resMax,
  hit(e,mult,o={}){if(!e||e.hp<=0)return;o.skill=1;heroStrike(e,mult,o)},
  aoe(mult,o={}){o.skill=1;o.aoe=1;for(const e of alive())heroStrike(e,mult,o);if(o.shake)emit({t:'shake'})},
  heal(a){heal(a)},healPct(p){heal(G.d.maxHp*p)},
  buff(id,dur,mods,icon){const h=G.h;h.buffs=h.buffs.filter(b=>b.id!==id);h.buffs.push({id,t:dur,max:dur,mods,icon});G.dirty=true},
  dot(e,mult,dur,icon){if(!e)return;e.dots=e.dots.filter(x=>x.icon!==icon);e.dots.push({dps:mult,t:dur,icon,acc:0})},
  shield(p){G.h.shield=Math.max(G.h.shield,G.d.maxHp*p);emit({t:'shield'})},
  combo(n){G.h.combo=Math.min(5,G.h.combo+n)},
  gain(n){G.h.res=Math.min(resMax(),G.h.res+n)},
  petHit(e,mult){if(!e)return;petStrike(e,mult,'🐺')},
  steal(e,f){const g=monGold(e.lvl)*f*(1+G.d.gold/100);G.S.gold+=g;G.S.stats.gold+=g;emit({t:'gold',a:g,uid:e.uid})},
};
function heal(a){const d=G.d;a*=1+d.healPct/100;const h=G.h;const before=h.hp;h.hp=Math.min(d.maxHp,h.hp+a);const got=h.hp-before;if(got>1)emit({t:'heal',a:got})}
function calcHit(e,mult,o){
  const d=G.d;let dmg=d.weaponDmg*d.mainMult*(1+d.dmgPct/100)*mult;
  if(o.skill)dmg*=1+d.skillDmg/100; if(o.spell)dmg*=1+d.spellDmg/100; if(o.aoe)dmg*=1+d.aoeDmg/100;
  for(const t of e.def.tags)if(d.vs[t])dmg*=1+d.vs[t]/100;
  if(e.hp/e.maxHp<.35&&d.execute)dmg*=1+d.execute/100;
  if(e.mark)dmg*=1+e.mark;
  if(d.presence&&G.h&&G.h.troops)dmg*=1+d.presence*G.h.troops/500;
  let crit=o.forceCrit||Math.random()*100<d.crit+(o.bonusCrit||0);
  if(e.sneak&&G.S.cls==='rogue'){dmg*=1+d.sneak/100;if(d.sneakCrit)crit=true}
  if(crit)dmg*=1+d.critDmg/100;
  dmg*=R(.9,1.1);
  let capped=false;if(dmg>d.cap){dmg=d.cap;capped=true}
  return {dmg,crit,capped};
}
function heroStrike(e,mult,o={}){
  if(o.auto&&!chance(G.d.hit/100)){emit({t:'miss',uid:e.uid});return}
  const r=calcHit(e,mult,o);e.sneak=false;dealToEnemy(e,r.dmg,{crit:r.crit,capped:r.capped,icon:o.icon,color:o.color,proj:o.proj,big:o.big});
  const d=G.d;if(d.lifesteal)heal(r.dmg*d.lifesteal/100*.5);
  if(d.powers.storm&&chance(.1)&&e.hp>0){const r2=calcHit(e,1.5,{});dealToEnemy(e,r2.dmg,{crit:r2.crit,capped:r2.capped,icon:'⚡',color:'#9ff'})}
  if(d.poison&&chance(d.poison/100))C.dot(e,.3,5,'🧪');
}
function petStrike(e,mult,icon){const d=G.d;const o={};const r=calcHit(e,mult*(1+d.petDmg/100),o);dealToEnemy(e,r.dmg,{crit:r.crit,capped:r.capped,icon,pet:1})}
function dealToEnemy(e,dmg,o){if(e.hp<=0)return;e.hp-=dmg;emit({t:'hit',uid:e.uid,a:dmg,crit:o.crit,cap:o.capped,icon:o.icon,color:o.color,proj:o.proj,pet:o.pet,big:o.big});if(e.hp<=0)killEnemy(e)}
function killEnemy(e){
  const S=G.S,d=G.d,h=G.h,cd=D.CLASSES[S.cls];e.hp=0;emit({t:'kill',uid:e.uid,boss:e.boss,elite:e.elite});
  const m=e.lvl,mult=(e.elite?3:1)*(e.boss?15:1),xmult=(e.elite?2:1)*(e.boss?6:1);
  const L=S.classes[S.cls].lvl;const pen=L>m+3?Math.max(.02,Math.pow(.85,L-m-3)):1;const xp=monXp(Math.min(m,L+2))*xmult*(1+d.xp/100)*pen;gainCombatXp(xp);
  const gold=monGold(m)*mult*(1+d.gold/100)*R(.8,1.2);S.gold+=gold;S.stats.gold+=gold;
  S.stats.kills++;if(e.elite)S.stats.elites++;
  if(cd.souls)h.souls=Math.min(d.soulMax,h.souls+1);
  if(d.killHeal)heal(d.maxHp*d.killHeal/100);
  const z=zoneDef();
  const bon=onAction('kill');apGain('cls',S.cls,(e.boss?20:e.elite?3:1)*bon);if(e.elite||e.boss)deedProgress('elites');deedProgress('kills');
  // drops
  const dc=e.loot?1:Math.min(1,(e.boss?1:e.elite?.6:.12)*(1+d.dropPct/100));
  if(chance(dc)){gainItem(makeItem(m,rollRarity(d.mf+(e.loot?e.loot*10:0),e.boss?2:e.elite?1:0)));if(e.boss)gainItem(makeItem(m,rollRarity(d.mf,1)))}
  if(chance(e.boss?1:e.elite?1:.15))addMat(z.mat,e.boss?RI(4,7):e.elite?RI(1,3):1);
  if(!e.def.tags.some(t=>['undead','construct','ooze','elemental'].includes(t))&&chance(.25))addMat('meat',e.boss?5:1);
  if(chance(.004*(e.boss?25:e.elite?5:1)))addMat(pick(['amethyst','ruby','sapphire','emerald','diamond'].slice(0,Math.min(5,1+Math.floor(S.zone/1.6)))),1);
  rollRelics({zone:S.zone,boss:e.boss,elite:e.elite});
  // zone progress
  const zs=S.zones[S.zone];
  if(e.boss){S.stats.bosses++;zs.bossKills++;zs.kills=0;S.bossReq=false;
    if(z.endless){S.riftLevel++;log(`♾️ Rift Warden falls! Rift depth ${S.riftLevel}.`,'boss')}
    else{const first=!zs.cleared;zs.cleared=true;S.stats.everCleared=Math.max(S.stats.everCleared,S.zone+1);
      if(first){const nk=zoneKey(S.zone+1);log(`🏆 Defeated <b>${z.boss.n}</b>! ${D.ZONES[S.zone+1]?D.ZONES[S.zone+1].n+(nk&&!S.attuned[nk.zone]?` found — it needs the ${nk.i} ${nk.n} (Enchanting ${nk.lv}) to enter.`:' unlocked.'):''}`,'boss')}
      if(D.ZONES[S.zone+1])S.zones[S.zone+1].unlocked=true;checkClassUnlocks();
      if(S.qol.autoAdvance&&S.settings.autoAdvance&&D.ZONES[S.zone+1]&&first&&zoneOpen(S.zone+1)){setZone(S.zone+1)}}
  } else if(!z.endless||true){zs.kills=Math.min(D.KILLS_TO_BOSS,zs.kills+1)}
}
function setZone(i){const S=G.S;if(!zoneOpen(i))return;S.zone=i;S.bossReq=false;G.cb=null;emit({t:'zone'});log(`🧭 Traveling to ${D.ZONES[i].n}`,'info')}
function heroAutoAttack(){
  const S=G.S,d=G.d,h=G.h,cd=D.CLASSES[S.cls];const t=C.tgt();if(!t)return;
  const am=cd.autoMult||1;const volley=d.volley&&chance(d.volley/100);
  const targets=volley?alive():[t];
  for(const e of targets)heroStrike(e,am,{icon:null,proj:cd.w==='🏹'?'➶':(cd.autoMult?cd.w:null),auto:1});
  if(d.double&&chance(d.double/100))heroStrike(t,am,{});
  emit({t:'atk'});
  const r=cd.res;if(r.onAtk)h.res=Math.min(resMax(),h.res+r.onAtk*(r.discrete?1:(1+d.resGen/100)));
  if(d.hpProc&&chance(d.hpProc/100))C.gain(1);
  if(cd.combo)C.combo(1);
}
function tryCast(){
  const S=G.S,h=G.h,d=G.d,cd=D.CLASSES[S.cls],cl=S.classes[S.cls];if(h.gcd>0)return;
  for(const sk of cd.skills){const r=cl.ranks[sk.id]||0;if(!r||cl.off[sk.id])continue;if((h.cds[sk.id]||0)>0)continue;
    if(sk.cond&&!sk.cond(C))continue;if(!C.tgt())return;
    let cost=0;if(sk.slot){if(h.slots<sk.slot)continue}else{cost=sk.cost*(cd.res.discrete?1:d.costMult);if(h.res<cost-1e-9)continue}
    if(sk.slot)h.slots-=sk.slot;else h.res-=cost;
    sk.cast(C,r);emit({t:'cast',n:sk.n,i:sk.i});
    if(d.echo&&chance(d.echo/100)&&C.tgt()){sk.cast(C,r);emit({t:'cast',n:sk.n+' (Echo)',i:'🔁'})}
    h.cds[sk.id]=sk.cd;h.gcd=.6;return;}
}
function enemyAttack(e){
  const S=G.S,d=G.d,h=G.h;if(h.dead)return;let mult=1;
  if(e.boss&&e.warn){mult=3;e.warn=false;emit({t:'shake'})}
  if(chance(d.dodge/100)){emit({t:'dodge'});return}
  const lvl=e.lvl;const red=Math.min(.85,d.armor/(d.armor+12*Math.pow(1.1,lvl)));
  let dmg=e.atk*mult*(1-red)*(1-d.dr/100)*R(.9,1.1);
  if(h.shield>0){const ab=Math.min(h.shield,dmg);h.shield-=ab;dmg-=ab}
  h.hp-=dmg;emit({t:'hurt',a:dmg,uid:e.uid,big:mult>1});
  if(h.troops>=1&&chance(.25*(1-Math.min(.95,d.troopSafe/100)))){h.troops-=1;emit({t:'troopLoss'})}
  const cd=D.CLASSES[S.cls];if(cd.res.onHurt)h.res=Math.min(resMax(),h.res+cd.res.onHurt*(1+d.resGen/100));
  if(d.riposte&&chance(d.riposte/100))heroStrike(e,1,{icon:'🤺'});
  if(h.hp<=0){
    if(d.powers.phoenix&&h.phoenixT<=0){h.hp=d.maxHp*.3;h.phoenixT=60;emit({t:'cast',n:'Phoenix Rebirth',i:'🐦‍🔥'});return}
    heroDie();}
}
function searchDelay(){const d=G.d;return 3*(1-Math.min(.8,((d.search||0)+(G.S.qol.hounds?30:0))/100))}
function heroDie(){const S=G.S,h=G.h;h.dead=true;h.hp=0;h.troops=Math.floor((h.troops||0)/2);h.reviveT=S.qol.swiftRevive?3:8;S.stats.deaths++;emit({t:'death'});
  if(G.cb&&G.cb.boss){S.bossReq=false;S.bossRetry=30;log(`💀 Defeated by ${zoneDef().boss.n}. Regroup and grow stronger.`,'death')}
  G.cb=null;}
function usePotion(){const S=G.S;for(let t=5;t>=1;t--){if((S.potions[t]||0)>0){const rc=D.PROFS.alchemy.recipes.find(r=>r.pot===t);S.potions[t]--;const pot=1+(S.ps.alchemy.mastery[rc.id]||0)/200;heal(G.d.maxHp*rc.heal*pot);G.h.potT=8;emit({t:'cast',n:rc.n,i:rc.i});return true}}return false}
function combatTick(dt){
  const S=G.S;if(!G.h)newHero();const h=G.h,d=G.d,cd=D.CLASSES[S.cls];
  if(h.dead){h.reviveT-=dt;if(h.reviveT<=0){h.dead=false;h.hp=d.maxHp;h.shield=0;h.buffs=[];G.dirty=true;emit({t:'revive'})}return}
  // buffs
  let bchg=false;for(const b of h.buffs){b.t-=dt;if(b.t<=0)bchg=true}if(bchg){h.buffs=h.buffs.filter(b=>b.t>0);G.dirty=true}
  h.potT-=dt;h.phoenixT-=dt;h.gcd-=dt;for(const k in h.cds)h.cds[k]-=dt;
  const r=cd.res,mx=resMax();
  if(!r.discrete)h.res=Math.min(mx,h.res+r.regen(d)*(1+d.resRegen/100)*(r.onAtk?(1+d.resGen/100):1)*dt);
  if(cd.slots){h.slotT+=dt*(1+d.slotRate/100);if(h.slotT>=15){h.slotT-=15;if(h.slots<d.slotMax)h.slots++}h.slots=Math.min(h.slots,d.slotMax)}
  const a=alive();
  // regen
  let reg=d.regen+d.maxHp*d.regenPct/100;if(h.hp<d.maxHp*.5)reg+=d.maxHp*d.lowRegen/100;if(!a.length)reg+=d.maxHp*.08;
  h.hp=Math.min(d.maxHp,h.hp+reg*dt);
  if(S.qol.autoQuaff&&h.potT<=0&&h.hp<d.maxHp*S.settings.quaffAt/100&&a.length)usePotion();
  if(!a.length){
    if(r.decay)h.res=Math.max(0,h.res-r.decay*dt);
    if(G.cb&&G.cb.boss){}// boss done
    G.cb=G.cb&&G.cb.enemies.some(e=>e.hp>0)?G.cb:G.cb;
    const wt=(G.cb?G.cb.waveT:0)+dt;if(G.cb)G.cb.waveT=wt;
    if(!G.cb||wt>searchDelay()){
      const zs=S.zones[S.zone];S.bossRetry=Math.max(0,S.bossRetry-dt);
      const full=zs.kills>=D.KILLS_TO_BOSS;
      const doBoss=full&&(S.bossReq||(S.qol.autoBoss&&S.settings.autoBoss&&S.bossRetry<=0));
      spawnWave(doBoss);}
    return;}
  // hero attacks
  h.atkT-=dt;let guard=0;while(h.atkT<=0&&guard++<20){heroAutoAttack();h.atkT+=G.d.atkInt;if(!alive().length)break}
  if(h.atkT<0)h.atkT=0;
  tryCast();
  // pets & allies
  if(cd.pet){h.petT-=dt*(1+d.petSpeed/100);while(h.petT<=0){h.petT+=cd.pet.int;const t=C.tgt();if(t)petStrike(t,cd.pet.mult,'🐺')}}
  if(S.cls==='warlock'&&(h.impT>0||d.permImp)){h.impT-=dt;h.impAtk-=dt;if(h.impAtk<=0){h.impAtk=1.5;const t=C.tgt();if(t)petStrike(t,d.permImp?Math.max(h.impMult,1.2):h.impMult,'😈')}}
  if(cd.troops&&h.troops>=1){if(h.troops>(G.S.stats.maxTroops||0))G.S.stats.maxTroops=h.troops;h.troopT-=dt;if(h.troopT<=0){h.troopT=2;const t=C.tgt();if(t){const r2=calcHit(t,.12*h.troops*(1+d.troopDmg/100),{});dealToEnemy(t,r2.dmg,{crit:r2.crit,capped:r2.capped,icon:'💂',pet:1})}}}
  {const sm=relicMod('summonMult')||1;for(const su of S.summons){if(su.role!=='fight')continue;h.sumT[su.uid]=(h.sumT[su.uid]||Math.random()*2.5)-dt;if(h.sumT[su.uid]<=0){h.sumT[su.uid]=2.5;const t=C.tgt();if(t)petStrike(t,.25*su.power*sm,D.SUMMONS.find(x=>x.id===su.type).i)}}}
  if(S.qol.sellsword){h.swT-=dt;if(h.swT<=0){h.swT=2;const t=C.tgt();if(t)petStrike(t,.6,'🗡️')}}
  if(S.qol.acolyte){h.acoT-=dt;if(h.acoT<=0){h.acoT=3;if(h.hp<d.maxHp*.9){heal(d.maxHp*.05*(1+d.petDmg/200))}}}
  // dots
  for(const e of alive()){for(const dt2 of e.dots){const step=Math.min(dt,dt2.t);dt2.t-=dt;dt2.acc+=step;if(dt2.acc>=1||dt2.t<=0){const r2=calcHit(e,dt2.dps*dt2.acc,{skill:1,spell:1});dt2.acc=0;dealToEnemy(e,r2.dmg,{icon:dt2.icon,crit:r2.crit,dot:1})}}e.dots=e.dots.filter(x=>x.t>0);if(e.slowT>0)e.slowT-=dt}
  // enemies
  for(const e of alive()){
    if(e.boss){e.specT-=dt;if(e.specT<=1.5&&!e.warn){e.warn=true;emit({t:'warn',uid:e.uid});e.t=Math.min(e.t,1.5)}if(e.specT<=0)e.specT=9}
    e.t-=dt*(e.slowT>0?.5:1);let g=0;while(e.t<=0&&g++<10&&e.hp>0){e.t+=e.spd;enemyAttack(e);if(G.h.dead)return}}
}

/* ---------- professions (v2) ---------- */
function profSpeed(si,p){const info=actionSlotsInfo()[si]||{eff:.75};const d=G.d;let eff=info.eff;
  if(si>0)eff*=1+((d.helperEff||0)+pm(p,'mentor')*5)/100;
  return eff*(1+((d.profSpeed||0)+(d.actSpeed||0)+pm(p,'eff')*3+summonWork(p))/100)}
function toolMult(p){return (1+.15*(G.S.tools[p]||0))*groupBonus(p)*((p==='mining'&&star('g2'))||(p==='herbalism'&&star('g3'))||(p==='fishing'&&star('g4'))?1.15:1)}
function profSucc(p,req){const S=G.S,d=G.d;return Math.max(.05,Math.min(.97,.4+.02*(S.profs[p].lvl-req)+(pm(p,'steady')*1.5+(d.profSucc||0))/100))}
function bountyRoll(p){const d=G.d;const c=((d.bounty||0)+pm(p,'bounty')*3)/100;return Math.floor(c)+(chance(c%1)?1:0)}
function summonCap(){return 1+Math.floor(G.S.profs.summoning.lvl/12)+(relicMod('summonSlots')||0)+(star('m2')?2:0)}
function summonWork(p){let w=0;const sm=relicMod('summonMult')||1;for(const su of G.S.summons)if(su.role===p)w+=su.power*3*sm;return w}
function favorTier(f){return Math.min(10,Math.floor(Math.log2(f/10+1)))}
function hasMats(inp,n=1){const S=G.S;for(const k in inp)if((S.mats[k]||0)<inp[k]*n)return false;return true}
function useMats(inp){const S=G.S;for(const k in inp)S.mats[k]-=inp[k]}
function enchCost(it){return Math.ceil(5*Math.pow(1.45,it.ench||0)*(1+it.il/15))}
function enchChance(it){const S=G.S,lv=S.profs.enchanting.lvl,d=G.d;return Math.max(3,Math.min(95,70-(it.ench||0)*8+lv*.5+pm('enchanting','steady')*1.5+(d.profSucc||0)+(S.relics.rune?25:0)+(d.enchSucc||0)))}
function smithCost(t,slot){const n=slot==='weapon'?6:slot==='chest'?8:4;const inp={};inp[t.ore]=n;inp[t.mat]=(inp[t.mat]||0)+2;return inp}
function crackChance(target){const S=G.S;if(S.relics.forge)return 0;const t=D.PROFS.smithing.tiers.find(x=>x.id===S.ps.smithing.tier)||{lv:1};return Math.max(0,Math.min(.95,(1-profSucc('smithing',t.lv))+(target-60)*.008))}
function profDone(p,ok,req,t,mult=1){const xp=actXp(req,t)*mult; // shared bookkeeping for every profession action
  const S=G.S;addProfXp(p,ok?xp:xp*.3);const bon=onAction('prof',p);apGain('prof',p,(ok?1:.3)*bon);if(ok)deedProgress('prof',p);rollRelics({prof:p});
}
function herbTick(dt){
  const S=G.S,hs=S.ps.herbalism;const n=plotsCount();while(hs.plots.length<n)hs.plots.push(null);
  const tended=S.slots.map((sl,i)=>sl.act&&sl.act.type==='prof'&&sl.act.p==='herbalism'?i:-1).filter(i=>i>=0);
  const sp=(tended.length?2:1)*toolMult('herbalism')*(tended.length?Math.max(...tended.map(i=>profSpeed(i,'herbalism'))):1+((G.d.profSpeed||0)+pm('herbalism','eff')*3)/100);
  for(const p of hs.plots)if(p&&p.g<p.max)p.g=Math.min(p.max,p.g+dt*sp);
  if(tended.length||S.qol.autoHarvest){
    const lv=S.profs.herbalism.lvl;
    for(let i=0;i<hs.plots.length;i++){let p=hs.plots[i];
      if(p&&p.g>=p.max){const sd=D.PROFS.herbalism.seeds.find(x=>x.id===p.s);const ok=chance(profSucc('herbalism',sd.lv));
        let q=ok?(1+Math.floor(lv/20)+bountyRoll('herbalism'))*(p.gold?5:1)*(relicMod('gatherMult')||1):1;addMat(p.s,q);if(ok)uniqueRoll('herbalism',sd.lv);
        profDone('herbalism',ok,sd.lv,sd.t/6,p.gold?3:1);if(p.gold&&ok)log(`🌟 Golden ${D.MATS[p.s].n} harvested! (+${q})`,'prof');emit({t:'harvest',i,gold:p.gold&&ok});hs.plots[i]=p=null}
      if(!p){const sd=D.PROFS.herbalism.seeds.find(x=>x.id===hs.seed);if(sd&&sd.lv<=lv)hs.plots[i]={s:sd.id,g:0,max:sd.t,gold:chance(.02+lv*.0004)}}}
  }
}
function timed(sl,dt,sp,t){sl.prog+=dt*sp/t;if(sl.prog>=1){sl.prog=0;return true}return false}
function profTick(si,dt){
  const S=G.S,sl=S.slots[si],p=sl.act.p,sp=profSpeed(si,p)*toolMult(p);sl.note='';const lv=S.profs[p].lvl;
  if(p==='herbalism'){sl.prog=0;return}
  if(p==='mining'){const ms=S.ps.mining,nd=D.PROFS.mining.nodes.find(x=>x.id===ms.node);if(!nd||nd.lv>lv){sl.note='Level too low';return}
    if(timed(sl,dt,sp,nd.t)){const ok=chance(profSucc('mining',nd.lv));
      if(ok){ms.streak=Math.min(20,(ms.streak||0)+1);let q=1+ms.streak*.05;q=Math.floor(q)+(chance(q%1)?1:0)+bountyRoll('mining');q*=relicMod('gatherMult')||1;
        addMat(nd.id,q);uniqueRoll('mining',nd.lv);if(chance(.01+lv*.0003)){addMat(nd.gem,1);log(`💎 Unearthed a ${D.MATS[nd.gem].n}!`,'prof')}emit({t:'mine',si})}
      else{ms.streak=0;emit({t:'fail',si})}
      profDone('mining',ok,nd.lv,nd.t)}return}
  if(p==='smithing'){const ss=S.ps.smithing,t=D.PROFS.smithing.tiers.find(x=>x.id===ss.tier);if(!t||t.lv>lv){sl.note='Level too low';return}
    const inp=smithCost(t,ss.slot);
    if(!sl.busy){if(!hasMats(inp)){sl.note='Need materials';sl.heat=Math.max(0,sl.heat-dt*10);return}useMats(inp);sl.busy=1;sl.heat=0}
    sl.heat+=dt*5*sp;sl.prog=Math.min(1,sl.heat/ss.target);
    if(sl.heat>=ss.target){sl.busy=0;sl.heat=0;sl.prog=0;const ok=!chance(crackChance(ss.target));profDone('smithing',ok,t.lv,ss.target/5+3);
      if(!ok){emit({t:'crack',si});return}
      const qual=(ss.target-40)*3+lv*1.5;const outs=(relicMod('craftMult')||1)*(1+bountyRoll('smithing'));
      for(let k=0;k<outs;k++){let r=rollRarity(qual,1);if(chance(star('k2')?.15:.05))r=Math.min(maxRarity(),r+1);if(S.relics.forge)r=Math.min(maxRarity(),r+1);
        const it=makeItem(t.il+Math.floor(lv/8),r,ss.slot);it.n='Forged '+it.n;S.stats.crafted++;gainItem(it,'Forged');}
      emit({t:'forge',si})}
    return}
  if(p==='alchemy'){const as=S.ps.alchemy,rc=D.PROFS.alchemy.recipes.find(x=>x.id===as.recipe);if(!rc||rc.lv>lv){sl.note='Level too low';return}
    if(!sl.busy){if(!hasMats(rc.in)){sl.note='Need ingredients';return}useMats(rc.in);sl.busy=1;sl.prog=0}
    if(timed(sl,dt,sp,8)){sl.busy=0;const ok=chance(profSucc('alchemy',rc.lv));profDone('alchemy',ok,rc.lv,8);if(!ok){emit({t:'fizzle',si});return}
      const m=as.mastery[rc.id]||0;let n=(1+(chance(m/200)?1:0)+bountyRoll('alchemy'))*(relicMod('craftMult')||1);
      if(rc.mat){addMat(rc.mat,n);log(`${rc.i} Brewed ${n>1?n+'× ':''}<b>${rc.n}</b>`,'prof')}else if(rc.pot)S.potions[rc.pot]=(S.potions[rc.pot]||0)+n;else S.elixirs[rc.id]=(S.elixirs[rc.id]||0)+n;
      if(chance(1-m/120))as.mastery[rc.id]=Math.min(100,m+1);
      if(chance(.04)){const el=pick(D.PROFS.alchemy.recipes.filter(x=>x.elix));S.elixirs[el.id]=(S.elixirs[el.id]||0)+1;log(`💥 Volatile reaction! Bonus ${el.n}.`,'prof')}
      emit({t:'brew',si})}return}
  if(p==='cooking'){const cs=S.ps.cooking,rc=D.PROFS.cooking.recipes.find(x=>x.id===cs.recipe);if(!rc||rc.lv>lv){sl.note='Level too low';return}
    if(!sl.busy){if(!hasMats(rc.in)){sl.note='Need ingredients';return}useMats(rc.in);sl.busy=1;sl.prog=0}
    if(timed(sl,dt,sp,10)){sl.busy=0;const diff=lv-rc.lv;const ok=chance(profSucc('cooking',rc.lv));const perf=Math.min(.3,Math.max(0,diff*.015));profDone('cooking',ok,rc.lv,10);
      if(!ok){emit({t:'burn',si});return}
      const n=(relicMod('craftMult')||1)*(1+bountyRoll('cooking'));if(chance(perf))S.foodP[rc.id]=(S.foodP[rc.id]||0)+n;else S.food[rc.id]=(S.food[rc.id]||0)+n;
      const c=(cs.count[rc.id]||0)+1;cs.count[rc.id]=c;if(c===25||c===100||c===500){log(`👨‍🍳 Signature ${rc.n} tier ${c===25?1:c===100?2:3} earned!`,'prof');G.dirty=true}
      emit({t:'cook',si})}return}
  if(p==='enchanting'){const es=S.ps.enchanting,it=S.equip[es.slot];if(!it){sl.note='Nothing equipped';return}if((it.ench||0)>=15){sl.note='Maxed at +15';return}
    const cost=enchCost(it);if(!sl.busy){if((S.mats.dust||0)<cost){sl.note='Need Arcane Dust';return}S.mats.dust-=cost;sl.busy=1;sl.prog=0}
    if(timed(sl,dt,sp,12)){sl.busy=0;const ok=chance(enchChance(it)/100);profDone('enchanting',ok,Math.max(1,it.il/2+(it.ench||0)*2),12);
      if(ok){it.ench=(it.ench||0)+1;S.stats.maxEnch=Math.max(S.stats.maxEnch,it.ench);G.dirty=true;emit({t:'ench',ok:1,si});if(it.ench>=5)log(`🔮 ${it.n} enchanted to +${it.ench}!`,'prof')}
      else{emit({t:'ench',ok:0,si});if(it.ench>=5&&!S.relics.rune){const gems=Object.keys(S.mats).filter(k=>D.MATS[k]&&D.MATS[k].gem&&S.mats[k]>0);
        if(es.ward&&gems.length){S.mats[gems[0]]--;}else{it.ench--;G.dirty=true;log(`🔮 Enchant failed — ${it.n} dropped to +${it.ench}.`,'prof')}}}}return}
  if(p==='summoning'){const ss=S.ps.summoning,sd=D.SUMMONS.find(x=>x.id===ss.target);if(!sd||sd.lv>lv){sl.note='Level too low';return}
    if(!sl.busy){if(!hasMats(sd.in)){sl.note='Need materials';return}useMats(sd.in);sl.busy=1;sl.prog=0}
    if(timed(sl,dt,sp,sd.t)){sl.busy=0;const ok=chance(profSucc('summoning',sd.lv));profDone('summoning',ok,sd.lv,sd.t);
      if(!ok){emit({t:'fail',si});return}
      uniqueRoll('summoning',sd.lv);const su={uid:S.nextId++,type:sd.id,power:Math.round(sd.power*(1+lv*.02)*100)/100,role:'fight'};
      if(S.summons.length<summonCap()){S.summons.push(su);log(`🔯 Bound a ${sd.n} (power ${su.power}).`,'prof')}
      else{let w=null;for(const x of S.summons)if(!w||x.power<w.power)w=x;
        if(w&&w.power<su.power){su.role=w.role;S.summons[S.summons.indexOf(w)]=su;log(`🔯 A ${sd.n} (power ${su.power}) replaced a weaker creature.`,'prof')}else apGain('prof','summoning',5)}
      emit({t:'summon',si})}return}
  if(p==='dancing'){const ds=S.ps.dancing,dd=D.DANCES.find(x=>x.id===ds.target);if(!dd||dd.lv>lv){sl.note='Level too low';return}
    if(timed(sl,dt,sp,dd.t)){const ok=chance(profSucc('dancing',dd.lv));profDone('dancing',ok,dd.lv,dd.t);
      if(ok){ds.combo=(ds.combo||0)+1;emit({t:'step',si});if(ds.combo>=8){ds.combo=0;const cur=S.dance&&S.dance.id===dd.id?S.dance.t:0;S.dance={id:dd.id,t:Math.min(star('m3')?7200:3600,cur+300)};uniqueRoll('dancing',dd.lv,1);
        const tip=2*Math.pow(1.12,lv)*(1+bountyRoll('dancing'));S.gold+=tip;S.stats.gold+=tip;addProfXp('dancing',actXp(dd.lv,dd.t)*2);G.dirty=true;emit({t:'routine',si})}}
      else{ds.combo=0;emit({t:'fail',si})}}return}
  if(p==='praying'){const ps=S.ps.praying,dv=D.DEITIES.find(x=>x.id===ps.target);if(!dv||dv.lv>lv){sl.note='Level too low';return}
    if(timed(sl,dt,sp,dv.t)){const ok=chance(profSucc('praying',dv.lv));profDone('praying',ok,dv.lv,dv.t);
      if(ok){const before=favorTier(ps.favor[dv.id]||0);ps.favor[dv.id]=(ps.favor[dv.id]||0)+(1+lv/20+bountyRoll('praying'))*(star('m4')?1.5:1);uniqueRoll('praying',dv.lv);const t=favorTier(ps.favor[dv.id]);if(t>before){G.dirty=true;log(`🙏 ${dv.n} grants you blessing tier ${t}.`,'prof')}
        if(chance(.005)){S.ap.gen+=25;S.stats.apEarned+=25;log('✨ A miracle! +25 general AP.','prof')}emit({t:'pray',si})}else emit({t:'fail',si})}return}
  if(p==='advising'){const as=S.ps.advising,pt=D.PETITIONERS.find(x=>x.id===as.target);if(!pt||pt.lv>lv){sl.note='Level too low';return}
    if(timed(sl,dt,sp,pt.t)){const ok=chance(profSucc('advising',pt.lv));profDone('advising',ok,pt.lv,pt.t);const before=as.rep||0;
      if(ok){const g=pt.gold*(1+before/500)*(1+bountyRoll('advising'));S.gold+=g;S.stats.gold+=g;as.rep=before+pt.rep*(star('m5')?1.5:1);uniqueRoll('advising',pt.lv);emit({t:'counsel',si,a:g})}
      else{as.rep=Math.max(0,before-pt.rep*2);emit({t:'fail',si})}
      for(const pk of D.REP_PERKS)if(before<pk.at&&as.rep>=pk.at){log(`📜 Reputation ${pk.at}: ${pk.d}`,'prof');G.dirty=true;syncSlots()}}return}
  if(p==='bard'){const bs=S.ps.bard,sg=D.SONGS.find(x=>x.id===bs.target);if(!sg||sg.lv>lv){sl.note='Level too low';return}
    if(timed(sl,dt,sp,sg.t)){const ok=chance(profSucc('bard',sg.lv));profDone('bard',ok,sg.lv,sg.t);
      if(ok){const enc=chance(Math.min(.3,(bs.fame||0)/5000));const g=1.5*Math.pow(1.12,lv)*(1+(bs.fame||0)/200)*(enc?2:1)*(1+bountyRoll('bard'));S.gold+=g;S.stats.gold+=g;bs.fame=(bs.fame||0)+1;uniqueRoll('bard',sg.lv);
        const m=bs.mastery[sg.id]||0;if(chance(1-m/120)){bs.mastery[sg.id]=Math.min(100,m+1);if(bs.anthem===sg.id)G.dirty=true}emit({t:'song',si,enc})}else emit({t:'fail',si})}return}
  if(p==='fishing'){const fs=S.ps.fishing,sp2=D.FISHING.find(x=>x.id===fs.target);if(!sp2||sp2.lv>lv){sl.note='Level too low';return}
    if(!sl.need){sl.need=sp2.t*R(.5,1.8);sl.needT=sl.need}
    if(timed(sl,dt,sp,sl.need)){sl.need=0;const ok=chance(profSucc('fishing',sp2.lv));profDone('fishing',ok,sp2.lv,sl.needT||sp2.t);
      if(ok){addMat('fish',(sp2.fish+bountyRoll('fishing'))*(relicMod('gatherMult')||1));emit({t:'fish',si});uniqueRoll('fishing',sp2.lv);
        if(chance(.02)){const it=makeItem(sp2.lv+5,rollRarity(G.d.mf+50,1));gainItem(it,'Sunken treasure');const g=5*Math.pow(1.1,sp2.lv);S.gold+=g;S.stats.gold+=g;log(`🎣 Hooked a sunken chest! <span class="r${it.r}">${it.n}</span>`,'prof')}}
      else emit({t:'fail',si})}return}
}

/* ---------- action points, daily, deeds ---------- */
function localDate(t){const d=new Date(t||Date.now());return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function dailyCheck(){const S=G.S,today=localDate();const dl=S.daily;if(dl.date===today)return;
  const y=localDate(Date.now()-864e5);dl.streak=dl.date===y?(dl.streak||0)+1:1;dl.best=Math.max(dl.best||0,dl.streak);dl.date=today;dl.count=0;
  const gift=10*Math.min(7,dl.streak);S.ap.gen+=gift;S.stats.apEarned+=gift;
  if(S.started)log(`📅 New day! Daily streak ${dl.streak} — +${gift} general AP. Your first ${dailyCap()} actions today earn double AP.`,'ach');
  const pool=D.DEEDS.slice();const list=[];const sc=1+Math.min(2,S.ascensions*.1);
  while(list.length<3&&pool.length){const t=pool.splice(RI(0,pool.length-1),1)[0];const it={t:t.t,n:Math.ceil(t.n*sc),prog:0,done:false};if(t.t==='prof'){const top=D.PROF_ORDER.slice().sort((a,b)=>S.profs[b].lvl-S.profs[a].lvl).slice(0,4);it.p=pick(top)}list.push(it)}
  S.deeds={date:today,list};}
function dailyCap(){return D.DAILY_CAP+((G.d&&G.d.dailyCap)||0)}
function onAction(kind,p){const S=G.S;S.stats.actions++;let bon=1;if(S.daily.count<dailyCap()){bon=2;S.daily.count++}
  deedProgress('actions');const g=.1*bon*apMult();S.ap.gen+=g;S.stats.apEarned+=g;return bon}
function apMult(){const d=G.d;return 1+(d.apPct||0)/100}
function apGain(pool,key,amt){const S=G.S,d=G.d;let a=amt*apMult();if(pool==='prof')a*=1+(d.profApPct||0)/100;if(pool==='cls'&&star('l4'))a*=1.5;
  if(pool==='cls')S.ap.cls[key]=(S.ap.cls[key]||0)+a;else if(pool==='prof')S.ap.prof[key]=(S.ap.prof[key]||0)+a;else S.ap.gen+=a;S.stats.apEarned+=a}
function deedProgress(t,p){const S=G.S;for(const dd of S.deeds.list){if(dd.done||dd.t!==t||(dd.p&&dd.p!==p))continue;dd.prog++;
  if(dd.prog>=dd.n){dd.done=true;const rw=30+5*Math.min(7,S.daily.streak||1);S.ap.gen+=rw;S.stats.apEarned+=rw;S.stats.deedsDone++;const g=monGold(Math.max(5,highestLevelReached()))*40;S.gold+=g;S.stats.gold+=g;
    log(`📜 Daily deed complete: ${deedText(dd)} — +${rw} general AP, +${fmt(g)} gold`,'ach');emit({t:'deed'})}}}
function deedText(dd){const t=D.DEEDS.find(x=>x.t===dd.t);return t.d(dd.n,dd.p)}
function masteryCost(node,r){return Math.ceil(node.base*Math.pow(node.mult,r))}
function buyMastery(tree,key,id){const S=G.S;let node,ranks,pool;
  if(tree==='gen'){node=D.AP_GEN.find(x=>x.id===id);ranks=S.mastery.gen;pool=()=>S.ap.gen;}
  else if(tree==='cls'){node=id==='sig'?Object.assign({id:'sig',base:15,mult:1.25,max:20},D.CLASSES[key].apNode):D.AP_CLASS.find(x=>x.id===id);ranks=S.mastery.cls[key]=S.mastery.cls[key]||{};pool=()=>S.ap.cls[key]||0}
  else{node=D.AP_PROF.find(x=>x.id===id);ranks=S.mastery.prof[key]=S.mastery.prof[key]||{};pool=()=>S.ap.prof[key]||0}
  if(!node)return false;const r=ranks[id]||0;if(r>=node.max)return false;const c=masteryCost(node,r);if(pool()<c)return false;
  if(tree==='gen')S.ap.gen-=c;else if(tree==='cls')S.ap.cls[key]-=c;else S.ap.prof[key]-=c;ranks[id]=r+1;S.stats.apSpent+=c;G.dirty=true;return true}

/* ---------- consumables ---------- */
function eatBest(){const S=G.S;const recs=D.PROFS.cooking.recipes.slice().reverse();for(const rc of recs){if((S.foodP[rc.id]||0)>0){S.foodP[rc.id]--;S.meal={id:rc.id,t:mealDur(),p:1};G.dirty=true;return rc}if((S.food[rc.id]||0)>0){S.food[rc.id]--;S.meal={id:rc.id,t:mealDur(),p:0};G.dirty=true;return rc}}return null}
function eatMeal(id,perfect){const S=G.S,store=perfect?S.foodP:S.food;if((store[id]||0)<=0)return;store[id]--;S.meal={id,t:mealDur(),p:perfect?1:0};G.dirty=true}
function drinkElixir(id){const S=G.S;if((S.elixirs[id]||0)<=0)return;S.elixirs[id]--;const rc=D.PROFS.alchemy.recipes.find(x=>x.id===id);S.elix[id]=(S.elix[id]>0?S.elix[id]:0)+rc.dur*(star('k3')?2:1);G.dirty=true}
function consumablesTick(dt){const S=G.S;
  if(S.dance){S.dance.t-=dt;if(S.dance.t<=0){S.dance=null;G.dirty=true}}
  if(S.meal&&!S.relics.ladle){S.meal.t-=dt;if(S.meal.t<=0){S.meal=null;G.dirty=true}}
  for(const k in S.elix){if(S.elix[k]>0){S.elix[k]-=dt;if(S.elix[k]<=0){S.elix[k]=0;G.dirty=true}}}
  if(S.qol.autoEat&&S.settings.autoEat&&!S.meal)eatBest();
  if(S.qol.autoElixir&&S.settings.autoElixir)for(const rc of D.PROFS.alchemy.recipes)if(rc.elix&&!(S.elix[rc.id]>0)&&(S.elixirs[rc.id]||0)>0)drinkElixir(rc.id);
}

/* ---------- main tick ---------- */
function tick(dt){
  const S=G.S;if(!S.started)return;if(G.dirty||!G.d)recalc();
  S.stats.play+=dt;G._dc=(G._dc||0)+dt;if(G._dc>5||!S.daily.date){G._dc=0;dailyCheck()}
  consumablesTick(dt);if(G.dirty)recalc();
  herbTick(dt);
  for(let i=0;i<S.slots.length;i++){const sl=S.slots[i];if(!sl.act)continue;
    if(sl.act.type==='combat'&&i===0)combatTick(dt);else if(sl.act.type==='prof')profTick(i,dt);}
  if(!S.slots[0].act||S.slots[0].act.type!=='combat'){if(G.h&&!G.h.dead)G.h.hp=Math.min(G.d.maxHp,G.h.hp+G.d.maxHp*.05*dt)}
  if(G.dirty)recalc();
}
function checkAch(){const S=G.S;let n=0;for(const a of D.ACH){if(!S.ach[a.id]&&a.t(S)){S.ach[a.id]=Date.now();n++;log(`🏆 Achievement: <b>${a.n}</b> — ${a.d}`,'ach');emit({t:'ach',n:a.n})}}if(n)G.dirty=true}

/* ---------- actions ---------- */
function assign(si,act){const S=G.S;const sl=S.slots[si];if(!sl)return;
  if(act&&act.type==='combat'&&si!==0)return;
  // refund in-progress materials? (keep simple: busy craft continues only if same)
  if(sl.act&&act&&sl.act.p===act.p&&sl.act.type===act.type)return;
  if(sl.busy){sl.busy=0}
  sl.act=act;sl.prog=0;sl.heat=0;if(si===0){G.cb=null;}}
function spendPoint(id){const S=G.S,cl=S.classes[S.cls],cd=D.CLASSES[S.cls];const sk=[...cd.skills,...cd.passives].find(x=>x.id===id);if(!sk||cl.pts<=0||cl.lvl<sk.lv)return;const r=cl.ranks[id]||0;if(r>=sk.max)return;cl.ranks[id]=r+1;cl.pts--;G.dirty=true}
function respecCost(){const L=G.S.classes[G.S.cls].lvl;return L<=10?0:Math.floor(50*Math.pow(L,1.8))}
function respec(){const S=G.S,cl=S.classes[S.cls];const c=respecCost();if(S.gold<c)return false;S.gold-=c;let n=0;for(const k in cl.ranks)n+=cl.ranks[k];cl.ranks={};cl.pts+=n;G.dirty=true;return true}
function switchClass(c){const S=G.S;if(!S.unlockedCls[c]||S.cls===c)return;S.cls=c;if(S.cls2===c)S.cls2=null;autoFirst(c);G.dirty=true;recalc();newHero();G.cb=null;log(`🎭 You are now a ${D.CLASSES[c].n}.`,'info')}
function upgradeCost(base,mult,l){return Math.ceil(base*Math.pow(mult,l))}
function buyQol(id){const S=G.S,q=D.QOL.find(x=>x.id===id);const c=townCost(q.cost);if(!q||S.qol[id]||S.gold<c)return false;S.gold-=c;S.qol[id]=1;syncSlots();G.dirty=true;log(`🏰 Unlocked ${q.n}`,'info');return true}
function buyGuild(id){const S=G.S,g=D.GUILD.find(x=>x.id===id),l=S.guild[id]||0,c=townCost(upgradeCost(g.base,g.mult,l));if(S.gold<c)return false;S.gold-=c;S.guild[id]=l+1;G.dirty=true;return true}
function buyTool(p){const S=G.S,l=S.tools[p]||0;if(l>=D.TOOLS.max)return false;const c=townCost(upgradeCost(D.TOOLS.base,D.TOOLS.mult,l));if(S.gold<c)return false;S.gold-=c;S.tools[p]=l+1;return true}
function buySatchel(){const S=G.S;if(S.satchel>=D.SATCHEL.max)return false;const c=townCost(upgradeCost(D.SATCHEL.base,D.SATCHEL.mult,S.satchel));if(S.gold<c)return false;S.gold-=c;S.satchel++;return true}
function buyPlot(){const S=G.S;if(S.plotsBought>=D.PLOTS.max)return false;const c=townCost(upgradeCost(D.PLOTS.base,D.PLOTS.mult,S.plotsBought));if(S.gold<c)return false;S.gold-=c;S.plotsBought++;return true}

/* ---------- ascension ---------- */
function highestLevelReached(){const S=G.S;let m=0;S.zones.forEach((z,i)=>{if(z.cleared)m=Math.max(m,D.ZONES[i].max+2)});if(S.zones[8].unlocked)m=Math.max(m,80+S.riftLevel*2);return m}
function canAscend(){return G.S.zones[2].cleared}
function ascend(){
  const S=G.S;if(!canAscend())return false;const gain=shardPreview();const kp=keepPct();const keep=newState();
  const persist=['name','qol','settings','astral','stars','attuned','tools','relics','relicTries','ach','stats','unlockedCls','log','satchel','plotsBought','started','ap','mastery','daily','deeds'];
  for(const k of persist)keep[k]=S[k];
  keep.shards=S.shards+gain;keep.ascensions=S.ascensions+1;keep.cls=S.cls;keep.cls2=S.cls2;
  // professions: keep a share of levels by constellation (20% base)
  for(const p of D.PROF_ORDER){const g=profGroup(p);keep.profs[p].lvl=Math.max(1,Math.floor(S.profs[p].lvl*kp[g]/100))}
  // recipes & know-how carry over
  keep.ps.cooking.count=S.ps.cooking.count;keep.ps.alchemy.mastery=S.ps.alchemy.mastery;keep.ps.bard.mastery=S.ps.bard.mastery;keep.ps.bard.anthem=S.ps.bard.anthem;
  keep.ps.bard.fame=Math.floor((S.ps.bard.fame||0)*.25);keep.ps.advising.rep=Math.floor((S.ps.advising.rep||0)*.25);
  for(const k in S.ps.praying.favor)keep.ps.praying.favor[k]=S.ps.praying.favor[k]*.25;keep.ps.praying.target=S.ps.praying.target;
  for(const k in S.mats)if(D.MATS[k]&&D.MATS[k].u&&k!=='saga')keep.mats[k]=S.mats[k];
  // classes
  for(const c in S.classes){const o=S.classes[c],L=Math.max(1,Math.floor(o.lvl*kp.cls/100));const n=keep.classes[c];n.lvl=L;n.pts=L+(S.relics.quill?Math.floor(L/5):0)+(star('l2')?Math.floor(L/10):0);n.sub=L>=D.SUB_LEVEL?o.sub:null}
  if(keep.cls2&&keep.classes[keep.cls2].lvl<D.MULTI_LEVEL)keep.cls2=null;
  keep.gold=Math.floor(S.gold*kp.gold/100);
  const hs=star('ec')?3:star('e4')?2:0;for(let i=0;i<hs;i++){keep.zones[i].cleared=true;keep.zones[i+1].unlocked=true}
  keep.stats.lastAscend={t:Date.now(),gain};
  G.S=keep;syncSlots();G.h=null;G.cb=null;giveStarter();recalc();newHero();
  log(`🌟 ASCENDED! Gained ${fmt(gain)} Stardust. (Ascension ${keep.ascensions})`,'relic');return gain;
}
function autoFirst(c){const cl=G.S.classes[c];const f=D.CLASSES[c].skills[0].id;if(!cl.ranks[f]&&cl.pts>0){cl.ranks[f]=1;cl.pts--}}
function giveStarter(){const S=G.S;autoFirst(S.cls);const it=makeItem(1,0,'weapon');it.aff=[];it.n='Splintered Training '+D.CLASSES[S.cls].wn[0];S.equip.weapon=it}

/* ---------- save / load / offline ---------- */
function serialize(){G.S.last=Date.now();return JSON.stringify(G.S)}
function save(){try{localStorage.setItem(SAVE_KEY,serialize())}catch(e){}}
/* v1 -> v2 save migration. Levels are converted by equivalent play time: hours a v1 player needed for a level
   (measured with the v1 engine at 1x) mapped onto hours the v2 curve needs (measured with sim.js, AP spending on). */
const MIG={
 oldProf:[0,0,0.004,0.008,0.012,0.016,0.021,0.027,0.033,0.039,0.047,0.055,0.063,0.068,0.072,0.077,0.083,0.089,0.095,0.103,0.111,0.12,0.129,0.14,0.153,0.165,0.172,0.178,0.186,0.194,0.203,0.213,0.223,0.235,0.247,0.262,0.277,0.295,0.314,0.334,0.357,0.369,0.38,0.392,0.407,0.422,0.44,0.459,0.479,0.502,0.527,0.555,0.585,0.617,0.655,0.695,0.739,0.787,0.841,0.9,0.965,0.995,1.029,1.065,1.105,1.149,1.198,1.252,1.311,1.376,1.447,1.524,1.611,1.706,1.811,1.924,2.051,2.19,2.342,2.511,2.695,2.898,3.122,3.368,3.638,3.936,4.263,4.623,5.019,5.455,5.934],
 oldCls:[[1,0],[13,.164],[18,.5],[21,1],[23,1.35],[27,1.47],[28,1.5],[35,1.75],[42,2],[47,2.27],[53,2.5],[65,3],[70,3.5],[72,4],[74,5],[75,5.12],[77,6]],
 newProf:[0,0,0.288,0.552,0.798,1.07,1.374,1.712,2.024,2.328,2.659,3.006,3.392,3.718,4.089,4.482,4.897,5.335,5.821,6.358,6.911,7.471,8.061,8.69,9.38,10.106,10.747,11.436,12.157,12.939,13.796,14.71,15.704,16.783,17.917,19.122,20.339,21.661,23.086],
 newCls:[0,0,0.396,0.804,1.267,1.756,2.044,2.334,2.638,3.031,3.453,3.952,4.49,4.998,5.405,5.796,6.15,6.5,6.849,7.194,7.542,7.852,8.152,8.453,8.767,9.084,9.421,9.806,10.246,10.731,11.297,11.733,12.191,12.659,13.159,13.693,14.271,14.915,15.641,16.451,17.419,18.399,19.043,19.706,20.404,21.166,21.983,22.86,23.823]};
function migHours(kind,lvl,frac){ // v1 hours to reach (lvl + frac)
  if(kind==='prof'){const a=MIG.oldProf,L=Math.min(lvl,a.length-1);let h=a[L];const nx=L+1<a.length?a[L+1]:h*1.09;if(L<lvl)h*=Math.pow(1.09,lvl-L);return h+(nx-a[L])*frac}
  const a=MIG.oldCls;const x=lvl+frac;for(let i=1;i<a.length;i++)if(x<=a[i][0]){const [l0,h0]=a[i-1],[l1,h1]=a[i];return h0+(h1-h0)*(x-l0)/(l1-l0)}
  return a[a.length-1][1]+.5*(x-a[a.length-1][0])}
function migLevel(kind,h){ // v2 level + fraction reached after h hours
  const a=kind==='prof'?MIG.newProf:MIG.newCls;let L=1;while(L+1<a.length&&a[L+1]<=h)L++;
  if(L+1<a.length)return [L,(h-a[L])/(a[L+1]-a[L])];
  let step=a[L]-a[L-1],t=a[L];while(t+step*1.07<=h){step*=1.07;t+=step;L++}return [L,(h-t)/(step*1.07)]}
function migrate2(s){if((s.v||1)>=2)return null;
  const old=s.v||1;s.v=2;s.settings.speed=1;s.unlockedCls=s.unlockedCls||{};s.unlockedCls.worker=1;
  if(s.qol){if(s.qol.speed15){delete s.qol.speed15;s.qol.hounds=1}if(s.qol.speed2){delete s.qol.speed2;s.qol.ledger=1}}
  if(s.astral&&s.astral.warp3){delete s.astral.warp3;s.astral.haste=(s.astral.haste||0)+2}
  const oldCN=L=>Math.floor(12*Math.pow(1.13,L)*(1+L*0.1)),oldPN=L=>Math.floor(30*Math.pow(1.1,L));
  const rescaled=[];let cl=0,pr=0;
  for(const c in s.classes){const st=s.classes[c];if(st.lvl<=1&&!st.xp)continue;const h=migHours('cls',st.lvl,Math.min(1,(st.xp||0)/oldCN(st.lvl)));
    let [L,f]=migLevel('cls',h);if(L>st.lvl){L=st.lvl;f=0}const from=st.lvl;st.lvl=L;st.xp=Math.floor(f*xpNeed(L));
    if(L<from){st.ranks={};st.pts=L;if(L<D.SUB_LEVEL)st.sub=null;if(D.CLASSES[c])rescaled.push({i:D.CLASSES[c].i,n:D.CLASSES[c].n,from,to:L})}
    const a=Math.round(h*1500);if(a){s.ap.cls[c]=(s.ap.cls[c]||0)+a;cl+=a}}
  for(const p in s.profs){const st=s.profs[p];if(st.lvl<=1&&!st.xp)continue;const h=migHours('prof',st.lvl,Math.min(1,(st.xp||0)/oldPN(st.lvl)));
    let [L,f]=migLevel('prof',h);if(L>st.lvl){L=st.lvl;f=0}const from=st.lvl;st.lvl=L;st.xp=Math.floor(f*profXpNeed(L));
    if(L<from&&D.PROFS[p])rescaled.push({i:D.PROFS[p].i,n:D.PROFS[p].n,from,to:L});
    const a=Math.round(h*400);if(a){s.ap.prof[p]=(s.ap.prof[p]||0)+a;pr+=a}}
  // keep profession targets valid for the new levels
  const best=(arr,lv)=>{let b=arr[0].id;for(const x of arr)if(x.lv<=lv)b=x.id;return b};
  const ok=(arr,id,lv)=>{const x=arr.find(y=>y.id===id);return x&&x.lv<=lv};
  const P=s.profs,ps=s.ps;
  if(!ok(D.PROFS.mining.nodes,ps.mining.node,P.mining.lvl)){ps.mining.node=best(D.PROFS.mining.nodes,P.mining.lvl);ps.mining.streak=0}
  if(!ok(D.PROFS.herbalism.seeds,ps.herbalism.seed,P.herbalism.lvl))ps.herbalism.seed=best(D.PROFS.herbalism.seeds,P.herbalism.lvl);
  if(!ok(D.PROFS.smithing.tiers,ps.smithing.tier,P.smithing.lvl))ps.smithing.tier=best(D.PROFS.smithing.tiers,P.smithing.lvl);
  if(!ok(D.PROFS.alchemy.recipes,ps.alchemy.recipe,P.alchemy.lvl))ps.alchemy.recipe=best(D.PROFS.alchemy.recipes,P.alchemy.lvl);
  if(!ok(D.PROFS.cooking.recipes,ps.cooking.recipe,P.cooking.lvl))ps.cooking.recipe=best(D.PROFS.cooking.recipes,P.cooking.lvl);
  // send the hero somewhere survivable for the new level
  const lv=(s.classes[s.cls]||{lvl:1}).lvl;let z=0;D.ZONES.forEach((zd,i)=>{if(s.zones[i]&&s.zones[i].unlocked&&zd.min<=lv+2)z=i});if((s.zone||0)>z)s.zone=z;
  if(s.cls2&&(s.classes[s.cls2]||{lvl:1}).lvl<D.MULTI_LEVEL&&!Object.values(s.classes).some(c=>c.lvl>=D.MULTI_LEVEL))s.cls2=null;
  const kills=(s.stats&&s.stats.kills)||0;const gen=Math.round(50+Math.min(2000,kills/25));s.ap.gen+=gen;
  return {from:old,gen,cl,pr,rescaled}}
function migrate3(s){if((s.v||1)>=3)return null;s.v=3;s.stars=s.stars||{};s.stars.origin=1;s.attuned=s.attuned||{};
  let refund=0;const mapped=[];
  for(const a of D.ASTRAL_OLD){const l=(s.astral||{})[a.id]||0;if(!l)continue;
    if(a.id==='mythic'){s.stars.f6=1;mapped.push('🔴 Mythic Attunement');continue}
    if(a.id==='familiar'){s.stars.t5=1;mapped.push('🦉 Astral Familiar');continue}
    for(let i=0;i<l;i++)refund+=Math.ceil(a.base*Math.pow(a.mult,i))}
  s.shards=(s.shards||0)+refund;s.astral={};
  (s.zones||[]).forEach((z,i)=>{const k=D.KEYS.find(x=>x.zone===i);if(k&&z.unlocked)s.attuned[i]=1});
  s.stats.infused=s.stats.infused||[0,0,0,0,0,0];s.stats.c20=s.stats.c20||{};for(const c in s.classes){if(s.classes[c].lvl>=20)s.stats.c20[c]=1;s.stats.clsBest=Math.max(s.stats.clsBest||1,s.classes[c].lvl)}
  while(s.settings.filter.length<D.RARITIES.length)s.settings.filter.push('keep');
  return {refund,mapped}}
function migrate(s){const a=migrate2(s),b=migrate3(s);if(!a&&!b)return null;return Object.assign({from:a?a.from:2,gen:0,cl:0,pr:0,rescaled:[]},a||{},{v3:b})}
function loadFrom(json){const s=JSON.parse(json);deepFill(s,newState());G.migration=migrate(s);G.S=s;syncSlots();G.dirty=true;recalc();newHero();return s}
function exportSave(){return btoa(unescape(encodeURIComponent(serialize())))}
function importSave(str){const json=decodeURIComponent(escape(atob(str.trim())));loadFrom(json);save()}
function snapshot(){const S=G.S;return {gold:S.gold,kills:S.stats.kills,lv:S.classes[S.cls].lvl,profs:D.PROF_ORDER.map(p=>S.profs[p].lvl),found:S.stats.found.slice(),relics:Object.keys(S.relics).length,zone:S.stats.everCleared,ap:S.stats.apEarned||0,mats:Object.assign({},S.mats)}}
function simulate(seconds,step=1){const fx=G.fx;G.fx=false;let t=0;while(t<seconds){const dt=Math.min(step,seconds-t);tick(dt);t+=dt;if(Math.floor(t)%30===0)checkAch()}G.fx=fx;G.ev.length=0;checkAch()}
function offlineProgress(){const S=G.S;const el=Math.min(offlineCap(),(Date.now()-S.last)/1000);if(el<30)return null;const before=snapshot();const t0=performance.now();
  simulate(el*offlineRate(),el>7200?2:1);const after=snapshot();return {el,before,after,ms:performance.now()-t0}}

/* ---------- v3: rarity, reagents, infusion, keys, Star Chart ---------- */
function star(id){const S=G.S;return !!(S&&S.stars&&S.stars[id])}
function starDustMult(){return star('f4')?1.5:1}
function gearMult(){return 1+(star('f2')?.15:0)+(star('fc')?.25:0)}
function maxRarity(){return star('f6')?5:4}
function mealDur(){return star('k4')?1200:600}
function profGroup(p){for(const g in D.PGROUP)if(D.PGROUP[g].includes(p))return g;return 'wilds'}
function groupBonus(p){const g=profGroup(p);return (g==='wilds'&&star('gc'))||(g==='workshop'&&star('kc'))||(g==='court'&&star('mc'))?1.25:1}
function rarityWeights(mfPct,bonus=0){const lw=relicMod('legendW')||1;return D.RARITIES.map((r,i)=>{let w=r.w;if(i>0)w*=1+(mfPct+bonus)/100*(i/2);
  if(i===3&&star('f3'))w*=1.5;if(i>=4){w*=lw;if(star('f5'))w*=1.5}if(i===5&&!star('f6'))w=0;return w})}
function rarityOdds(mfPct,minR=0){const ws=rarityWeights(mfPct);const t=ws.reduce((a,b)=>a+b,0);const o=ws.map(w=>w/t);if(minR){let lo=0;for(let i=0;i<minR;i++){lo+=o[i];o[i]=0}o[minR]+=lo}return o}
function uniqueChance(u){let ch=u.ch;if((u.id==='deepcore'||u.id==='stariron')&&star('g2'))ch*=1.5;if((u.id==='pearl'||u.id==='essence')&&star('g4'))ch*=2;return ch}
function uniqueRoll(p,req,routine){const S=G.S;for(const u of D.UNIQUE){if(u.p!==p||req<u.lv||!!u.routine!==!!routine)continue;
  if(chance(uniqueChance(u))){addMat(u.id,1);S.stats.uniques=(S.stats.uniques||0)+1;log(`${u.i} Rare find: <b>${u.n}</b>`,'prof');emit({t:'unique',id:u.id})}}}
function infuseInfo(it){const f=D.INFUSE[it.r];if(!f)return null;const S=G.S;const why=[];if(S.profs.smithing.lvl<f.lv)why.push(`Smithing ${f.lv}`);
  if(f.star&&!star(f.star))why.push(`star ${D.STAR[f.star].n}`);if(!hasMats(f.in))why.push('reagents');return {f,ok:!why.length,why}}
function infuse(it){const inf=infuseInfo(it);if(!inf||!inf.ok)return false;const S=G.S,f=inf.f;useMats(f.in);const from=it.r,to=f.to;const k=D.RARITIES[to].am/D.RARITIES[from].am;
  for(const a of it.aff)a.v=D.AFFIXES[a.k].pct?Math.round(a.v*k*10)/10:Math.max(1,Math.round(a.v*k));
  it.r=to;const want=D.RARITIES[to].affixes+(it.slot==='ring'||it.slot==='amulet'?1:0)+(to>=3&&star('fc')?1:0);const keys=Object.keys(D.AFFIXES);
  while(it.aff.length<want){const k2=pick(keys);if(it.aff.some(a=>a.k===k2))continue;let v=D.AFFIXES[k2].roll(it.il,D.RARITIES[to].am)*R(.85,1.1);v=D.AFFIXES[k2].pct?Math.round(v*10)/10:Math.max(1,Math.round(v));it.aff.push({k:k2,v})}
  const need=to===5?2:to===4?1:0;while(it.pw.length<need){const pw=pick(D.LEGENDARY).id;if(!it.pw.includes(pw))it.pw.push(pw)}
  if(!/^Infused /.test(it.n))it.n='Infused '+it.n;S.locked[it.id]=1;S.stats.infused[to]=(S.stats.infused[to]||0)+1;
  addProfXp('smithing',actXp(f.lv,60)*3);log(`⚒️ Infused <span class="r${to}">${it.n}</span> — now ${D.RARITIES[to].name}!`,'loot');emit({t:'loot',r:to,inf:1,slot:it.slot});G.dirty=true;return true}
function zoneKey(i){return D.KEYS.find(k=>k.zone===i)}
function zoneOpen(i){const S=G.S;const k=zoneKey(i);return !!(S.zones[i]&&S.zones[i].unlocked&&(!k||S.attuned[i]))}
function keyInfo(k){const S=G.S;if(S.attuned[k.zone])return {done:1};const why=[];if(S.profs.enchanting.lvl<k.lv)why.push(`Enchanting ${k.lv}`);if(!hasMats(k.in))why.push('reagents');return {ok:!why.length,why}}
function craftKey(id){const k=D.KEYS.find(x=>x.id===id);if(!k)return false;const ki=keyInfo(k);if(!ki.ok)return false;useMats(k.in);G.S.attuned[k.zone]=1;addProfXp('enchanting',actXp(k.lv,60)*3);
  log(`${k.i} Crafted the <b>${k.n}</b> — ${D.ZONES[k.zone].n} is open to you for good.`,'relic');emit({t:'loot',r:4,key:1});return true}
function starState(id){const S=G.S,n=D.STAR[id];if(S.stars[id])return 'owned';if(n.cap)return 'cap';if(!n.adj.some(a=>S.stars[a]))return 'locked';if(n.goal&&!n.goal.t(S))return 'goal';return S.shards>=n.cost?'buy':'poor'}
function buyStar(id){const S=G.S,n=D.STAR[id];if(!n||starState(id)!=='buy')return false;S.shards-=n.cost;S.stars[id]=1;log(`🌌 Lit <b>${n.i} ${n.n}</b>: ${n.d}`,'relic');checkCapstones();syncSlots();G.dirty=true;return true}
function constProgress(c){const ns=D.STARS.filter(n=>n.c===c&&!n.cap);return [ns.filter(n=>G.S.stars[n.id]).length,ns.length]}
function checkCapstones(){const S=G.S;for(const n of D.STARS)if(n.cap&&!S.stars[n.id]){const [a,b]=constProgress(n.c);if(a>=b){S.stars[n.id]=1;const c=D.CONST.find(x=>x.id===n.c);log(`🌠 Constellation complete: <b>${c.n}</b>! ${n.i} ${n.n}: ${n.d}`,'relic');emit({t:'capstone',id:n.id})}}}
function keepPct(){const t=(ids,base)=>{for(const [id,v] of ids)if(star(id))return v;return base};
  return {gold:t([['e5',25],['e2',10]],0),cls:t([['lc',30],['l5',20],['l3',10]],0),
    wilds:t([['gc',60],['g5',50],['g1',35]],20),workshop:t([['kc',60],['k6',50],['k1',35]],20),court:t([['mc',60],['m7',50],['m1',35]],20)}}
function stardustParts(){const S=G.S;const m=highestLevelReached();if(m<20)return null;const deep=Math.pow(m/10,2.2),cls=totalClassLevels(S)/15,prof=D.PROF_ORDER.reduce((a,p)=>a+S.profs[p].lvl,0)/20;
  const pct=(star('r2')?20:0)+(star('r4')?20:0)+(star('rc')?30:0),saga=Math.min(60,(S.mats.saga||0)*3);const base=deep+cls+prof;
  return {m,deep,cls,prof,base,pct,saga,total:Math.floor(base*(1+pct/100)*(1+saga/100))}}
function shardPreview(){const p=stardustParts();return p?p.total:0}

if(typeof module!=='undefined')module.exports={G};
