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
  const s={v:1,started:false,name:'Hero',created:Date.now(),last:Date.now(),
    cls:'fighter',cls2:null,classes:{},unlockedCls:{fighter:1,wizard:1,rogue:1},
    gold:0,shards:0,ascensions:0,
    inv:[],nextId:1,equip:{},locked:{},
    mats:{},potions:{},elixirs:{},food:{},foodP:{},
    profs:{},ps:{mining:{node:'copper',streak:0},herbalism:{seed:'silverleaf',plots:[]},smithing:{tier:'copper',slot:'weapon',target:65},alchemy:{recipe:'pot1',mastery:{}},enchanting:{slot:'weapon',ward:true},cooking:{recipe:'haunch',count:{}}},
    slots:[{act:{type:'combat'},prog:0,heat:0}],
    zone:0,zones:D.ZONES.map((z,i)=>({unlocked:i===0,kills:0,cleared:false,bossKills:0})),riftLevel:0,bossReq:false,bossRetry:0,
    qol:{},plotsBought:0,satchel:0,guild:{},tools:{},astral:{},relics:{},relicTries:{},
    ach:{},settings:{speed:1,quaffAt:40,particles:true,numbers:true,autoBoss:true,autoAdvance:true,autoEquip:true,autoEat:true,autoElixir:true,filter:['sell','keep','keep','keep','keep','keep'],shake:true},
    meal:null,elix:{},
    stats:{kills:0,elites:0,bosses:0,deaths:0,gold:0,found:[0,0,0,0,0,0],maxEnch:0,crafted:0,play:0,everCleared:0,profMax:{}},
    log:[]};
  for(const c of D.CLASS_ORDER)s.classes[c]=newClassState();
  for(const p of D.PROF_ORDER){s.profs[p]={lvl:1,xp:0};s.stats.profMax[p]=1}
  return s;
}
function deepFill(t,src){for(const k in src){if(t[k]===undefined)t[k]=JSON.parse(JSON.stringify(src[k]));else if(src[k]&&typeof src[k]==='object'&&!Array.isArray(src[k])&&typeof t[k]==='object')deepFill(t[k],src[k])}return t}

function log(msg,cat='info'){const S=G.S;S.log.unshift({t:Date.now(),m:msg,c:cat});if(S.log.length>150)S.log.length=150;if(G.logCb)G.logCb()}
function emit(e){if(G.fx){G.ev.push(e);if(G.ev.length>300)G.ev.splice(0,100)}}

/* ---------- curves ---------- */
const xpNeed=L=>Math.floor(12*Math.pow(1.13,L)*(1+L*0.1));
const profXpNeed=L=>Math.floor(30*Math.pow(1.1,L));
const monHp=m=>14*Math.pow(1.135,m)*(1+m/10);
const monAtk=m=>2.4*Math.pow(1.115,m)*(1+m/25);
const monXp=m=>4*Math.pow(1.1,m);
const monGold=m=>2*Math.pow(1.1,m);
const relicMod=k=>{let v=0;for(const r of D.RELICS)if(G.S.relics[r.id]&&r.mods[k])v+=r.mods[k];return v};
function relicOdds(r){return Math.max(1,Math.round(r.odds/(1+0.25*(G.S.astral.relicLuck||0))))}
function actionSlotsInfo(){const S=G.S;const a=[{n:'Hero',eff:1,hero:1}];
  ['apprentice1','apprentice2','apprentice3'].forEach((q,i)=>{if(S.qol[q])a.push({n:['Apprentice','Journeyman','Master Artisan'][i],eff:.75})});
  if(S.astral.familiar)a.push({n:'Astral Familiar',eff:1});
  if(S.relics.hourglass)a.push({n:'Hourglass Familiar',eff:1});
  return a;}
function syncSlots(){const n=actionSlotsInfo().length;const S=G.S;while(S.slots.length<n)S.slots.push({act:null,prog:0,heat:0});if(S.slots.length>n)S.slots.length=n}
function speedOptions(){const S=G.S,o=[1];if(S.qol.speed15)o.push(1.5);if(S.qol.speed2)o.push(2);if(S.astral.warp3)o.push(3);return o}
function gameSpeed(){return (G.S.settings.speed||1)*(G.S.relics.clock?1.5:1)}
function offlineCap(){const S=G.S;return S.qol.hourglass2?86400:S.qol.hourglass1?28800:7200}
function plotsCount(){const S=G.S;return 3+(S.plotsBought||0)+Math.floor(S.profs.herbalism.lvl/20)}
function invCap(){return 30+10*(G.S.satchel||0)}

/* ---------- stats ---------- */
function itemScale(il){return Math.pow(1.11,il)}
function itemBase(it){const f=itemScale(it.il)*D.RARITIES[it.r].mult*(1+.1*(it.ench||0));const b={};
  switch(it.slot){case'weapon':b.weapon=5*f;break;case'offhand':b.armor=3*f;b.hpFlat=3*f;break;case'helm':b.armor=2*f;b.hpFlat=6*f;break;
  case'chest':b.armor=4*f;b.hpFlat=10*f;break;case'gloves':b.armor=1.5*f;break;case'boots':b.armor=1.5*f;break;}
  return b;}
function baseDerived(){return {str:0,dex:0,con:0,int:0,wis:0,cha:0,hpFlat:0,hpPct:0,armor:0,armorPct:0,dmgPct:0,crit:0,critDmg:50,haste:0,lifesteal:0,
  gold:0,xp:0,mf:0,regen:0,regenPct:0,resRegen:0,resGen:0,skillDmg:0,spellDmg:0,aoeDmg:0,dodge:0,petDmg:0,dr:0,healPct:0,weapon:0,
  vs:{},execute:0,riposte:0,poison:0,sneak:50,sneakCrit:0,costMult:1,slotRate:0,slotMax:2,wardMult:1,smiteMult:1,ebMult:1,soulMax:10,
  killHeal:0,permImp:0,double:0,volley:0,petSpeed:0,hpProc:0,lowRegen:0,profSpeed:0,profXp:0,capMult:1,powers:{},echo:0}}
function computeStats(opt={}){
  const S=G.S,cd=D.CLASSES[S.cls],cl=S.classes[S.cls],L=cl.lvl,d=baseDerived();
  d.crit=cd.crit;
  for(const st of D.STATS)d[st]=8+cd.growth[st]*L;
  const equip=opt.equip||S.equip;
  for(const sl of D.SLOTS){const it=equip[sl];if(!it)continue;const b=itemBase(it);for(const k in b)d[k]+=b[k];
    const em=1+.1*(it.ench||0);for(const a of it.aff)d[a.k]+=a.v*em;for(const p of (it.pw||[]))d.powers[p]=1;}
  for(const p of cd.passives){const r=cl.ranks[p.id]||0;if(r)p.ap(d,r)}
  if(cl.sub){const sb=cd.subs.find(x=>x.id===cl.sub);if(sb)sb.ap(d)}
  if(S.cls2&&S.cls2!==S.cls){const c2=D.CLASSES[S.cls2],cl2=S.classes[S.cls2];for(const p of c2.passives){const r=cl2.ranks[p.id]||0;if(r)p.ap(d,r*.5)}
    for(const st of D.STATS)d[st]+=c2.growth[st]*cl2.lvl*.25;}
  for(const g of D.GUILD){const l=S.guild[g.id]||0;if(l)g.ap(d,l)}
  for(const a of D.ASTRAL){const l=S.astral[a.id]||0;if(l&&a.ap)a.ap(d,l)}
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
  d.atkInt=cd.atk/(1+d.haste/100);
  d.dodge=Math.min(60,d.dodge); d.dr=Math.min(75,d.dr);
  d.cap=S.relics.crown?Infinity:D.BASE_DMG_CAP*d.capMult;
  const rm=D.RARITIES;void rm;
  d.dps=d.weaponDmg*d.mainMult*(1+d.dmgPct/100)*(1+Math.min(d.crit,80)/100*d.critDmg/100)/d.atkInt*(1+d.skillDmg/300)*(cd.autoMult||1);
  d.ehp=d.maxHp/(1-d.dr/100)*(1+d.armor/(d.armor+12*Math.pow(1.1,L)))/(1-d.dodge/100);
  d.power=Math.sqrt(d.dps*d.ehp);
  return d;
}
function recalc(){G.d=computeStats();G.dirty=false;if(G.h){G.h.hp=Math.min(G.h.hp,G.d.maxHp)}}

/* ---------- items ---------- */
function rollRarity(mfPct,minR=0,bonus=0){
  const S=G.S;const lw=relicMod('legendW')||1;const ws=D.RARITIES.map((r,i)=>{let w=r.w;if(i>0)w*=1+(mfPct+bonus)/100*(i/2);if(i>=4)w*=lw;if(i===5&&!S.astral.mythic)w=0;return w});
  let t=ws.reduce((a,b)=>a+b,0),x=Math.random()*t;for(let i=0;i<ws.length;i++){x-=ws[i];if(x<=0)return Math.max(minR,i)}return minR;}
function makeItem(il,r,slot){
  const S=G.S;slot=slot||pick(D.SLOTS);const cd=D.CLASSES[S.cls];
  const it={id:S.nextId++,slot,il:Math.max(1,Math.round(il)),r,aff:[],pw:[],ench:0};
  let n=D.RARITIES[r].affixes+(slot==='ring'||slot==='amulet'?1:0);
  const keys=Object.keys(D.AFFIXES);const used=new Set();
  const weighted=[cd.main,cd.main,'con','dmgPct','crit','critDmg','haste','hpPct','skillDmg',...keys];
  while(it.aff.length<n){const k=pick(weighted);if(used.has(k))continue;used.add(k);let v=D.AFFIXES[k].roll(it.il,D.RARITIES[r].mult)*R(.75,1.1);
    v=D.AFFIXES[k].pct?Math.round(v*10)/10:Math.max(1,Math.round(v));it.aff.push({k,v})}
  if(r>=4){const pw=D.LEGENDARY.slice();it.pw.push(pw.splice(RI(0,pw.length-1),1)[0].id);if(r===5)it.pw.push(pick(pw).id)}
  const tier=D.TIER_NAMES[Math.min(D.TIER_NAMES.length-1,Math.floor(it.il/10))];
  const noun=slot==='weapon'?pick(cd.wn):pick(D.SLOT_NOUN[slot]);
  const top=it.aff[0]?D.SUFFIX[it.aff[0].k]:'';
  it.n=(it.pw.length?D.LEGENDARY.find(x=>x.id===it.pw[0]).n+' ':'')+tier+' '+noun+(top?' '+top:'');
  return it;
}
function itemValue(it){return Math.ceil(3*Math.pow(1.1,it.il)*Math.pow(2.2,it.r))}
function itemDust(it){return Math.ceil((1+it.r)*(1+it.r)*(1+it.il/8))}
function powerWith(slot,it){const eq=Object.assign({},G.S.equip);eq[slot]=it;return computeStats({equip:eq,noBuffs:1}).power}
function isUpgrade(it){const cur=G.S.equip[it.slot];if(!cur)return true;return powerWith(it.slot,it)>powerWith(it.slot,cur)*1.005}
function equipItem(it,fromInv=true){const S=G.S;if(fromInv){const i=S.inv.indexOf(it);if(i>=0)S.inv.splice(i,1)}
  const old=S.equip[it.slot];S.equip[it.slot]=it;if(old){S.inv.push(old)}G.dirty=true;return old}
function sellItem(it){const S=G.S;const i=S.inv.indexOf(it);if(i>=0)S.inv.splice(i,1);const g=itemValue(it);S.gold+=g;S.stats.gold+=g;return g}
function salvageItem(it){const S=G.S;const i=S.inv.indexOf(it);if(i>=0)S.inv.splice(i,1);const n=itemDust(it);addMat('dust',n);return n}
function addMat(k,n){const S=G.S;S.mats[k]=(S.mats[k]||0)+n}
function gainItem(it,src){
  const S=G.S;S.stats.found[it.r]++;
  if(it.r>=3)log(`${src||'Found'}: <span class="r${it.r}">${it.n}</span> (ilvl ${it.il})`,'loot');
  emit({t:'loot',r:it.r});
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
  while(c.xp>=xpNeed(c.lvl)&&c.lvl<200){c.xp-=xpNeed(c.lvl);c.lvl++;up++;c.pts++;const pl=S.astral.prodigy||0;if(pl){const every=[0,10,8,6,5,4][pl];if(c.lvl%every===0)c.pts++}}
  if(up&&cid===S.cls){G.dirty=true;emit({t:'lvl'});log(`⬆️ ${D.CLASSES[cid].n} reached level ${c.lvl}!`,'level');checkClassUnlocks()}
}
function gainCombatXp(x){
  const S=G.S;addClassXp(x);
  if(S.cls2&&S.cls2!==S.cls)addClassXp(x*.25,S.cls2);
  const sh=relicMod('shareXp');if(sh)for(const c of D.CLASS_ORDER)if(c!==S.cls&&c!==S.cls2&&S.unlockedCls[c])addClassXp(x*sh/100,c);
}
function addProfXp(p,x,share=true){
  const S=G.S,pr=S.profs[p];const d=G.d||computeStats();x*=(1+(d.profXp||0)/100)*(1+relicMod('profXp')/100);pr.xp+=x;
  while(pr.xp>=profXpNeed(pr.lvl)&&pr.lvl<120){pr.xp-=profXpNeed(pr.lvl);pr.lvl++;log(`${D.PROFS[p].i} ${D.PROFS[p].n} reached level ${pr.lvl}`,'prof');S.stats.profMax[p]=Math.max(S.stats.profMax[p]||1,pr.lvl)}
  const sh=relicMod('shareProf');if(share&&sh){let lo=null;for(const q of D.PROF_ORDER)if(q!==p&&(!lo||S.profs[q].lvl<S.profs[lo].lvl))lo=q;if(lo)addProfXp(lo,x*sh/100/((1+(d.profXp||0)/100)*(1+relicMod('profXp')/100)),false)}
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
function newHero(){const d=G.d;const cd=D.CLASSES[G.S.cls];G.h={hp:d.maxHp,res:cd.res.start?cd.res.max(d):0,combo:0,slots:d.slotMax,slotT:0,souls:0,shield:0,atkT:.5,gcd:0,cds:{},buffs:[],dead:false,reviveT:0,petT:1,impT:0,impMult:1,impAtk:0,swT:1.5,acoT:3,potT:0,phoenixT:0}}
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
};
function heal(a){const d=G.d;a*=1+d.healPct/100;const h=G.h;const before=h.hp;h.hp=Math.min(d.maxHp,h.hp+a);const got=h.hp-before;if(got>1)emit({t:'heal',a:got})}
function calcHit(e,mult,o){
  const d=G.d;let dmg=d.weaponDmg*d.mainMult*(1+d.dmgPct/100)*mult;
  if(o.skill)dmg*=1+d.skillDmg/100; if(o.spell)dmg*=1+d.spellDmg/100; if(o.aoe)dmg*=1+d.aoeDmg/100;
  for(const t of e.def.tags)if(d.vs[t])dmg*=1+d.vs[t]/100;
  if(e.hp/e.maxHp<.35&&d.execute)dmg*=1+d.execute/100;
  if(e.mark)dmg*=1+e.mark;
  let crit=o.forceCrit||Math.random()*100<d.crit+(o.bonusCrit||0);
  if(e.sneak&&G.S.cls==='rogue'){dmg*=1+d.sneak/100;if(d.sneakCrit)crit=true}
  if(crit)dmg*=1+d.critDmg/100;
  dmg*=R(.9,1.1);
  let capped=false;if(dmg>d.cap){dmg=d.cap;capped=true}
  return {dmg,crit,capped};
}
function heroStrike(e,mult,o={}){
  const r=calcHit(e,mult,o);e.sneak=false;dealToEnemy(e,r.dmg,{crit:r.crit,capped:r.capped,icon:o.icon,color:o.color,proj:o.proj,big:o.big});
  const d=G.d;if(d.lifesteal)heal(r.dmg*d.lifesteal/100*.5);
  if(d.powers.storm&&chance(.1)&&e.hp>0){const r2=calcHit(e,1.5,{});dealToEnemy(e,r2.dmg,{crit:r2.crit,capped:r2.capped,icon:'⚡',color:'#9ff'})}
  if(d.poison&&chance(d.poison/100))C.dot(e,.3,5,'🧪');
}
function petStrike(e,mult,icon){const d=G.d;const o={};const r=calcHit(e,mult*(1+d.petDmg/100),o);dealToEnemy(e,r.dmg,{crit:r.crit,capped:r.capped,icon,pet:1})}
function dealToEnemy(e,dmg,o){if(e.hp<=0)return;e.hp-=dmg;emit({t:'hit',uid:e.uid,a:dmg,crit:o.crit,cap:o.capped,icon:o.icon,color:o.color,proj:o.proj,pet:o.pet,big:o.big});if(e.hp<=0)killEnemy(e)}
function killEnemy(e){
  const S=G.S,d=G.d,h=G.h,cd=D.CLASSES[S.cls];e.hp=0;emit({t:'kill',uid:e.uid,boss:e.boss,elite:e.elite});
  const m=e.lvl,mult=(e.elite?3:1)*(e.boss?15:1);
  const L=S.classes[S.cls].lvl;const pen=L>m+3?Math.max(.02,Math.pow(.85,L-m-3)):1;const xp=monXp(m)*mult*(1+d.xp/100)*pen;gainCombatXp(xp);
  const gold=monGold(m)*mult*(1+d.gold/100)*R(.8,1.2);S.gold+=gold;S.stats.gold+=gold;
  S.stats.kills++;if(e.elite)S.stats.elites++;
  if(cd.souls)h.souls=Math.min(d.soulMax,h.souls+1);
  if(d.killHeal)heal(d.maxHp*d.killHeal/100);
  const z=zoneDef();
  // drops
  const dc=e.boss?1:e.elite?.6:.12;
  if(chance(dc)){gainItem(makeItem(m,rollRarity(d.mf,e.boss?2:e.elite?1:0)));if(e.boss)gainItem(makeItem(m,rollRarity(d.mf,1)))}
  if(chance(e.boss?1:e.elite?1:.15))addMat(z.mat,e.boss?RI(4,7):e.elite?RI(1,3):1);
  if(!e.def.tags.some(t=>['undead','construct','ooze','elemental'].includes(t))&&chance(.25))addMat('meat',e.boss?5:1);
  if(chance(.004*(e.boss?25:e.elite?5:1)))addMat(pick(['amethyst','ruby','sapphire','emerald','diamond'].slice(0,Math.min(5,1+Math.floor(S.zone/1.6)))),1);
  rollRelics({zone:S.zone,boss:e.boss,elite:e.elite});
  // zone progress
  const zs=S.zones[S.zone];
  if(e.boss){S.stats.bosses++;zs.bossKills++;zs.kills=0;S.bossReq=false;
    if(z.endless){S.riftLevel++;log(`♾️ Rift Warden falls! Rift depth ${S.riftLevel}.`,'boss')}
    else{const first=!zs.cleared;zs.cleared=true;S.stats.everCleared=Math.max(S.stats.everCleared,S.zone+1);
      if(first)log(`🏆 Defeated <b>${z.boss.n}</b>! ${D.ZONES[S.zone+1]?D.ZONES[S.zone+1].n+' unlocked.':''}`,'boss');
      if(D.ZONES[S.zone+1])S.zones[S.zone+1].unlocked=true;checkClassUnlocks();
      if(S.qol.autoAdvance&&S.settings.autoAdvance&&D.ZONES[S.zone+1]&&first){setZone(S.zone+1)}}
  } else if(!z.endless||true){zs.kills=Math.min(D.KILLS_TO_BOSS,zs.kills+1)}
}
function setZone(i){const S=G.S;if(!S.zones[i]||!S.zones[i].unlocked)return;S.zone=i;S.bossReq=false;G.cb=null;emit({t:'zone'});log(`🧭 Traveling to ${D.ZONES[i].n}`,'info')}
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
  const cd=D.CLASSES[S.cls];if(cd.res.onHurt)h.res=Math.min(resMax(),h.res+cd.res.onHurt*(1+d.resGen/100));
  if(d.riposte&&chance(d.riposte/100))heroStrike(e,1,{icon:'🤺'});
  if(h.hp<=0){
    if(d.powers.phoenix&&h.phoenixT<=0){h.hp=d.maxHp*.3;h.phoenixT=60;emit({t:'cast',n:'Phoenix Rebirth',i:'🐦‍🔥'});return}
    heroDie();}
}
function heroDie(){const S=G.S,h=G.h;h.dead=true;h.hp=0;h.reviveT=S.qol.swiftRevive?3:8;S.stats.deaths++;emit({t:'death'});
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
    if(!G.cb||wt>.8){
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
  if(S.qol.sellsword){h.swT-=dt;if(h.swT<=0){h.swT=2;const t=C.tgt();if(t)petStrike(t,.6,'🗡️')}}
  if(S.qol.acolyte){h.acoT-=dt;if(h.acoT<=0){h.acoT=3;if(h.hp<d.maxHp*.9){heal(d.maxHp*.05*(1+d.petDmg/200))}}}
  // dots
  for(const e of alive()){for(const dt2 of e.dots){const step=Math.min(dt,dt2.t);dt2.t-=dt;dt2.acc+=step;if(dt2.acc>=1||dt2.t<=0){const r2=calcHit(e,dt2.dps*dt2.acc,{skill:1,spell:1});dt2.acc=0;dealToEnemy(e,r2.dmg,{icon:dt2.icon,crit:r2.crit,dot:1})}}e.dots=e.dots.filter(x=>x.t>0);if(e.slowT>0)e.slowT-=dt}
  // enemies
  for(const e of alive()){
    if(e.boss){e.specT-=dt;if(e.specT<=1.5&&!e.warn){e.warn=true;emit({t:'warn',uid:e.uid});e.t=Math.min(e.t,1.5)}if(e.specT<=0)e.specT=9}
    e.t-=dt*(e.slowT>0?.5:1);let g=0;while(e.t<=0&&g++<10&&e.hp>0){e.t+=e.spd;enemyAttack(e);if(G.h.dead)return}}
}

/* ---------- professions ---------- */
function profSpeed(slotIdx){const info=actionSlotsInfo()[slotIdx]||{eff:.75};const d=G.d;return info.eff*(1+(d.profSpeed||0)/100)}
function toolMult(p){return 1+.15*(G.S.tools[p]||0)}
function hasMats(inp,n=1){const S=G.S;for(const k in inp)if((S.mats[k]||0)<inp[k]*n)return false;return true}
function useMats(inp){const S=G.S;for(const k in inp)S.mats[k]-=inp[k]}
function enchCost(it){return Math.ceil(5*Math.pow(1.45,it.ench||0)*(1+it.il/15))}
function enchChance(it){const lv=G.S.profs.enchanting.lvl;return Math.max(5,Math.min(95,95-(it.ench||0)*8+lv*.4))}
function smithCost(t,slot){const n=slot==='weapon'?6:slot==='chest'?8:4;const inp={};inp[t.ore]=n;inp[t.mat]=(inp[t.mat]||0)+2;return inp}
function crackChance(target){if(G.S.relics.forge)return 0;return Math.max(0,(target-60)*.8*(1-G.S.profs.smithing.lvl/150))/100}
function herbTick(dt){
  const S=G.S,hs=S.ps.herbalism;const n=plotsCount();while(hs.plots.length<n)hs.plots.push(null);
  const tended=S.slots.some(sl=>sl.act&&sl.act.type==='prof'&&sl.act.p==='herbalism');
  const sp=(tended?2:1)*toolMult('herbalism')*(1+(G.d.profSpeed||0)/100);
  for(const p of hs.plots)if(p&&p.g<p.max)p.g=Math.min(p.max,p.g+dt*sp);
  if(tended||S.qol.autoHarvest){
    const lv=S.profs.herbalism.lvl;
    for(let i=0;i<hs.plots.length;i++){let p=hs.plots[i];
      if(p&&p.g>=p.max){const sd=D.PROFS.herbalism.seeds.find(x=>x.id===p.s);let q=(2+Math.floor(lv/15))*(p.gold?5:1)*(relicMod('gatherMult')||1);addMat(p.s,q);addProfXp('herbalism',sd.xp*(p.gold?3:1));if(p.gold)log(`🌟 Golden ${D.MATS[p.s].n} harvested! (+${q})`,'prof');emit({t:'harvest',i,gold:p.gold});rollRelics({prof:'herbalism'});hs.plots[i]=p=null}
      if(!p){const sd=D.PROFS.herbalism.seeds.find(x=>x.id===hs.seed);if(sd&&sd.lv<=lv)hs.plots[i]={s:sd.id,g:0,max:sd.t,gold:chance(.03+lv*.0005)}}}
  }
}
function profTick(si,dt){
  const S=G.S,sl=S.slots[si],p=sl.act.p,sp=profSpeed(si)*toolMult(p);sl.note='';
  if(p==='herbalism'){sl.prog=0;return}
  if(p==='mining'){const ms=S.ps.mining,nd=D.PROFS.mining.nodes.find(x=>x.id===ms.node);if(!nd||nd.lv>S.profs.mining.lvl){sl.note='Level too low';return}
    sl.prog+=dt*sp/nd.t;while(sl.prog>=1){sl.prog-=1;ms.streak=Math.min(20,(ms.streak||0)+1);let q=1+ms.streak*.05;q=Math.floor(q)+(chance(q%1)?1:0);q*=relicMod('gatherMult')||1;
      addMat(nd.id,q);addProfXp('mining',nd.xp);if(chance(.015+S.profs.mining.lvl*.0004)){addMat(nd.gem,1);log(`💎 Unearthed a ${D.MATS[nd.gem].n}!`,'prof')}
      emit({t:'mine',si});rollRelics({prof:'mining'})}return}
  if(p==='smithing'){const ss=S.ps.smithing,t=D.PROFS.smithing.tiers.find(x=>x.id===ss.tier);if(!t||t.lv>S.profs.smithing.lvl){sl.note='Level too low';return}
    const inp=smithCost(t,ss.slot);
    if(!sl.busy){if(!hasMats(inp)){sl.note='Need materials';sl.heat=Math.max(0,sl.heat-dt*10);return}useMats(inp);sl.busy=1;sl.heat=0}
    sl.heat+=dt*12*sp;sl.prog=Math.min(1,sl.heat/ss.target);
    if(sl.heat>=ss.target){sl.busy=0;sl.heat=0;sl.prog=0;addProfXp('smithing',t.xp*(ss.target/65));rollRelics({prof:'smithing'});
      if(chance(crackChance(ss.target))){log(`💥 The ${t.n} piece cracked in the quench!`,'prof');emit({t:'crack',si});return}
      const lv=S.profs.smithing.lvl;const qual=(ss.target-40)*3+lv*1.5;
      const outs=relicMod('craftMult')||1;
      for(let k=0;k<outs;k++){let r=rollRarity(qual,1);if(chance(.05))r=Math.min(S.astral.mythic?5:4,r+1);if(S.relics.forge)r=Math.min(S.astral.mythic?5:4,r+1);
        const it=makeItem(t.il+Math.floor(lv/8),r,ss.slot);it.n='Forged '+it.n;S.stats.crafted++;gainItem(it,'Forged');}
      emit({t:'forge',si})}
    return}
  if(p==='alchemy'){const as=S.ps.alchemy,rc=D.PROFS.alchemy.recipes.find(x=>x.id===as.recipe);if(!rc||rc.lv>S.profs.alchemy.lvl){sl.note='Level too low';return}
    if(!sl.busy){if(!hasMats(rc.in)){sl.note='Need ingredients';return}useMats(rc.in);sl.busy=1;sl.prog=0}
    sl.prog+=dt*sp/4;if(sl.prog>=1){sl.prog=0;sl.busy=0;const m=as.mastery[rc.id]||0;let n=(1+(chance(m/200)?1:0))*(relicMod('craftMult')||1);
      if(rc.pot)S.potions[rc.pot]=(S.potions[rc.pot]||0)+n;else S.elixirs[rc.id]=(S.elixirs[rc.id]||0)+n;
      if(chance(1-m/120))as.mastery[rc.id]=Math.min(100,m+1);addProfXp('alchemy',rc.xp);
      if(chance(.04)){const el=pick(D.PROFS.alchemy.recipes.filter(x=>x.elix));S.elixirs[el.id]=(S.elixirs[el.id]||0)+1;log(`💥 Volatile reaction! Bonus ${el.n}.`,'prof')}
      emit({t:'brew',si});rollRelics({prof:'alchemy'})}return}
  if(p==='cooking'){const cs=S.ps.cooking,rc=D.PROFS.cooking.recipes.find(x=>x.id===cs.recipe);if(!rc||rc.lv>S.profs.cooking.lvl){sl.note='Level too low';return}
    if(!sl.busy){if(!hasMats(rc.in)){sl.note='Need ingredients';return}useMats(rc.in);sl.busy=1;sl.prog=0}
    sl.prog+=dt*sp/5;if(sl.prog>=1){sl.prog=0;sl.busy=0;const lv=S.profs.cooking.lvl,diff=lv-rc.lv;
      const burn=Math.max(.02,.4-diff*.03),perf=Math.min(.3,Math.max(0,diff*.015));addProfXp('cooking',rc.xp);rollRelics({prof:'cooking'});
      if(chance(burn)){emit({t:'burn',si});return}
      const n=relicMod('craftMult')||1;if(chance(perf))S.foodP[rc.id]=(S.foodP[rc.id]||0)+n;else S.food[rc.id]=(S.food[rc.id]||0)+n;
      const c=(cs.count[rc.id]||0)+1;cs.count[rc.id]=c;if(c===25||c===100||c===500){log(`👨‍🍳 Signature ${rc.n} tier ${c===25?1:c===100?2:3} earned!`,'prof');G.dirty=true}
      emit({t:'cook',si})}return}
  if(p==='enchanting'){const es=S.ps.enchanting,it=S.equip[es.slot];if(!it){sl.note='Nothing equipped';return}if((it.ench||0)>=15){sl.note='Maxed at +15';return}
    const cost=enchCost(it);if(!sl.busy){if((S.mats.dust||0)<cost){sl.note='Need Arcane Dust';return}S.mats.dust-=cost;sl.busy=1;sl.prog=0}
    sl.prog+=dt*sp/4;if(sl.prog>=1){sl.prog=0;sl.busy=0;addProfXp('enchanting',10+(it.ench||0)*8+it.il*.5);
      if(chance(enchChance(it)/100)){it.ench=(it.ench||0)+1;S.stats.maxEnch=Math.max(S.stats.maxEnch,it.ench);G.dirty=true;emit({t:'ench',ok:1,si});if(it.ench>=5)log(`🔮 ${it.n} enchanted to +${it.ench}!`,'prof')}
      else{emit({t:'ench',ok:0,si});if(it.ench>=5){const gems=Object.keys(S.mats).filter(k=>D.MATS[k]&&D.MATS[k].gem&&S.mats[k]>0);
        if(es.ward&&gems.length){S.mats[gems[0]]--;}else{it.ench--;G.dirty=true;log(`🔮 Enchant failed — ${it.n} dropped to +${it.ench}.`,'prof')}}}
      rollRelics({prof:'enchanting'})}return}
}

/* ---------- consumables ---------- */
function eatBest(){const S=G.S;const recs=D.PROFS.cooking.recipes.slice().reverse();for(const rc of recs){if((S.foodP[rc.id]||0)>0){S.foodP[rc.id]--;S.meal={id:rc.id,t:600,p:1};G.dirty=true;return rc}if((S.food[rc.id]||0)>0){S.food[rc.id]--;S.meal={id:rc.id,t:600,p:0};G.dirty=true;return rc}}return null}
function eatMeal(id,perfect){const S=G.S,store=perfect?S.foodP:S.food;if((store[id]||0)<=0)return;store[id]--;S.meal={id,t:600,p:perfect?1:0};G.dirty=true}
function drinkElixir(id){const S=G.S;if((S.elixirs[id]||0)<=0)return;S.elixirs[id]--;const rc=D.PROFS.alchemy.recipes.find(x=>x.id===id);S.elix[id]=(S.elix[id]>0?S.elix[id]:0)+rc.dur;G.dirty=true}
function consumablesTick(dt){const S=G.S;
  if(S.meal&&!S.relics.ladle){S.meal.t-=dt;if(S.meal.t<=0){S.meal=null;G.dirty=true}}
  for(const k in S.elix){if(S.elix[k]>0){S.elix[k]-=dt;if(S.elix[k]<=0){S.elix[k]=0;G.dirty=true}}}
  if(S.qol.autoEat&&S.settings.autoEat&&!S.meal)eatBest();
  if(S.qol.autoElixir&&S.settings.autoElixir)for(const rc of D.PROFS.alchemy.recipes)if(rc.elix&&!(S.elix[rc.id]>0)&&(S.elixirs[rc.id]||0)>0)drinkElixir(rc.id);
}

/* ---------- main tick ---------- */
function tick(dt){
  const S=G.S;if(!S.started)return;if(G.dirty||!G.d)recalc();
  S.stats.play+=dt;
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
function buyQol(id){const S=G.S,q=D.QOL.find(x=>x.id===id);if(!q||S.qol[id]||S.gold<q.cost)return false;S.gold-=q.cost;S.qol[id]=1;syncSlots();G.dirty=true;log(`🏰 Unlocked ${q.n}`,'info');return true}
function buyGuild(id){const S=G.S,g=D.GUILD.find(x=>x.id===id),l=S.guild[id]||0,c=upgradeCost(g.base,g.mult,l);if(S.gold<c)return false;S.gold-=c;S.guild[id]=l+1;G.dirty=true;return true}
function buyTool(p){const S=G.S,l=S.tools[p]||0;if(l>=D.TOOLS.max)return false;const c=upgradeCost(D.TOOLS.base,D.TOOLS.mult,l);if(S.gold<c)return false;S.gold-=c;S.tools[p]=l+1;return true}
function buySatchel(){const S=G.S;if(S.satchel>=D.SATCHEL.max)return false;const c=upgradeCost(D.SATCHEL.base,D.SATCHEL.mult,S.satchel);if(S.gold<c)return false;S.gold-=c;S.satchel++;return true}
function buyPlot(){const S=G.S;if(S.plotsBought>=D.PLOTS.max)return false;const c=upgradeCost(D.PLOTS.base,D.PLOTS.mult,S.plotsBought);if(S.gold<c)return false;S.gold-=c;S.plotsBought++;return true}
function buyAstral(id){const S=G.S,a=D.ASTRAL.find(x=>x.id===id),l=S.astral[id]||0;if(l>=a.max)return false;const c=upgradeCost(a.base,a.mult,l);if(S.shards<c)return false;S.shards-=c;S.astral[id]=l+1;syncSlots();G.dirty=true;return true}

/* ---------- ascension ---------- */
function highestLevelReached(){const S=G.S;let m=0;S.zones.forEach((z,i)=>{if(z.cleared)m=Math.max(m,D.ZONES[i].max+2)});if(S.zones[8].unlocked)m=Math.max(m,80+S.riftLevel*2);return m}
function shardPreview(){const S=G.S;const m=highestLevelReached();if(m<20)return 0;return Math.floor(Math.pow(m/10,2.2)+totalClassLevels(S)/20)}
function canAscend(){return G.S.zones[2].cleared}
function ascend(){
  const S=G.S;if(!canAscend())return false;const gain=shardPreview();const keep=newState();
  const persist=['name','qol','settings','astral','relics','relicTries','ach','stats','unlockedCls','log','satchel','plotsBought','started'];
  for(const k of persist)keep[k]=S[k];
  keep.shards=S.shards+gain;keep.ascensions=S.ascensions+1;keep.cls=S.cls;
  const mem=(S.astral.memory||0)*.1;for(const p of D.PROF_ORDER){keep.profs[p].lvl=Math.max(1,Math.floor(S.profs[p].lvl*mem))}
  const hs=S.astral.headstart||0;for(let i=0;i<hs;i++){keep.zones[i].cleared=true;keep.zones[i+1].unlocked=true}keep.gold=hs?1000*Math.pow(10,hs):0;
  G.S=keep;syncSlots();G.h=null;G.cb=null;giveStarter();recalc();newHero();
  log(`🌟 ASCENDED! Gained ${fmt(gain)} Astral Shards. (Ascension ${keep.ascensions})`,'relic');return gain;
}
function autoFirst(c){const cl=G.S.classes[c];const f=D.CLASSES[c].skills[0].id;if(!cl.ranks[f]&&cl.pts>0){cl.ranks[f]=1;cl.pts--}}
function giveStarter(){const S=G.S;autoFirst(S.cls);const it=makeItem(1,0,'weapon');it.n='Worn '+D.CLASSES[S.cls].wn[0];S.equip.weapon=it}

/* ---------- save / load / offline ---------- */
function serialize(){G.S.last=Date.now();return JSON.stringify(G.S)}
function save(){try{localStorage.setItem(SAVE_KEY,serialize())}catch(e){}}
function loadFrom(json){const s=JSON.parse(json);deepFill(s,newState());G.S=s;syncSlots();G.dirty=true;recalc();newHero();return s}
function exportSave(){return btoa(unescape(encodeURIComponent(serialize())))}
function importSave(str){const json=decodeURIComponent(escape(atob(str.trim())));loadFrom(json);save()}
function snapshot(){const S=G.S;return {gold:S.gold,kills:S.stats.kills,lv:S.classes[S.cls].lvl,profs:D.PROF_ORDER.map(p=>S.profs[p].lvl),found:S.stats.found.slice(),relics:Object.keys(S.relics).length,zone:S.stats.everCleared,mats:Object.assign({},S.mats)}}
function simulate(seconds,step=1){const fx=G.fx;G.fx=false;let t=0;while(t<seconds){const dt=Math.min(step,seconds-t);tick(dt);t+=dt;if(Math.floor(t)%30===0)checkAch()}G.fx=fx;G.ev.length=0;checkAch()}
function offlineProgress(){const S=G.S;const el=Math.min(offlineCap(),(Date.now()-S.last)/1000);if(el<30)return null;const before=snapshot();const t0=performance.now();
  simulate(el*gameSpeed(),el>7200?2:1);const after=snapshot();return {el,before,after,ms:performance.now()-t0}}

if(typeof module!=='undefined')module.exports={G};
