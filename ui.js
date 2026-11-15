'use strict';
/* Realms of Ember — UI */
const $=s=>document.querySelector(s);
const UI={tab:'adventure',profSel:'mining',invSort:'r',lastPanel:0,enemyEls:new Map(),parts:[],busyInput:false,logFilter:'all',selItem:null};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const TABS=[['adventure','⚔️ Adventure'],['hero','🧝 Hero'],['skills','✨ Skills'],['classes','🎭 Classes'],['profs','⚒️ Professions'],['mastery','🎖️ Mastery'],['inv','🎒 Inventory'],['town','🏰 Town'],['codex','🏺 Relics'],['ascend','🌟 Ascend'],['ach','🏆 Feats'],['log','📜 Log'],['settings','⚙️']];
const S=()=>G.S;
function setHTML(el,html){if(!el)return;if(el._h===html)return;if(UI.ptrDown&&el.querySelector('[data-a]'))return;el._h=html;el.innerHTML=html}
document.addEventListener('pointerdown',()=>{UI.ptrDown=true},true);document.addEventListener('pointerup',()=>{setTimeout(()=>{UI.ptrDown=false},30)},true);document.addEventListener('pointercancel',()=>{UI.ptrDown=false},true);

function toast(html,ms=3500){const t=document.createElement('div');t.className='toast';t.innerHTML=html;$('#toasts').appendChild(t);setTimeout(()=>t.remove(),ms);while($('#toasts').children.length>4)$('#toasts').firstChild.remove()}
function modal(html){const m=$('#modal');m.innerHTML=`<div class="mbox">${html}</div>`;m.classList.remove('hidden')}
function closeModal(){$('#modal').classList.add('hidden');$('#modal').innerHTML='';UI.selItem=null}
function bar(p,cls,txt){p=Math.max(0,Math.min(1,p||0));return `<div class="bar ${txt==null?'thin':''}"><i class="${cls}" style="width:${p*100}%"></i>${txt!=null?`<span>${txt}</span>`:''}</div>`}
function btn(a,label,o={}){const attrs=Object.entries(o.data||{}).map(([k,v])=>`data-${k}="${esc(v)}"`).join(' ');return `<button class="btn ${o.cls||''} ${o.dis?'dis':''}" data-a="${a}" ${attrs} ${o.title?`title="${esc(o.title)}"`:''}>${label}</button>`}
function costTxt(c,cur='🪙'){return `${cur} ${fmt(c)}`}
function itemIcon(it){if(it.slot==='weapon')return D.CLASSES[S().cls].w;return D.SLOT_ICON[it.slot]}
function affLine(a,em=1){const f=D.AFFIXES[a.k];let v=a.v*em;v=f.pct?(Math.round(v*10)/10):fmt(Math.round(v));return f.f.replace('{v}',v)}

/* ---------------- intro ---------------- */
function showIntro(){
  const opts=['fighter','wizard','rogue'].map(c=>{const cd=D.CLASSES[c];return `<div class="card" data-a="pickStart" data-c="${c}"><div class="ic">${cd.i}${cd.w}</div><b class="cinzel">${cd.n}</b><div class="muted">${cd.mech}</div></div>`}).join('');
  modal(`<h2 class="cinzel" style="text-align:center">🔥 Realms of Ember</h2>
  <p class="muted" style="text-align:center">An idle saga of steel, spellcraft and dragonfire. Your hero fights, gathers and crafts on their own — you decide where they spend their time.</p>
  <label class="small">Hero name</label><input type="text" id="heroName" value="${esc(S().name)}" maxlength="18">
  <h3>Choose your first class</h3><div class="choose">${opts}</div>
  <p class="muted">You can learn every class later. Four more classes unlock as you progress.</p>`);
}

/* ---------------- top bar ---------------- */
function renderTop(){const s=S();const dc=dailyCap(),dn=Math.min(dc,s.daily.count||0);
  setHTML($('#res'),`<span class="chip">🪙 ${fmt(s.gold)}</span>${s.shards||s.ascensions?`<span class="chip">🌟 ${fmt(s.shards)}</span>`:''}<span class="chip">✨ ${fmt(s.mats.dust||0)}</span><span class="chip" title="General Action Points">🎖️ ${fmt(Math.floor(s.ap.gen))}</span><span class="chip" title="Daily double-AP actions used today · streak" data-a="tab" data-t="mastery" style="cursor:pointer">📅 ${dn}/${dc}${s.daily.streak>1?' 🔥'+s.daily.streak:''}</span><span class="chip">⚡ ${fmt(G.d.power)}</span>`);}

/* ---------------- stage ---------------- */
let curBg=null;
function setScene(){const s=S(),z=D.ZONES[s.zone];if(curBg===s.zone)return;curBg=s.zone;$('#bg').style.background=z.bg;
  const deco=$('#deco');deco.innerHTML='';for(let i=0;i<9;i++){const sp=document.createElement('span');sp.textContent=z.deco[i%z.deco.length];const big=i%3===0;sp.style.fontSize=(big?40:22)+'px';sp.style.left=(i*13+Math.random()*6)+'%';sp.style.top=(big?52+Math.random()*12:10+Math.random()*40)+'%';sp.style.animationDuration=(30+Math.random()*30)+'s';sp.style.animationDirection=i%2?'alternate':'alternate-reverse';deco.appendChild(sp)}}
function enemyPos(i,n,boss){if(boss)return [73,48];if(n===1)return [72,52];if(n===2)return [[68,40],[82,64]][i];return [[66,50],[81,30],[83,72]][i]}
function stageCoords(el){const sr=$('#stage').getBoundingClientRect(),r=el.getBoundingClientRect();return [r.left-sr.left+r.width/2,r.top-sr.top+r.height/2]}
function renderStage(){
  const s=S(),cd=D.CLASSES[s.cls],h=G.h,d=G.d;setScene();
  const inCombat=s.slots[0].act&&s.slots[0].act.type==='combat';
  const z=D.ZONES[s.zone];const [mn,mx]=zoneLevelRange(s.zone);
  $('#zoneTitle').innerHTML=inCombat?`${z.i} ${z.n}${z.endless?' · Depth '+s.riftLevel:''}<small>Monster level ${mn}–${mx}</small>`:'';
  const ps=$('#profScene');
  if(!inCombat){ps.classList.add('on');renderProfScene();}else ps.classList.remove('on');
  // hero
  const he=$('#hero');he.style.setProperty('--cc',cd.color);he.querySelector('.spr').textContent=cd.i;he.querySelector('.wpn').textContent=cd.w;
  he.classList.toggle('dead',!!(h&&h.dead));he.classList.toggle('shielded',!!(h&&h.shield>1));
  // allies
  const al=[];if(cd.pet)al.push(['pet',cd.pet.i,9,74]);if(s.cls==='warlock'&&h&&(h.impT>0||d.permImp))al.push(['imp','😈',33,30]);if(s.qol.sellsword)al.push(['sw','💂',8,40]);if(s.qol.acolyte)al.push(['aco','🧑‍⚕️',33,76]);
  if(cd.troops&&h){const n=Math.floor(h.troops||0),show=Math.min(8,n);for(let i=0;i<show;i++)al.push(['tr'+i,'💂',14+(i%4)*5,22+Math.floor(i/4)*58+(i%2)*6])}
  const fs=s.summons.filter(x=>x.role==='fight').slice(0,6);fs.forEach((su,i)=>{const sd=D.SUMMONS.find(x=>x.id===su.type);if(sd)al.push(['su'+su.uid,sd.i,40+(i%2)*6,18+i*12])});
  const ae=$('#allies');const key=al.map(a=>a[0]).join()+(cd.troops&&h?'|'+Math.floor(h.troops||0):'');if(ae.dataset.k!==key){ae.dataset.k=key;ae.innerHTML=al.map(a=>`<div class="ally ${a[0].startsWith('tr')?'troop':a[0].startsWith('su')?'summon':''}" id="ally-${a[0]}" style="left:${a[2]}%;top:${a[3]}%">${a[1]}</div>`).join('')+(cd.troops&&h&&h.troops>=1?`<div class="troopCount" style="left:18%;top:93%">💂 ×${Math.floor(h.troops)}</div>`:'')}
  // enemies
  const en=inCombat&&G.cb?G.cb.enemies:[];const side=$('#enemySide');const seen=new Set();
  en.forEach((e,i)=>{seen.add(e.uid);let el=UI.enemyEls.get(e.uid);
    if(!el){el=document.createElement('div');el.className='unit enemy'+(e.elite?' elite':'')+(e.boss?' boss':'');const [x,y]=enemyPos(i,en.length,e.boss);el.style.left=x+'%';el.style.top=y+'%';
      el.innerHTML=`<div class="warnIcon">⚠️</div><div class="dots"></div><div class="spr">${e.def.i}</div><div class="nm">${e.elite?'★ ':''}${esc(e.def.n)} <span class="muted">L${e.lvl}</span></div><div class="hpb"><i></i></div>`;side.appendChild(el);UI.enemyEls.set(e.uid,el)}
    if(e.hp>0){el.querySelector('.hpb i').style.width=Math.max(0,e.hp/e.maxHp*100)+'%';el.classList.toggle('warn',!!e.warn);el.querySelector('.dots').textContent=e.dots.map(x=>x.icon).join('')+(e.mark?'🔻':'')+(e.slowT>0?'❄️':'')}
    else if(!el.classList.contains('dying')){el.classList.add('dying');el.querySelector('.hpb i').style.width='0%';setTimeout(()=>{el.remove()},600)}
  });
  for(const [uid,el] of UI.enemyEls){if(!seen.has(uid)){if(!el.classList.contains('dying')){el.classList.add('dying');setTimeout(()=>el.remove(),600)}UI.enemyEls.delete(uid)}}
  layoutScene(inCombat);
  if(!document.getElementById('left').classList.contains('slim'))renderBars();
}
function renderBars(){
  const s=S(),cd=D.CLASSES[s.cls],h=G.h,d=G.d,cl=s.classes[s.cls];if(!h)return;
  const r=cd.res,mx=resMax();
  let pips='';
  if(r.discrete){pips+=`<span class="muted">${r.n}</span>`+Array.from({length:mx},(_,i)=>`<span class="pip ${i<h.res?'on':''}" style="--pc:${r.color}"></span>`).join('')}
  if(cd.slots)pips+=`<span class="muted">Spell Slots</span>`+Array.from({length:d.slotMax},(_,i)=>`<span class="pip ${i<h.slots?'on':''}" style="--pc:#7fb0ff"></span>`).join('');
  if(cd.combo)pips+=`<span class="muted">Combo</span>`+Array.from({length:5},(_,i)=>`<span class="pip ${i<h.combo?'on':''}" style="--pc:#ff5a5a"></span>`).join('');
  if(cd.souls)pips+=`<span class="muted">Souls ${h.souls}/${d.soulMax}</span>`;
  if(cd.troops)pips+=`<span class="muted">💂 Troops ${Math.floor(h.troops||0)}/${Math.floor(d.troopMax)}</span>`;
  const buffs=[...h.buffs.map(b=>`<span class="buff">${b.icon} ${Math.ceil(b.t)}s</span>`)];
  if(s.meal){const rc=D.PROFS.cooking.recipes.find(x=>x.id===s.meal.id);buffs.push(`<span class="buff">${rc.i}${s.meal.p?'✨':''} ${s.relics.ladle?'∞':fmtTime(s.meal.t)}</span>`)}
  if(s.dance&&s.dance.t>0){const dd=D.DANCES.find(x=>x.id===s.dance.id);if(dd)buffs.push(`<span class="buff" title="Grace: ${dd.bd}">${dd.i} ${fmtTime(s.dance.t)}</span>`)}
  for(const k in s.elix)if(s.elix[k]>0){const rc=D.PROFS.alchemy.recipes.find(x=>x.id===k);buffs.push(`<span class="buff">${rc.i} ${fmtTime(s.elix[k])}</span>`)}
  const pot=[1,2,3,4,5].reduce((a,t)=>a+(s.potions[t]||0),0);
  setHTML($('#heroBars'),`
   <div class="row"><b>${esc(s.name)}</b><span class="pill">${cd.i} ${cd.n} ${cl.lvl}${cl.sub?' · '+cd.subs.find(x=>x.id===cl.sub).n:''}</span>${s.cls2?`<span class="pill">+ ${D.CLASSES[s.cls2].i} ${D.CLASSES[s.cls2].n}</span>`:''}<span class="sp"></span><span class="pill" title="Healing potions">🧪 ${pot}</span></div>
   <div class="bar"><i class="hpfill" style="width:${h.hp/d.maxHp*100}%"></i>${h.shield>1?`<i class="shfill" style="width:${Math.min(100,h.shield/d.maxHp*100)}%"></i>`:''}<span>${h.dead?'Reviving in '+Math.ceil(h.reviveT)+'s':`❤️ ${fmt(h.hp)} / ${fmt(d.maxHp)}${h.shield>1?' 🔰'+fmt(h.shield):''}`}</span></div>
   ${r.discrete?'':`<div class="bar"><i style="width:${h.res/mx*100}%;background:${r.color}"></i><span>${r.n} ${Math.floor(h.res)} / ${Math.floor(mx)}</span></div>`}
   <div class="bar thin"><i class="xpfill" style="width:${cl.xp/xpNeed(cl.lvl)*100}%"></i></div>
   <div class="row"><div class="pips">${pips}</div><span class="sp"></span><div class="buffs">${buffs.join('')}</div></div>`);
  // skill bar
  const sb=$('#skillBar');const sk=cd.skills.filter(x=>cl.ranks[x.id]);const k2=s.cls+sk.map(x=>x.id+(cl.off[x.id]?0:1)).join();
  if(sb.dataset.k!==k2){sb.dataset.k=k2;sb.innerHTML=sk.map(x=>`<div class="sk ${cl.off[x.id]?'off':''}" id="sk-${x.id}" data-a="toggleSkill" data-id="${x.id}" title="${esc(x.n)} — tap to toggle auto-cast"><div class="cdm"></div>${x.i}<span class="rk">${cl.ranks[x.id]}</span></div>`).join('')}
  for(const x of sk){const el=document.getElementById('sk-'+x.id);if(!el)continue;const c=Math.max(0,h.cds[x.id]||0);el.querySelector('.cdm').style.setProperty('--p',(c/x.cd*100)+'%')}
  // zone bar
  const zs=s.zones[s.zone];const inCombat=s.slots[0].act&&s.slots[0].act.type==='combat';
  const full=zs.kills>=D.KILLS_TO_BOSS;const z=D.ZONES[s.zone];
  setHTML($('#zoneBar'),inCombat?`${bar(zs.kills/D.KILLS_TO_BOSS,'kfill',G.cb&&G.cb.boss?`👑 BOSS: ${z.boss.n}`:full?'Boss ready!':`Hunt ${zs.kills}/${D.KILLS_TO_BOSS} to face ${z.boss.n}`)}
   ${full&&!(G.cb&&G.cb.boss)?btn('boss',s.bossRetry>0&&!s.bossReq?`⏳ ${Math.ceil(s.bossRetry)}s`:s.bossReq?'Summoning…':'👑 Fight Boss',{cls:'gold sm'}):''}`:`<span class="muted">Hero is busy with a profession. ${btn('goFight','⚔️ Return to battle',{cls:'sm'})}</span>`);
}
const SCENE_ICON={mining:'⛏️',smithing:'🔨',alchemy:'⚗️',cooking:'🍳',enchanting:'🔮',herbalism:'🌱',summoning:'🔯',dancing:'💃',praying:'🙏',advising:'📜',bard:'🎻',fishing:'🎣'};
function renderProfScene(){
  const s=S(),sl=s.slots[0],p=sl.act&&sl.act.p;const ps=$('#profScene');if(!p){ps.dataset.k='';ps.innerHTML='<div class="pscene">🏕️</div><div class="pstatus">Resting at camp</div>';return}
  const pd=D.PROFS[p];let inner='';const prog=sl.prog||0;
  if(p==='herbalism'){inner=`<div style="width:90%">${plotsHtml()}</div>`}
  else if(p==='smithing'){const t=s.ps.smithing.target;inner=`<div class="heatbar"><b style="left:${t}%"></b><i style="left:${Math.min(100,sl.heat)}%"></i></div>`}
  else if(p==='dancing'){const c=s.ps.dancing.combo||0;inner=`<div class="pips" style="justify-content:center;margin-top:6px">${Array.from({length:8},(_,i)=>`<span class="pip ${i<c?'on':''}" style="--pc:#ff7ad9"></span>`).join('')}</div><div style="width:220px;margin-top:6px">${bar(prog,'kfill')}</div>`}
  else if(p==='fishing'){inner=`<div style="width:220px;margin-top:8px">${bar(prog,'kfill',sl.need?'Waiting for a bite…':'Casting…')}</div>`}
  else inner=`<div style="width:220px;margin-top:8px">${bar(prog,'kfill')}</div>`;
  const key=p+(p==='herbalism'?'':'');
  if(ps.dataset.k!==key){ps.dataset.k=key;ps.innerHTML=`<div class="pscene ${p}">${SCENE_ICON[p]||'🌱'}</div><div class="pstatus"></div><div class="pin" style="width:100%;display:flex;justify-content:center"></div>`}
  ps.querySelector('.pstatus').innerHTML=`${pd.i} ${pd.n} (Lv ${s.profs[p].lvl}) — ${profTarget(p)} ${sl.note?`<span style="color:#ff8a8a">· ${sl.note}</span>`:''}`;
  ps.querySelector('.pin').innerHTML=inner;
}
function profTarget(p){const s=S();switch(p){
  case'mining':{const n=s.ps.mining.node;return `${D.MATS[n].i} ${D.MATS[n].n} · streak ${s.ps.mining.streak||0}`}
  case'herbalism':{const n=s.ps.herbalism.seed;return `${D.MATS[n].i} ${D.MATS[n].n}`}
  case'smithing':{const t=D.PROFS.smithing.tiers.find(x=>x.id===s.ps.smithing.tier);return `${t.n} ${D.SLOT_NAME[s.ps.smithing.slot]} @ ${s.ps.smithing.target}°`}
  case'alchemy':{const r=D.PROFS.alchemy.recipes.find(x=>x.id===s.ps.alchemy.recipe);return `${r.i} ${r.n}`}
  case'cooking':{const r=D.PROFS.cooking.recipes.find(x=>x.id===s.ps.cooking.recipe);return `${r.i} ${r.n}`}
  case'enchanting':{const it=s.equip[s.ps.enchanting.slot];return it?`${D.SLOT_NAME[it.slot]} +${it.ench||0}`:'(empty slot)'}
  case'summoning':{const x=D.SUMMONS.find(y=>y.id===s.ps.summoning.target);return `${x.i} ${x.n} · ${s.summons.length}/${summonCap()} bound`}
  case'dancing':{const x=D.DANCES.find(y=>y.id===s.ps.dancing.target);return `${x.i} ${x.n} · combo ${s.ps.dancing.combo||0}/8`}
  case'praying':{const x=D.DEITIES.find(y=>y.id===s.ps.praying.target);return `${x.i} ${x.n.split(',')[0]} · tier ${favorTier(s.ps.praying.favor[x.id]||0)}`}
  case'advising':{const x=D.PETITIONERS.find(y=>y.id===s.ps.advising.target);return `${x.i} ${x.n} · rep ${fmt(s.ps.advising.rep||0)}`}
  case'bard':{const x=D.SONGS.find(y=>y.id===s.ps.bard.target);return `${x.i} ${x.n} · fame ${fmt(s.ps.bard.fame||0)}`}
  case'fishing':{const x=D.FISHING.find(y=>y.id===s.ps.fishing.target);return `${x.i} ${x.n} · 🐟 ${fmt(s.mats.fish||0)}`}}}
function plotsHtml(){const s=S(),hs=s.ps.herbalism;const n=plotsCount();let h='<div class="plots">';for(let i=0;i<n;i++){const p=hs.plots[i];
  if(!p){h+=`<div class="plot">🟫<small>empty</small></div>`;continue}const f=p.g/p.max;const st=f>=1?D.MATS[p.s].i:f>.6?'🌿':f>.25?'🌱':'🌰';
  h+=`<div class="plot ${p.gold?'gold':''}">${st}<small>${f>=1?'Ripe!':Math.ceil((p.max-p.g))+'s'}</small><div class="pb"><i style="width:${f*100}%"></i></div></div>`}return h+'</div>'}

/* ---------------- HUD: always-visible HP + XP ---------------- */
UI.xpS={};const CUMC={};
function cumXp(kind,L){const k=kind;const a=CUMC[k]||(CUMC[k]=[0,0]);const need=kind==='cls'?xpNeed:profXpNeed;while(a.length<=L)a.push(a[a.length-1]+need(a.length-1));return a[L]}
function sampleXp(){const s=S(),t=Date.now();const add=(key,kind,o)=>{const v=cumXp(kind,o.lvl)+o.xp;let arr=UI.xpS[key]||(UI.xpS[key]=[]);if(arr.length&&v<arr[arr.length-1][1])arr=UI.xpS[key]=[];arr.push([t,v]);while(arr.length>1&&t-arr[0][0]>180000)arr.shift()};
  add('cls:'+s.cls,'cls',s.classes[s.cls]);if(s.cls2)add('cls:'+s.cls2,'cls',s.classes[s.cls2]);for(const q of D.PROF_ORDER)add('prof:'+q,'prof',s.profs[q])}
function xpRate(key){const a=UI.xpS[key];if(!a||a.length<2)return 0;const [t0,v0]=a[0],[t1,v1]=a[a.length-1];if(t1-t0<8000)return 0;return (v1-v0)/((t1-t0)/1000)}
function xpEta(key,short){const s=S();const [kind,id]=key.split(':');const o=kind==='cls'?s.classes[id]:s.profs[id];if(!o)return '';const r=xpRate(key);
  if(r<=0)return short?'':'';const need=(kind==='cls'?xpNeed:profXpNeed)(o.lvl);const sec=(need-o.xp)/r;
  return short?`~${fmtTime(sec)}`:`~${fmtTime(sec)} to Lv ${o.lvl+1} · ${fmt(r*3600)} XP/h`}
function hudBar(icon,name,o,need,key,cls){const pct=Math.max(0,Math.min(1,o.xp/need));const eta=xpEta(key,true);
  return `<div class="hrow"><span class="hl">${icon} <b>${name}</b> <span class="lv">Lv ${o.lvl}</span></span><div class="bar hb"><i class="${cls}" style="width:${pct*100}%"></i><span>${fmt(Math.floor(o.xp))} / ${fmt(need)} · ${(pct*100).toFixed(1)}%${eta?' · '+eta:''}</span></div></div>`}
function renderHud(){const s=S(),h=G.h,d=G.d;if(!s.started||!h)return;const cd=D.CLASSES[s.cls],cl=s.classes[s.cls];const sl=s.slots[0];
  const act=sl.act?(sl.act.type==='combat'?`⚔️ ${D.ZONES[s.zone].n}`:`${D.PROFS[sl.act.p].i} ${D.PROFS[sl.act.p].n}`):'💤 Idle';
  const hp=`<div class="hrow"><span class="hl">❤️ <span class="act">${act}</span></span><div class="bar hb"><i class="hpfill" style="width:${h.dead?0:h.hp/d.maxHp*100}%"></i><span>${h.dead?'💀 Reviving '+Math.ceil(h.reviveT)+'s':`${fmt(h.hp)} / ${fmt(d.maxHp)} HP`}</span></div></div>`;
  let pq=sl.act&&sl.act.type==='prof'?sl.act.p:(UI.tab==='profs'?UI.profSel:null);
  const prof=pq?hudBar(D.PROFS[pq].i,D.PROFS[pq].n,s.profs[pq],profXpNeed(s.profs[pq].lvl),'prof:'+pq,'pfill'):'';
  const cls=hudBar(cd.i,cd.n,cl,xpNeed(cl.lvl),'cls:'+s.cls,'xpfill');
  setHTML($('#hud'),hp+(sl.act&&sl.act.type==='prof'?prof+cls:cls+prof))}

/* ---------------- battle scene collapse (profession mode) ---------------- */
function layoutScene(inCombat){const s=S(),left=$('#left');const slim=!inCombat&&!s.settings.sceneOpen;left.classList.toggle('slim',slim);
  const sb=$('#sceneBtn');sb.style.display=inCombat?'none':'';sb.textContent='▴ Collapse';
  if(slim){const sl=s.slots[0],p=sl.act&&sl.act.p;const pd=p?D.PROFS[p]:null;
    setHTML($('#slim'),`<div class="slimrow"><span class="sic">${pd?pd.i:'🏕️'}</span><div class="sp"><div class="small"><b>${pd?pd.n:'Resting'}</b>${p?' — '+profTarget(p):''}${sl.note?` <span style="color:#ff8a8a">· ${sl.note}</span>`:''}</div><div class="bar thin"><i class="kfill" id="slimProg" style="width:0%"></i></div></div>${btn('sceneToggle','▾ Scene',{cls:'sm'})}${btn('goFight','⚔️ Fight',{cls:'sm'})}</div>`);
    const pb=document.getElementById('slimProg');if(pb&&p){const v=p==='smithing'?Math.min(1,sl.heat/s.ps.smithing.target):p==='herbalism'?0:(sl.prog||0);pb.style.width=(v*100)+'%'}}}

/* ---------------- swipe: carousel first, then main tabs ---------------- */
(function(){let sx=0,sy=0,st=0,tgt=null,active=false,swiped=false;
  const start=(x,y,t)=>{if(t&&t.closest&&t.closest('input,select,textarea,.pgchips,#tabs'))return;sx=x;sy=y;st=Date.now();tgt=t;active=true};
  const end=(x,y)=>{if(!active)return;active=false;const dx=x-sx,dy=y-sy;if(Math.abs(dx)<55||Math.abs(dy)>Math.abs(dx)*.6||Date.now()-st>900)return;
    swiped=true;setTimeout(()=>swiped=false,350);const dir=dx<0?1:-1;const pg=tgt&&tgt.closest&&tgt.closest('.pager');
    if(pg){pagerStep(pg.dataset.pager,dir);renderPanel(true)}else stepTab(dir)};
  const pn=()=>document.getElementById('panel');
  document.addEventListener('touchstart',e=>{if(!pn().contains(e.target)||e.touches.length>1)return;const t=e.touches[0];start(t.clientX,t.clientY,e.target)},{passive:true});
  document.addEventListener('touchend',e=>{const t=e.changedTouches[0];if(t)end(t.clientX,t.clientY)},{passive:true});
  document.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||!pn().contains(e.target))return;start(e.clientX,e.clientY,e.target)});
  document.addEventListener('pointerup',e=>{if(e.pointerType==='mouse')end(e.clientX,e.clientY)});
  document.addEventListener('click',e=>{if(swiped){e.stopPropagation();e.preventDefault()}},true);
  document.addEventListener('keydown',e=>{if(e.target.closest&&e.target.closest('input,textarea,select'))return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const d=e.key==='ArrowRight'?1:-1;if(e.shiftKey)stepTab(d);else{const pg=document.querySelector('#panel .pager');if(pg){pagerStep(pg.dataset.pager,d);renderPanel(true)}else stepTab(d)}}});
})();

/* ---------------- FX ---------------- */
const fxc=()=>$('#fx');let fctx=null;
function fxResize(){const c=fxc();const r=$('#stage').getBoundingClientRect();c.width=r.width*devicePixelRatio;c.height=r.height*devicePixelRatio;fctx=c.getContext('2d');fctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}
function burst(x,y,color,n=10,sp=120){if(!S().settings.particles)return;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=sp*(.3+Math.random());UI.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,life:.5+Math.random()*.5,max:1,c:color,r:2+Math.random()*3})}if(UI.parts.length>400)UI.parts.splice(0,UI.parts.length-400)}
function drawFx(dt){if(!fctx)return;const c=fxc();fctx.clearRect(0,0,c.width,c.height);for(const p of UI.parts){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=260*dt;fctx.globalAlpha=Math.max(0,p.life);fctx.fillStyle=p.c;fctx.beginPath();fctx.arc(p.x,p.y,p.r,0,7);fctx.fill()}fctx.globalAlpha=1;UI.parts=UI.parts.filter(p=>p.life>0)}
function floater(x,y,txt,cls){if(!S().settings.numbers&&cls!=='info')return;const f=$('#floaters');if(f.children.length>45)f.firstChild.remove();const el=document.createElement('div');el.className='float '+(cls||'');el.textContent=txt;el.style.left=(x+R(-18,18))+'px';el.style.top=(y-20+R(-10,10))+'px';f.appendChild(el);setTimeout(()=>el.remove(),900)}
function projectile(icon,from,to){const el=document.createElement('div');el.className='proj';el.textContent=icon;$('#stage').appendChild(el);const dx=to[0]-from[0],dy=to[1]-from[1];
  el.animate([{transform:`translate(${from[0]-12}px,${from[1]-14}px) rotate(${Math.atan2(dy,dx)}rad)`},{transform:`translate(${to[0]-12}px,${to[1]-14}px) rotate(${Math.atan2(dy,dx)}rad)`}],{duration:220,easing:'ease-in'}).onfinish=()=>el.remove()}
function shake(){if(!S().settings.shake)return;const st=$('#stage');st.classList.remove('shake');void st.offsetWidth;st.classList.add('shake')}
function banner(txt){const b=$('#banner');b.innerHTML=txt;b.classList.remove('show');void b.offsetWidth;b.classList.add('show')}
function processEvents(){
  const evs=G.ev.splice(0);if(!evs.length)return;const he=$('#hero');const hp=stageCoords(he.querySelector('.spr'));let hits=0;
  for(const e of evs){
    switch(e.t){
    case'hit':{const el=UI.enemyEls.get(e.uid);if(!el)break;const p=stageCoords(el.querySelector('.spr'));if(++hits>14)break;
      if(e.proj&&hits<8)projectile(e.proj,e.pet?hp:[hp[0]+20,hp[1]-6],p);
      el.classList.remove('hit');void el.offsetWidth;el.classList.add('hit');
      floater(p[0],p[1]-30,(e.icon?e.icon+' ':'')+fmt(e.a)+(e.cap?' CAP':''),e.cap?'cap':e.crit?'crit':e.pet?'pet':'');
      burst(p[0],p[1],e.color||(e.crit?'#ffd34d':'#ff8855'),e.crit?14:6);if(e.big)shake();
      if(e.pet){const a=document.querySelector('#allies .ally');if(a){a.classList.remove('jump');void a.offsetWidth;a.classList.add('jump')}}break}
    case'atk':he.classList.remove('lunge');void he.offsetWidth;he.classList.add('lunge');break;
    case'hurt':{he.classList.remove('hurt');void he.offsetWidth;he.classList.add('hurt');floater(hp[0],hp[1]-40,'-'+fmt(e.a),'hurt');if(e.big){shake();burst(hp[0],hp[1],'#ff3333',18,180)}break}
    case'heal':floater(hp[0],hp[1]-50,'+'+fmt(e.a),'heal');burst(hp[0],hp[1],'#5dff8f',8,80);break;
    case'dodge':floater(hp[0],hp[1]-40,'Dodge!','info');break;
    case'kill':{const el=UI.enemyEls.get(e.uid);if(el){const p=stageCoords(el.querySelector('.spr'));burst(p[0],p[1],e.boss?'#ffd34d':'#ffffff',e.boss?60:16,e.boss?260:150)}if(e.boss){banner('👑 BOSS DEFEATED!');shake()}break}
    case'cast':floater(hp[0],hp[1]-70,e.i+' '+e.n,'info');{const sk=[...document.querySelectorAll('#skillBar .sk')].find(x=>x.title.startsWith(e.n));if(sk){sk.classList.add('flash');setTimeout(()=>sk.classList.remove('flash'),250)}}break;
    case'shield':burst(hp[0],hp[1],'#7fd3ff',20,120);break;
    case'lvl':banner('⬆️ LEVEL UP!');burst(hp[0],hp[1],'#ffdb7a',40,200);break;
    case'death':banner('💀 Defeated…');break;
    case'warn':floater(hp[0]+120,hp[1]-80,'⚠️ Heavy attack!','info');break;
    case'wave':if(e.boss)banner('👑 '+esc(D.ZONES[S().zone].boss.n));break;
    case'loot':if(e.r>=4){toast(`<span class="r${e.r}">★ ${D.RARITIES[e.r].name} item found!</span>`);burst(hp[0],hp[1],D.RARITIES[e.r].color,30,160)}break;
    case'relic':{const r=D.RELICS.find(x=>x.id===e.id);banner(`🏺 RELIC FOUND<br>${r.i} ${esc(r.n)}`);toast(`<b class="relic">${r.i} ${esc(r.n)}</b><br>${esc(r.d)}`,9000);break}
    case'ach':toast(`🏆 <b>${esc(e.n)}</b>`);break;
    case'miss':{const el=UI.enemyEls.get(e.uid);if(el&&hits<14){const p=stageCoords(el.querySelector('.spr'));floater(p[0],p[1]-30,'miss','info')}break}
    case'gold':{const el=UI.enemyEls.get(e.uid);if(el){const p=stageCoords(el.querySelector('.spr'));floater(p[0],p[1]-50,'🪙+'+fmt(e.a),'crit');burst(p[0],p[1],'#ffd34d',10,120)}break}
    case'troopLoss':floater(hp[0]-60,hp[1]-60,'💂 fell!','hurt');break;
    case'deed':toast('📜 <b>Daily deed complete!</b> +AP & gold');break;
    case'fail':case'fizzle':case'summon':case'step':case'routine':case'pray':case'counsel':case'song':case'fish':{const sc=document.querySelector('#profScene .pscene');if(sc&&$('#profScene').classList.contains('on')&&e.si===0){const p=stageCoords(sc);
      const T={fail:['✖ Failed','hurt','#777'],fizzle:['💨 Fizzled','hurt','#777'],summon:['🔯 Bound!','info','#b57bff'],step:['♪ Step','info','#ff7ad9'],routine:['💃 Routine complete!','crit','#ff7ad9'],pray:['🙏 Favor','info','#ffe9a3'],counsel:['📜 +🪙'+fmt(e.a||0),'info','#ffd34d'],song:[e.enc?'🎻 ENCORE!':'🎵 Applause','info','#7fd3ff'],fish:['🎣 Catch!','info','#6fd0ff']}[e.t];
      floater(p[0],p[1]-50,T[0],T[1]);burst(p[0],p[1],T[2],e.t==='routine'||e.enc?24:10,130);sc.classList.remove('bob');void sc.offsetWidth;sc.classList.add('bob');setTimeout(()=>sc.classList.remove('bob'),360)}break}
    case'mine':case'forge':case'brew':case'cook':case'harvest':{const sc=document.querySelector('#profScene .pscene');if(sc&&$('#profScene').classList.contains('on')){const p=stageCoords(sc);burst(p[0],p[1],e.t==='forge'?'#ffb347':e.t==='brew'?'#7cf':e.t==='mine'?'#ddd':'#8f8',14,140);if(e.t!=='mine')floater(p[0],p[1]-50,e.t==='forge'?'Forged!':e.t==='brew'?'Brewed!':e.t==='cook'?'Cooked!':e.gold?'🌟 Golden!':'Harvest!','info')}break}
    case'crack':case'burn':{const sc=document.querySelector('#profScene .pscene');if(sc&&$('#profScene').classList.contains('on')){const p=stageCoords(sc);floater(p[0],p[1]-50,e.t==='crack'?'💥 Cracked!':'🔥 Burnt!','hurt')}break}
    case'ench':{const sc=document.querySelector('#profScene .pscene');if(sc&&$('#profScene').classList.contains('on')){const p=stageCoords(sc);floater(p[0],p[1]-50,e.ok?'✨ Success!':'Failed','info');burst(p[0],p[1],e.ok?'#c58bff':'#666',20,150)}break}
    }}
}

/* ---------------- slots strip ---------------- */
function slotLabel(sl){if(!sl.act)return '💤 Idle — tap to assign';if(sl.act.type==='combat')return `⚔️ Fighting in ${D.ZONES[S().zone].n}`;const pd=D.PROFS[sl.act.p];return `${pd.i} ${pd.n}: ${profTarget(sl.act.p)}`}
function renderSlots(){const s=S(),info=actionSlotsInfo();
  const prog=sl=>sl.act&&sl.act.type==='prof'&&sl.act.p!=='herbalism'?(sl.act.p==='smithing'?Math.min(1,sl.heat/s.ps.smithing.target):sl.prog):null;
  const html=s.slots.map((sl,i)=>`<div class="slot ${sl.act?'':'idle'}" data-a="assignMenu" data-si="${i}"><div class="t"><span>${info[i].hero?'🧝 Hero':'🧑‍🔧 '+info[i].n}</span><span>${Math.round(info[i].eff*100)}% speed</span></div><div class="a">${slotLabel(sl)}${sl.note?` <span style="color:#ff8a8a;font-size:11px">(${sl.note})</span>`:''}</div>${prog(sl)!=null?bar(0,'kfill'):''}</div>`).join('');
  const el=$('#slotsStrip');setHTML(el,html);
  s.slots.forEach((sl,i)=>{const p=prog(sl);if(p==null)return;const b=el.querySelector(`.slot[data-si="${i}"] .bar i`);if(b)b.style.width=(p*100)+'%'})}
function assignMenu(si){const s=S();const opts=[];if(si==0)opts.push(btn('assign','⚔️ Adventure (combat)',{data:{si,k:'combat'},cls:'gold'}));
  for(const p of D.PROF_ORDER)opts.push(btn('assign',`${D.PROFS[p].i} ${D.PROFS[p].n} <span class="muted">Lv ${s.profs[p].lvl}</span>`,{data:{si,k:p}}));
  opts.push(btn('assign','💤 Idle',{data:{si,k:'idle'}}));
  modal(`<h2>${si==0?'🧝 Hero':'🧑‍🔧 '+actionSlotsInfo()[si].n} — choose activity</h2><p class="muted">${si==0?'Only your hero can fight. ':''}Profession targets (which ore, recipe, etc.) are set in the Professions tab.</p><div class="grid" style="--min:180px">${opts.join('')}</div><div class="row" style="margin-top:10px"><span class="sp"></span>${btn('close','Close')}</div>`)}

/* ---------------- panels ---------------- */
const P={};
P.adventure=()=>{const s=S();const cur=s.zone;
  let h=`<h2>⚔️ Adventure</h2><div class="row">${s.qol.autoBoss?toggle('autoBoss','🔔 Auto-boss'):''}${s.qol.autoAdvance?toggle('autoAdvance','🗺️ Auto-advance'):''}${canAscend()?'':'<span class="muted">Ascension unlocks after defeating the Sunken Crypt.</span>'}</div><div class="grid" style="--min:250px;margin-top:8px">`;
  D.ZONES.forEach((z,i)=>{const zs=s.zones[i];const [mn,mx]=zoneLevelRange(i);const rel=D.RELICS.filter(r=>r.src.zone===i);
    h+=`<div class="card zone ${zs.unlocked?'':'locked'} ${i===cur?'cur':''}" ${zs.unlocked?`data-a="zone" data-i="${i}"`:''}><div class="zbg" style="background:${z.bg}"></div>
     <div class="hd"><span class="ic">${z.i}</span><div><b class="cinzel">${z.n}</b><div class="small">Lv ${mn}–${mx}${z.endless?` · Depth ${s.riftLevel}`:''} ${zs.cleared?'✅':''}</div></div></div>
     <div class="small" style="margin-top:4px">${z.mons.map(m=>m.i).join(' ')} · 👑 ${z.boss.i} ${esc(z.boss.n)}</div>
     <div class="small">Drops: ${D.MATS[z.mat].i} ${D.MATS[z.mat].n}${zs.bossKills?` · Boss kills: ${zs.bossKills}`:''}</div>
     ${rel.map(r=>`<div class="small"><span class="${s.relics[r.id]?'relic':''}">${r.i} ${esc(r.n)}</span> — <span class="odds">1/${fmt(relicOdds(r))}</span> ${r.src.boss?'(boss)':r.src.elite?'(elite/boss)':'(any kill)'} ${s.relics[r.id]?'✅':''}</div>`).join('')}
     ${zs.unlocked?'':'<div class="small">🔒 Defeat the previous boss</div>'}</div>`});
  return h+'</div>';};
function toggle(k,label){return btn('toggleSet',`${S().settings[k]?'✅':'⬜'} ${label}`,{data:{k},cls:'sm'})}
P.hero=()=>{const s=S(),d=G.d,cd=D.CLASSES[s.cls];
  let doll=D.SLOTS.map(sl=>{const it=s.equip[sl];return it?`<div class="item" style="--rc:${D.RARITIES[it.r].color}" data-a="item" data-id="${it.id}" data-eq="1"><div class="ii">${itemIcon(it)}</div><div class="small r${it.r}" style="font-size:10px">${esc(D.SLOT_NAME[sl])}</div><div class="il">il ${it.il}</div>${it.ench?`<span class="en">+${it.ench}</span>`:''}</div>`:`<div class="item" style="--rc:#333;opacity:.5"><div class="ii">${D.SLOT_ICON[sl]}</div><div class="il">${D.SLOT_NAME[sl]}</div></div>`}).join('');
  const st=(n,v)=>`<div class="stat"><span>${n}</span><b>${v}</b></div>`;
  const pots=D.PROFS.alchemy.recipes.filter(r=>r.pot&&(s.potions[r.pot]||0)>0).map(r=>`<span class="pill">${r.i} ${r.n} ×${s.potions[r.pot]}</span>`).join(' ')||'<span class="muted">No potions — brew some with Alchemy.</span>';
  const elix=D.PROFS.alchemy.recipes.filter(r=>r.elix&&(s.elixirs[r.id]||0)>0).map(r=>btn('drink',`${r.i} ${r.n} ×${s.elixirs[r.id]}`,{data:{id:r.id},cls:'sm'})).join(' ')||'<span class="muted">None</span>';
  const food=D.PROFS.cooking.recipes.flatMap(r=>[(s.foodP[r.id]||0)>0?btn('eat',`${r.i}✨ Perfect ${r.n} ×${s.foodP[r.id]}`,{data:{id:r.id,p:1},cls:'sm'}):'',(s.food[r.id]||0)>0?btn('eat',`${r.i} ${r.n} ×${s.food[r.id]}`,{data:{id:r.id,p:0},cls:'sm'}):'']).join(' ')||'<span class="muted">None — cook with Cooking.</span>';
  return `<h2>🧝 ${esc(s.name)} the ${cd.n}</h2>
  <div class="doll">${doll}</div>
  <div class="grid" style="--min:230px;margin-top:10px"><div class="card"><h3 style="margin-top:0">Attributes</h3>${D.STATS.map(k=>st((k===cd.main?'★ ':'')+D.STAT_NAMES[k],fmt(d[k]))).join('')}</div>
  <div class="card"><h3 style="margin-top:0">Combat</h3>${st('Power',fmt(d.power))}${st('Est. DPS',fmt(d.dps))}${st('Max HP',fmt(d.maxHp))}${st('Weapon damage',fmt(d.weaponDmg))}${st('Damage bonus','+'+fmt(d.dmgPct)+'%')}${st('Crit',d.crit.toFixed(1)+'% / +'+fmt(d.critDmg)+'%')}${st('Attack interval',d.atkInt.toFixed(2)+'s')}${st('Hit chance',d.hit.toFixed(0)+'%')}${st('Armor',fmt(d.armor))}${st('Damage reduction',d.dr.toFixed(0)+'%')}${st('Dodge',d.dodge.toFixed(1)+'%')}${st('Lifesteal',d.lifesteal.toFixed(1)+'%')}${st('Damage cap / hit',d.cap===Infinity?'∞ (Unbound)':fmt(d.cap))}</div>
  <div class="card"><h3 style="margin-top:0">Fortune</h3>${st('Gold find','+'+fmt(d.gold)+'%')}${st('XP bonus','+'+fmt(d.xp)+'%')}${st('Magic find','+'+fmt(d.mf)+'%')}${st('Skill damage','+'+fmt(d.skillDmg)+'%')}${st('Pet/ally damage','+'+fmt(d.petDmg)+'%')}${st('Profession speed','+'+fmt(d.profSpeed)+'%')}${st('Action speed (all)','+'+fmt(d.actSpeed||0)+'%')}${st('Action Point bonus','+'+fmt(d.apPct||0)+'%')}${st('Relic luck','+'+fmt(d.relicLuck||0)+'%')}${st('Achievements',Object.keys(s.ach).length+' (+'+Object.keys(s.ach).length+'% dmg & gold)')}${st('Relics',Object.keys(s.relics).length+' / '+D.RELICS.length)}</div></div>
  <h3>🧪 Potions</h3><div class="row">${pots}</div><p class="muted">${s.qol.autoQuaff?`Potion Belt drinks automatically below ${s.settings.quaffAt}% HP.`:'Buy the Potion Belt in Town to drink potions automatically in combat.'}</p>
  <h3>🧴 Elixirs</h3><div class="row">${elix}</div>
  <h3>🍽️ Meals</h3><div class="row">${food}</div>`;};
P.skills=()=>{const s=S(),cd=D.CLASSES[s.cls],cl=s.classes[s.cls];
  const card=(x,act)=>{const r=cl.ranks[x.id]||0,lock=cl.lvl<x.lv;return `<div class="card ${lock?'locked':''}"><div class="hd"><span class="ic">${x.i}</span><div class="sp"><b>${x.n}</b> <span class="pill">${r}/${x.max}</span><div class="small muted">${lock?`🔒 Requires level ${x.lv}`:act?(x.slot?`${x.slot} slot${x.slot>1?'s':''}`:`${x.cost?x.cost+' '+cd.res.n:'No cost'}`)+` · ${x.cd}s cooldown`:'Passive'}</div></div>
   ${!lock&&r<x.max?btn('skillUp','+',{data:{id:x.id},cls:'gold sm',dis:cl.pts<=0}):''}</div>
   <div class="small" style="margin-top:4px">${r?x.d(r):x.d(1)}${r&&r<x.max?`<br><span class="muted">Next: ${x.d(r+1)}</span>`:''}</div>
   ${act&&r?`<div style="margin-top:4px">${btn('toggleSkill',cl.off[x.id]?'⬜ Auto-cast off':'✅ Auto-cast on',{data:{id:x.id},cls:'sm'})}</div>`:''}</div>`};
  let sub='';if(cl.lvl>=D.SUB_LEVEL){sub=cl.sub?`<div class="card sel"><b>${cd.subs.find(x=>x.id===cl.sub).i} ${cd.subs.find(x=>x.id===cl.sub).n}</b> — ${cd.subs.find(x=>x.id===cl.sub).d}</div>`:`<div class="grid">${cd.subs.map(x=>`<div class="card"><b>${x.i} ${x.n}</b><div class="small">${x.d}</div>${btn('sub','Choose',{data:{id:x.id},cls:'gold sm'})}</div>`).join('')}</div>`}
  else sub=`<p class="muted">🔒 Choose a subclass at level ${D.SUB_LEVEL}: ${cd.subs.map(x=>x.i+' '+x.n+' ('+x.d+')').join(' or ')}.</p>`;
  const rc=respecCost();
  return `<h2>✨ ${cd.i} ${cd.n} Skills</h2><div class="card"><div class="small">${cd.mech}</div><div class="row" style="margin-top:6px"><span class="big">${cl.pts}</span> skill point${cl.pts===1?'':'s'} available<span class="sp"></span>${btn('respec',`↺ Respec (${rc?costTxt(rc):'free'})`,{cls:'sm',dis:s.gold<rc})}</div></div>
  <h3>Abilities (auto-cast in order)</h3><div class="grid">${cd.skills.map(x=>card(x,1)).join('')}</div>
  <h3>Passives</h3><div class="grid">${cd.passives.map(x=>card(x,0)).join('')}</div>
  <h3>Subclass</h3>${sub}`;};
/* ---------- pager (one page at a time, swipe / arrows / chips) ---------- */
const PAGERS={
  profs:{keys:()=>D.PROF_ORDER,get:()=>UI.profSel,set:k=>{UI.profSel=k},chip:k=>{const s=S();const who=s.slots.some(sl=>sl.act&&sl.act.p===k);return `${D.PROFS[k].i}<small>${s.profs[k].lvl}</small>${who?'<i class="live"></i>':''}`}},
  classes:{keys:()=>D.CLASS_ORDER,get:()=>UI.clsSel||S().cls,set:k=>{UI.clsSel=k},chip:k=>{const s=S();return `${D.CLASSES[k].i}<small>${s.unlockedCls[k]?s.classes[k].lvl:'🔒'}</small>${s.cls===k?'<i class="live"></i>':''}`}},
  mastery:{keys:()=>['daily','gen','cls',...D.PROF_ORDER.map(q=>'p:'+q)],get:()=>UI.mPage||'daily',set:k=>{UI.mPage=k},
    chip:k=>{const s=S();if(k==='daily')return '📅<small>Daily</small>';if(k==='gen')return `🌐<small>${fmt(Math.floor(s.ap.gen))}</small>`;if(k==='cls')return `${D.CLASSES[s.cls].i}<small>${fmt(Math.floor(s.ap.cls[s.cls]||0))}</small>`;const q=k.slice(2);return `${D.PROFS[q].i}<small>${fmt(Math.floor(s.ap.prof[q]||0))}</small>`}},
};
function pagerStep(id,d){const P2=PAGERS[id],ks=P2.keys();let i=ks.indexOf(P2.get());if(i<0)i=0;i=(i+d+ks.length)%ks.length;P2.set(ks[i]);UI.slide=d>0?'slideL':'slideR'}
function pager(id,title,body){const P2=PAGERS[id],ks=P2.keys(),cur=P2.get(),i=Math.max(0,ks.indexOf(cur));const sl=UI.slide||'';
  return `<div class="pager" data-pager="${id}"><div class="pgnav">${btn('pg','‹',{data:{pg:id,d:-1},cls:'pgb'})}<div class="pgtitle">${title}<small>${i+1} / ${ks.length} · swipe ⇆</small></div>${btn('pg','›',{data:{pg:id,d:1},cls:'pgb'})}</div>
   <div class="pgchips">${ks.map(k=>`<button class="pgc ${k===cur?'on':''}" data-a="pgTo" data-pg="${id}" data-k="${k}">${P2.chip(k)}</button>`).join('')}</div>
   <div class="pgbody ${sl}">${body}</div></div>`}
function bigXp(cur,need,cls,label){const pct=need?cur/need:0;return `<div class="bigxp">${bar(pct,cls||'xpfill',`${label?label+' · ':''}${fmt(Math.floor(cur))} / ${fmt(need)} XP · ${(pct*100).toFixed(1)}%`)}</div>`}
P.classes=()=>{const s=S();const can2=Object.values(s.classes).some(c=>c.lvl>=D.MULTI_LEVEL);const c=PAGERS.classes.get();const cd=D.CLASSES[c],cl=s.classes[c],un=s.unlockedCls[c];
  const eta=xpEta('cls:'+c);
  const body=`<div class="card cls ${un?'':'locked'} ${s.cls===c?'sel':''}"><div class="hd"><span class="ic big">${cd.i}${cd.w}</span><div class="sp"><b class="cinzel" style="font-size:17px">${cd.n}</b><div class="small">Level <b>${cl.lvl}</b> · ${cd.res.n} · ★${D.STAT_SHORT[cd.main]}${cl.sub?' · '+cd.subs.find(x=>x.id===cl.sub).n:''}</div></div></div>
   ${bigXp(cl.xp,xpNeed(cl.lvl),'xpfill','Lv '+cl.lvl)}${eta?`<div class="small muted">⏱ ${eta}</div>`:''}
   <div class="small" style="margin:8px 0">${cd.mech}</div>
   ${un?`<div class="row">${s.cls===c?'<span class="pill">✅ Active class</span>':btn('switchCls','Play as '+cd.n,{data:{c},cls:'gold'})}${can2&&s.cls!==c?btn('cls2',s.cls2===c?'✅ Secondary':'Set secondary',{data:{c},cls:'sm'}):''}${s.cls===c?btn('tab','✨ Skills →',{data:{t:'skills'},cls:'sm'}):''}</div>
     <div class="small" style="margin-top:8px">🎖️ ${cd.n} AP: <b>${fmt(Math.floor(s.ap.cls[c]||0))}</b> · Subclasses: ${cd.subs.map(x=>x.i+' '+x.n).join(' / ')}</div>`:`<div class="small">🔒 ${D.CLASS_UNLOCK[c].d}</div>`}</div>`;
  return `<h2>🎭 Classes</h2>${pager('classes',`${cd.i} ${cd.n}`,body)}<p class="small muted">Each class levels separately and keeps its skills. Switching is free. ${can2?'<b>Multiclassing unlocked:</b> your secondary class grants 50% of its passives and 25% of its attribute growth, and earns 25% of your XP.':`Reach level ${D.MULTI_LEVEL} in any class to unlock multiclassing.`}</p>`;};
P.profs=()=>{const s=S(),p=UI.profSel,pd=D.PROFS[p],pr=s.profs[p];const info=actionSlotsInfo();const eta=xpEta('prof:'+p);
  const who=s.slots.map((sl,i)=>sl.act&&sl.act.p===p?(i?'🧑‍🔧 '+info[i].n:'🧝 Hero'):'').filter(Boolean).join(', ');
  let body=`<div class="card"><div class="hd"><span class="ic big">${pd.i}</span><div class="sp"><b class="cinzel" style="font-size:17px">${pd.n}</b> <span class="pill">Lv ${pr.lvl}</span><div class="small">${who?'Working: '+who:'<span class="muted">Nobody assigned</span>'}</div></div></div>
   ${bigXp(pr.xp,profXpNeed(pr.lvl),'xpfill','Lv '+pr.lvl)}${eta?`<div class="small muted">⏱ ${eta}</div>`:''}
   <div class="small" style="margin-top:6px">${pd.mech}</div>
   <div class="row" style="margin-top:6px">Assign: ${s.slots.map((sl,i)=>btn('assign',(i?'🧑‍🔧 '+info[i].n:'🧝 Hero')+(sl.act&&sl.act.p===p?' ✅':''),{data:{si:i,k:p},cls:'sm'+(sl.act&&sl.act.p===p?' on':'')})).join('')}</div>
   <div class="row small" style="margin-top:6px">🎖️ AP: <b>${fmt(Math.floor(s.ap.prof[p]||0))}</b> ${btn('goMastery','Mastery →',{data:{p},cls:'sm gold'})}<span class="muted">Speed ×${profSpeed(0,p).toFixed(2)} (hero) · bonus yield ${((G.d.bounty||0)+pm(p,'bounty')*3).toFixed(0)}%</span></div>
   <div class="row small" style="margin-top:6px">🔧 Tools: ${D.TOOLS.names[s.tools[p]||0]} (+${15*(s.tools[p]||0)}% speed) ${(s.tools[p]||0)<D.TOOLS.max?btn('tool',`Upgrade ${costTxt(townCost(upgradeCost(D.TOOLS.base,D.TOOLS.mult,s.tools[p]||0)))}`,{data:{p},cls:'sm'}):''}</div></div>`;
  body+=profDetail(p);
  return `<h2>⚒️ Professions</h2>${pager('profs',`${pd.i} ${pd.n} · Lv ${pr.lvl}`,body)}`;};
const MODN={dmgPct:'damage',regenPct:'HP regen/s',hpPct:'max HP',profSpeed:'profession speed',xp:'XP',profXp:'profession XP',crit:'crit'};
function profDetail2(p,lv){const s=S();let h='';const t=(x)=>`Lv ${x.lv} · ${x.t}s · ${succ(p,x.lv)}`;
  if(p==='summoning'){const ss=s.ps.summoning,cap=summonCap();
    h=`<h3>Rituals</h3><div class="grid" style="--min:170px">${D.SUMMONS.map(x=>selCard('setSum',{id:x.id},ss.target===x.id,lv<x.lv,`<b>${x.i} ${x.n}</b><div class="small">${t(x)}<br>Base power ${x.power} (×${(1+lv*.02).toFixed(2)} at your level)<br>${Object.keys(x.in).length?matsHave(x.in):'No materials'}</div>`)).join('')}</div>
    <h3>Bestiary ${s.summons.length}/${cap}</h3><p class="small muted">⚔️ Fighters strike beside your hero every 2.5s for 25% of power × damage. 🔧 Workers add power×3% speed to their profession. Roster +1 every 12 levels.</p>
    <div class="grid" style="--min:200px">${s.summons.map(su=>{const sd=D.SUMMONS.find(x=>x.id===su.type);return `<div class="card"><div class="hd"><span class="ic">${sd.i}</span><div class="sp"><b>${sd.n}</b><div class="small">Power ${su.power} · ${su.role==='fight'?'⚔️ Fighting':'🔧 Working: '+D.PROFS[su.role].n}</div></div></div>
      <select data-sel="sumRole" data-uid="${su.uid}"><option value="fight" ${su.role==='fight'?'selected':''}>⚔️ Fight beside hero</option>${D.PROF_ORDER.filter(q=>q!=='summoning').map(q=>`<option value="${q}" ${su.role===q?'selected':''}>🔧 Work: ${D.PROFS[q].n}</option>`).join('')}</select>
      <div style="margin-top:4px">${btn('releaseSum','Release',{data:{uid:su.uid},cls:'sm red'})}</div></div>`}).join('')||'<span class="muted">No creatures bound yet.</span>'}</div>`}
  if(p==='dancing'){const ds=s.ps.dancing;const cur=s.dance&&s.dance.t>0?D.DANCES.find(x=>x.id===s.dance.id):null;
    h=`<h3>Dances · combo ${ds.combo||0}/8 ${cur?`· Grace active: ${cur.i} ${cur.bd} (${fmtTime(s.dance.t)})`:''}</h3><div class="pips" style="margin-bottom:6px">${Array.from({length:8},(_,i)=>`<span class="pip ${i<(ds.combo||0)?'on':''}" style="--pc:#ff7ad9"></span>`).join('')}</div>
    <div class="grid" style="--min:180px">${D.DANCES.map(x=>selCard('setDance',{id:x.id},ds.target===x.id,lv<x.lv,`<b>${x.i} ${x.n}</b><div class="small">${t(x)}<br>Grace: ${x.bd}<br>Chance to land 8 in a row: ${(Math.pow(profSucc('dancing',x.lv),8)*100).toFixed(1)}%</div>`)).join('')}</div>
    <p class="small muted">Each completed routine adds 5 minutes of Grace (max 60) and earns tips. Switching dances replaces the Grace buff.</p>`}
  if(p==='praying'){const pr=s.ps.praying;
    h=`<h3>Pantheon — only your current patron blesses you</h3><div class="grid" style="--min:220px">${D.DEITIES.map(x=>{const f=pr.favor[x.id]||0,tr=favorTier(f),nx=10*(Math.pow(2,tr+1)-1);return selCard('setDeity',{id:x.id},pr.target===x.id,lv<x.lv,`<b>${x.i} ${x.n}</b><div class="small">${t(x)}<br>Favor ${fmt(Math.floor(f))} · Tier <b>${tr}</b>/10${tr<10?` (next at ${fmt(nx)})`:''}<br>Blessing now: ${tr?x.bd(tr):'—'}<br><span class="muted">At tier 10: ${x.bd(10)}</span></div>${bar(tr>=10?1:(f-10*(Math.pow(2,tr)-1))/(nx-10*(Math.pow(2,tr)-1)),'xpfill')}`)}).join('')}</div>
    <p class="small muted">Favor per prayer: ${(1+lv/20).toFixed(2)}. Each tier needs double the favor of the last. 0.5% of prayers are miracles (+25 general AP).</p>`}
  if(p==='advising'){const as=s.ps.advising,rep=as.rep||0;
    h=`<h3>Petitioners · Reputation <b>${fmt(Math.floor(rep))}</b></h3><div class="grid" style="--min:190px">${D.PETITIONERS.map(x=>selCard('setPet',{id:x.id},as.target===x.id,lv<x.lv,`<b>${x.i} ${x.n}</b><div class="small">${t(x)}<br>Fee 🪙${fmt(x.gold*(1+rep/500))} · +${x.rep} rep<br><span class="r5">Bad counsel: −${x.rep*2} rep</span></div>`)).join('')}</div>
    <h3>Court perks</h3>${D.REP_PERKS.map(pk=>`<div class="small">${rep>=pk.at?'✅':'🔒'} <b>${fmt(pk.at)}</b> rep — ${pk.d}</div>`).join('')}`}
  if(p==='bard'){const bs=s.ps.bard;
    h=`<h3>Songbook · Fame ${fmt(bs.fame||0)} · encore ${(Math.min(.3,(bs.fame||0)/5000)*100).toFixed(1)}%</h3><div class="grid" style="--min:210px">${D.SONGS.map(x=>{const m=bs.mastery[x.id]||0;const str=m/100*(1+lv/100)*(s.relics.lute?2:1);return selCard('setSong',{id:x.id},bs.target===x.id,lv<x.lv,`<b>${x.i} ${x.n}</b>${bs.anthem===x.id?' <span class="pill">🎺 Anthem</span>':''}<div class="small">${t(x)}<br>Anthem effect now: ${Object.entries(x.mods).map(([k,v])=>`+${(v*str).toFixed(1)}% ${MODN[k]||k}`).join(', ')||'—'}<br>Mastery ${m}/100</div>${bar(m/100,'xpfill')}`)}).join('')}</div>
    <div class="row" style="margin-top:6px">Anthem: ${D.SONGS.filter(x=>lv>=x.lv).map(x=>btn('setAnthem',x.i+' '+x.n,{data:{id:x.id},cls:'sm'+(bs.anthem===x.id?' on':'')})).join('')}</div>
    <p class="small muted">Your Anthem buffs you at all times: song effect × mastery% × (1 + Bard level/100). Practise a song to raise its mastery.</p>`}
  if(p==='fishing'){const fs=s.ps.fishing;
    h=`<h3>Fishing spots · 🐟 ${fmt(s.mats.fish||0)} fish</h3><div class="grid" style="--min:180px">${D.FISHING.map(x=>selCard('setFish',{id:x.id},fs.target===x.id,lv<x.lv,`<b>${x.i} ${x.n}</b><div class="small">Lv ${x.lv} · bite in ${(x.t*.5).toFixed(0)}–${(x.t*1.8).toFixed(0)}s · ${succ('fishing',x.lv)}<br>${x.fish} fish per catch · 2% sunken treasure</div>`)).join('')}</div>
    <p class="small muted">Fish are used by Cooking (Grilled Trout, Seafarer's Chowder).</p>`}
  return h}
function selCard(a,data,sel,lock,inner){const attrs=Object.entries(data).map(([k,v])=>`data-${k}="${v}"`).join(' ');return `<div class="card ${sel?'sel':''} ${lock?'locked':''}" ${lock?'':`data-a="${a}" ${attrs}`} style="cursor:pointer">${inner}</div>`}
function matsHave(inp){const s=S();return Object.entries(inp).map(([k,n])=>`<span class="${(s.mats[k]||0)>=n?'':'r5'}">${D.MATS[k].i}${n} <span class="muted">(${fmt(s.mats[k]||0)})</span></span>`).join(' ')}
function succ(p,req){const v=profSucc(p,req);return `<span class="${v<.5?'r5':v>.85?'r1':''}">✔ ${(v*100).toFixed(0)}%</span>`}
function profDetail(p){const s=S(),lv=s.profs[p].lvl;let h='';
  if(D.PROFS[p].kind==='perform'||p==='summoning'||p==='fishing')h+=profDetail2(p,lv);
  if(p==='mining'){h=`<h3>Veins · Lode streak ${s.ps.mining.streak||0}/20 (+${(s.ps.mining.streak||0)*5}% yield)</h3><div class="grid" style="--min:170px">${D.PROFS.mining.nodes.map(n=>selCard('setNode',{id:n.id},s.ps.mining.node===n.id,lv<n.lv,`<b>${D.MATS[n.id].i} ${D.MATS[n.id].n}</b><div class="small">Lv ${n.lv} · ${n.t}s · ${succ('mining',n.lv)}<br>Gem: ${D.MATS[n.gem].i} ${D.MATS[n.gem].n}<br>Owned: ${fmt(s.mats[n.id]||0)}</div>`)).join('')}</div>`}
  if(p==='herbalism'){h=`<h3>Seeds</h3><div class="grid" style="--min:150px">${D.PROFS.herbalism.seeds.map(n=>selCard('setSeed',{id:n.id},s.ps.herbalism.seed===n.id,lv<n.lv,`<b>${D.MATS[n.id].i} ${D.MATS[n.id].n}</b><div class="small">Lv ${n.lv} · ${n.t}s grow · ${succ('herbalism',n.lv)}<br>Owned: ${fmt(s.mats[n.id]||0)}</div>`)).join('')}</div>
    <h3>Garden — ${plotsCount()} plots ${s.qol.autoHarvest?'· 🎃 Scarecrow active':''}</h3>${plotsHtml()}<p class="muted">Yield ${2+Math.floor(lv/15)} per plot · golden mutation ${(3+lv*.05).toFixed(1)}% · +1 plot per 20 levels, more in Town.</p>`}
  if(p==='smithing'){const ss=s.ps.smithing,t=D.PROFS.smithing.tiers.find(x=>x.id===ss.tier),cr=crackChance(ss.target);
    h=`<h3>Metal</h3><div class="grid" style="--min:160px">${D.PROFS.smithing.tiers.map(n=>selCard('setTier',{id:n.id},ss.tier===n.id,lv<n.lv,`<b>${n.n}</b><div class="small">Lv ${n.lv} · item level ${n.il}+<br>${D.MATS[n.ore].i} ${D.MATS[n.ore].n} + ${D.MATS[n.mat].i} ${D.MATS[n.mat].n}</div>`)).join('')}</div>
    <h3>Piece</h3><div class="row">${D.SLOTS.map(sl=>btn('setSmithSlot',D.SLOT_ICON[sl]+' '+D.SLOT_NAME[sl],{data:{sl},cls:'sm'+(ss.slot===sl?' on':'')})).join('')}</div>
    <h3>Strike temperature: ${ss.target}°</h3><input type="range" min="40" max="100" value="${ss.target}" data-in="smithTarget">
    <div class="row small"><span>Crack chance: <b class="${cr>.1?'r5':''}">${(cr*100).toFixed(1)}%</b></span><span>Quality bonus: <b class="r3">+${Math.round((ss.target-40)*3+lv*1.5)}% rarity</b></span><span>Time: ${(ss.target/12).toFixed(1)}s</span></div>
    <p class="small">Cost: ${matsHave(smithCost(t,ss.slot))} · Forged items are at least Uncommon, 5% Masterwork (+1 rarity).</p>`}
  if(p==='alchemy'){const as=s.ps.alchemy;h=`<h3>Recipes</h3><div class="grid" style="--min:200px">${D.PROFS.alchemy.recipes.map(r=>{const m=as.mastery[r.id]||0;return selCard('setAlch',{id:r.id},as.recipe===r.id,lv<r.lv,`<b>${r.i} ${r.n}</b><div class="small">Lv ${r.lv} · ${succ('alchemy',r.lv)} · ${r.pot?`heals ${Math.round(r.heal*100*(1+m/200))}%`:Object.entries(r.elix).map(([k,v])=>`+${Math.round(v*(1+m/200))}% ${k}`).join(', ')+` · 5 min`}<br>${matsHave(r.in)}<br>Owned: ${r.pot?(s.potions[r.pot]||0):(s.elixirs[r.id]||0)}</div><div class="small">Mastery ${m}/100</div>${bar(m/100,'xpfill')}`)}).join('')}</div>`}
  if(p==='cooking'){const cs=s.ps.cooking;h=`<h3>Recipes</h3><div class="grid" style="--min:200px">${D.PROFS.cooking.recipes.map(r=>{const c=cs.count[r.id]||0,diff=lv-r.lv,burn=1-profSucc('cooking',r.lv),perf=Math.min(.3,Math.max(0,diff*.015));const tier=c>=500?3:c>=100?2:c>=25?1:0;
    return selCard('setCook',{id:r.id},cs.recipe===r.id,lv<r.lv,`<b>${r.i} ${r.n}</b><div class="small">Lv ${r.lv} · ${Object.entries(r.buff).map(([k,v])=>`+${v}% ${k}`).join(', ')} · 10 min<br>${matsHave(r.in)}<br>🔥 burn ${(burn*100).toFixed(0)}% · ✨ perfect ${(perf*100).toFixed(0)}%<br>Signature ${'★'.repeat(tier)}${'☆'.repeat(3-tier)} (${c}/${tier>=3?500:[25,100,500][tier]}) · Owned ${(s.food[r.id]||0)}+${(s.foodP[r.id]||0)}✨</div>`)}).join('')}</div>`}
  if(p==='enchanting'){const es=s.ps.enchanting;h=`<h3>Target (equipped item) · ✨ Dust: ${fmt(s.mats.dust||0)}</h3><div class="grid" style="--min:170px">${D.SLOTS.map(sl=>{const it=s.equip[sl];return selCard('setEnch',{sl},es.slot===sl,!it,it?`<b class="r${it.r}">${D.SLOT_ICON[sl]} ${D.SLOT_NAME[sl]} +${it.ench||0}</b><div class="small">${esc(it.n)}<br>${it.ench>=15?'MAX':`Cost ✨${fmt(enchCost(it))} · ${enchChance(it).toFixed(0)}% success`}</div>`:`<b>${D.SLOT_NAME[sl]}</b><div class="small">empty</div>`)}).join('')}</div>
    <div class="row" style="margin-top:8px">${btn('toggleWard',es.ward?'✅ Use gems as wards':'⬜ Use gems as wards',{cls:'sm'})}<span class="muted">Gems: ${['amethyst','ruby','sapphire','emerald','diamond'].map(g=>D.MATS[g].i+(s.mats[g]||0)).join(' ')}</span></div><p class="muted">Get dust by salvaging gear in the Inventory (or set the Loot Filter to Salvage).</p>`}
  return h;}
function mNode(tree,key,n,ranks,pool){const r=(ranks||{})[n.id]||0,mx=r>=n.max,c=mx?0:masteryCost(n,r);
  return `<div class="card mnode ${mx?'sel':''}"><div class="hd"><span class="ic">${n.i||'⭐'}</span><div class="sp"><b>${n.n}</b> <span class="pill">${r}/${n.max}</span><div class="small">${r?n.d(r):n.d(1)}${!mx&&r?`<br><span class="muted">Next: ${n.d(r+1)}</span>`:''}</div></div></div>
   <div style="margin-top:4px">${mx?'<span class="pill">Mastered</span>':btn('buyM',`🎖️ ${fmt(c)} AP`,{data:{tree,key:key||'',id:n.id},cls:'gold sm',dis:pool<c})}</div></div>`}
P.mastery=()=>{const s=S(),d=G.d;const dc=dailyCap();const cd=D.CLASSES[s.cls];const k=PAGERS.mastery.get();let title='',body='';
  if(k==='daily'){const deeds=(s.deeds.list||[]).map(dd=>`<div class="card ${dd.done?'sel':''}"><b>${dd.done?'✅':'📜'} ${deedText(dd)}</b><div class="small">${fmt(Math.min(dd.prog,dd.n))}/${fmt(dd.n)} · reward +${30+5*Math.min(7,s.daily.streak||1)} general AP & gold</div>${bar(dd.prog/dd.n,'xpfill')}</div>`).join('');
    title='📅 Daily & balances';
    body=`<p class="small">Every action earns <b>Action Points</b>: kills fill your <b>class</b> pool, profession actions fill that <b>profession's</b> pool, and everything trickles into the <b>general</b> pool. Masteries are <b>permanent</b> (they survive Ascension) and each rank costs more. AP bonus <b>+${fmt(d.apPct||0)}%</b>${d.profApPct?` · profession AP +${fmt(d.profApPct)}%`:''} · offline efficiency <b>${Math.round(offlineRate()*100)}%</b>.</p>
    <div class="grid" style="--min:230px"><div class="card"><h3 style="margin-top:0">📅 Daily</h3><div class="small">Streak <b>${s.daily.streak||0}</b> 🔥 · first <b>${dc}</b> actions each day earn <b>double AP</b>: ${fmt(Math.min(dc,s.daily.count||0))}/${dc} used</div>${bar(Math.min(1,(s.daily.count||0)/dc),'kfill')}<div class="small muted">New day = +${10*Math.min(7,(s.daily.streak||0)+1)} general AP (max 70) and 3 new deeds.</div></div>
    <div class="card"><h3 style="margin-top:0">🎖️ Balances</h3><div class="small">General: <b>${fmt(Math.floor(s.ap.gen))}</b><br>${cd.i} ${cd.n}: <b>${fmt(Math.floor(s.ap.cls[s.cls]||0))}</b><br>${D.PROF_ORDER.filter(q=>(s.ap.prof[q]||0)>=1).map(q=>`${D.PROFS[q].i} ${fmt(Math.floor(s.ap.prof[q]))}`).join(' · ')||'<span class="muted">No profession AP yet</span>'}<br><span class="muted">Lifetime earned ${fmt(Math.floor(s.stats.apEarned||0))} · spent ${fmt(s.stats.apSpent||0)}</span></div></div></div>
    <h3>📜 Today's deeds</h3><div class="grid" style="--min:220px">${deeds||'<span class="muted">Deeds arrive at the start of each day.</span>'}</div>`}
  else if(k==='gen'){title=`🌐 General · ${fmt(Math.floor(s.ap.gen))} AP`;body=`<div class="grid" style="--min:230px">${D.AP_GEN.map(n=>mNode('gen',null,n,s.mastery.gen,s.ap.gen)).join('')}</div>`}
  else if(k==='cls'){const sig=Object.assign({id:'sig',i:cd.i,base:15,mult:1.25,max:20},cd.apNode);title=`${cd.i} ${cd.n} · ${fmt(Math.floor(s.ap.cls[s.cls]||0))} AP`;
    body=`<p class="small muted">Class mastery is per class. Switch class to train another tree.</p><div class="grid" style="--min:230px">${mNode('cls',s.cls,sig,s.mastery.cls[s.cls],s.ap.cls[s.cls]||0)}${D.AP_CLASS.map(n=>mNode('cls',s.cls,n,s.mastery.cls[s.cls],s.ap.cls[s.cls]||0)).join('')}</div>`}
  else{const q=k.slice(2);title=`${D.PROFS[q].i} ${D.PROFS[q].n} · ${fmt(Math.floor(s.ap.prof[q]||0))} AP`;
    body=`<div class="row small" style="margin-bottom:6px">Level ${s.profs[q].lvl} ${btn('goProf','Open profession →',{data:{p:q},cls:'sm'})}</div><div class="grid" style="--min:230px">${D.AP_PROF.map(n=>mNode('prof',q,n,s.mastery.prof[q],s.ap.prof[q]||0)).join('')}</div>`}
  return `<h2>🎖️ Mastery</h2>${pager('mastery',title,body)}`};
P.inv=()=>{const s=S();const items=s.inv.slice().sort((a,b)=>UI.invSort==='r'?(b.r-a.r||b.il-a.il):UI.invSort==='il'?(b.il-a.il):D.SLOTS.indexOf(a.slot)-D.SLOTS.indexOf(b.slot));
  const tiles=items.map(it=>`<div class="item ${isUpgradeCached(it)?'up':''}" style="--rc:${D.RARITIES[it.r].color}" data-a="item" data-id="${it.id}"><div class="ii">${itemIcon(it)}</div><div class="small r${it.r}" style="font-size:10px">${D.RARITIES[it.r].name}</div><div class="il">${D.SLOT_NAME[it.slot]} · il ${it.il}</div>${it.ench?`<span class="en">+${it.ench}</span>`:''}${s.locked[it.id]?'<span class="lk">🔒</span>':''}</div>`).join('');
  const mats=Object.keys(D.MATS).filter(k=>(s.mats[k]||0)>0).map(k=>`<span class="pill">${D.MATS[k].i} ${D.MATS[k].n} <b>${fmt(s.mats[k])}</b></span>`).join(' ');
  return `<h2>🎒 Inventory <span class="muted">${s.inv.length}/${invCap()}</span></h2>
  <div class="row">Sort: ${btn('sort','Rarity',{data:{k:'r'},cls:'sm'+(UI.invSort==='r'?' on':'')})}${btn('sort','Item level',{data:{k:'il'},cls:'sm'+(UI.invSort==='il'?' on':'')})}${btn('sort','Slot',{data:{k:'slot'},cls:'sm'+(UI.invSort==='slot'?' on':'')})}<span class="sp"></span>${btn('equipBest','🎽 Equip best',{cls:'sm green'})}</div>
  <div class="row" style="margin-top:6px">${[0,1,2,3].map(r=>btn('bulk',`Sell ≤ <span class="r${r}">${D.RARITIES[r].name}</span>`,{data:{r,m:'sell'},cls:'sm'})).join('')}</div>
  <div class="row" style="margin-top:6px">${[0,1,2,3].map(r=>btn('bulk',`Salvage ≤ <span class="r${r}">${D.RARITIES[r].name}</span>`,{data:{r,m:'salvage'},cls:'sm'})).join('')}</div>
  <div class="grid" style="--min:92px;margin-top:10px">${tiles||'<span class="muted">Empty. Monsters drop gear; Smithing forges it.</span>'}</div>
  <h3>Materials</h3><div class="row">${mats||'<span class="muted">None yet.</span>'}</div><p class="muted">▲ = upgrade over what you wear. Locked items are never auto-sold.</p>`;};
const upCache=new Map();function isUpgradeCached(it){const k=it.id+':'+G.S.cls+':'+(G.S.equip[it.slot]?G.S.equip[it.slot].id+'.'+G.S.equip[it.slot].ench:'');if(!upCache.has(k)){if(upCache.size>2000)upCache.clear();upCache.set(k,isUpgrade(it))}return upCache.get(k)}
function itemModal(id,eq){const s=S();let it=eq?Object.values(s.equip).find(x=>x&&x.id==id):s.inv.find(x=>x.id==id);if(!it)return closeModal();UI.selItem=it.id;
  const b=itemBase(it);const cur=s.equip[it.slot];const em=1+.1*(it.ench||0);
  let cmp='';if(!eq){const now=G.d.power,nw=powerWith(it.slot,it),base=powerWith(it.slot,cur||null);const pct=(nw/base-1)*100;cmp=`<div class="small" style="margin:6px 0">Power if equipped: <b class="${pct>=0?'r1':'r5'}">${pct>=0?'+':''}${pct.toFixed(1)}%</b>${cur?` vs <span class="r${cur.r}">${esc(cur.n)}</span>`:''}</div>`;void now}
  modal(`<div class="hd row"><span style="font-size:40px">${itemIcon(it)}</span><div><b class="r${it.r}" style="font-size:16px">${esc(it.n)}${it.ench?' +'+it.ench:''}</b><div class="muted">${D.RARITIES[it.r].name} ${D.SLOT_NAME[it.slot]} · item level ${it.il}</div></div></div>
   <div style="margin-top:8px">${b.weapon?`<div>⚔️ ${fmt(b.weapon)} weapon damage</div>`:''}${b.armor?`<div>🛡️ ${fmt(b.armor)} armor</div>`:''}${b.hpFlat?`<div>❤️ ${fmt(b.hpFlat)} max HP</div>`:''}
   ${it.aff.map(a=>`<div class="r1">${affLine(a,em)}</div>`).join('')}${(it.pw||[]).map(p=>{const L=D.LEGENDARY.find(x=>x.id===p);return `<div class="r4">★ ${L.n}: ${L.d}</div>`}).join('')}</div>${cmp}
   <div class="row" style="margin-top:10px">${eq?'':btn('equip','Equip',{data:{id:it.id},cls:'green'})}${eq?'':btn('lock',s.locked[it.id]?'🔓 Unlock':'🔒 Lock',{data:{id:it.id}})}${eq?'':btn('sell',`Sell 🪙${fmt(itemValue(it))}`,{data:{id:it.id}})}${eq?'':btn('salvage',`Salvage ✨${fmt(itemDust(it))}`,{data:{id:it.id}})}<span class="sp"></span>${btn('close','Close')}</div>`)}
P.town=()=>{const s=S();
  const g=D.GUILD.map(x=>{const l=s.guild[x.id]||0,c=townCost(upgradeCost(x.base,x.mult,l));return `<div class="card"><div class="hd"><span class="ic">${x.i}</span><div class="sp"><b>${x.n}</b> <span class="pill">Lv ${l}</span><div class="small">${x.d(l)} → <span class="r1">${x.d(l+1)}</span></div></div></div>${btn('guild',costTxt(c),{data:{id:x.id},cls:'gold sm',dis:s.gold<c})}</div>`}).join('');
  const q=D.QOL.map(x=>s.qol[x.id]?`<div class="card" style="opacity:.6"><b>${x.i} ${x.n}</b> ✅<div class="small">${x.d}</div></div>`:`<div class="card"><b>${x.i} ${x.n}</b><div class="small">${x.d}</div>${btn('qol',costTxt(townCost(x.cost)),{data:{id:x.id},cls:'gold sm',dis:s.gold<townCost(x.cost)})}</div>`).join('');
  const sc=townCost(upgradeCost(D.SATCHEL.base,D.SATCHEL.mult,s.satchel)),pc=townCost(upgradeCost(D.PLOTS.base,D.PLOTS.mult,s.plotsBought));const pmu=priceMult();
  return `<h2>🏰 Town of Emberhold</h2>${pmu<1?`<p class="small">📜 Court favor: all Town prices <b class="r1">−${Math.round((1-pmu)*100)}%</b> (Advising reputation).</p>`:''}<h3>Quality of Life</h3><div class="grid">${q}</div>
  <h3>Guild Halls (repeatable)</h3><div class="grid">${g}</div>
  <h3>Outfitters</h3><div class="grid"><div class="card"><b>🎒 Bigger Satchel</b><div class="small">Inventory ${invCap()} → ${invCap()+10}</div>${s.satchel<D.SATCHEL.max?btn('satchel',costTxt(sc),{cls:'gold sm',dis:s.gold<sc}):'<span class="pill">Max</span>'}</div>
  <div class="card"><b>🌱 Garden Plot</b><div class="small">Herb plots ${plotsCount()} → ${plotsCount()+1}</div>${s.plotsBought<D.PLOTS.max?btn('plot',costTxt(pc),{cls:'gold sm',dis:s.gold<pc}):'<span class="pill">Max</span>'}</div></div>`;};
P.codex=()=>{const s=S();const found=Object.keys(s.relics).length;
  return `<h2>🏺 Relic Codex <span class="muted">${found}/${D.RELICS.length}</span></h2>
  <p class="small">Relics are ultra-rare, <b>account-wide and permanent</b> — they survive Ascension. Every relic, its effect, where it drops and its exact odds are listed so you know what you're hunting. Magic Find does not affect relics; <b>Relic Sense</b> (Ascension and Mastery), <b>Lucky Find</b> (profession Mastery) and some relics do. Profession relics roll on <b>every action</b> of that profession — success or failure.</p>
  <p class="small">💥 <b>Damage cap:</b> every single hit is capped at <b>${fmt(D.BASE_DMG_CAP)}</b>. Late zones and the Endless Rift demand more — break it with <b>Limit Breaker</b> (Ascension), the <b>Shard of the Limitless</b> (×100) or the <b>Crown of the Unbound</b> (no cap). Current cap: <b>${G.d.cap===Infinity?'∞':fmt(G.d.cap)}</b>.</p>
  <div class="grid" style="--min:250px">${D.RELICS.map(r=>{const f=s.relics[r.id],o=relicOdds(r),src=r.src.prof?`${D.PROFS[r.src.prof].i} Any ${D.PROFS[r.src.prof].n} action`:`${D.ZONES[r.src.zone].i} ${D.ZONES[r.src.zone].n} — ${r.src.boss?'boss kill':r.src.elite?'elite or boss kill':'any kill'}`;
   return `<div class="card relicCard ${f?'found':''}"><div class="hd"><span class="ic">${r.i}</span><div><b class="${f?'relic':''}">${r.n}</b><div class="small">${f?'✅ Found '+new Date(f.t).toLocaleDateString()+` after ${fmt(f.tries)} tries`:'Not yet found'}</div></div></div>
   <div class="small" style="margin-top:6px"><b>${r.d}</b></div><div class="small" style="margin-top:4px">📍 ${src}</div>
   <div class="small">🎲 <span class="odds">1 in ${o.toLocaleString()}</span> (${(100/o).toPrecision(2)}%) per ${r.src.prof?'action':'kill'} · your rolls: ${fmt(s.relicTries[r.id]||0)}</div></div>`}).join('')}</div>`;};
P.ascend=()=>{const s=S(),g=shardPreview(),can=canAscend();
  const a=D.ASTRAL.map(x=>{const l=s.astral[x.id]||0,c=upgradeCost(x.base,x.mult,l),mx=l>=x.max;return `<div class="card"><div class="hd"><span class="ic">${x.i}</span><div class="sp"><b>${x.n}</b> <span class="pill">${l}/${x.max}</span><div class="small">${l?x.d(l):'—'}${mx?'':` → <span class="r1">${x.d(l+1)}</span>`}</div></div></div>${mx?'<span class="pill">Max</span>':btn('astral',`🌟 ${fmt(c)}`,{data:{id:x.id},cls:'gold sm',dis:s.shards<c})}</div>`}).join('');
  return `<h2>🌟 Ascension</h2><div class="card"><div class="row"><div><div class="big">🌟 ${fmt(s.shards)}</div><div class="muted">Astral Shards · Ascensions: ${s.ascensions}</div></div><span class="sp"></span><div style="text-align:right"><div>Ascend now for <b class="r4">+${fmt(g)}</b> shards</div>${btn('ascend','🌟 Ascend',{cls:'gold',dis:!can})}</div></div>
  <p class="small">${can?'':'🔒 Defeat The Hollow Priest (Sunken Crypt) to unlock. '}Shards scale with the highest monster level you have conquered and your total class levels.<br><b>Resets:</b> class levels & skills, gear, inventory, gold, materials, consumables, zones, guild halls, tools, professions (see Guild Memory).<br><b>Keeps:</b> shards & astral upgrades, relics, Town QoL unlocks, unlocked classes, satchel & plots, achievements, settings.</p></div>
  <h3>Astral Constellation</h3><div class="grid">${a}</div>`;};
P.ach=()=>{const s=S();const n=Object.keys(s.ach).length;return `<h2>🏆 Feats <span class="muted">${n}/${D.ACH.length}</span></h2><p class="muted">Each feat permanently grants +1% damage and +1% gold.</p><div class="grid" style="--min:200px">${D.ACH.map(a=>`<div class="card ${s.ach[a.id]?'sel':'locked'}"><b>${s.ach[a.id]?'🏆':'🔒'} ${a.n}</b><div class="small">${a.d}</div></div>`).join('')}</div>`};
P.log=()=>{const s=S();const cats=['all','loot','level','boss','prof','relic','ach','death'];const L=s.log.filter(l=>UI.logFilter==='all'||l.c===UI.logFilter);
  return `<h2>📜 Chronicle</h2><div class="row">${cats.map(c=>btn('logf',c,{data:{c},cls:'sm'+(UI.logFilter===c?' on':'')})).join('')}</div><div style="margin-top:8px">${L.map(l=>`<div class="logl ${l.c}"><time>${new Date(l.t).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}</time>${l.m}</div>`).join('')||'<span class="muted">Nothing yet.</span>'}</div>`};
P.settings=()=>{const s=S(),st=s.settings;
  const filt=s.qol.filter?`<h3>🧾 Loot Filter</h3><table>${D.RARITIES.map((r,i)=>`<tr><td class="r${i}">${r.name}</td><td>${['keep','sell','salvage'].map(a=>btn('filter',a,{data:{r:i,v:a},cls:'sm'+(st.filter[i]===a?' on':'')})).join(' ')}</td></tr>`).join('')}</table>`:`<p class="muted">Buy the Loot Filter in Town for per-rarity Keep/Sell/Salvage rules.</p>`;
  return `<h2>⚙️ Settings</h2>
  <p class="small muted">The world runs in real time. Speed comes only from permanent upgrades (Mastery, relics, Haste) — there is no fast-forward.</p>
  <h3>Combat</h3><div class="small">Auto-potion below <b>${st.quaffAt}%</b> HP ${s.qol.autoQuaff?'':'(needs Potion Belt)'}</div><input type="range" min="10" max="90" step="5" value="${st.quaffAt}" data-in="quaffAt">
  <div class="row">${s.qol.autoEquip?toggle('autoEquip','🎽 Auto-equip'):''}${s.qol.autoEat?toggle('autoEat','🍽️ Auto-eat'):''}${s.qol.autoElixir?toggle('autoElixir','🧴 Auto-elixir'):''}${s.qol.autoBoss?toggle('autoBoss','🔔 Auto-boss'):''}${s.qol.autoAdvance?toggle('autoAdvance','🗺️ Auto-advance'):''}</div>
  ${filt}
  <h3>Visuals</h3><div class="row">${toggle('particles','✨ Particles')}${toggle('numbers','🔢 Damage numbers')}${toggle('shake','📳 Screen shake')}</div>
  <h3>Save</h3><p class="muted">Autosaves every 10s to this browser. Offline progress: ${Math.round(offlineRate()*100)}% of online rate, capped at ${fmtTime(offlineCap())}.</p>
  <div class="row">${btn('saveNow','💾 Save now')}${btn('export','📤 Export')}${btn('import','📥 Import')}${btn('rename','✏️ Rename hero')}<span class="sp"></span>${btn('hardReset','🗑️ Hard reset',{cls:'red'})}</div>
  <p class="muted" style="margin-top:14px">Realms of Ember · original fantasy setting · made for Noah.</p>`};

function renderTabs(){const s=S();const pts=s.classes[s.cls].pts>0;const tb=$('#tabs');const before=tb._h;const setT=(el,h)=>{if(el._h!==h){el._h=h;el.innerHTML=h}};setT(tb,TABS.map(([k,l])=>{const [ic,...rest]=l.split(' ');return `<button data-a="tab" data-t="${k}" class="${UI.tab===k?'on':''}"><span class="ti">${ic}</span><span class="tl">${rest.join(' ')||'Settings'}</span>${k==='skills'&&pts?'<span class="dot"></span>':''}</button>`}).join(''));
  if(tb._h!==before){centerIn(tb,tb.querySelector('button.on'))}}
function centerIn(box,el){if(!box||!el)return;const br=box.getBoundingClientRect(),er=el.getBoundingClientRect();box.scrollLeft+=(er.left-br.left)-(box.clientWidth-er.width)/2}
function goTab(t,dir){const i0=TABS.findIndex(x=>x[0]===UI.tab),i1=TABS.findIndex(x=>x[0]===t);UI.mainSlide=dir||(i1>=i0?'slideL':'slideR');UI.slide=null;UI.tab=t;const pn=$('#panel');pn.scrollTop=0;renderPanel(true);
  pn.classList.remove('slideL','slideR');void pn.offsetWidth;pn.classList.add(UI.mainSlide);
  if(window.innerWidth<=900){const r=$('#right');const y=r.getBoundingClientRect().top+window.scrollY-$('#top').offsetHeight-4;if(window.scrollY>y||r.getBoundingClientRect().top>window.innerHeight*.6)window.scrollTo({top:Math.max(0,y),behavior:'smooth'})}}
function stepTab(d){const i=TABS.findIndex(x=>x[0]===UI.tab);const n=TABS[(i+d+TABS.length)%TABS.length][0];goTab(n,d>0?'slideL':'slideR')}
function renderPanel(force){const pn=$('#panel');if(!force&&(UI.busyInput||pn.contains(document.activeElement)&&/INPUT|SELECT/.test(document.activeElement.tagName)))return;
  const st=pn.scrollTop;if(force)pn._h=null;const h=P[UI.tab]();if(force||(!UI.ptrDown&&pn._h!==h)){pn._h=h;pn.innerHTML=h}pn.scrollTop=st;UI.lastPanel=performance.now();if(force){const cc=pn.querySelector('.pgchips');if(cc)centerIn(cc,cc.querySelector('.pgc.on'))}if(UI.slide&&force){UI.slide=null;centerIn(pn.querySelector('.pgchips'),pn.querySelector('.pgc.on'))}renderTabs()}

/* ---------------- actions ---------------- */
const A={
  tab:e=>goTab(e.t),
  pickStart:e=>{const s=S();s.name=($('#heroName').value||'Hero').slice(0,18);s.cls=e.c;s.started=true;giveStarter();recalc();newHero();closeModal();log(`⚔️ ${esc(s.name)} the ${D.CLASSES[e.c].n} sets out from Emberhold.`,'level');save();renderPanel(true)},
  zone:e=>{const s=S();setZone(+e.i);if(!s.slots[0].act||s.slots[0].act.type!=='combat')assign(0,{type:'combat'})},
  boss:()=>{S().bossReq=true;S().bossRetry=0},
  goFight:()=>assign(0,{type:'combat'}),
  assignMenu:e=>assignMenu(+e.si),
  assign:e=>{const si=+e.si;if(e.k==='combat')assign(si,{type:'combat'});else if(e.k==='idle')assign(si,null);else{if(si===0||true)assign(si,{type:'prof',p:e.k})}closeModal()},
  profSel:e=>{UI.profSel=e.p},
  setNode:e=>{const ms=S().ps.mining;if(ms.node!==e.id){ms.node=e.id;ms.streak=0}},
  setSeed:e=>{S().ps.herbalism.seed=e.id},setTier:e=>{S().ps.smithing.tier=e.id},setSmithSlot:e=>{S().ps.smithing.slot=e.sl},
  setAlch:e=>{S().ps.alchemy.recipe=e.id},setCook:e=>{S().ps.cooking.recipe=e.id},setEnch:e=>{S().ps.enchanting.slot=e.sl},
  toggleWard:()=>{const es=S().ps.enchanting;es.ward=!es.ward},
  tool:e=>buyTool(e.p),
  setSum:e=>{S().ps.summoning.target=e.id},setDance:e=>{const ds=S().ps.dancing;if(ds.target!==e.id){ds.target=e.id;ds.combo=0}},setDeity:e=>{S().ps.praying.target=e.id;G.dirty=true},
  setPet:e=>{S().ps.advising.target=e.id},setSong:e=>{S().ps.bard.target=e.id},setAnthem:e=>{S().ps.bard.anthem=e.id;G.dirty=true},setFish:e=>{S().ps.fishing.target=e.id},
  releaseSum:e=>{const s=S();if(confirm('Release this creature?')){s.summons=s.summons.filter(x=>x.uid!=e.uid);G.dirty=true}},
  buyM:e=>{if(!buyMastery(e.tree,e.key||null,e.id))toast('Not enough AP')},
  mProf:e=>{UI.mPage='p:'+e.p},goMastery:e=>{UI.mPage='p:'+e.p;goTab('mastery')},goProf:e=>{UI.profSel=e.p;goTab('profs')},
  pg:e=>pagerStep(e.pg,+e.d),pgTo:e=>{const P2=PAGERS[e.pg],ks=P2.keys();UI.slide=ks.indexOf(e.k)>=ks.indexOf(P2.get())?'slideL':'slideR';P2.set(e.k)},
  sceneToggle:()=>{const st=S().settings;st.sceneOpen=!st.sceneOpen;layoutScene()},
  skillUp:e=>spendPoint(e.id),
  toggleSkill:e=>{const cl=S().classes[S().cls];cl.off[e.id]=!cl.off[e.id]},
  respec:()=>{if(confirm('Refund all skill points for this class?'))respec()},
  sub:e=>{const cl=S().classes[S().cls];if(!cl.sub&&cl.lvl>=D.SUB_LEVEL){cl.sub=e.id;G.dirty=true;checkAch()}},
  switchCls:e=>{switchClass(e.c);UI.enemyEls.forEach(el=>el.remove());UI.enemyEls.clear()},
  cls2:e=>{const s=S();s.cls2=s.cls2===e.c?null:e.c;G.dirty=true;checkAch()},
  item:e=>itemModal(e.id,e.eq==='1'),
  equip:e=>{const it=S().inv.find(x=>x.id==e.id);if(it)equipItem(it);closeModal()},
  sell:e=>{const it=S().inv.find(x=>x.id==e.id);if(it)sellItem(it);closeModal()},
  salvage:e=>{const it=S().inv.find(x=>x.id==e.id);if(it)salvageItem(it);closeModal()},
  lock:e=>{const s=S();if(s.locked[e.id])delete s.locked[e.id];else s.locked[e.id]=1;itemModal(e.id,false)},
  close:()=>closeModal(),showOff:()=>{const r=UI.pendingOff;UI.pendingOff=null;if(r)showOffline(r);else closeModal()},
  sort:e=>{UI.invSort=e.k},
  bulk:e=>{const s=S();let n=0,g=0;for(const it of s.inv.slice())if(it.r<=+e.r&&!s.locked[it.id]){g+=e.m==='sell'?sellItem(it):salvageItem(it);n++}toast(`${e.m==='sell'?'Sold':'Salvaged'} ${n} items for ${e.m==='sell'?'🪙':'✨'}${fmt(g)}`)},
  equipBest:()=>{const s=S();let n=0;for(const sl of D.SLOTS){let best=null;for(const it of s.inv)if(it.slot===sl&&isUpgrade(it)&&(!best||powerWith(sl,it)>powerWith(sl,best)))best=it;if(best){equipItem(best);n++}}toast(n?`Equipped ${n} upgrade${n>1?'s':''}`:'Already wearing your best gear')},
  qol:e=>buyQol(e.id),guild:e=>buyGuild(e.id),satchel:()=>buySatchel(),plot:()=>buyPlot(),astral:e=>buyAstral(e.id),
  ascend:()=>{if(!canAscend())return;const g=shardPreview();if(confirm(`Ascend now for ${fmt(g)} Astral Shards? Your run resets (relics, QoL and astral upgrades are kept).`)){ascend();UI.enemyEls.forEach(el=>el.remove());UI.enemyEls.clear();curBg=null;banner('🌟 ASCENDED');save()}},
  drink:e=>drinkElixir(e.id),eat:e=>eatMeal(e.id,e.p==='1'),
  logf:e=>{UI.logFilter=e.c},
  toggleSet:e=>{const st=S().settings;st[e.k]=!st[e.k]},
  filter:e=>{S().settings.filter[+e.r]=e.v},
  saveNow:()=>{save();toast('💾 Saved')},
  export:()=>{const code=exportSave();modal(`<h2>📤 Export save</h2><textarea rows="6" readonly onclick="this.select()">${code}</textarea><div class="row" style="margin-top:8px">${btn('copySave','📋 Copy')}<span class="sp"></span>${btn('close','Close')}</div>`)},
  copySave:()=>{const t=document.querySelector('#modal textarea');t.select();(navigator.clipboard?navigator.clipboard.writeText(t.value):Promise.reject()).then(()=>toast('Copied'),()=>{document.execCommand('copy');toast('Copied')})},
  import:()=>modal(`<h2>📥 Import save</h2><textarea rows="6" id="impTxt" placeholder="Paste save code"></textarea><div class="row" style="margin-top:8px">${btn('doImport','Import',{cls:'gold'})}<span class="sp"></span>${btn('close','Cancel')}</div>`),
  doImport:()=>{try{importSave($('#impTxt').value);closeModal();UI.enemyEls.forEach(el=>el.remove());UI.enemyEls.clear();curBg=null;toast('Save imported')}catch(err){toast('❌ Invalid save code')}},
  rename:()=>{const n=prompt('Hero name',S().name);if(n)S().name=n.slice(0,18)},
  hardReset:()=>{if(confirm('Erase ALL progress, including relics and ascension? This cannot be undone.')&&confirm('Really erase everything?')){localStorage.removeItem(SAVE_KEY);G.S=newState();syncSlots();G.h=null;G.cb=null;recalc();showIntro();renderPanel(true)}},
};
document.addEventListener('click',ev=>{const el=ev.target.closest('[data-a]');if(!el)return;if(el.classList.contains('dis'))return;const f=A[el.dataset.a];if(f){f(el.dataset);renderTop();renderSlots();if(!$('#modal').contains(el)||el.dataset.a!=='lock')renderPanel(true)}});
document.addEventListener('input',ev=>{const k=ev.target.dataset&&ev.target.dataset.in;if(!k)return;const v=+ev.target.value;if(k==='smithTarget')S().ps.smithing.target=v;if(k==='quaffAt')S().settings.quaffAt=v;UI.busyInput=true});
document.addEventListener('change',ev=>{if(ev.target.dataset&&ev.target.dataset.sel==='sumRole'){const su=S().summons.find(x=>x.uid==ev.target.dataset.uid);if(su){su.role=ev.target.value;G.dirty=true}renderPanel(true);return}if(ev.target.dataset&&ev.target.dataset.in){UI.busyInput=false;renderPanel(true)}});
document.addEventListener('pointerup',()=>{if(UI.busyInput)setTimeout(()=>{UI.busyInput=false},50)});
$('#modal').addEventListener('click',ev=>{if(ev.target.id==='modal'&&S().started)closeModal()});

/* ---------------- loop ---------------- */
let lastT=performance.now(),acc=0,lastSave=Date.now(),lastAch=0,lastStrip=0;
function frame(now){
  let dt=(now-lastT)/1000;lastT=now;
  if(S().started){
    if(dt>5){const r=catchUp(dt);if(r)showOffline(r);dt=0;UI.xpS={}}
    let sim=Math.min(dt,1)*gameSpeed();while(sim>0){const st=Math.min(.05,sim);tick(st);sim-=st}
    if(now-lastAch>2000){lastAch=now;checkAch();checkClassUnlocks()}
    renderStage();processEvents();drawFx(Math.min(dt,.05));
    if(now-lastStrip>250){lastStrip=now;renderTop();renderSlots();renderHud()}
    if(now-(UI.lastXs||0)>1000){UI.lastXs=now;sampleXp()}
    if(now-UI.lastPanel>1000)renderPanel(false);
    if(Date.now()-lastSave>10000){lastSave=Date.now();save()}
  }
  requestAnimationFrame(frame);
}
function catchUp(sec){const before=snapshot();const rate=sec>60?offlineRate():1;simulate(Math.min(sec,offlineCap())*rate,sec>600?1:.25);return sec>60?{el:sec,before,after:snapshot(),rate}:null}
function showOffline(r){const b=r.before,a=r.after;const lines=[];
  lines.push(`🪙 Gold: <b>+${fmt(Math.max(0,a.gold-b.gold))}</b>`);lines.push(`⚔️ Monsters slain: <b>${fmt(a.kills-b.kills)}</b>`);if(a.lv>b.lv)lines.push(`⬆️ Class level ${b.lv} → <b>${a.lv}</b>`);
  D.PROF_ORDER.forEach((p,i)=>{if(a.profs[i]>b.profs[i])lines.push(`${D.PROFS[p].i} ${D.PROFS[p].n} ${b.profs[i]} → <b>${a.profs[i]}</b>`)});
  const items=a.found.map((n,i)=>n-b.found[i]);if(items.some(x=>x))lines.push(`🎒 Items found: ${items.map((n,i)=>n?`<span class="r${i}">${n} ${D.RARITIES[i].name}</span>`:'').filter(Boolean).join(', ')}`);
  const mats=Object.keys(a.mats).filter(k=>(a.mats[k]||0)>(b.mats[k]||0)&&D.MATS[k]).map(k=>`${D.MATS[k].i}+${fmt(a.mats[k]-(b.mats[k]||0))}`);if(mats.length)lines.push(`📦 ${mats.join(' ')}`);
  if(a.ap>b.ap)lines.push(`🎖️ +${fmt(Math.floor(a.ap-b.ap))} Action Points earned`);
  if(a.relics>b.relics)lines.push(`<b class="relic">🏺 You discovered a RELIC while away!</b>`);
  modal(`<h2>🌙 While you were away (${fmtTime(Math.min(r.el,offlineCap()))}${r.el>offlineCap()?' — capped':''})</h2><p class="small muted">Offline you progress at <b>${Math.round((r.rate||offlineRate())*100)}%</b> of your online rate (raise it with 🌙 Night Watch in Mastery). Offline cap: ${fmtTime(offlineCap())}.</p>${lines.map(l=>`<div style="margin:4px 0">${l}</div>`).join('')}<div class="row" style="margin-top:10px"><span class="sp"></span>${btn('close','Onward!',{cls:'gold'})}</div>`)}

function showMigration(m,off){const rs=(m.rescaled||[]).map(x=>`${x.i} ${x.n} ${x.from} → <b>${x.to}</b>`).join(' · ');
  modal(`<h2>🔥 Realms of Ember has been reforged (v2)</h2>
  <p class="small">Your gear, gold, relics, unlocked classes, Town upgrades and ascension progress are safe. What changed:</p>
  <ul class="small"><li><b>A real grind now.</b> No game-speed multiplier. Every level takes at least 10 minutes from level 1, and much longer later.</li>
  <li><b>Offline is slow.</b> Away time earns only ${Math.round(offlineRate()*100)}% of your online rate (raise it with 🌙 Night Watch), capped at ${fmtTime(offlineCap())}.</li>
  <li><b>Action Points & Mastery.</b> Every kill and profession action earns AP for permanent upgrades (new 🎖️ Mastery tab). Daily double-AP actions, streaks and deeds.</li>
  <li><b>Six new professions:</b> 🔯 Summoning, 💃 Dancing, 🙏 Praying, 📜 Advising, 🎻 Bard, 🎣 Fishing, plus 12 profession relics.</li>
  <li><b>Three new classes:</b> 🤴 General (commands troops), 👷 Worker (profession specialist, available now), 🕵️ Collector (loot and relic hunter, fragile).</li>
  <li>Professions can now <b>fail</b> and attacks can <b>miss</b>. Levels and Mastery improve the odds.</li></ul>
  <p class="small"><b>⚖️ Levels rescaled.</b> Your levels were earned on the old, much faster curve, so they were converted to the new curve by equivalent play time: ${rs||'no changes needed'}. Skill points were refunded to match your new class levels.</p>
  <p class="small"><b>Converted for you:</b> old speed runes became 🐕 Hunting Hounds and 📒 Steward's Ledger, and the old astral speed upgrade became 🌀 Astral Haste. <b>Head-start AP</b> for your past play: 🎖️ ${fmt(m.gen)} general, ${fmt(m.cl)} class, ${fmt(m.pr)} profession AP.</p>
  <div class="row"><span class="sp"></span>${btn(off?'showOff':'close','Onward!',{cls:'gold'})}</div>`);UI.pendingOff=off}
/* ---------------- boot ---------------- */
function boot(){
  let loaded=false;try{const raw=localStorage.getItem(SAVE_KEY);if(raw){loadFrom(raw);loaded=true}}catch(e){console.warn('Save load failed',e)}
  if(!loaded){G.S=newState();syncSlots();recalc()}
  if(!G.h)newHero();
  fxResize();window.addEventListener('resize',fxResize);
  renderTabs();renderPanel(true);renderTop();
  if(!S().started)showIntro();
  else{const el=(Date.now()-S().last)/1000;let r=null;if(el>60)r=catchUp(el);
    if(G.migration){const m=G.migration;G.migration=null;save();showMigration(m,r)}else if(r)showOffline(r)}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)save();else lastT=performance.now()-(Date.now()-S().last)})
  window.addEventListener('pagehide',save);
  requestAnimationFrame(t=>{lastT=t;frame(t)});
}
boot();
