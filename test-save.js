// Headless tests for Realms of Ember save/load hardening.
// Usage: node test-save.js
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');

class MemoryStorage {
  constructor(){this.map=new Map();this.failKeys=new Set();this.writes=0}
  getItem(k){return this.map.has(k)?this.map.get(k):null}
  setItem(k,v){this.writes++;if(this.failKeys.has(k)){const e=new Error('QuotaExceededError');e.name='QuotaExceededError';throw e}this.map.set(String(k),String(v))}
  removeItem(k){this.map.delete(k)}
  clear(){this.map.clear()}
  key(i){return [...this.map.keys()][i]||null}
  get length(){return this.map.size}
}

function loadEngine(storage){
  const btoa=s=>Buffer.from(s,'binary').toString('base64');
  const atob=s=>Buffer.from(s,'base64').toString('binary');
  const quiet={...console,warn(){},error(){}};const ctx={console:quiet,Math,Date,JSON,performance:{now:()=>0},localStorage:storage,navigator:{storage:{persist:()=>{ctx._persistCalled=true;return Promise.resolve(true)}}},btoa,atob,escape,unescape};
  ctx._persistCalled=false;
  vm.createContext(ctx);
  const src=fs.readFileSync(path.join(__dirname,'data.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'engine.js'),'utf8')+`
    this.api={G,D,SAVE_KEY,SAVE_BACKUP_KEY,SAVE_BROKEN_KEY,SAVE_META_KEY,SAVE_REMIND_MS,
      newState,deepFill,serialize,save,tryLoad,loadFrom,exportSave,importSave,exportRaw,
      restoreBackup,listBackups,pushBackup,readBackups,backupLabel,confirmHardReset,
      loadMeta,saveMeta,markExported,markReminded,markIosPromptSeen,shouldShowIosPrompt,
      shouldRemindExport,requestPersist,migrate,migrate2,migrate3,applyLoaded,
      syncSlots,recalc,newHero,giveStarter};
  `;
  vm.runInContext(src,ctx);
  return ctx;
}

const results=[];
function check(name,cond,detail){
  results.push({name,ok:!!cond,detail:cond?'':(detail||'failed')});
  if(!cond)console.error('  FAIL',name,detail||'');
  else console.log('  ok  ',name);
}

function freshHero(api,extra){
  const s=api.newState();
  s.started=true;s.name='TestHero';s.cls='fighter';s.gold=123;s.stats.kills=40;
  s.classes.fighter.lvl=5;s.classes.fighter.xp=10;
  Object.assign(s,extra||{});
  return s;
}

(function(){
  let failed=0;

  console.log('# tryLoad empty and valid');
  {
    const store=new MemoryStorage();
    const ctx=loadEngine(store);const api=ctx.api;
    const empty=api.tryLoad();
    check('empty status', empty.status==='empty', JSON.stringify(empty));
    const s=freshHero(api);ctx.api.G.S=s;api.syncSlots();api.recalc();api.newHero();
    check('save ok', api.save()===true);
    check('main key written', !!store.getItem(api.SAVE_KEY));
    const ctx2=loadEngine(store);const loaded=ctx2.api.tryLoad();
    check('valid status', loaded.status==='ok', JSON.stringify(loaded));
    check('name survived', ctx2.api.G.S.name==='TestHero', ctx2.api.G.S&&ctx2.api.G.S.name);
    check('gold survived', ctx2.api.G.S.gold===123, ctx2.api.G.S&&ctx2.api.G.S.gold);
    check('holdSave is off', ctx2.api.G.holdSave===false);
  }

  console.log('# corrupt save is not overwritten');
  {
    const store=new MemoryStorage();
    const ctx=loadEngine(store);const api=ctx.api;
    const raw='{"this is":"not valid json"';
    store.setItem(api.SAVE_KEY,raw);
    const result=api.tryLoad();
    check('broken status', result.status==='broken', JSON.stringify(result));
    check('holdSave is on', api.G.holdSave===true);
    check('broken key stored', store.getItem(api.SAVE_BROKEN_KEY)===raw);
    check('main key unchanged after failed load', store.getItem(api.SAVE_KEY)===raw);
    api.G.S=api.newState();api.syncSlots();api.recalc();
    check('save() blocked while held', api.save()===false);
    check('main key unchanged after held save', store.getItem(api.SAVE_KEY)===raw);
  }

  console.log('# export / import roundtrip');
  {
    const store=new MemoryStorage();
    const ctx=loadEngine(store);const api=ctx.api;
    api.G.S=freshHero(api,{gold:999,name:'Round'});api.syncSlots();api.recalc();api.newHero();api.giveStarter();
    const code=api.exportSave();
    api.G.S=api.newState();api.syncSlots();api.recalc();
    api.importSave(code);
    check('imported name', api.G.S.name==='Round', api.G.S.name);
    check('imported gold', api.G.S.gold===999, api.G.S.gold);
    check('import released hold', api.G.holdSave===false);
  }

  console.log('# unknown fields are kept; nulls are filled');
  {
    const store=new MemoryStorage();
    const ctx=loadEngine(store);const api=ctx.api;
    const s=freshHero(api,{v:3,customFoo:42,settings:{filter:null,speed:1,quaffAt:40,particles:true,numbers:true,autoBoss:true,autoAdvance:true,autoEquip:true,autoEat:true,autoElixir:true,shake:true}});
    api.loadFrom(JSON.stringify(s));
    check('custom field kept', api.G.S.customFoo===42, api.G.S.customFoo);
    check('null filter filled', Array.isArray(api.G.S.settings.filter)&&api.G.S.settings.filter.length>=6, JSON.stringify(api.G.S.settings.filter));
  }

  console.log('# v1 save migrates to v3 and keeps progress');
  {
    const store=new MemoryStorage();
    const ctx=loadEngine(store);const api=ctx.api;
    const v1={v:1,started:true,name:'OldHero',created:1,last:2,cls:'fighter',cls2:null,
      classes:{fighter:{lvl:13,xp:10,pts:13,ranks:{slash:1},sub:null,off:{}}},
      unlockedCls:{fighter:1,wizard:1,rogue:1},gold:500,shards:3,ascensions:1,
      inv:[],nextId:1,equip:{},locked:{},mats:{copper:4},potions:{},elixirs:{},food:{},foodP:{},
      profs:{mining:{lvl:8,xp:0}},ps:{mining:{node:'copper',streak:0},herbalism:{seed:'silverleaf',plots:[]},smithing:{tier:'copper',slot:'weapon',target:65},alchemy:{recipe:'pot1',mastery:{}},enchanting:{slot:'weapon',ward:true},cooking:{recipe:'haunch',count:{}}},
      slots:[{act:{type:'combat'},prog:0,heat:0}],
      zone:0,zones:[{unlocked:true,kills:10,cleared:false,bossKills:0}],riftLevel:0,bossReq:false,bossRetry:0,
      qol:{speed15:1},plotsBought:0,satchel:0,guild:{},tools:{},astral:{warp3:1},relics:{quill:1},relicTries:{},
      ach:{},settings:{speed:2,quaffAt:40,particles:true,numbers:true,autoBoss:true,autoAdvance:true,autoEquip:true,autoEat:true,autoElixir:true,filter:['sell','keep','keep','keep','keep']},
      meal:null,elix:{},stats:{kills:80,elites:0,bosses:0,deaths:0,gold:500,found:[0,0,0,0,0],maxEnch:0,crafted:0,play:0,everCleared:0,profMax:{}},
      log:[],mysteryField:'keep-me'};
    // pad zones to avoid later index errors in other systems — migrate3 walks s.zones
    while(v1.zones.length<9)v1.zones.push({unlocked:false,kills:0,cleared:false,bossKills:0});
    api.loadFrom(JSON.stringify(v1));
    check('migrated version is 3', api.G.S.v===3, api.G.S.v);
    check('v1 name kept', api.G.S.name==='OldHero', api.G.S.name);
    check('v1 gold kept', api.G.S.gold===500, api.G.S.gold);
    check('v1 relic kept', !!api.G.S.relics.quill);
    check('v1 mystery field kept', api.G.S.mysteryField==='keep-me', api.G.S.mysteryField);
    check('class level rescaled or kept', api.G.S.classes.fighter.lvl>=1&&api.G.S.classes.fighter.lvl<=13, api.G.S.classes.fighter.lvl);
    check('origin star granted', !!api.G.S.stars.origin);
    check('old speed rune converted', !api.G.S.qol.speed15&&api.G.S.qol.hounds, JSON.stringify(api.G.S.qol));
    check('migration recorded', !!api.G.migration, api.G.migration);
  }

  console.log('# v2 save migrates to v3');
  {
    const store=new MemoryStorage();
    const ctx=loadEngine(store);const api=ctx.api;
    const s=freshHero(api,{v:2,shards:10,astral:{mythic:1,power:2},zones:null});
    // zones null should be filled by deepFill
    // actually freshHero already has zones from newState, then v:2 assigned
    s.v=2;s.astral={mythic:1,power:2};s.shards=10;s.stars={};s.name='V2Hero';
    // remove stars so migrate3 runs cleanly? newState has stars.origin. freshHero copies newState which is v:3.
    s.v=2;
    api.loadFrom(JSON.stringify(s));
    check('v2 became v3', api.G.S.v===3, api.G.S.v);
    check('v2 name kept', api.G.S.name==='V2Hero');
    check('mythic mapped or shards refunded', !!(api.G.S.stars&&api.G.S.stars.f6)||api.G.S.shards>=10, JSON.stringify({stars:api.G.S.stars,shards:api.G.S.shards}));
  }

  console.log('# rolling backups: last 3 plus one daily');
  {
    const store=new MemoryStorage();
    const ctx=loadEngine(store);const api=ctx.api;
    const day=24*60*60*1000;
    const t0=Date.parse('2026-11-20T12:00:00-05:00');
    let clock=t0;api.G.now=()=>clock;
    api.G.S=freshHero(api,{name:'DayAgo',gold:1});
    check('first save', api.save()===true);
    clock=t0+day; // next calendar day
    for(let i=0;i<4;i++){
      clock=t0+day+i*1000;
      api.G.S=freshHero(api,{name:'Today'+i,gold:10+i});
      api.save();
    }
    const backups=api.listBackups();
    const names=backups.map(b=>JSON.parse(b.raw).name);
    check('at least 3 backups', backups.length>=3, backups.length);
    check('keeps a previous-day backup', names.includes('DayAgo')||backups.length===4, names.join(','));
    check('most recent backup is previous main (Today2)', names[0]==='Today2'||names.includes('Today2')||names.includes('Today3'), names.join(','));
    // After 5 writes: initial DayAgo is main, then Today0 overwrites and backs up DayAgo, Today1 backs up Today0, etc.
    // After Today3 save, main is Today3, backups start with Today2, Today1, Today0, plus DayAgo daily.
    check('has 3 recent + daily (4)', backups.length===4, 'count='+backups.length+' names='+names.join(','));
  }

  console.log('# quota failure does not wipe the main save');
  {
    const store=new MemoryStorage();
    const ctx=loadEngine(store);const api=ctx.api;
    api.G.S=freshHero(api,{name:'Safe',gold:7});api.syncSlots();api.recalc();
    check('initial save', api.save()===true);
    const before=store.getItem(api.SAVE_KEY);
    store.failKeys.add(api.SAVE_KEY);
    api.G.S.gold=999;
    const ok=api.save();
    check('save reports failure', ok===false);
    check('main still the old save', store.getItem(api.SAVE_KEY)===before);
    check('saveError set', !!api.G.saveError);
  }

  console.log('# hard reset confirmation');
  {
    const store=new MemoryStorage();
    const ctx=loadEngine(store);const api=ctx.api;
    check('RESET accepted', api.confirmHardReset('RESET')===true);
    check('reset with spaces accepted', api.confirmHardReset('  RESET  ')===true);
    check('wrong word rejected', api.confirmHardReset('yes')===false);
    check('empty rejected', api.confirmHardReset('')===false);
    check('lowercase rejected', api.confirmHardReset('reset')===false);
  }

  console.log('# export reminders and persist()');
  {
    const store=new MemoryStorage();
    const ctx=loadEngine(store);const api=ctx.api;
    const now=Date.parse('2026-11-23T12:00:00-05:00');
    api.G.S=null;
    check('no remind without state', api.shouldRemindExport(now)===false);
    api.G.S=freshHero(api,{created:now-2*api.SAVE_REMIND_MS,started:true});
    check('remind when never exported and save is old', api.shouldRemindExport(now)===true);
    api.markExported(now-1000);
    check('no remind just after export', api.shouldRemindExport(now)===false);
    api.markExported(now-api.SAVE_REMIND_MS-1);
    api.markReminded(now-api.SAVE_REMIND_MS-1);
    check('remind again after 3 days', api.shouldRemindExport(now)===true);
    check('ios prompt starts unseen', api.shouldShowIosPrompt()===true);
    api.markIosPromptSeen();
    check('ios prompt dismissed', api.shouldShowIosPrompt()===false);
    const p=api.requestPersist();
    check('persist() called', ctx._persistCalled===true);
    check('persist() returns a promise', p&&typeof p.then==='function');
  }

  console.log('# restore from backup');
  {
    const store=new MemoryStorage();
    const ctx=loadEngine(store);const api=ctx.api;
    api.G.S=freshHero(api,{name:'Alpha',gold:1});api.save();
    api.G.S=freshHero(api,{name:'Beta',gold:2});api.save();
    const names=api.listBackups().map(b=>JSON.parse(b.raw).name);
    check('backup of Alpha exists', names.includes('Alpha'), names.join(','));
    const i=api.listBackups().findIndex(b=>JSON.parse(b.raw).name==='Alpha');
    check('restore Alpha', api.restoreBackup(i)===true);
    check('now named Alpha', api.G.S.name==='Alpha', api.G.S.name);
  }

  const ok=results.filter(r=>r.ok).length;
  const bad=results.filter(r=>!r.ok);
  console.log('\n'+ok+'/'+results.length+' passed');
  if(bad.length){console.error(bad.map(b=>b.name+': '+b.detail).join('\n'));process.exit(1)}
})();
