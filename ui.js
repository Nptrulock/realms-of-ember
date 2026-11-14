'use strict';
/* Realms of Ember — UI */
const $=s=>document.querySelector(s);
const UI={tab:'adventure',profSel:'mining',invSort:'r',lastPanel:0,enemyEls:new Map(),parts:[],busyInput:false,logFilter:'all',selItem:null};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const TABS=[['adventure','⚔️ Adventure'],['hero','🧝 Hero'],['skills','✨ Skills'],['classes','🎭 Classes'],['profs','⚒️ Professions'],['inv','🎒 Inventory'],['town','🏰 Town'],['codex','🏺 Relics'],['ascend','🌟 Ascend'],['ach','🏆 Feats'],['log','📜 Log'],['settings','⚙️']];
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
function renderTop(){const s=S();const sp=gameSpeed();
  $('#res').innerHTML=`<span class="chip">🪙 ${fmt(s.gold)}</span>${s.shards||s.ascensions?`<span class="chip">🌟 ${fmt(s.shards)}</span>`:''}<span class="chip">✨ ${fmt(s.mats.dust||0)}</span><span class="chip">⚡ ${fmt(G.d.power)}</span>`;
  $('#speedBtn').textContent=(Math.round(sp*100)/100)+'×';}

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
  const ae=$('#allies');const key=al.map(a=>a[0]).join();if(ae.dataset.k!==key){ae.dataset.k=key;ae.innerHTML=al.map(a=>`<div class="ally" id="ally-${a[0]}" style="left:${a[2]}%;top:${a[3]}%">${a[1]}</div>`).join('')}
  // enemies
  const en=inCombat&&G.cb?G.cb.enemies:[];const side=$('#enemySide');const seen=new Set();
  en.forEach((e,i)=>{seen.add(e.uid);let el=UI.enemyEls.get(e.uid);
    if(!el){el=document.createElement('div');el.className='unit enemy'+(e.elite?' elite':'')+(e.boss?' boss':'');const [x,y]=enemyPos(i,en.length,e.boss);el.style.left=x+'%';el.style.top=y+'%';
      el.innerHTML=`<div class="warnIcon">⚠️</div><div class="dots"></div><div class="spr">${e.def.i}</div><div class="nm">${e.elite?'★ ':''}${esc(e.def.n)} <span class="muted">L${e.lvl}</span></div><div class="hpb"><i></i></div>`;side.appendChild(el);UI.enemyEls.set(e.uid,el)}
    if(e.hp>0){el.querySelector('.hpb i').style.width=Math.max(0,e.hp/e.maxHp*100)+'%';el.classList.toggle('warn',!!e.warn);el.querySelector('.dots').textContent=e.dots.map(x=>x.icon).join('')+(e.mark?'🔻':'')+(e.slowT>0?'❄️':'')}
    else if(!el.classList.contains('dying')){el.classList.add('dying');el.querySelector('.hpb i').style.width='0%';setTimeout(()=>{el.remove()},600)}
  });
  for(const [uid,el] of UI.enemyEls){if(!seen.has(uid)){if(!el.classList.contains('dying')){el.classList.add('dying');setTimeout(()=>el.remove(),600)}UI.enemyEls.delete(uid)}}
  renderBars();
}
function renderBars(){
  const s=S(),cd=D.CLASSES[s.cls],h=G.h,d=G.d,cl=s.classes[s.cls];if(!h)return;
  const r=cd.res,mx=resMax();
  let pips='';
  if(r.discrete){pips+=`<span class="muted">${r.n}</span>`+Array.from({length:mx},(_,i)=>`<span class="pip ${i<h.res?'on':''}" style="--pc:${r.color}"></span>`).join('')}
  if(cd.slots)pips+=`<span class="muted">Spell Slots</span>`+Array.from({length:d.slotMax},(_,i)=>`<span class="pip ${i<h.slots?'on':''}" style="--pc:#7fb0ff"></span>`).join('');
  if(cd.combo)pips+=`<span class="muted">Combo</span>`+Array.from({length:5},(_,i)=>`<span class="pip ${i<h.combo?'on':''}" style="--pc:#ff5a5a"></span>`).join('');
  if(cd.souls)pips+=`<span class="muted">Souls ${h.souls}/${d.soulMax}</span>`;
  const buffs=[...h.buffs.map(b=>`<span class="buff">${b.icon} ${Math.ceil(b.t)}s</span>`)];
  if(s.meal){const rc=D.PROFS.cooking.recipes.find(x=>x.id===s.meal.id);buffs.push(`<span class="buff">${rc.i}${s.meal.p?'✨':''} ${s.relics.ladle?'∞':fmtTime(s.meal.t)}</span>`)}
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
function renderProfScene(){
  const s=S(),sl=s.slots[0],p=sl.act&&sl.act.p;const ps=$('#profScene');if(!p){ps.dataset.k='';ps.innerHTML='<div class="pscene">🏕️</div><div class="pstatus">Resting at camp</div>';return}
  const pd=D.PROFS[p];let inner='';const prog=sl.prog||0;
  if(p==='herbalism'){inner=`<div style="width:90%">${plotsHtml()}</div>`}
  else if(p==='smithing'){const t=s.ps.smithing.target;inner=`<div class="heatbar"><b style="left:${t}%"></b><i style="left:${Math.min(100,sl.heat)}%"></i></div>`}
  else inner=`<div style="width:220px;margin-top:8px">${bar(prog,'kfill')}</div>`;
  const key=p+(p==='herbalism'?'':'');
  if(ps.dataset.k!==key){ps.dataset.k=key;ps.innerHTML=`<div class="pscene ${p}">${p==='mining'?'⛏️':p==='smithing'?'🔨':p==='alchemy'?'⚗️':p==='cooking'?'🍳':p==='enchanting'?'🔮':'🌱'}</div><div class="pstatus"></div><div class="pin" style="width:100%;display:flex;justify-content:center"></div>`}
  ps.querySelector('.pstatus').innerHTML=`${pd.i} ${pd.n} (Lv ${s.profs[p].lvl}) — ${profTarget(p)} ${sl.note?`<span style="color:#ff8a8a">· ${sl.note}</span>`:''}`;
  ps.querySelector('.pin').innerHTML=inner;
}
function profTarget(p){const s=S();switch(p){
  case'mining':{const n=s.ps.mining.node;return `${D.MATS[n].i} ${D.MATS[n].n} · streak ${s.ps.mining.streak||0}`}
  case'herbalism':{const n=s.ps.herbalism.seed;return `${D.MATS[n].i} ${D.MATS[n].n}`}
  case'smithing':{const t=D.PROFS.smithing.tiers.find(x=>x.id===s.ps.smithing.tier);return `${t.n} ${D.SLOT_NAME[s.ps.smithing.slot]} @ ${s.ps.smithing.target}°`}
  case'alchemy':{const r=D.PROFS.alchemy.recipes.find(x=>x.id===s.ps.alchemy.recipe);return `${r.i} ${r.n}`}
  case'cooking':{const r=D.PROFS.cooking.recipes.find(x=>x.id===s.ps.cooking.recipe);return `${r.i} ${r.n}`}
  case'enchanting':{const it=s.equip[s.ps.enchanting.slot];return it?`${D.SLOT_NAME[it.slot]} +${it.ench||0}`:'(empty slot)'}}}
function plotsHtml(){const s=S(),hs=s.ps.herbalism;const n=plotsCount();let h='<div class="plots">';for(let i=0;i<n;i++){const p=hs.plots[i];
  if(!p){h+=`<div class="plot">🟫<small>empty</small></div>`;continue}const f=p.g/p.max;const st=f>=1?D.MATS[p.s].i:f>.6?'🌿':f>.25?'🌱':'🌰';
  h+=`<div class="plot ${p.gold?'gold':''}">${st}<small>${f>=1?'Ripe!':Math.ceil((p.max-p.g))+'s'}</small><div class="pb"><i style="width:${f*100}%"></i></div></div>`}return h+'</div>'}

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
  <div class="card"><h3 style="margin-top:0">Combat</h3>${st('Power',fmt(d.power))}${st('Est. DPS',fmt(d.dps))}${st('Max HP',fmt(d.maxHp))}${st('Weapon damage',fmt(d.weaponDmg))}${st('Damage bonus','+'+fmt(d.dmgPct)+'%')}${st('Crit',d.crit.toFixed(1)+'% / +'+fmt(d.critDmg)+'%')}${st('Attack interval',d.atkInt.toFixed(2)+'s')}${st('Armor',fmt(d.armor))}${st('Damage reduction',d.dr.toFixed(0)+'%')}${st('Dodge',d.dodge.toFixed(1)+'%')}${st('Lifesteal',d.lifesteal.toFixed(1)+'%')}${st('Damage cap / hit',d.cap===Infinity?'∞ (Unbound)':fmt(d.cap))}</div>
  <div class="card"><h3 style="margin-top:0">Fortune</h3>${st('Gold find','+'+fmt(d.gold)+'%')}${st('XP bonus','+'+fmt(d.xp)+'%')}${st('Magic find','+'+fmt(d.mf)+'%')}${st('Skill damage','+'+fmt(d.skillDmg)+'%')}${st('Pet/ally damage','+'+fmt(d.petDmg)+'%')}${st('Profession speed','+'+fmt(d.profSpeed)+'%')}${st('Achievements',Object.keys(s.ach).length+' (+'+Object.keys(s.ach).length+'% dmg & gold)')}${st('Relics',Object.keys(s.relics).length+' / '+D.RELICS.length)}</div></div>
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
P.classes=()=>{const s=S();const can2=Object.values(s.classes).some(c=>c.lvl>=D.MULTI_LEVEL);
  return `<h2>🎭 Classes</h2><p class="muted">Each class levels separately and keeps its skills. Switching is free. ${can2?'<b>Multiclassing unlocked:</b> your secondary class grants 50% of its passives and 25% of its attribute growth, and earns 25% of your XP.':`Reach level ${D.MULTI_LEVEL} in any class to unlock multiclassing.`}</p>
  <div class="grid" style="--min:240px">${D.CLASS_ORDER.map(c=>{const cd=D.CLASSES[c],cl=s.classes[c],un=s.unlockedCls[c];
   return `<div class="card cls ${un?'':'locked'} ${s.cls===c?'sel':''}"><div class="hd"><span class="ic">${cd.i}${cd.w}</span><div><b class="cinzel">${cd.n}</b><div class="small">Level ${cl.lvl} · ${cd.res.n} · ★${D.STAT_SHORT[cd.main]}${cl.sub?' · '+cd.subs.find(x=>x.id===cl.sub).n:''}</div></div></div>
   <div class="small" style="margin:6px 0">${cd.mech}</div>
   ${un?`<div class="row">${s.cls===c?'<span class="pill">Active</span>':btn('switchCls','Play as '+cd.n,{data:{c},cls:'gold sm'})}${can2&&s.cls!==c?btn('cls2',s.cls2===c?'✅ Secondary':'Set secondary',{data:{c},cls:'sm'}):''}</div>`:`<div class="small">🔒 ${D.CLASS_UNLOCK[c].d}</div>`}</div>`}).join('')}</div>`;};
P.profs=()=>{const s=S(),p=UI.profSel,pd=D.PROFS[p],pr=s.profs[p];const info=actionSlotsInfo();
  let h=`<h2>⚒️ Professions</h2><div class="grid" style="--min:150px">${D.PROF_ORDER.map(q=>{const x=s.profs[q];const who=s.slots.map((sl,i)=>sl.act&&sl.act.p===q?(i?'🧑‍🔧':'🧝'):'').join('');return `<div class="card ${q===p?'sel':''}" data-a="profSel" data-p="${q}" style="cursor:pointer"><div class="hd"><span class="ic">${D.PROFS[q].i}</span><div class="sp"><b>${D.PROFS[q].n}</b><div class="small">Lv ${x.lvl} ${who}</div></div></div>${bar(x.xp/profXpNeed(x.lvl),'xpfill')}</div>`}).join('')}</div>`;
  h+=`<div class="card" style="margin-top:10px"><div class="hd"><span class="ic">${pd.i}</span><div class="sp"><b class="cinzel">${pd.n}</b> — Level ${pr.lvl} <span class="muted">(${fmt(pr.xp)}/${fmt(profXpNeed(pr.lvl))} xp)</span><div class="small">${pd.mech}</div></div></div>
   <div class="row" style="margin-top:6px">Assign: ${s.slots.map((sl,i)=>btn('assign',(i?'🧑‍🔧 '+info[i].n:'🧝 Hero')+(sl.act&&sl.act.p===p?' ✅':''),{data:{si:i,k:p},cls:'sm'+(sl.act&&sl.act.p===p?' on':'')})).join('')}</div>
   <div class="row small" style="margin-top:6px">🔧 Tools: ${D.TOOLS.names[s.tools[p]||0]} (+${15*(s.tools[p]||0)}% speed) ${(s.tools[p]||0)<D.TOOLS.max?btn('tool',`Upgrade ${costTxt(upgradeCost(D.TOOLS.base,D.TOOLS.mult,s.tools[p]||0))}`,{data:{p},cls:'sm'}):''}</div></div>`;
  h+=profDetail(p);return h;};
function selCard(a,data,sel,lock,inner){const attrs=Object.entries(data).map(([k,v])=>`data-${k}="${v}"`).join(' ');return `<div class="card ${sel?'sel':''} ${lock?'locked':''}" ${lock?'':`data-a="${a}" ${attrs}`} style="cursor:pointer">${inner}</div>`}
function matsHave(inp){const s=S();return Object.entries(inp).map(([k,n])=>`<span class="${(s.mats[k]||0)>=n?'':'r5'}">${D.MATS[k].i}${n} <span class="muted">(${fmt(s.mats[k]||0)})</span></span>`).join(' ')}
function profDetail(p){const s=S(),lv=s.profs[p].lvl;let h='';
  if(p==='mining'){h=`<h3>Veins · Lode streak ${s.ps.mining.streak||0}/20 (+${(s.ps.mining.streak||0)*5}% yield)</h3><div class="grid" style="--min:170px">${D.PROFS.mining.nodes.map(n=>selCard('setNode',{id:n.id},s.ps.mining.node===n.id,lv<n.lv,`<b>${D.MATS[n.id].i} ${D.MATS[n.id].n}</b><div class="small">Lv ${n.lv} · ${n.t}s · ${n.xp} xp<br>Gem: ${D.MATS[n.gem].i} ${D.MATS[n.gem].n}<br>Owned: ${fmt(s.mats[n.id]||0)}</div>`)).join('')}</div>`}
  if(p==='herbalism'){h=`<h3>Seeds</h3><div class="grid" style="--min:150px">${D.PROFS.herbalism.seeds.map(n=>selCard('setSeed',{id:n.id},s.ps.herbalism.seed===n.id,lv<n.lv,`<b>${D.MATS[n.id].i} ${D.MATS[n.id].n}</b><div class="small">Lv ${n.lv} · ${n.t}s grow · ${n.xp} xp<br>Owned: ${fmt(s.mats[n.id]||0)}</div>`)).join('')}</div>
    <h3>Garden — ${plotsCount()} plots ${s.qol.autoHarvest?'· 🎃 Scarecrow active':''}</h3>${plotsHtml()}<p class="muted">Yield ${2+Math.floor(lv/15)} per plot · golden mutation ${(3+lv*.05).toFixed(1)}% · +1 plot per 20 levels, more in Town.</p>`}
  if(p==='smithing'){const ss=s.ps.smithing,t=D.PROFS.smithing.tiers.find(x=>x.id===ss.tier),cr=crackChance(ss.target);
    h=`<h3>Metal</h3><div class="grid" style="--min:160px">${D.PROFS.smithing.tiers.map(n=>selCard('setTier',{id:n.id},ss.tier===n.id,lv<n.lv,`<b>${n.n}</b><div class="small">Lv ${n.lv} · item level ${n.il}+<br>${D.MATS[n.ore].i} ${D.MATS[n.ore].n} + ${D.MATS[n.mat].i} ${D.MATS[n.mat].n}</div>`)).join('')}</div>
    <h3>Piece</h3><div class="row">${D.SLOTS.map(sl=>btn('setSmithSlot',D.SLOT_ICON[sl]+' '+D.SLOT_NAME[sl],{data:{sl},cls:'sm'+(ss.slot===sl?' on':'')})).join('')}</div>
    <h3>Strike temperature: ${ss.target}°</h3><input type="range" min="40" max="100" value="${ss.target}" data-in="smithTarget">
    <div class="row small"><span>Crack chance: <b class="${cr>.1?'r5':''}">${(cr*100).toFixed(1)}%</b></span><span>Quality bonus: <b class="r3">+${Math.round((ss.target-40)*3+lv*1.5)}% rarity</b></span><span>Time: ${(ss.target/12).toFixed(1)}s</span></div>
    <p class="small">Cost: ${matsHave(smithCost(t,ss.slot))} · Forged items are at least Uncommon, 5% Masterwork (+1 rarity).</p>`}
  if(p==='alchemy'){const as=s.ps.alchemy;h=`<h3>Recipes</h3><div class="grid" style="--min:200px">${D.PROFS.alchemy.recipes.map(r=>{const m=as.mastery[r.id]||0;return selCard('setAlch',{id:r.id},as.recipe===r.id,lv<r.lv,`<b>${r.i} ${r.n}</b><div class="small">Lv ${r.lv} · ${r.pot?`heals ${Math.round(r.heal*100*(1+m/200))}%`:Object.entries(r.elix).map(([k,v])=>`+${Math.round(v*(1+m/200))}% ${k}`).join(', ')+` · 5 min`}<br>${matsHave(r.in)}<br>Owned: ${r.pot?(s.potions[r.pot]||0):(s.elixirs[r.id]||0)}</div><div class="small">Mastery ${m}/100</div>${bar(m/100,'xpfill')}`)}).join('')}</div>`}
  if(p==='cooking'){const cs=s.ps.cooking;h=`<h3>Recipes</h3><div class="grid" style="--min:200px">${D.PROFS.cooking.recipes.map(r=>{const c=cs.count[r.id]||0,diff=lv-r.lv,burn=Math.max(.02,.4-diff*.03),perf=Math.min(.3,Math.max(0,diff*.015));const tier=c>=500?3:c>=100?2:c>=25?1:0;
    return selCard('setCook',{id:r.id},cs.recipe===r.id,lv<r.lv,`<b>${r.i} ${r.n}</b><div class="small">Lv ${r.lv} · ${Object.entries(r.buff).map(([k,v])=>`+${v}% ${k}`).join(', ')} · 10 min<br>${matsHave(r.in)}<br>🔥 burn ${(burn*100).toFixed(0)}% · ✨ perfect ${(perf*100).toFixed(0)}%<br>Signature ${'★'.repeat(tier)}${'☆'.repeat(3-tier)} (${c}/${tier>=3?500:[25,100,500][tier]}) · Owned ${(s.food[r.id]||0)}+${(s.foodP[r.id]||0)}✨</div>`)}).join('')}</div>`}
  if(p==='enchanting'){const es=s.ps.enchanting;h=`<h3>Target (equipped item) · ✨ Dust: ${fmt(s.mats.dust||0)}</h3><div class="grid" style="--min:170px">${D.SLOTS.map(sl=>{const it=s.equip[sl];return selCard('setEnch',{sl},es.slot===sl,!it,it?`<b class="r${it.r}">${D.SLOT_ICON[sl]} ${D.SLOT_NAME[sl]} +${it.ench||0}</b><div class="small">${esc(it.n)}<br>${it.ench>=15?'MAX':`Cost ✨${fmt(enchCost(it))} · ${enchChance(it).toFixed(0)}% success`}</div>`:`<b>${D.SLOT_NAME[sl]}</b><div class="small">empty</div>`)}).join('')}</div>
    <div class="row" style="margin-top:8px">${btn('toggleWard',es.ward?'✅ Use gems as wards':'⬜ Use gems as wards',{cls:'sm'})}<span class="muted">Gems: ${['amethyst','ruby','sapphire','emerald','diamond'].map(g=>D.MATS[g].i+(s.mats[g]||0)).join(' ')}</span></div><p class="muted">Get dust by salvaging gear in the Inventory (or set the Loot Filter to Salvage).</p>`}
  return h;}
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
  const g=D.GUILD.map(x=>{const l=s.guild[x.id]||0,c=upgradeCost(x.base,x.mult,l);return `<div class="card"><div class="hd"><span class="ic">${x.i}</span><div class="sp"><b>${x.n}</b> <span class="pill">Lv ${l}</span><div class="small">${x.d(l)} → <span class="r1">${x.d(l+1)}</span></div></div></div>${btn('guild',costTxt(c),{data:{id:x.id},cls:'gold sm',dis:s.gold<c})}</div>`}).join('');
  const q=D.QOL.map(x=>s.qol[x.id]?`<div class="card" style="opacity:.6"><b>${x.i} ${x.n}</b> ✅<div class="small">${x.d}</div></div>`:`<div class="card"><b>${x.i} ${x.n}</b><div class="small">${x.d}</div>${btn('qol',costTxt(x.cost),{data:{id:x.id},cls:'gold sm',dis:s.gold<x.cost})}</div>`).join('');
  const sc=upgradeCost(D.SATCHEL.base,D.SATCHEL.mult,s.satchel),pc=upgradeCost(D.PLOTS.base,D.PLOTS.mult,s.plotsBought);
  return `<h2>🏰 Town of Emberhold</h2><h3>Quality of Life</h3><div class="grid">${q}</div>
  <h3>Guild Halls (repeatable)</h3><div class="grid">${g}</div>
  <h3>Outfitters</h3><div class="grid"><div class="card"><b>🎒 Bigger Satchel</b><div class="small">Inventory ${invCap()} → ${invCap()+10}</div>${s.satchel<D.SATCHEL.max?btn('satchel',costTxt(sc),{cls:'gold sm',dis:s.gold<sc}):'<span class="pill">Max</span>'}</div>
  <div class="card"><b>🌱 Garden Plot</b><div class="small">Herb plots ${plotsCount()} → ${plotsCount()+1}</div>${s.plotsBought<D.PLOTS.max?btn('plot',costTxt(pc),{cls:'gold sm',dis:s.gold<pc}):'<span class="pill">Max</span>'}</div></div>`;};
P.codex=()=>{const s=S();const found=Object.keys(s.relics).length;
  return `<h2>🏺 Relic Codex <span class="muted">${found}/${D.RELICS.length}</span></h2>
  <p class="small">Relics are ultra-rare, <b>account-wide and permanent</b> — they survive Ascension. Every relic, its effect, where it drops and its exact odds are listed so you know what you're hunting. Magic Find does not affect relics; <b>Relic Sense</b> (Ascension) does.</p>
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
P.settings=()=>{const s=S(),st=s.settings;const sp=speedOptions();
  const filt=s.qol.filter?`<h3>🧾 Loot Filter</h3><table>${D.RARITIES.map((r,i)=>`<tr><td class="r${i}">${r.name}</td><td>${['keep','sell','salvage'].map(a=>btn('filter',a,{data:{r:i,v:a},cls:'sm'+(st.filter[i]===a?' on':'')})).join(' ')}</td></tr>`).join('')}</table>`:`<p class="muted">Buy the Loot Filter in Town for per-rarity Keep/Sell/Salvage rules.</p>`;
  return `<h2>⚙️ Settings</h2>
  <h3>Game speed</h3><div class="row">${sp.map(x=>btn('setSpeed',x+'×',{data:{v:x},cls:'sm'+(st.speed===x?' on':'')})).join('')}${s.relics.clock?'<span class="pill">🕰️ Everclock ×1.5</span>':''}</div>
  <h3>Combat</h3><div class="small">Auto-potion below <b>${st.quaffAt}%</b> HP ${s.qol.autoQuaff?'':'(needs Potion Belt)'}</div><input type="range" min="10" max="90" step="5" value="${st.quaffAt}" data-in="quaffAt">
  <div class="row">${s.qol.autoEquip?toggle('autoEquip','🎽 Auto-equip'):''}${s.qol.autoEat?toggle('autoEat','🍽️ Auto-eat'):''}${s.qol.autoElixir?toggle('autoElixir','🧴 Auto-elixir'):''}${s.qol.autoBoss?toggle('autoBoss','🔔 Auto-boss'):''}${s.qol.autoAdvance?toggle('autoAdvance','🗺️ Auto-advance'):''}</div>
  ${filt}
  <h3>Visuals</h3><div class="row">${toggle('particles','✨ Particles')}${toggle('numbers','🔢 Damage numbers')}${toggle('shake','📳 Screen shake')}</div>
  <h3>Save</h3><p class="muted">Autosaves every 10s to this browser. Offline progress: ${Math.round(offlineRate()*100)}% of online rate, capped at ${fmtTime(offlineCap())}.</p>
  <div class="row">${btn('saveNow','💾 Save now')}${btn('export','📤 Export')}${btn('import','📥 Import')}${btn('rename','✏️ Rename hero')}<span class="sp"></span>${btn('hardReset','🗑️ Hard reset',{cls:'red'})}</div>
  <p class="muted" style="margin-top:14px">Realms of Ember · original fantasy setting · made for Noah.</p>`};

function renderTabs(){const s=S();const pts=s.classes[s.cls].pts>0;setHTML($('#tabs'),TABS.map(([k,l])=>`<button data-a="tab" data-t="${k}" class="${UI.tab===k?'on':''}">${l}${k==='skills'&&pts?'<span class="dot"></span>':''}</button>`).join(''))}
function renderPanel(force){const pn=$('#panel');if(!force&&(UI.busyInput||pn.contains(document.activeElement)&&document.activeElement.tagName==='INPUT'))return;
  const st=pn.scrollTop;if(force)pn._h=null;const h=P[UI.tab]();if(force||(!UI.ptrDown&&pn._h!==h)){pn._h=h;pn.innerHTML=h}pn.scrollTop=st;UI.lastPanel=performance.now();renderTabs()}

/* ---------------- actions ---------------- */
const A={
  tab:e=>{UI.tab=e.t;$('#panel').scrollTop=0;renderPanel(true)},
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
  close:()=>closeModal(),
  sort:e=>{UI.invSort=e.k},
  bulk:e=>{const s=S();let n=0,g=0;for(const it of s.inv.slice())if(it.r<=+e.r&&!s.locked[it.id]){g+=e.m==='sell'?sellItem(it):salvageItem(it);n++}toast(`${e.m==='sell'?'Sold':'Salvaged'} ${n} items for ${e.m==='sell'?'🪙':'✨'}${fmt(g)}`)},
  equipBest:()=>{const s=S();let n=0;for(const sl of D.SLOTS){let best=null;for(const it of s.inv)if(it.slot===sl&&isUpgrade(it)&&(!best||powerWith(sl,it)>powerWith(sl,best)))best=it;if(best){equipItem(best);n++}}toast(n?`Equipped ${n} upgrade${n>1?'s':''}`:'Already wearing your best gear')},
  qol:e=>buyQol(e.id),guild:e=>buyGuild(e.id),satchel:()=>buySatchel(),plot:()=>buyPlot(),astral:e=>buyAstral(e.id),
  ascend:()=>{if(!canAscend())return;const g=shardPreview();if(confirm(`Ascend now for ${fmt(g)} Astral Shards? Your run resets (relics, QoL and astral upgrades are kept).`)){ascend();UI.enemyEls.forEach(el=>el.remove());UI.enemyEls.clear();curBg=null;banner('🌟 ASCENDED');save()}},
  drink:e=>drinkElixir(e.id),eat:e=>eatMeal(e.id,e.p==='1'),
  logf:e=>{UI.logFilter=e.c},
  toggleSet:e=>{const st=S().settings;st[e.k]=!st[e.k]},
  filter:e=>{S().settings.filter[+e.r]=e.v},
  setSpeed:e=>{S().settings.speed=+e.v},
  speed:()=>{const o=speedOptions(),st=S().settings;st.speed=o[(o.indexOf(st.speed)+1)%o.length];if(o.length===1)toast('Unlock faster speeds with Runes of Haste in Town.')},
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
document.addEventListener('change',ev=>{if(ev.target.dataset&&ev.target.dataset.in){UI.busyInput=false;renderPanel(true)}});
document.addEventListener('pointerup',()=>{if(UI.busyInput)setTimeout(()=>{UI.busyInput=false},50)});
$('#modal').addEventListener('click',ev=>{if(ev.target.id==='modal'&&S().started)closeModal()});

/* ---------------- loop ---------------- */
let lastT=performance.now(),acc=0,lastSave=Date.now(),lastAch=0,lastStrip=0;
function frame(now){
  let dt=(now-lastT)/1000;lastT=now;
  if(S().started){
    if(dt>5){const r=catchUp(dt);if(r)showOffline(r);dt=0}
    let sim=Math.min(dt,1)*gameSpeed();while(sim>0){const st=Math.min(.05,sim);tick(st);sim-=st}
    if(now-lastAch>2000){lastAch=now;checkAch();checkClassUnlocks()}
    renderStage();processEvents();drawFx(Math.min(dt,.05));
    if(now-lastStrip>250){lastStrip=now;renderTop();renderSlots()}
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
  if(a.relics>b.relics)lines.push(`<b class="relic">🏺 You discovered a RELIC while away!</b>`);
  modal(`<h2>🌙 While you were away (${fmtTime(Math.min(r.el,offlineCap()))}${r.el>offlineCap()?' — capped':''})</h2><p class="small muted">Offline you progress at <b>${Math.round((r.rate||offlineRate())*100)}%</b> of your online rate (raise it with 🌙 Night Watch in Mastery). Offline cap: ${fmtTime(offlineCap())}.</p>${lines.map(l=>`<div style="margin:4px 0">${l}</div>`).join('')}<div class="row" style="margin-top:10px"><span class="sp"></span>${btn('close','Onward!',{cls:'gold'})}</div>`)}

/* ---------------- boot ---------------- */
function boot(){
  let loaded=false;try{const raw=localStorage.getItem(SAVE_KEY);if(raw){loadFrom(raw);loaded=true}}catch(e){console.warn('Save load failed',e)}
  if(!loaded){G.S=newState();syncSlots();recalc()}
  if(!G.h)newHero();
  fxResize();window.addEventListener('resize',fxResize);
  renderTabs();renderPanel(true);renderTop();
  if(!S().started)showIntro();
  else{const el=(Date.now()-S().last)/1000;if(el>60){const r=catchUp(el);if(r)showOffline(r)}}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)save();else lastT=performance.now()-(Date.now()-S().last)})
  window.addEventListener('pagehide',save);
  requestAnimationFrame(t=>{lastT=t;frame(t)});
}
boot();
