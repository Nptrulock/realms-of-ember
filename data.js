'use strict';
/* Realms of Ember — game data */
const D = {};
D.STATS = ['str','dex','con','int','wis','cha'];
D.STAT_NAMES = {str:'Strength',dex:'Dexterity',con:'Constitution',int:'Intelligence',wis:'Wisdom',cha:'Charisma'};
D.STAT_SHORT = {str:'STR',dex:'DEX',con:'CON',int:'INT',wis:'WIS',cha:'CHA'};
D.BASE_DMG_CAP = 99999;

D.RARITIES = [
  {name:'Common',    color:'#b9b4a8', mult:1.00, affixes:0, w:600},
  {name:'Uncommon',  color:'#55d46e', mult:1.20, affixes:1, w:280},
  {name:'Rare',      color:'#4aa3ff', mult:1.45, affixes:2, w:90},
  {name:'Epic',      color:'#b56cff', mult:1.75, affixes:3, w:22},
  {name:'Legendary', color:'#ff9d2e', mult:2.20, affixes:4, w:4},
  {name:'Mythic',    color:'#ff4d6d', mult:3.00, affixes:5, w:0.4},
];
D.SLOTS = ['weapon','offhand','helm','chest','gloves','boots','ring','amulet'];
D.SLOT_ICON = {weapon:'⚔️',offhand:'🛡️',helm:'🪖',chest:'🥋',gloves:'🧤',boots:'👢',ring:'💍',amulet:'📿'};
D.SLOT_NAME = {weapon:'Weapon',offhand:'Off-hand',helm:'Helm',chest:'Chest',gloves:'Gloves',boots:'Boots',ring:'Ring',amulet:'Amulet'};
D.TIER_NAMES = ['Rusty','Copper','Iron','Steel','Mithril','Adamantine','Starmetal','Dragonbone','Astral','Voidforged','Primordial'];
D.SLOT_NOUN = {
  offhand:['Buckler','Kite Shield','Grimoire','Orb','Parrying Dagger'], helm:['Helm','Hood','Circlet','Coif'],
  chest:['Breastplate','Robe','Hauberk','Jerkin','Brigandine'], gloves:['Gauntlets','Gloves','Bracers','Grips'],
  boots:['Boots','Greaves','Treads','Sabatons'], ring:['Ring','Band','Signet','Loop'], amulet:['Amulet','Pendant','Talisman','Torc']
};

// value scale helpers: f = 1.11^ilvl
D.AFFIXES = {
  str:{n:'STR',f:'+{v} STR',roll:(il,r)=>(2+il*0.55)*r},
  dex:{n:'DEX',f:'+{v} DEX',roll:(il,r)=>(2+il*0.55)*r},
  con:{n:'CON',f:'+{v} CON',roll:(il,r)=>(2+il*0.55)*r},
  int:{n:'INT',f:'+{v} INT',roll:(il,r)=>(2+il*0.55)*r},
  wis:{n:'WIS',f:'+{v} WIS',roll:(il,r)=>(2+il*0.55)*r},
  cha:{n:'CHA',f:'+{v} CHA',roll:(il,r)=>(2+il*0.55)*r},
  dmgPct:{n:'Damage',f:'+{v}% Damage',pct:1,roll:(il,r)=>(3+il*0.12)*r},
  crit:{n:'Crit',f:'+{v}% Crit Chance',pct:1,roll:(il,r)=>(1.5+il*0.025)*r},
  critDmg:{n:'Crit Dmg',f:'+{v}% Crit Damage',pct:1,roll:(il,r)=>(8+il*0.25)*r},
  haste:{n:'Haste',f:'+{v}% Haste',pct:1,roll:(il,r)=>(2+il*0.04)*r},
  hpFlat:{n:'HP',f:'+{v} Max HP',roll:(il,r)=>6*Math.pow(1.11,il)*r},
  hpPct:{n:'HP%',f:'+{v}% Max HP',pct:1,roll:(il,r)=>(3+il*0.1)*r},
  armor:{n:'Armor',f:'+{v} Armor',roll:(il,r)=>3*Math.pow(1.11,il)*r},
  lifesteal:{n:'Lifesteal',f:'+{v}% Lifesteal',pct:1,roll:(il,r)=>(0.4+il*0.015)*r},
  gold:{n:'Gold',f:'+{v}% Gold Find',pct:1,roll:(il,r)=>(5+il*0.2)*r},
  xp:{n:'XP',f:'+{v}% XP',pct:1,roll:(il,r)=>(3+il*0.1)*r},
  mf:{n:'Magic Find',f:'+{v}% Magic Find',pct:1,roll:(il,r)=>(4+il*0.15)*r},
  regen:{n:'Regen',f:'+{v} HP/s',roll:(il,r)=>0.4*Math.pow(1.11,il)*r},
  resRegen:{n:'Res. Regen',f:'+{v}% Resource Regen',pct:1,roll:(il,r)=>(4+il*0.08)*r},
  skillDmg:{n:'Skill Dmg',f:'+{v}% Skill Damage',pct:1,roll:(il,r)=>(4+il*0.14)*r},
  dodge:{n:'Dodge',f:'+{v}% Dodge',pct:1,roll:(il,r)=>(1+il*0.015)*r},
  petDmg:{n:'Pet Dmg',f:'+{v}% Pet & Ally Damage',pct:1,roll:(il,r)=>(6+il*0.2)*r},
};
D.SUFFIX = {str:'of the Bear',dex:'of the Fox',con:'of the Ox',int:'of the Owl',wis:'of the Sage',cha:'of the Silver Tongue',
  dmgPct:'of Fury',crit:'of Precision',critDmg:'of Ruin',haste:'of Swiftness',hpFlat:'of Vitality',hpPct:'of the Titan',armor:'of Warding',
  lifesteal:'of the Leech',gold:'of Greed',xp:'of Insight',mf:'of Fortune',regen:'of Mending',resRegen:'of Focus',skillDmg:'of Mastery',dodge:'of Evasion',petDmg:'of the Pack'};
D.LEGENDARY = [
  {id:'storm',n:'Stormcaller',d:'10% chance on hit to call lightning for 150% damage'},
  {id:'echo',n:'Echoing',d:'Skills have a 15% chance to cast twice'},
  {id:'vamp',n:'Sanguine',d:'+6% Lifesteal'},
  {id:'titan',n:'Titanic',d:'+25% Max HP'},
  {id:'midas',n:'Midas',d:'+50% Gold Find'},
  {id:'exec',n:'Headsman',d:'+60% damage to enemies below 35% HP'},
  {id:'swift',n:'Windborne',d:'+20% Haste'},
  {id:'phoenix',n:'Phoenix',d:'Once per 60s, survive a lethal blow at 30% HP'},
];

/* ---------------- ZONES ---------------- */
D.ZONES = [
  {id:'woods',n:'Whispering Woods',i:'🌲',min:1,max:6,bg:'linear-gradient(180deg,#123222 0%,#1d4a2c 55%,#2b3a1c 100%)',deco:['🌲','🌳','🍄','🌿','🌲'],mat:'pelt',
    mons:[{n:'Giant Rat',i:'🐀',hp:.7,atk:.7,spd:1.5,tags:['beast']},{n:'Grey Wolf',i:'🐺',hp:1,atk:1,spd:1.8,tags:['beast']},{n:'Webspinner',i:'🕷️',hp:.8,atk:1.1,spd:1.6,tags:['beast']},{n:'Wild Boar',i:'🐗',hp:1.3,atk:.9,spd:2.2,tags:['beast']},{n:'Road Bandit',i:'🥷',hp:1,atk:1.1,spd:2,tags:['humanoid']}],
    boss:{n:'Old Grizzlemaw',i:'🐻',tags:['beast']}},
  {id:'warrens',n:'Goblin Warrens',i:'🕳️',min:7,max:13,bg:'linear-gradient(180deg,#2a1e12 0%,#3d2c18 60%,#1c140c 100%)',deco:['🪨','🔥','🦴','⛏️','🪵'],mat:'scrap',
    mons:[{n:'Goblin Sneak',i:'👺',hp:.8,atk:1.1,spd:1.5,tags:['humanoid']},{n:'Kobold Trapper',i:'🦎',hp:.9,atk:1,spd:1.7,tags:['humanoid']},{n:'Hobgoblin Brute',i:'👹',hp:1.5,atk:1.2,spd:2.4,tags:['humanoid']},{n:'Warg',i:'🐕',hp:1.1,atk:1.1,spd:1.8,tags:['beast']}],
    boss:{n:'Grubnak the Goblin King',i:'🤴',tags:['humanoid']}},
  {id:'crypt',n:'Sunken Crypt',i:'⚰️',min:14,max:21,bg:'linear-gradient(180deg,#181a2b 0%,#232744 60%,#10111c 100%)',deco:['🪦','⚰️','🕯️','🦴','🪦'],mat:'bone',
    mons:[{n:'Skeleton Guard',i:'💀',hp:1,atk:1,spd:1.9,tags:['undead']},{n:'Shambling Corpse',i:'🧟',hp:1.5,atk:1,spd:2.4,tags:['undead']},{n:'Wailing Spirit',i:'👻',hp:.8,atk:1.3,spd:1.7,tags:['undead']},{n:'Crypt Ghoul',i:'🧌',hp:1.2,atk:1.2,spd:1.9,tags:['undead']}],
    boss:{n:'The Hollow Priest',i:'☠️',tags:['undead']}},
  {id:'caverns',n:'Crystal Caverns',i:'💎',min:22,max:31,bg:'linear-gradient(180deg,#0f1f33 0%,#1b3554 55%,#0c1522 100%)',deco:['💎','🔮','🪨','✨','💠'],mat:'crystal',
    mons:[{n:'Cave Bat Swarm',i:'🦇',hp:.7,atk:1.2,spd:1.2,tags:['beast']},{n:'Crystal Golem',i:'🗿',hp:1.8,atk:1,spd:2.6,tags:['construct']},{n:'Gelatinous Blob',i:'🫧',hp:1.4,atk:.9,spd:2.1,tags:['ooze']},{n:'Deep Crawler',i:'🦂',hp:1.1,atk:1.2,spd:1.8,tags:['beast']}],
    boss:{n:'Crystalback Basilisk',i:'🐊',tags:['beast']}},
  {id:'peaks',n:'Frostfang Peaks',i:'🏔️',min:32,max:42,bg:'linear-gradient(180deg,#bcd2e8 0%,#6f8fb0 45%,#2b3c55 100%)',deco:['🏔️','❄️','🌨️','🧊','❄️'],mat:'frost',
    mons:[{n:'Snow Ape',i:'🦍',hp:1.4,atk:1.1,spd:2.1,tags:['beast']},{n:'Ice Wolf',i:'🐺',hp:1,atk:1.1,spd:1.6,tags:['beast']},{n:'Storm Harpy',i:'🦅',hp:.9,atk:1.3,spd:1.5,tags:['monstrosity']},{n:'Frost Giant Thrall',i:'🧊',hp:1.8,atk:1.4,spd:2.8,tags:['giant']}],
    boss:{n:'Jarl Hrimmar',i:'🥶',tags:['giant']}},
  {id:'volcano',n:'Ashen Volcano',i:'🌋',min:43,max:54,bg:'linear-gradient(180deg,#2a0b07 0%,#5c160a 50%,#ff5a1f 140%)',deco:['🌋','🔥','🪨','♨️','🔥'],mat:'ember',
    mons:[{n:'Fire Elemental',i:'🔥',hp:1,atk:1.3,spd:1.6,tags:['elemental']},{n:'Salamander',i:'🦎',hp:1.1,atk:1.2,spd:1.7,tags:['beast']},{n:'Hellhound',i:'🐕‍🦺',hp:1.2,atk:1.3,spd:1.6,tags:['fiend']},{n:'Magma Golem',i:'🪨',hp:2,atk:1.2,spd:2.8,tags:['construct']}],
    boss:{n:'Pyrelord Azhkar',i:'👹',tags:['elemental','fiend']}},
  {id:'abyss',n:'Abyssal Rift',i:'🌀',min:55,max:67,bg:'linear-gradient(180deg,#0b0418 0%,#25103d 55%,#060210 100%)',deco:['🌀','✨','🌑','🔮','👁️'],mat:'ichor',
    mons:[{n:'Imp Swarm',i:'👿',hp:.8,atk:1.3,spd:1.3,tags:['fiend']},{n:'Gazing Horror',i:'👁️',hp:1.3,atk:1.4,spd:2,tags:['aberration']},{n:'Tentacle Fiend',i:'🦑',hp:1.5,atk:1.2,spd:2.2,tags:['aberration']},{n:'Living Shadow',i:'🌑',hp:1,atk:1.4,spd:1.6,tags:['undead']}],
    boss:{n:'The Dreaming Maw',i:'🐙',tags:['aberration']}},
  {id:'roost',n:"Dragon's Roost",i:'🐉',min:68,max:80,bg:'linear-gradient(180deg,#3a1505 0%,#7a3510 50%,#d9a441 140%)',deco:['💰','🦴','🔥','👑','💰'],mat:'scale',
    mons:[{n:'Scaled Cultist',i:'🧙‍♂️',hp:1,atk:1.3,spd:1.7,tags:['humanoid']},{n:'Fire Drake',i:'🦎',hp:1.3,atk:1.3,spd:1.8,tags:['dragon']},{n:'Wyvern',i:'🦖',hp:1.6,atk:1.4,spd:2.2,tags:['dragon']},{n:'Young Dragon',i:'🐉',hp:2,atk:1.5,spd:2.5,tags:['dragon']}],
    boss:{n:'Vyraxion the Ancient Flame',i:'🐲',tags:['dragon']}},
  {id:'rift',n:'The Endless Rift',i:'♾️',min:80,max:82,endless:true,bg:'linear-gradient(180deg,#000 0%,#1a0b2e 40%,#3b0f4d 100%)',deco:['♾️','🌌','✨','💫','🌠'],mat:'ichor',
    mons:[{n:'Rift Stalker',i:'👾',hp:1.2,atk:1.3,spd:1.6,tags:['aberration']},{n:'Void Knight',i:'🦹',hp:1.6,atk:1.4,spd:2,tags:['fiend']},{n:'Star Leviathan',i:'🐋',hp:2.2,atk:1.3,spd:2.6,tags:['aberration']},{n:'Echo Dragon',i:'🐉',hp:1.8,atk:1.5,spd:2.2,tags:['dragon']}],
    boss:{n:'Rift Warden',i:'🌌',tags:['aberration']}},
];
D.KILLS_TO_BOSS = 25;

/* ---------------- MATERIALS ---------------- */
D.MATS = {
  pelt:{n:'Beast Pelt',i:'🦊'}, scrap:{n:'Goblin Scrap',i:'⚙️'}, bone:{n:'Bone Dust',i:'🦴'}, crystal:{n:'Crystal Shard',i:'🔷'},
  frost:{n:'Frost Core',i:'❄️'}, ember:{n:'Ember Core',i:'🔥'}, ichor:{n:'Void Ichor',i:'🟣'}, scale:{n:'Dragon Scale',i:'🐲'},
  meat:{n:'Monster Meat',i:'🍖'}, dust:{n:'Arcane Dust',i:'✨'},
  copper:{n:'Copper Ore',i:'🟤'}, iron:{n:'Iron Ore',i:'⚫'}, mithril:{n:'Mithril Ore',i:'⚪'}, adamant:{n:'Adamantine Ore',i:'🟢'}, starmetal:{n:'Starmetal Ore',i:'🌟'},
  silverleaf:{n:'Silverleaf',i:'🌿'}, bloodthistle:{n:'Bloodthistle',i:'🥀'}, moonpetal:{n:'Moonpetal',i:'🌸'}, emberroot:{n:'Emberroot',i:'🌶️'}, starbloom:{n:'Starbloom',i:'🌼'},
  amethyst:{n:'Amethyst',i:'🟪',gem:1}, ruby:{n:'Ruby',i:'🔴',gem:1}, sapphire:{n:'Sapphire',i:'🔵',gem:1}, emerald:{n:'Emerald',i:'🟩',gem:1}, diamond:{n:'Diamond',i:'💎',gem:1},
};

/* ---------------- CLASSES ----------------
 skill cast(C, r) where C is combat API, r = rank */
D.CLASSES = {
 fighter:{n:'Fighter',i:'🧔',w:'🪓',wn:['Battleaxe','Greatsword','Warhammer'],color:'#e05a3a',main:'str',atk:1.6,crit:5,
  growth:{str:2,dex:.6,con:1.5,int:.3,wis:.4,cha:.4},
  res:{n:'Rage',color:'#d33',max:()=>100,regen:()=>0,start:0,decay:3,onAtk:8,onHurt:4},
  mech:'Builds <b>Rage</b> by attacking and being hit. Rage fuels brutal strikes. Rage slowly fades between fights.',
  skills:[
   {id:'pstrike',n:'Power Strike',i:'💥',lv:1,max:5,cd:3,cost:25,d:r=>`Strike for ${pc(1.8+.3*(r-1))} damage.`,cast:(C,r)=>C.hit(C.tgt(),1.8+.3*(r-1),{icon:'💥'})},
   {id:'cleave',n:'Cleave',i:'🌪️',lv:3,max:5,cd:5,cost:35,d:r=>`Hit all enemies for ${pc(1.2+.2*(r-1))}.`,cast:(C,r)=>C.aoe(1.2+.2*(r-1),{icon:'🌪️'})},
   {id:'bcry',n:'Battle Cry',i:'📯',lv:8,max:5,cd:20,cost:30,d:r=>`+${20+5*(r-1)}% damage for 8s.`,cast:(C,r)=>C.buff('bcry',8,{dmgPct:20+5*(r-1)},'📯')},
   {id:'swind',n:'Second Wind',i:'💨',lv:15,max:5,cd:25,cost:40,cond:C=>C.hpPct()<.6,d:r=>`When below 60% HP, heal ${20+5*(r-1)}% HP.`,cast:(C,r)=>C.healPct((20+5*(r-1))/100)},
   {id:'whirl',n:'Bladestorm',i:'⚔️',lv:25,max:5,cd:14,cost:60,d:r=>`Spin 4 times, each hitting all enemies for ${pc(.9+.15*(r-1))}.`,cast:(C,r)=>{for(let k=0;k<4;k++)C.aoe(.9+.15*(r-1),{icon:'⚔️'})}},
  ],
  passives:[
   {id:'wmast',n:'Weapon Mastery',i:'🗡️',lv:1,max:10,d:r=>`+${6*r}% damage`,ap:(d,r)=>d.dmgPct+=6*r},
   {id:'tough',n:'Toughness',i:'🪨',lv:1,max:10,d:r=>`+${6*r}% max HP`,ap:(d,r)=>d.hpPct+=6*r},
   {id:'blust',n:'Bloodlust',i:'🩸',lv:5,max:10,d:r=>`+${10*r}% Rage generation`,ap:(d,r)=>d.resGen+=10*r},
   {id:'ripo',n:'Riposte',i:'🤺',lv:10,max:10,d:r=>`${3*r}% chance to counterattack when hit`,ap:(d,r)=>d.riposte+=3*r},
   {id:'execu',n:'Executioner',i:'🪓',lv:20,max:10,d:r=>`+${6*r}% damage vs enemies below 35% HP`,ap:(d,r)=>d.execute+=6*r},
   {id:'indom',n:'Indomitable',i:'🏰',lv:30,max:10,d:r=>`${2*r}% damage reduction`,ap:(d,r)=>d.dr+=2*r},
  ],
  subs:[{id:'glad',n:'Gladiator',i:'🏟️',d:'+10% crit chance, +50% crit damage',ap:d=>{d.crit+=10;d.critDmg+=50}},
        {id:'lord',n:'Warlord',i:'🎖️',d:'Skills cost 30% less Rage, +25% skill damage',ap:d=>{d.costMult*=.7;d.skillDmg+=25}}]},
 wizard:{n:'Wizard',i:'🧙',w:'🪄',wn:['Staff','Wand','Spellblade'],color:'#5a7dff',main:'int',atk:1.7,autoMult:.7,crit:5,
  growth:{str:.3,dex:.5,con:1,int:2,wis:.8,cha:.4},
  res:{n:'Mana',color:'#3b7bff',max:d=>100+d.int*1.5,regen:d=>5+d.wis*.15,start:1},
  slots:true,
  mech:'Uses <b>Mana</b> for cantrips and <b>Spell Slots</b> (recharge over time) for devastating spells.',
  skills:[
   {id:'mmiss',n:'Magic Missile',i:'✨',lv:1,max:5,cd:1.5,cost:10,d:r=>`3 unerring bolts, each ${pc(.55+.1*(r-1))}.`,cast:(C,r)=>{for(let k=0;k<3;k++)C.hit(C.rnd(),.55+.1*(r-1),{icon:'✨',spell:1,proj:'✨'})}},
   {id:'fball',n:'Fireball',i:'🔥',lv:3,max:5,cd:6,slot:1,d:r=>`Uses 1 Spell Slot. Explode all enemies for ${pc(2.5+.4*(r-1))}.`,cast:(C,r)=>C.aoe(2.5+.4*(r-1),{icon:'🔥',spell:1,proj:'🔥',color:'#ff7a1a'})},
   {id:'frost',n:'Ray of Frost',i:'❄️',lv:8,max:5,cd:4,cost:20,d:r=>`Deal ${pc(1.6+.25*(r-1))} and slow the target's attacks by 50% for 4s.`,cast:(C,r)=>{const t=C.tgt();C.hit(t,1.6+.25*(r-1),{icon:'❄️',spell:1,proj:'❄️',color:'#9be7ff'});if(t)t.slowT=4}},
   {id:'award',n:'Arcane Ward',i:'🔰',lv:15,max:5,cd:18,cost:30,d:r=>`Gain a shield equal to ${25+5*(r-1)}% max HP.`,cast:(C,r)=>C.shield((25+5*(r-1))/100*C.d.wardMult)},
   {id:'meteor',n:'Meteor Swarm',i:'☄️',lv:25,max:5,cd:20,slot:2,d:r=>`Uses 2 Spell Slots. Rain meteors on all enemies for ${pc(6+1*(r-1))}.`,cast:(C,r)=>C.aoe(6+(r-1),{icon:'☄️',spell:1,proj:'☄️',color:'#ff5a1f',shake:1})},
  ],
  passives:[
   {id:'amind',n:'Arcane Mind',i:'🧠',lv:1,max:10,d:r=>`+${10*r}% mana regeneration`,ap:(d,r)=>d.resRegen+=10*r},
   {id:'spow',n:'Spell Power',i:'📘',lv:1,max:10,d:r=>`+${7*r}% spell damage`,ap:(d,r)=>d.spellDmg+=7*r},
   {id:'arec',n:'Arcane Recovery',i:'⏳',lv:5,max:10,d:r=>`Spell slots recharge ${8*r}% faster`,ap:(d,r)=>d.slotRate+=8*r},
   {id:'xslot',n:'Deep Reserves',i:'🎴',lv:20,max:3,d:r=>`+${r} max spell slots`,ap:(d,r)=>d.slotMax+=r},
   {id:'eover',n:'Elemental Overload',i:'⚡',lv:10,max:10,d:r=>`+${2*r}% crit chance`,ap:(d,r)=>d.crit+=2*r},
   {id:'mshield',n:'Mana Skin',i:'🫧',lv:30,max:10,d:r=>`${2*r}% damage reduction`,ap:(d,r)=>d.dr+=2*r},
  ],
  subs:[{id:'pyro',n:'Pyromancer',i:'🔥',d:'+30% area spell damage, +1 spell slot',ap:d=>{d.aoeDmg+=30;d.slotMax+=1}},
        {id:'ward',n:'Spellward',i:'🔰',d:'Arcane Ward is twice as strong, +25% max HP',ap:d=>{d.wardMult*=2;d.hpPct+=25}}]},
 rogue:{n:'Rogue',i:'🥷',w:'🗡️',wn:['Daggers','Rapier','Shortblade'],color:'#9adf5a',main:'dex',atk:1.2,crit:12,
  growth:{str:.6,dex:2,con:1,int:.5,wis:.4,cha:.6},
  res:{n:'Energy',color:'#f5d742',max:()=>100,regen:()=>12,start:1},
  combo:true,
  mech:'Regenerates <b>Energy</b> quickly. Attacks build <b>Combo Points</b> (max 5) that finishers spend. First hit on each foe is a <b>Sneak Attack</b> (+50%).',
  skills:[
   {id:'bstab',n:'Backstab',i:'🔪',lv:1,max:5,cd:2,cost:30,d:r=>`Deal ${pc(1.5+.2*(r-1))}, +2 combo.`,cast:(C,r)=>{C.hit(C.tgt(),1.5+.2*(r-1),{icon:'🔪'});C.combo(2)}},
   {id:'evisc',n:'Eviscerate',i:'🩸',lv:3,max:5,cd:1,cost:25,cond:C=>C.h.combo>=4,d:r=>`Finisher at 4+ combo: ${pc(.8+.15*(r-1))} per combo point.`,cast:(C,r)=>{const c=C.h.combo;C.h.combo=0;C.hit(C.tgt(),(.8+.15*(r-1))*c,{icon:'🩸',big:1})}},
   {id:'fan',n:'Fan of Knives',i:'🍃',lv:8,max:5,cd:5,cost:40,d:r=>`Hit all enemies for ${pc(.9+.15*(r-1))}, +1 combo.`,cast:(C,r)=>{C.aoe(.9+.15*(r-1),{icon:'🍃',proj:'🗡️'});C.combo(1)}},
   {id:'smoke',n:'Smoke Bomb',i:'💨',lv:15,max:5,cd:20,cost:30,d:r=>`+${30+5*(r-1)}% dodge for 6s.`,cast:(C,r)=>C.buff('smoke',6,{dodge:30+5*(r-1)},'💨')},
   {id:'death',n:'Death Mark',i:'☠️',lv:25,max:5,cd:16,cost:50,d:r=>`Mark the target: it takes +${40+10*(r-1)}% damage.`,cast:(C,r)=>{const t=C.tgt();if(t)t.mark=Math.max(t.mark||0,(.4+.1*(r-1)))}},
  ],
  passives:[
   {id:'leth',n:'Lethality',i:'🎯',lv:1,max:10,d:r=>`+${10*r}% crit damage`,ap:(d,r)=>d.critDmg+=10*r},
   {id:'quick',n:'Quickness',i:'🌀',lv:1,max:10,d:r=>`+${3*r}% haste`,ap:(d,r)=>d.haste+=3*r},
   {id:'envenom',n:'Envenom',i:'🧪',lv:5,max:10,d:r=>`${4*r}% chance on hit to poison (30%/s for 5s)`,ap:(d,r)=>d.poison+=4*r},
   {id:'pick',n:'Pickpocket',i:'👛',lv:10,max:10,d:r=>`+${8*r}% gold find`,ap:(d,r)=>d.gold+=8*r},
   {id:'sneak',n:'Ambusher',i:'🌒',lv:20,max:10,d:r=>`Sneak Attacks deal +${20*r}% more`,ap:(d,r)=>d.sneak+=20*r},
   {id:'prec',n:'Deadly Precision',i:'🎯',lv:30,max:10,d:r=>`+${1.5*r}% crit chance`,ap:(d,r)=>d.crit+=1.5*r},
  ],
  subs:[{id:'shadow',n:'Shadowblade',i:'🌑',d:'Sneak Attacks always crit and deal double',ap:d=>{d.sneakCrit=1;d.sneak+=100}},
        {id:'duel',n:'Duelist',i:'🤺',d:'+20% dodge, +15% haste',ap:d=>{d.dodge+=20;d.haste+=15}}]},
 cleric:{n:'Cleric',i:'👼',w:'🔱',wn:['Mace','Holy Scepter','Morningstar'],color:'#ffe08a',main:'wis',atk:1.6,crit:5,
  growth:{str:.8,dex:.4,con:1.3,int:.5,wis:2,cha:.8},
  res:{n:'Faith',color:'#ffd34d',max:()=>100,regen:()=>3,start:0,onAtk:6},
  mech:'Gathers <b>Faith</b> through prayer and battle. At full Faith, <b>Channel Divinity</b> unleashes radiant judgment. Strong healing and bonus damage vs undead.',
  skills:[
   {id:'sflame',n:'Sacred Flame',i:'🕯️',lv:1,max:5,cd:2.5,cost:15,d:r=>`Radiant blast for ${pc(1.6+.25*(r-1))}.`,cast:(C,r)=>C.hit(C.tgt(),1.6+.25*(r-1),{icon:'🕯️',spell:1,proj:'✨',color:'#ffe066'})},
   {id:'hword',n:'Healing Word',i:'💛',lv:3,max:5,cd:6,cost:25,cond:C=>C.hpPct()<.75,d:r=>`When below 75% HP, heal ${18+4*(r-1)}%.`,cast:(C,r)=>C.healPct((18+4*(r-1))/100)},
   {id:'sguard',n:'Spirit Guardians',i:'👼',lv:8,max:5,cd:15,cost:40,d:r=>`Spirits burn all enemies for ${pc(.6+.1*(r-1))}/s for 8s.`,cast:(C,r)=>C.enemiesAlive().forEach(e=>C.dot(e,.6+.1*(r-1),8,'👼'))},
   {id:'cdiv',n:'Channel Divinity',i:'🌟',lv:15,max:5,cd:10,cost:100,d:r=>`At full Faith: smite all enemies for ${pc(3+.5*(r-1))} and heal 20%.`,cast:(C,r)=>{C.aoe(3+.5*(r-1),{icon:'🌟',spell:1,color:'#fff3a0',shake:1});C.healPct(.2)}},
   {id:'bless',n:'Blessing',i:'🙏',lv:25,max:5,cd:30,cost:30,d:r=>`+${25+5*(r-1)}% damage and haste for 10s.`,cast:(C,r)=>C.buff('bless',10,{dmgPct:25+5*(r-1),haste:25+5*(r-1)},'🙏')},
  ],
  passives:[
   {id:'devo',n:'Devotion',i:'📿',lv:1,max:10,d:r=>`+${10*r}% Faith generation`,ap:(d,r)=>d.resGen+=10*r},
   {id:'turn',n:'Turn Undead',i:'☀️',lv:1,max:10,d:r=>`+${10*r}% damage vs undead & fiends`,ap:(d,r)=>{d.vs.undead=(d.vs.undead||0)+10*r;d.vs.fiend=(d.vs.fiend||0)+10*r}},
   {id:'bvit',n:'Blessed Vitality',i:'💚',lv:5,max:10,d:r=>`Regenerate ${.3*r}% max HP/s`,ap:(d,r)=>d.regenPct+=.3*r},
   {id:'favor',n:'Divine Favor',i:'✝️',lv:10,max:10,d:r=>`+${6*r}% damage and healing`,ap:(d,r)=>{d.dmgPct+=6*r;d.healPct+=6*r}},
   {id:'sanct',n:'Sanctuary',i:'⛪',lv:20,max:10,d:r=>`${2*r}% damage reduction`,ap:(d,r)=>d.dr+=2*r},
   {id:'aegis',n:'Aegis of Faith',i:'🛡️',lv:30,max:10,d:r=>`+${8*r}% max HP`,ap:(d,r)=>d.hpPct+=8*r},
  ],
  subs:[{id:'life',n:'Lifebinder',i:'💖',d:'+50% healing, +3% max HP regen/s while below 50% HP',ap:d=>{d.healPct+=50;d.lowRegen+=3}},
        {id:'warp',n:'Warpriest',i:'⚒️',d:'+25% damage, 20% chance for auto-attacks to strike twice',ap:d=>{d.dmgPct+=25;d.double+=20}}]},
 ranger:{n:'Ranger',i:'🧝',w:'🏹',wn:['Longbow','Recurve Bow','Crossbow'],color:'#3fbf7f',main:'dex',atk:1.5,crit:8,
  growth:{str:.5,dex:2,con:1.1,int:.5,wis:.8,cha:.4},
  res:{n:'Focus',color:'#46d38a',max:()=>100,regen:()=>10,start:1},
  pet:{n:'Wolf Companion',i:'🐺',int:2,mult:.45},
  mech:'Fights with a loyal <b>Wolf Companion</b> that attacks on its own. Spends <b>Focus</b> on precise shots and marks prey.',
  skills:[
   {id:'aim',n:'Aimed Shot',i:'🎯',lv:1,max:5,cd:3,cost:30,d:r=>`Deal ${pc(2+.3*(r-1))} with +20% crit chance.`,cast:(C,r)=>C.hit(C.tgt(),2+.3*(r-1),{icon:'🎯',proj:'➶',bonusCrit:20})},
   {id:'multi',n:'Multishot',i:'🏹',lv:3,max:5,cd:5,cost:40,d:r=>`Hit all enemies for ${pc(1.1+.18*(r-1))}.`,cast:(C,r)=>C.aoe(1.1+.18*(r-1),{icon:'🏹',proj:'➶'})},
   {id:'mark',n:"Hunter's Mark",i:'🔻',lv:8,max:5,cd:8,cost:20,cond:C=>C.tgt()&&!C.tgt().hmark,d:r=>`Marked target takes +${15+3*(r-1)}% damage.`,cast:(C,r)=>{const t=C.tgt();t.hmark=1;t.mark=Math.max(t.mark||0,(15+3*(r-1))/100)}},
   {id:'bcmd',n:'Beast Command',i:'🐾',lv:15,max:5,cd:8,cost:30,d:r=>`Your wolf mauls the target for ${pc(3+.5*(r-1))} (pet damage).`,cast:(C,r)=>C.petHit(C.tgt(),3+.5*(r-1))},
   {id:'rain',n:'Arrow Rain',i:'🌧️',lv:25,max:5,cd:15,cost:60,d:r=>`Arrows strike all enemies 5 times for ${pc(.7+.12*(r-1))}.`,cast:(C,r)=>{for(let k=0;k<5;k++)C.aoe(.7+.12*(r-1),{icon:'🌧️'})}},
  ],
  passives:[
   {id:'bond',n:'Companion Bond',i:'🐾',lv:1,max:10,d:r=>`+${12*r}% pet damage`,ap:(d,r)=>d.petDmg+=12*r},
   {id:'eagle',n:'Eagle Eye',i:'🦅',lv:1,max:10,d:r=>`+${1.5*r}% crit chance`,ap:(d,r)=>d.crit+=1.5*r},
   {id:'favored',n:'Favored Enemy',i:'🐉',lv:5,max:10,d:r=>`+${8*r}% damage vs beasts & dragons`,ap:(d,r)=>{d.vs.beast=(d.vs.beast||0)+8*r;d.vs.dragon=(d.vs.dragon||0)+8*r}},
   {id:'quiver',n:'Swift Quiver',i:'🪶',lv:10,max:10,d:r=>`+${3*r}% haste`,ap:(d,r)=>d.haste+=3*r},
   {id:'volley',n:'Volley',i:'🎆',lv:20,max:10,d:r=>`${3*r}% chance for auto-attacks to hit all enemies`,ap:(d,r)=>d.volley+=3*r},
   {id:'pack',n:'Pack Tactics',i:'🐺',lv:30,max:10,d:r=>`+${5*r}% damage, +${5*r}% max HP`,ap:(d,r)=>{d.dmgPct+=5*r;d.hpPct+=5*r}},
  ],
  subs:[{id:'beast',n:'Beastcaller',i:'🐻',d:'Pet damage +100%, pet attacks 30% faster',ap:d=>{d.petDmg+=100;d.petSpeed+=30}},
        {id:'dead',n:'Deadeye',i:'🎯',d:'+15% crit chance, +40% crit damage',ap:d=>{d.crit+=15;d.critDmg+=40}}]},
 paladin:{n:'Paladin',i:'🦸',w:'🔨',wn:['Warhammer','Holy Blade','Flail'],color:'#f2c14e',main:'str',atk:1.7,crit:5,
  growth:{str:1.8,dex:.4,con:1.6,int:.3,wis:.6,cha:1},
  res:{n:'Holy Power',color:'#ffcc33',max:()=>5,regen:()=>0,start:0,onAtk:1,discrete:true},
  mech:'Auto-attacks build <b>Holy Power</b> (max 5). Spend it on <b>Divine Smite</b> and <b>Consecration</b>. Exceptionally sturdy.',
  skills:[
   {id:'crus',n:'Crusader Strike',i:'⚔️',lv:1,max:5,cd:3,cost:0,d:r=>`Deal ${pc(1.4+.2*(r-1))}, +1 Holy Power.`,cast:(C,r)=>{C.hit(C.tgt(),1.4+.2*(r-1),{icon:'⚔️'});C.gain(1)}},
   {id:'smite',n:'Divine Smite',i:'⚡',lv:3,max:5,cd:2,cost:3,d:r=>`Spend 3 HP: radiant ${pc(2.2+.4*(r-1))}, +50% vs undead/fiends.`,cast:(C,r)=>{const t=C.tgt();const b=t&&(t.def.tags.includes('undead')||t.def.tags.includes('fiend'))?1.5:1;C.hit(t,(2.2+.4*(r-1))*b*C.d.smiteMult,{icon:'⚡',color:'#fff1a8',spell:1})}},
   {id:'loh',n:'Lay on Hands',i:'🤲',lv:8,max:5,cd:60,cost:0,cond:C=>C.hpPct()<.35,d:r=>`Below 35% HP: heal ${60+8*(r-1)}%.`,cast:(C,r)=>C.healPct((60+8*(r-1))/100)},
   {id:'consec',n:'Consecration',i:'🔆',lv:15,max:5,cd:10,cost:2,d:r=>`Spend 2 HP: holy ground burns all enemies ${pc(.5+.1*(r-1))}/s for 6s.`,cast:(C,r)=>C.enemiesAlive().forEach(e=>C.dot(e,.5+.1*(r-1),6,'🔆'))},
   {id:'wrath',n:'Avenging Wrath',i:'👼',lv:25,max:5,cd:40,cost:0,d:r=>`+${40+10*(r-1)}% damage and 20% damage reduction for 12s.`,cast:(C,r)=>C.buff('wrath',12,{dmgPct:40+10*(r-1),dr:20},'👼')},
  ],
  passives:[
   {id:'aura',n:'Aura of Protection',i:'🛡️',lv:1,max:10,d:r=>`${2*r}% damage reduction`,ap:(d,r)=>d.dr+=2*r},
   {id:'hstr',n:'Holy Strength',i:'💪',lv:1,max:10,d:r=>`+${5*r}% damage`,ap:(d,r)=>d.dmgPct+=5*r},
   {id:'rvig',n:'Righteous Vigor',i:'❤️',lv:5,max:10,d:r=>`+${6*r}% max HP`,ap:(d,r)=>d.hpPct+=6*r},
   {id:'zeal',n:'Zeal',i:'🔥',lv:10,max:10,d:r=>`+${3*r}% haste`,ap:(d,r)=>d.haste+=3*r},
   {id:'radch',n:'Radiant Champion',i:'☀️',lv:20,max:10,d:r=>`+${8*r}% damage vs undead & fiends`,ap:(d,r)=>{d.vs.undead=(d.vs.undead||0)+8*r;d.vs.fiend=(d.vs.fiend||0)+8*r}},
   {id:'bhammer',n:'Blessed Hammer',i:'🔨',lv:30,max:10,d:r=>`${3*r}% chance on hit for +1 Holy Power`,ap:(d,r)=>d.hpProc+=3*r},
  ],
  subs:[{id:'bulw',n:'Bulwark',i:'🏰',d:'+30% armor, +20% max HP',ap:d=>{d.armorPct+=30;d.hpPct+=20}},
        {id:'aven',n:'Avenger',i:'⚡',d:'+30% Divine Smite damage, +15% haste',ap:d=>{d.smiteMult*=1.3;d.haste+=15}}]},
 warlock:{n:'Warlock',i:'🧛',w:'🔮',wn:['Pact Rod','Hexblade','Bone Wand'],color:'#a64dff',main:'cha',atk:1.8,autoMult:.7,crit:5,
  growth:{str:.3,dex:.5,con:1.1,int:.8,wis:.4,cha:2},
  res:{n:'Mana',color:'#8a3dff',max:d=>80+d.cha,regen:d=>2.5,start:1},
  souls:true,
  mech:'Low mana regen, but <b>Life Tap</b> turns HP into mana. Kills harvest <b>Souls</b> (each +6% Eldritch Blast damage). Can summon an <b>Imp</b>.',
  skills:[
   {id:'eblast',n:'Eldritch Blast',i:'🟣',lv:1,max:5,cd:1.8,cost:8,d:r=>`Deal ${pc(1.3+.2*(r-1))} (+6% per Soul).`,cast:(C,r)=>C.hit(C.tgt(),(1.3+.2*(r-1))*(1+.06*C.h.souls)*C.d.ebMult,{icon:'🟣',spell:1,proj:'🟣',color:'#b06cff'})},
   {id:'hex',n:'Hex',i:'🌀',lv:3,max:5,cd:8,cost:15,cond:C=>C.tgt()&&!C.tgt().hexed,d:r=>`Curse: ${pc(.5+.1*(r-1))}/s for 10s and +10% damage taken.`,cast:(C,r)=>{const t=C.tgt();t.hexed=1;t.mark=Math.max(t.mark||0,.1);C.dot(t,.5+.1*(r-1),10,'🌀')}},
   {id:'ltap',n:'Life Tap',i:'🩸',lv:8,max:5,cd:4,cost:0,cond:C=>C.h.res<C.resMax()*.4&&C.hpPct()>.5,d:r=>`Sacrifice 10% HP for ${40+10*(r-1)} mana.`,cast:(C,r)=>{C.h.hp-=C.d.maxHp*.1;C.h.res=Math.min(C.resMax(),C.h.res+40+10*(r-1))}},
   {id:'imp',n:'Summon Imp',i:'😈',lv:15,max:5,cd:25,cost:40,cond:C=>!C.d.permImp&&C.h.impT<=0,d:r=>`Imp fights for 20s, ${pc(.8+.15*(r-1))} per bolt.`,cast:(C,r)=>{C.h.impT=20;C.h.impMult=.8+.15*(r-1)}},
   {id:'harvest',n:'Soul Harvest',i:'💀',lv:25,max:5,cd:15,cost:20,cond:C=>C.h.souls>=5,d:r=>`Consume 5 Souls: hit all enemies for ${pc(4+.6*(r-1))}.`,cast:(C,r)=>{C.h.souls-=5;C.aoe(4+.6*(r-1),{icon:'💀',spell:1,shake:1,color:'#c58bff'})}},
  ],
  passives:[
   {id:'dpact',n:'Dark Pact',i:'📜',lv:1,max:10,d:r=>`+${6*r}% damage`,ap:(d,r)=>d.dmgPct+=6*r},
   {id:'siphon',n:'Soul Siphon',i:'🫀',lv:1,max:10,d:r=>`+${1*r}% lifesteal`,ap:(d,r)=>d.lifesteal+=r},
   {id:'agon',n:'Agonizing Blast',i:'💜',lv:5,max:10,d:r=>`+${8*r}% Eldritch Blast damage`,ap:(d,r)=>d.ebMult*=1+.08*r},
   {id:'fvig',n:'Fiendish Vigor',i:'🖤',lv:10,max:10,d:r=>`+${6*r}% max HP`,ap:(d,r)=>d.hpPct+=6*r},
   {id:'hoard',n:'Soul Hoarder',i:'👻',lv:20,max:5,d:r=>`+${2*r} max Souls`,ap:(d,r)=>d.soulMax+=2*r},
   {id:'emind',n:'Eldritch Mind',i:'🧿',lv:30,max:10,d:r=>`+${10*r}% mana regen, +${4*r}% pet damage`,ap:(d,r)=>{d.resRegen+=10*r;d.petDmg+=4*r}},
  ],
  subs:[{id:'reaver',n:'Soulreaver',i:'💀',d:'Heal 5% max HP per kill, +5 max Souls',ap:d=>{d.killHeal+=5;d.soulMax+=5}},
        {id:'void',n:'Voidcaller',i:'🌌',d:'Your Imp is permanent, +50% pet damage',ap:d=>{d.permImp=1;d.petDmg+=50}}]},
};
D.CLASS_ORDER = ['fighter','wizard','rogue','cleric','ranger','paladin','warlock'];
D.CLASS_UNLOCK = {
  fighter:{d:'Available from the start'}, wizard:{d:'Available from the start'}, rogue:{d:'Available from the start'},
  cleric:{d:'Reach 10 total class levels',test:s=>totalClassLevels(s)>=10},
  ranger:{d:'Defeat Old Grizzlemaw',test:s=>s.zones[0].cleared||s.stats.everCleared>0},
  paladin:{d:'Defeat The Hollow Priest',test:s=>s.zones[2].cleared||s.stats.everCleared>2},
  warlock:{d:'Defeat the Crystalback Basilisk',test:s=>s.zones[3].cleared||s.stats.everCleared>3},
  general:{d:'Defeat the Goblin King',test:s=>s.zones[1].cleared||s.stats.everCleared>1},
  worker:{d:'Available from the start'},
  collector:{d:'Find an Epic item',test:s=>s.stats.found[3]>0||s.stats.found[4]>0},
};
D.SUB_LEVEL = 20; D.MULTI_LEVEL = 20;
function pc(x){return Math.round(x*100)+'%'}
function totalClassLevels(s){let t=0;for(const k in s.classes)t+=s.classes[k].lvl;return t}

/* ---------------- PROFESSIONS ---------------- */
D.PROFS = {
  mining:{n:'Mining',i:'⛏️',kind:'gather',mech:'Pick a vein. Consecutive swings build a <b>Lode Streak</b> (up to +100% yield). Rare chance to unearth gems. Switching veins resets the streak.',
    nodes:[{id:'copper',lv:1,t:6,xp:8,gem:'amethyst'},{id:'iron',lv:12,t:7,xp:22,gem:'ruby'},{id:'mithril',lv:25,t:8,xp:60,gem:'sapphire'},{id:'adamant',lv:40,t:9,xp:160,gem:'emerald'},{id:'starmetal',lv:60,t:10,xp:420,gem:'diamond'}]},
  herbalism:{n:'Herbalism',i:'🌿',kind:'gather',mech:'Tend a <b>garden of plots</b>. Plants grow in real time (twice as fast while tended) and occasionally <b>mutate golden</b> for 5× harvest. Plots keep growing while you do other things.',
    seeds:[{id:'silverleaf',lv:1,t:90,xp:16},{id:'bloodthistle',lv:12,t:150,xp:48},{id:'moonpetal',lv:25,t:240,xp:130},{id:'emberroot',lv:40,t:360,xp:340},{id:'starbloom',lv:60,t:540,xp:900}]},
  smithing:{n:'Smithing',i:'⚒️',kind:'craft',mech:'Forge gear from ore and monster materials. <b>Heat builds</b> while you work; set your <b>strike temperature</b>. Hotter strikes roll far better rarity but risk <b>cracking</b> the piece.',
    tiers:[{id:'copper',n:'Copper',lv:1,il:6,ore:'copper',mat:'pelt',xp:15},{id:'iron',n:'Iron',lv:12,il:18,ore:'iron',mat:'scrap',xp:40},{id:'mithril',n:'Mithril',lv:25,il:32,ore:'mithril',mat:'crystal',xp:100},{id:'adamant',n:'Adamantine',lv:40,il:50,ore:'adamant',mat:'frost',xp:260},{id:'starmetal',n:'Starmetal',lv:60,il:70,ore:'starmetal',mat:'ember',xp:650},{id:'dragon',n:'Dragonforged',lv:75,il:88,ore:'starmetal',mat:'scale',xp:1500}]},
  alchemy:{n:'Alchemy',i:'⚗️',kind:'craft',mech:'Brew healing potions and powerful elixirs. Each recipe has its own <b>Mastery</b> (0–100) that raises potency and double-brew chance. 4% chance of a <b>volatile reaction</b> that yields a bonus random elixir.',
    recipes:[
      {id:'pot1',n:'Minor Healing Potion',i:'🧃',lv:1,in:{silverleaf:2},xp:12,heal:.2,pot:1},
      {id:'pot2',n:'Healing Potion',i:'🧪',lv:12,in:{bloodthistle:2,silverleaf:1},xp:35,heal:.3,pot:2},
      {id:'might',n:'Elixir of Might',i:'💪',lv:15,in:{bloodthistle:3,ruby:1},xp:60,elix:{dmgPct:25},dur:300},
      {id:'pot3',n:'Greater Healing Potion',i:'🍷',lv:25,in:{moonpetal:2},xp:90,heal:.4,pot:3},
      {id:'fort',n:'Elixir of Fortitude',i:'🛡️',lv:28,in:{moonpetal:3,sapphire:1},xp:120,elix:{hpPct:30,armorPct:30},dur:300},
      {id:'pot4',n:'Superior Healing Potion',i:'🏺',lv:40,in:{emberroot:2,bone:1},xp:220,heal:.5,pot:4},
      {id:'fortune',n:'Elixir of Fortune',i:'🍀',lv:42,in:{emberroot:3,emerald:1},xp:260,elix:{gold:50,mf:50},dur:300},
      {id:'pot5',n:'Supreme Healing Potion',i:'❤️‍🔥',lv:55,in:{starbloom:2},xp:550,heal:.6,pot:5},
      {id:'swift',n:'Elixir of Swiftness',i:'🌪️',lv:58,in:{starbloom:3,diamond:1},xp:620,elix:{haste:25},dur:300},
      {id:'sage',n:"Sage's Draught",i:'📖',lv:72,in:{starbloom:3,ichor:2},xp:1200,elix:{xp:60},dur:300},
    ]},
  enchanting:{n:'Enchanting',i:'🔮',kind:'craft',mech:'Spend <b>Arcane Dust</b> (from salvaging gear) to push an equipped item to <b>+15</b>. Each + adds 10% to the item. Success chance falls as it climbs; failures at +5 or higher can drop a level unless a <b>gem ward</b> is consumed.'},
  cooking:{n:'Cooking',i:'🍳',kind:'craft',mech:'Cook meals from monster meat and herbs. Meals grant a long buff. Higher skill means fewer <b>burnt</b> dishes and more <b>Perfect</b> dishes (+50% effect). Cooking a dish 25/100/500 times earns its permanent <b>Signature</b> bonus.',
    recipes:[
      {id:'haunch',n:'Roast Haunch',i:'🍖',lv:1,in:{meat:2},xp:12,buff:{hpPct:15},sig:{hpPct:1}},
      {id:'steak',n:'Herb-Crusted Steak',i:'🥩',lv:8,in:{meat:2,silverleaf:1},xp:30,buff:{dmgPct:10,regenPct:.3},sig:{dmgPct:1}},
      {id:'stew',n:"Hunter's Stew",i:'🍲',lv:20,in:{meat:3,bloodthistle:1},xp:75,buff:{dmgPct:15,xp:10},sig:{xp:1}},
      {id:'pie',n:'Moonlit Pie',i:'🥧',lv:35,in:{meat:3,moonpetal:2},xp:180,buff:{dmgPct:20,hpPct:20},sig:{hpPct:2}},
      {id:'chili',n:'Dragonfire Chili',i:'🌶️',lv:50,in:{meat:4,emberroot:2,ember:1},xp:420,buff:{dmgPct:30,haste:15},sig:{dmgPct:2}},
      {id:'feast',n:'Feast of Heroes',i:'🍗',lv:70,in:{meat:5,starbloom:1,scale:1},xp:1000,buff:{dmgPct:40,hpPct:40,xp:20},sig:{xp:3}},
    ]},
};
D.PROF_ORDER = ['mining','herbalism','smithing','alchemy','enchanting','cooking'];

/* ---------------- RELICS (ultra-rare, visible, account-wide permanent) ---------------- */
D.RELICS = [
  {id:'eye',n:"Sage's Third Eye",i:'👁️‍🗨️',src:{zone:0},odds:20000,d:'+100% XP for all classes and professions.',mods:{xp:100,profXp:100}},
  {id:'idol',n:'Idol of Endless Gold',i:'🗿',src:{zone:1,boss:1},odds:250,d:'+200% Gold Find.',mods:{gold:200}},
  {id:'tome',n:'Tome of Twin Paths',i:'📖',src:{zone:2,boss:1},odds:300,d:'Dual training: every class you are NOT playing also earns 50% of all class XP you gain.',mods:{shareXp:50}},
  {id:'prism',n:'Prism of Fortune',i:'🔺',src:{zone:3},odds:25000,d:'+150% Magic Find and Legendary/Mythic drop weights ×3.',mods:{mf:150,legendW:3}},
  {id:'mirror',n:"Apprentice's Mirror",i:'🪞',src:{prof:'herbalism'},odds:12000,d:'Dual skill gain: every profession action also gives 50% XP to your lowest-level other profession.',mods:{shareProf:50}},
  {id:'pick',n:'The Golden Pick',i:'⛏️',src:{prof:'mining'},odds:15000,d:'Double yield for Mining and Herbalism.',mods:{gatherMult:2}},
  {id:'hourglass',n:'Hourglass of Ages',i:'⌛',src:{zone:4,elite:1},odds:4000,d:'+1 extra action slot (a tireless Familiar working at 100% speed) and +10% offline efficiency.',mods:{extraSlot:1}},
  {id:'philo',n:"Philosopher's Stone",i:'🪨',src:{prof:'alchemy'},odds:10000,d:'Smithing, Alchemy and Cooking produce double output.',mods:{craftMult:2}},
  {id:'shard',n:'Shard of the Limitless',i:'💠',src:{zone:5,boss:1},odds:150,d:'LIMIT BREAK I: damage cap ×100 (99,999 → 9,999,900).',mods:{capMult:100}},
  {id:'sigil',n:'Sigil of Echoes',i:'🔁',src:{zone:6},odds:30000,d:'Every skill has a 30% chance to cast twice.',mods:{echo:30}},
  {id:'heart',n:'Heart of the Wyrm',i:'❤️‍🔥',src:{zone:7,elite:1},odds:5000,d:'+75% damage and +75% max HP, forever.',mods:{dmgPct:75,hpPct:75}},
  {id:'crown',n:'Crown of the Unbound',i:'👑',src:{zone:7,boss:1},odds:400,d:'LIMIT BREAK ∞: removes the damage cap entirely.',mods:{noCap:1}},
  {id:'ladle',n:'Everlasting Ladle',i:'🥄',src:{prof:'cooking'},odds:8000,d:'Meal buffs are doubled in strength and never expire.',mods:{mealMult:2}},
  {id:'clock',n:'Everclock',i:'🕰️',src:{zone:8,boss:1},odds:100,d:'+25% speed for every action: attacks and all professions.',mods:{actSpeed:25}},
  {id:'forge',n:'Ember of the First Forge',i:'🔥',src:{prof:'smithing'},odds:6000,d:'Smithing never cracks, and every forged item gains +1 rarity tier.',mods:{noCrack:1,forgeUp:1}},
];

/* ---------------- TOWN: QoL unlocks ---------------- */
D.QOL = [
  {id:'autoQuaff',n:'Potion Belt',i:'🧪',cost:300,d:'Automatically drink your best healing potion when HP falls below a threshold (set in Settings).'},
  {id:'junk',n:'Junk Sweeper',i:'🧹',cost:250,d:'Automatically sells Common items when looted.'},
  {id:'autoEquip',n:'Quartermaster',i:'🎽',cost:600,d:'Automatically equips dropped gear that raises your Power.'},
  {id:'autoBoss',n:'Boss Bell',i:'🔔',cost:1000,d:'Automatically challenges the zone boss when the kill bar is full (retries after failing).'},
  {id:'apprentice1',n:'Hire Apprentice',i:'🧑‍🔧',cost:3000,d:'+1 action slot: an apprentice runs a profession in parallel (75% speed).'},
  {id:'swiftRevive',n:'Field Medic',i:'⛑️',cost:8000,d:'Revive after 3s instead of 8s.'},
  {id:'filter',n:'Loot Filter',i:'🧾',cost:5000,d:'Choose Keep / Sell / Salvage for each rarity tier, applied automatically.'},
  {id:'autoAdvance',n:"Pathfinder's Map",i:'🗺️',cost:5000,d:'After defeating a zone boss, automatically advance to the next zone.'},
  {id:'autoHarvest',n:'Scarecrow',i:'🎃',cost:10000,d:'Garden plots are harvested and replanted automatically even when no one is tending them.'},
  {id:'sellsword',n:'Hire Sellsword',i:'🗡️',cost:15000,d:'A sellsword joins your party and fights alongside you.'},
  {id:'autoEat',n:'Mess Hall',i:'🍽️',cost:15000,d:'Automatically eat your best meal when no meal buff is active.'},
  {id:'hounds',n:'Hunting Hounds',i:'🐕',cost:25000,d:'Monsters are found 30% faster between fights.'},
  {id:'autoElixir',n:'Elixir Rack',i:'🧴',cost:40000,d:'Automatically drink elixirs to keep their buffs up.'},
  {id:'hourglass1',n:'Traveler\'s Hourglass',i:'⏳',cost:50000,d:'Offline progress cap 2h → 6h.'},
  {id:'apprentice2',n:'Hire Journeyman',i:'👷',cost:120000,d:'+1 more action slot (75% speed).'},
  {id:'acolyte',n:'Hire Acolyte',i:'🧑‍⚕️',cost:150000,d:'A healer joins your party, mending you during battle.'},
  {id:'ledger',n:"Steward's Ledger",i:'📒',cost:400000,d:'+15% Action Points from all sources.'},
  {id:'hourglass2',n:'Sands of Eternity',i:'⌛',cost:2e6,d:'Offline progress cap 6h → 12h.'},
  {id:'apprentice3',n:'Hire Master Artisan',i:'🧑‍🏭',cost:5e6,d:'+1 more action slot (75% speed).'},
];
D.SATCHEL = {base:2000,mult:3,max:6,add:10};
D.PLOTS = {base:1500,mult:2.6,max:6};
D.GUILD = [
  {id:'armory',n:'Armory',i:'⚔️',base:60,mult:1.28,d:l=>`+${5*l}% damage`,ap:(d,l)=>d.dmgPct+=5*l},
  {id:'barracks',n:'Barracks',i:'🏯',base:60,mult:1.28,d:l=>`+${5*l}% max HP`,ap:(d,l)=>d.hpPct+=5*l},
  {id:'bank',n:'Counting House',i:'🏦',base:100,mult:1.3,d:l=>`+${6*l}% gold find`,ap:(d,l)=>d.gold+=6*l},
  {id:'library',n:'Library',i:'📚',base:100,mult:1.3,d:l=>`+${5*l}% XP`,ap:(d,l)=>d.xp+=5*l},
  {id:'training',n:'Training Grounds',i:'🎯',base:150,mult:1.3,d:l=>`+${4*l}% profession speed`,ap:(d,l)=>d.profSpeed+=4*l},
  {id:'vault',n:'Treasure Vault',i:'🗝️',base:200,mult:1.32,d:l=>`+${4*l}% magic find`,ap:(d,l)=>d.mf+=4*l},
  {id:'smithy',n:'Town Smithy',i:'🔥',base:250,mult:1.3,d:l=>`+${4*l}% armor, +${2*l}% crit damage`,ap:(d,l)=>{d.armorPct+=4*l;d.critDmg+=2*l}},
];
D.TOOLS = {base:400,mult:4,max:6,names:['Basic','Bronze','Iron','Steel','Mithril','Runed','Legendary']};

/* ---------------- ASCENSION ---------------- */
D.ASTRAL = [
  {id:'might',n:'Astral Might',i:'🌟',base:1,mult:1.45,max:100,d:l=>`+${15*l}% damage`,ap:(d,l)=>d.dmgPct+=15*l},
  {id:'vigor',n:'Astral Vigor',i:'💫',base:1,mult:1.45,max:100,d:l=>`+${15*l}% max HP`,ap:(d,l)=>d.hpPct+=15*l},
  {id:'wisdom',n:'Wisdom of Ages',i:'📜',base:1,mult:1.5,max:50,d:l=>`+${20*l}% XP`,ap:(d,l)=>d.xp+=20*l},
  {id:'golden',n:'Golden Touch',i:'🪙',base:1,mult:1.5,max:50,d:l=>`+${20*l}% gold`,ap:(d,l)=>d.gold+=20*l},
  {id:'luck',n:'Lucky Star',i:'🍀',base:2,mult:1.6,max:30,d:l=>`+${10*l}% magic find`,ap:(d,l)=>d.mf+=10*l},
  {id:'artisan',n:'Artisan Spirit',i:'🛠️',base:2,mult:1.5,max:30,d:l=>`+${10*l}% profession speed & XP`,ap:(d,l)=>{d.profSpeed+=10*l;d.profXp+=10*l}},
  {id:'memory',n:'Guild Memory',i:'🧠',base:5,mult:2,max:5,d:l=>`Keep ${10*l}% of profession levels on Ascension`},
  {id:'prodigy',n:'Prodigy',i:'🎓',base:4,mult:2,max:5,d:l=>`+1 bonus skill point every ${[0,10,8,6,5,4][l]||'—'} class levels`},
  {id:'headstart',n:'Head Start',i:'🚩',base:3,mult:2.2,max:5,d:l=>`Start each run with the first ${l} zone(s) cleared + ${fmtPlain(1000*Math.pow(10,l))} gold`},
  {id:'limit',n:'Limit Breaker',i:'💥',base:5,mult:2,max:10,d:l=>`Damage cap +${100*l}%`,ap:(d,l)=>d.capMult*=1+l},
  {id:'relicLuck',n:'Relic Sense',i:'🧭',base:8,mult:2,max:5,d:l=>`Relic drop odds +${25*l}% (shown in the Codex)`},
  {id:'haste',n:'Astral Haste',i:'🌀',base:6,mult:1.8,max:10,d:l=>`+${5*l}% speed for all actions`,ap:(d,l)=>{d.actSpeed+=5*l}},
  {id:'mythic',n:'Mythic Attunement',i:'🔴',base:15,mult:1,max:1,d:l=>`Mythic items can drop`},
  {id:'familiar',n:'Astral Familiar',i:'🦉',base:25,mult:1,max:1,d:l=>`+1 action slot (100% speed)`},
];
function fmtPlain(n){return n>=1e6?(n/1e6)+'M':n>=1e3?(n/1e3)+'K':''+n}

/* ---------------- ACHIEVEMENTS (+1% damage & gold each) ---------------- */
D.ACH = [
  {id:'k100',n:'Pest Control',d:'Defeat 100 monsters',t:s=>s.stats.kills>=100},
  {id:'k1k',n:'Monster Hunter',d:'Defeat 1,000 monsters',t:s=>s.stats.kills>=1e3},
  {id:'k10k',n:'Slayer',d:'Defeat 10,000 monsters',t:s=>s.stats.kills>=1e4},
  {id:'k100k',n:'Living Legend',d:'Defeat 100,000 monsters',t:s=>s.stats.kills>=1e5},
  {id:'el50',n:'Elite Breaker',d:'Defeat 50 elites',t:s=>s.stats.elites>=50},
  {id:'l10',n:'Adventurer',d:'Reach class level 10',t:s=>maxClassLevel(s)>=10},
  {id:'l25',n:'Veteran',d:'Reach class level 25',t:s=>maxClassLevel(s)>=25},
  {id:'l50',n:'Champion',d:'Reach class level 50',t:s=>maxClassLevel(s)>=50},
  {id:'l75',n:'Hero of the Realm',d:'Reach class level 75',t:s=>maxClassLevel(s)>=75},
  {id:'l100',n:'Paragon',d:'Reach class level 100',t:s=>maxClassLevel(s)>=100},
  {id:'multi',n:'Jack of All Trades',d:'Reach level 10 in 4 classes',t:s=>Object.values(s.classes).filter(c=>c.lvl>=10).length>=4},
  {id:'all7',n:'Pantheon',d:'Reach level 20 in all 7 classes',t:s=>Object.values(s.classes).filter(c=>c.lvl>=20).length>=7},
  ...[0,1,2,3,4,5,6,7].map(i=>({id:'z'+i,n:'Conqueror: '+['Woods','Warrens','Crypt','Caverns','Peaks','Volcano','Abyss','Roost'][i],d:'Defeat the boss of '+['Whispering Woods','Goblin Warrens','Sunken Crypt','Crystal Caverns','Frostfang Peaks','Ashen Volcano','Abyssal Rift',"Dragon's Roost"][i],t:s=>s.zones[i].cleared||s.stats.everCleared>i})),
  {id:'rift10',n:'Into the Abyss',d:'Reach Rift depth 10',t:s=>s.riftLevel>=10},
  {id:'g1k',n:'Pocket Change',d:'Earn 1,000 gold',t:s=>s.stats.gold>=1e3},
  {id:'g1m',n:'Merchant Prince',d:'Earn 1M gold',t:s=>s.stats.gold>=1e6},
  {id:'g1b',n:'Dragon Hoard',d:'Earn 1B gold',t:s=>s.stats.gold>=1e9},
  {id:'epic',n:'Purple Haze',d:'Find an Epic item',t:s=>s.stats.found[3]>0},
  {id:'leg',n:'Legendary!',d:'Find a Legendary item',t:s=>s.stats.found[4]>0},
  {id:'myth',n:'Myth Made Real',d:'Find a Mythic item',t:s=>s.stats.found[5]>0},
  {id:'relic1',n:'Relic Hunter',d:'Discover a Relic',t:s=>Object.keys(s.relics).length>=1},
  {id:'relic5',n:'Curator',d:'Discover 5 Relics',t:s=>Object.keys(s.relics).length>=5},
  {id:'ench10',n:'Arcane Artisan',d:'Enchant an item to +10',t:s=>s.stats.maxEnch>=10},
  {id:'ench15',n:'Perfection',d:'Enchant an item to +15',t:s=>s.stats.maxEnch>=15},
  ...['mining','herbalism','smithing','alchemy','enchanting','cooking'].map(p=>({id:'p25'+p,n:'Journeyman '+D.PROFS[p].n,d:'Reach '+D.PROFS[p].n+' level 25',t:s=>s.profs[p].lvl>=25||s.stats.profMax[p]>=25})),
  {id:'p50',n:'Grandmaster',d:'Reach level 50 in any profession',t:s=>Object.values(s.stats.profMax).some(v=>v>=50)},
  {id:'asc1',n:'Ascendant',d:'Ascend for the first time',t:s=>s.ascensions>=1},
  {id:'asc5',n:'Star-Touched',d:'Ascend 5 times',t:s=>s.ascensions>=5},
  {id:'sub',n:'Specialist',d:'Choose a subclass',t:s=>Object.values(s.classes).some(c=>c.sub)},
  {id:'dual',n:'Multiclassed',d:'Choose a secondary class',t:s=>!!s.cls2},
];
function maxClassLevel(s){let m=0;for(const k in s.classes)m=Math.max(m,s.classes[k].lvl);return m}


/* =====================================================================
   v2 — new classes, professions, relics, Action Point masteries
   ===================================================================== */
Object.assign(D.CLASSES,{
 general:{n:'General',i:'🤴',w:'🚩',wn:['Command Sabre','Marshal\'s Baton','War Standard'],color:'#d4a017',main:'cha',atk:1.8,autoMult:.8,crit:5,
  growth:{str:1.1,dex:.5,con:1.3,int:.8,wis:.6,cha:1.8},
  res:{n:'Command',color:'#d4a017',max:()=>100,regen:()=>6,start:.5},
  troops:true,
  mech:'Leads a company of <b>Troops</b> that fight every 2 seconds as one. <b>Muster</b> recruits more; troops can fall when you are struck. <b>Command</b> fuels orders: volleys, charges and shield walls.',
  skills:[
   {id:'muster',n:'Muster',i:'📯',lv:1,max:5,cd:6,cost:30,cond:C=>C.h.troops<C.d.troopMax,d:r=>`Recruit ${1+r} troops (max set by Logistics & level).`,cast:(C,r)=>{C.h.troops=Math.min(C.d.troopMax,C.h.troops+1+r)}},
   {id:'volley',n:'Volley Order',i:'🏹',lv:3,max:5,cd:5,cost:25,cond:C=>C.h.troops>=3,d:r=>`Every troop looses arrows: all enemies take ${pc(.1+.02*(r-1))} per troop.`,cast:(C,r)=>C.aoe((.1+.02*(r-1))*C.h.troops*(1+C.d.troopDmg/100),{icon:'🏹',proj:'➶'})},
   {id:'wall',n:'Shield Wall',i:'🛡️',lv:8,max:5,cd:20,cost:35,d:r=>`Troops brace: +${20+5*(r-1)}% damage reduction for 8s.`,cast:(C,r)=>C.buff('wall',8,{dr:20+5*(r-1)},'🛡️')},
   {id:'charge',n:'Cavalry Charge',i:'🐎',lv:15,max:5,cd:10,cost:40,cond:C=>C.h.troops>=5,d:r=>`Ride down the target for ${pc(.3+.06*(r-1))} per troop.`,cast:(C,r)=>C.hit(C.tgt(),(.3+.06*(r-1))*C.h.troops*(1+C.d.troopDmg/100),{icon:'🐎',big:1})},
   {id:'rally',n:'Rally the Line',i:'🎺',lv:25,max:5,cd:30,cost:50,d:r=>`Heal ${15+3*(r-1)}% HP and recruit 5 troops.`,cast:(C,r)=>{C.healPct((15+3*(r-1))/100);C.h.troops=Math.min(C.d.troopMax,C.h.troops+5)}},
  ],
  passives:[
   {id:'drill',n:'Drillmaster',i:'🥁',lv:1,max:10,d:r=>`+${10*r}% troop damage`,ap:(d,r)=>d.troopDmg+=10*r},
   {id:'logist',n:'Logistics',i:'📦',lv:1,max:10,d:r=>`+${2*r} max troops`,ap:(d,r)=>d.troopMax+=2*r},
   {id:'vets',n:'Veterans',i:'🎖️',lv:5,max:10,d:r=>`Troops are ${5*r}% less likely to fall`,ap:(d,r)=>d.troopSafe+=5*r},
   {id:'presence',n:'Inspiring Presence',i:'✨',lv:10,max:10,d:r=>`+${r}% damage per 5 troops`,ap:(d,r)=>d.presence+=r},
   {id:'quarter',n:'Quartermaster',i:'🧾',lv:20,max:10,d:r=>`+${10*r}% Command regeneration`,ap:(d,r)=>d.resRegen+=10*r},
   {id:'banner',n:'War Banners',i:'🚩',lv:30,max:10,d:r=>`+${6*r}% max HP`,ap:(d,r)=>d.hpPct+=6*r},
  ],
  subs:[{id:'marshal',n:'Warmarshal',i:'⚔️',d:'Troop damage +100%, +5 max troops',ap:d=>{d.troopDmg+=100;d.troopMax+=5}},
        {id:'castellan',n:'Castellan',i:'🏰',d:'Troops 50% less likely to fall, +20% max HP',ap:d=>{d.troopSafe+=50;d.hpPct+=20}}],
  apNode:{n:'Recruiting Office',d:r=>`+${r} max troops`,ap:(d,r)=>d.troopMax+=r}},
 worker:{n:'Worker',i:'👷',w:'🔧',wn:['Shovel','Sledge','Wrench'],color:'#e8963a',main:'con',atk:1.9,autoMult:.6,crit:4,
  growth:{str:1,dex:.6,con:1.5,int:.5,wis:.7,cha:.4},
  res:{n:'Stamina',color:'#e8963a',max:()=>100,regen:()=>4,start:1},
  inherent:d=>{d.profApPct+=200;d.profSpeed+=20;d.profXp+=20},
  mech:'No combat specialty — a weak fighter. But while a Worker is your active class, every profession earns <b>3× Action Points</b> and works 20% faster with +20% profession XP.',
  skills:[
   {id:'swing',n:'Shovel Swing',i:'🪏',lv:1,max:5,cd:3,cost:20,d:r=>`Whack for ${pc(1.3+.2*(r-1))}.`,cast:(C,r)=>C.hit(C.tgt(),1.3+.2*(r-1),{icon:'🪏'})},
   {id:'toss',n:'Toolbox Toss',i:'🧰',lv:3,max:5,cd:6,cost:35,d:r=>`Hit all enemies for ${pc(.8+.15*(r-1))}.`,cast:(C,r)=>C.aoe(.8+.15*(r-1),{icon:'🧰',proj:'🔧'})},
   {id:'grit',n:'Grit',i:'😤',lv:8,max:5,cd:20,cost:30,cond:C=>C.hpPct()<.6,d:r=>`Below 60% HP heal ${15+4*(r-1)}%.`,cast:(C,r)=>C.healPct((15+4*(r-1))/100)},
   {id:'overtime',n:'Overtime',i:'⏱️',lv:15,max:5,cd:25,cost:40,d:r=>`+${20+5*(r-1)}% damage and haste for 10s.`,cast:(C,r)=>C.buff('ot',10,{dmgPct:20+5*(r-1),haste:20+5*(r-1)},'⏱️')},
   {id:'demolish',n:'Demolish',i:'🏗️',lv:25,max:5,cd:14,cost:60,d:r=>`Bring the house down: ${pc(3.5+.5*(r-1))} to the target.`,cast:(C,r)=>C.hit(C.tgt(),3.5+.5*(r-1),{icon:'🏗️',big:1})},
  ],
  passives:[
   {id:'callous',n:'Calloused Hands',i:'✋',lv:1,max:10,d:r=>`+${6*r}% max HP`,ap:(d,r)=>d.hpPct+=6*r},
   {id:'effic',n:'Efficiency',i:'⚙️',lv:1,max:10,d:r=>`+${4*r}% profession speed`,ap:(d,r)=>d.profSpeed+=4*r},
   {id:'union',n:'Union Card',i:'🪪',lv:5,max:10,d:r=>`+${10*r}% profession AP`,ap:(d,r)=>d.profApPct+=10*r},
   {id:'tinker',n:'Tinkerer',i:'🔩',lv:10,max:10,d:r=>`+${r}% profession success chance`,ap:(d,r)=>d.profSucc+=r},
   {id:'mule',n:'Pack Mule',i:'🫏',lv:20,max:10,d:r=>`+${3*r}% chance of bonus yield`,ap:(d,r)=>d.bounty+=3*r},
   {id:'sturdy',n:'Sturdy Frame',i:'🧱',lv:30,max:10,d:r=>`${2*r}% damage reduction`,ap:(d,r)=>d.dr+=2*r},
  ],
  subs:[{id:'foreman',n:'Foreman',i:'📋',d:'Your helpers work 25% faster',ap:d=>{d.helperEff+=25}},
        {id:'artisan',n:'Artisan',i:'🛠️',d:'+8% profession success, +50% profession AP',ap:d=>{d.profSucc+=8;d.profApPct+=50}}],
  apNode:{n:'Guild Dues',d:r=>`+${3*r}% profession AP (all classes' Worker pool)`,ap:(d,r)=>d.profApPct+=3*r}},
 collector:{n:'Collector',i:'🕵️',w:'💰',wn:['Cane','Jeweled Dirk','Collector\'s Whip'],color:'#2ec4b6',main:'dex',atk:1.4,crit:8,
  growth:{str:.5,dex:1.6,con:.6,int:.9,wis:.5,cha:1.2},
  res:{n:'Greed',color:'#2ec4b6',max:()=>100,regen:()=>5,start:0,onAtk:5},
  inherent:d=>{d.hpPct-=40;d.armorPct-=40;d.gold+=60;d.mf+=60;d.relicLuck+=25;d.dropPct+=30},
  mech:'Fragile (−40% HP and armor) but greedy: <b>+60% gold, +60% magic find, +30% item drops and +25% relic odds</b>. Attacks build <b>Greed</b>.',
  skills:[
   {id:'snatch',n:'Snatch',i:'🫳',lv:1,max:5,cd:3,cost:25,d:r=>`Hit for ${pc(1.4+.2*(r-1))} and pocket some coin.`,cast:(C,r)=>{const t=C.tgt();if(t){C.hit(t,1.4+.2*(r-1),{icon:'🫳'});C.steal(t,.3+.1*(r-1))}}},
   {id:'appraise',n:'Appraise',i:'🧐',lv:3,max:5,cd:15,cost:30,d:r=>`+${30+10*(r-1)}% magic find for 15s.`,cast:(C,r)=>C.buff('appr',15,{mf:30+10*(r-1)},'🧐')},
   {id:'sand',n:'Pocket Sand',i:'🫧',lv:8,max:5,cd:18,cost:30,d:r=>`+${35+5*(r-1)}% dodge for 6s.`,cast:(C,r)=>C.buff('sand',6,{dodge:35+5*(r-1)},'🫧')},
   {id:'tsense',n:'Treasure Sense',i:'🗝️',lv:15,max:5,cd:20,cost:40,cond:C=>C.tgt()&&!C.tgt().loot,d:r=>`Mark a foe: it is guaranteed to drop an item (+${r*10}% magic find on it).`,cast:(C,r)=>{const t=C.tgt();t.loot=r}},
   {id:'coins',n:'Coin Storm',i:'🪙',lv:25,max:5,cd:14,cost:60,d:r=>`Hurl gold at all enemies for ${pc(2.5+.4*(r-1))}.`,cast:(C,r)=>C.aoe(2.5+.4*(r-1),{icon:'🪙',proj:'🪙'})},
  ],
  passives:[
   {id:'keen',n:'Keen Eye',i:'👁️',lv:1,max:10,d:r=>`+${8*r}% magic find`,ap:(d,r)=>d.mf+=8*r},
   {id:'pockets',n:'Deep Pockets',i:'👝',lv:1,max:10,d:r=>`+${8*r}% gold`,ap:(d,r)=>d.gold+=8*r},
   {id:'rhunt',n:'Relic Hunter',i:'🏺',lv:5,max:10,d:r=>`+${4*r}% relic odds`,ap:(d,r)=>d.relicLuck+=4*r},
   {id:'charm',n:'Lucky Charm',i:'🍀',lv:10,max:10,d:r=>`+${1.5*r}% crit chance`,ap:(d,r)=>d.crit+=1.5*r},
   {id:'hoard',n:'Hoarder',i:'📦',lv:20,max:10,d:r=>`+${5*r}% item drop chance`,ap:(d,r)=>d.dropPct+=5*r},
   {id:'escape',n:'Escape Artist',i:'💨',lv:30,max:10,d:r=>`+${2*r}% dodge`,ap:(d,r)=>d.dodge+=2*r},
  ],
  subs:[{id:'thunter',n:'Treasure Hunter',i:'🗺️',d:'+50% relic odds',ap:d=>{d.relicLuck+=50}},
        {id:'fence',n:'Fence',i:'🤝',d:'Items sell for double, +50% gold',ap:d=>{d.sellMult*=2;d.gold+=50}}],
  apNode:{n:'Black Market Contacts',d:r=>`+${3*r}% gold and magic find`,ap:(d,r)=>{d.gold+=3*r;d.mf+=3*r}}},
});
D.CLASS_ORDER.push('general','worker','collector');
// signature AP nodes for the original classes
Object.assign(D.CLASSES.fighter,{apNode:{n:'Berserker Blood',d:r=>`+${3*r}% Rage generation, +${r}% crit`,ap:(d,r)=>{d.resGen+=3*r;d.crit+=r}}});
Object.assign(D.CLASSES.wizard,{apNode:{n:'Arcane Study',d:r=>`+${3*r}% spell damage, slots recharge ${2*r}% faster`,ap:(d,r)=>{d.spellDmg+=3*r;d.slotRate+=2*r}}});
Object.assign(D.CLASSES.rogue,{apNode:{n:'Shadow Training',d:r=>`+${5*r}% sneak attack damage, +${r}% dodge`,ap:(d,r)=>{d.sneak+=5*r;d.dodge+=r}}});
Object.assign(D.CLASSES.cleric,{apNode:{n:'Litany',d:r=>`+${3*r}% healing and Faith generation`,ap:(d,r)=>{d.healPct+=3*r;d.resGen+=3*r}}});
Object.assign(D.CLASSES.ranger,{apNode:{n:'Pack Leader',d:r=>`+${5*r}% pet damage`,ap:(d,r)=>d.petDmg+=5*r}});
Object.assign(D.CLASSES.paladin,{apNode:{n:'Oathkeeper',d:r=>`+${2*r}% armor, +${r}% damage reduction`,ap:(d,r)=>{d.armorPct+=2*r;d.dr+=r}}});
Object.assign(D.CLASSES.warlock,{apNode:{n:'Eldritch Pact',d:r=>`+${3*r}% Eldritch Blast damage`,ap:(d,r)=>{d.ebMult*=1+.03*r}}});

/* ---- new professions ---- */
D.SUMMONS=[
  {id:'wisp',n:'Will-o\'-Wisp',i:'🫧',lv:1,t:16,xp:8,power:1,in:{}},
  {id:'skel',n:'Bone Servant',i:'💀',lv:10,t:19,xp:22,power:2.2,in:{bone:3}},
  {id:'wolf',n:'Dire Wolf',i:'🐺',lv:20,t:22,xp:45,power:4,in:{pelt:5,meat:3}},
  {id:'golem',n:'Crystal Golem',i:'🗿',lv:32,t:25,xp:100,power:7,in:{crystal:5}},
  {id:'wraith',n:'Frost Wraith',i:'👻',lv:45,t:28,xp:220,power:11,in:{frost:5}},
  {id:'drake',n:'Ember Drake',i:'🦎',lv:58,t:31,xp:480,power:16,in:{ember:5}},
  {id:'horror',n:'Void Horror',i:'🦑',lv:70,t:34,xp:900,power:23,in:{ichor:5}},
  {id:'wyrm',n:'Wyrmling',i:'🐲',lv:85,t:38,xp:2000,power:32,in:{scale:5}},
];
D.DANCES=[
  {id:'jig',n:'Tavern Jig',i:'🕺',lv:1,t:5,xp:5,buff:{haste:12},bd:'+12% attack speed'},
  {id:'sword',n:'Sword Dance',i:'🗡️',lv:15,t:6,xp:18,buff:{dmgPct:20},bd:'+20% damage'},
  {id:'veil',n:'Dance of Veils',i:'🧣',lv:30,t:7,xp:50,buff:{dodge:8,hpPct:10},bd:'+8% dodge, +10% HP'},
  {id:'waltz',n:'Ember Waltz',i:'💃',lv:45,t:8,xp:130,buff:{gold:40,mf:20},bd:'+40% gold, +20% magic find'},
  {id:'star',n:'Starfall Ballet',i:'🩰',lv:60,t:9,xp:330,buff:{xp:25,profXp:25,profSpeed:10},bd:'+25% XP, +25% profession XP, +10% profession speed'},
];
D.DEITIES=[
  {id:'solara',n:'Solara, the Dawnmother',i:'☀️',lv:1,t:8,xp:7,per:{regenPct:.15,vsUndead:6},bd:t=>`+${(.15*t).toFixed(2)}% HP regen/s, +${6*t}% vs undead`},
  {id:'mordrin',n:'Mordrin of the Anvil',i:'⚒️',lv:12,t:9,xp:22,per:{profSucc:1.2,armorPct:4},bd:t=>`+${(1.2*t).toFixed(1)}% profession success, +${4*t}% armor`},
  {id:'vela',n:'Vela, Lady of Coin',i:'🪙',lv:25,t:10,xp:60,per:{gold:8,mf:6,relicLuck:2},bd:t=>`+${8*t}% gold, +${6*t}% magic find, +${2*t}% relic odds`},
  {id:'thalor',n:'Thalor the Red Banner',i:'🗡️',lv:40,t:11,xp:160,per:{dmgPct:6,crit:1},bd:t=>`+${6*t}% damage, +${t}% crit`},
  {id:'nyx',n:'Nyx, Keeper of Secrets',i:'🌙',lv:55,t:12,xp:400,per:{xp:6,profXp:6,apPct:2},bd:t=>`+${6*t}% XP & profession XP, +${2*t}% AP`},
];
D.PETITIONERS=[
  {id:'elder',n:'Village Elder',i:'👴',lv:1,t:8,xp:8,gold:4,rep:1},
  {id:'guild',n:'Guildmaster',i:'🧑‍💼',lv:12,t:9,xp:22,gold:40,rep:2},
  {id:'baron',n:'Baroness Ilsevar',i:'👸',lv:25,t:10,xp:60,gold:400,rep:4},
  {id:'duke',n:'Duke of the Marches',i:'🤴',lv:40,t:11,xp:160,gold:5000,rep:8},
  {id:'king',n:'The High King',i:'👑',lv:60,t:12,xp:420,gold:80000,rep:16},
];
D.REP_PERKS=[
  {at:50,d:'Town prices −5%'},{at:250,d:'+10% gold from all sources'},{at:1000,d:'Town prices −10% more (−15% total)'},
  {at:3000,d:'+10% Action Points from all sources'},{at:10000,d:'+1 action slot: a Royal Steward joins you'},
];
D.SONGS=[
  {id:'valor',n:'Ballad of Valor',i:'⚔️',lv:1,t:7,xp:7,mods:{dmgPct:30},bd:'damage'},
  {id:'mend',n:'Hymn of Mending',i:'💚',lv:10,t:8,xp:20,mods:{regenPct:1,hpPct:15},bd:'HP & regeneration'},
  {id:'work',n:'Work Song',i:'🪕',lv:20,t:9,xp:45,mods:{profSpeed:30},bd:'profession speed'},
  {id:'lore',n:'Lay of Lore',i:'📜',lv:35,t:10,xp:120,mods:{xp:30,profXp:30},bd:'all XP'},
  {id:'epic',n:'Epic of the Dragonslayers',i:'🐉',lv:55,t:12,xp:380,mods:{dmgPct:50,hpPct:30,crit:5},bd:'damage, HP & crit'},
];
D.FISHING=[
  {id:'pond',n:'Millpond',i:'🐟',lv:1,t:8,xp:8,fish:1},
  {id:'river',n:'Silverrun River',i:'🐠',lv:12,t:9,xp:22,fish:2},
  {id:'lake',n:'Moonmere Lake',i:'🐡',lv:25,t:10,xp:60,fish:3},
  {id:'sea',n:'Frozen Sea',i:'🦈',lv:40,t:11,xp:160,fish:4},
  {id:'trench',n:'Abyssal Trench',i:'🐙',lv:60,t:12,xp:420,fish:6},
];
D.MATS.fish={n:'Fresh Fish',i:'🐟'};
Object.assign(D.PROFS,{
  summoning:{n:'Summoning',i:'🔯',kind:'craft',mech:'Perform binding rituals to call creatures into your <b>Bestiary</b>. Each bound creature either <b>fights</b> beside you or <b>works</b> a profession (adding speed to it). Roster space grows with level; stronger creatures replace the weakest.'},
  dancing:{n:'Dancing',i:'💃',kind:'perform',mech:'Every action is a <b>step</b>. Land 8 steps in a row to finish a <b>routine</b> and gain (or extend, up to 60 min) that dance\'s <b>Grace</b> buff. A missed step <b>breaks your combo</b>.'},
  praying:{n:'Praying',i:'🙏',kind:'perform',mech:'Devote yourself to one <b>deity</b> at a time. Prayers build <b>Favor</b>; favor tiers (1–10) strengthen that deity\'s <b>blessing</b>. Only your current patron blesses you. Rare <b>miracles</b> grant Action Points.'},
  advising:{n:'Advising',i:'📜',kind:'perform',mech:'Counsel petitioners from village elders to the High King. Good counsel earns <b>gold</b> and <b>Reputation</b>; bad counsel costs reputation. Reputation unlocks permanent <b>court perks</b> (discounts, AP, an extra action slot).'},
  bard:{n:'Bard',i:'🎻',kind:'perform',mech:'Perform songs for coin and <b>Fame</b>. Each song has its own <b>mastery</b>; your chosen <b>Anthem</b> buffs you at all times, scaling with its mastery and your Bard level. Fame boosts tips and <b>encore</b> chance.'},
  fishing:{n:'Fishing',i:'🎣',kind:'gather',mech:'Cast and wait — <b>bite time is random</b> (patience!). Fish feed new Cooking recipes, and every cast has a small chance to hook a <b>sunken treasure</b> (an item and gold).'},
});
D.PROF_ORDER.push('summoning','dancing','praying','advising','bard','fishing');
D.PROFS.cooking.recipes.splice(1,0,{id:'trout',n:'Grilled Trout',i:'🐟',lv:5,in:{fish:2},xp:20,buff:{hpPct:10,regenPct:.3},sig:{hpPct:1}});
D.PROFS.cooking.recipes.splice(4,0,{id:'chowder',n:"Seafarer's Chowder",i:'🥣',lv:30,in:{fish:3,moonpetal:1},xp:140,buff:{dmgPct:15,xp:15,profXp:10},sig:{xp:1}});

/* ---- profession relics ---- */
D.RELICS.push(
  {id:'mountain',n:'Heart of the Mountain',i:'🏔️',src:{prof:'mining'},odds:20000,d:'+100% profession Action Points.',mods:{profApPct:100}},
  {id:'rune',n:'Runestone of Certainty',i:'🔷',src:{prof:'enchanting'},odds:5000,d:'+25% enchant success and enchantments never lose levels.',mods:{enchSure:1}},
  {id:'grimoire',n:'Grimoire of the Bound Legion',i:'📕',src:{prof:'summoning'},odds:8000,d:'+2 Bestiary slots and all summons are twice as powerful.',mods:{summonSlots:2,summonMult:2}},
  {id:'slippers',n:'Slippers of the Endless Reel',i:'🩰',src:{prof:'dancing'},odds:15000,d:'+25% speed for every action (attacks and professions).',mods:{actSpeed:25}},
  {id:'halo',n:'Halo of the Saint',i:'😇',src:{prof:'praying'},odds:12000,d:'Double Action Points from all sources.',mods:{apPct:100}},
  {id:'seal',n:'Seal of the High Chancellor',i:'📯',src:{prof:'advising'},odds:10000,d:'+1 action slot (a tireless Chancellor) and +100% gold.',mods:{extraSlot2:1,gold:100}},
  {id:'lute',n:'Lute of a Thousand Tales',i:'🪕',src:{prof:'bard'},odds:10000,d:'Your Anthem is twice as strong, and a second song you know plays at half strength.',mods:{anthemMult:2}},
  {id:'hook',n:"Leviathan's Hook",i:'🪝',src:{prof:'fishing'},odds:15000,d:'+50% odds for EVERY relic.',mods:{relicLuck:50}},
  {id:'twin',n:'Twin-Soul Locket',i:'💞',src:{prof:'summoning'},odds:25000,d:'Dual training: your two lowest professions gain 25% of ALL profession XP you earn.',mods:{dualProf:25}},
  {id:'quill',n:'Quill of the First Scribe',i:'🪶',src:{prof:'advising'},odds:20000,d:'+1 bonus skill point every 5 levels in every class.',mods:{quill:1}},
  {id:'sunstone',n:'Sunstone Rosary',i:'📿',src:{prof:'praying'},odds:25000,d:'+15% success chance for every profession.',mods:{profSucc:15}},
  {id:'apron',n:'Apron of Plenty',i:'🧑‍🍳',src:{prof:'cooking'},odds:15000,d:'+50% chance of bonus yield on every profession action.',mods:{bounty:50}},
);

/* ---- Action Point masteries (permanent; survive Ascension) ---- */
D.AP_GEN=[
  {id:'swift',n:'Swift Hands',i:'🤲',base:15,mult:1.3,max:25,d:r=>`+${2*r}% speed for all actions`,ap:(d,r)=>d.actSpeed+=2*r},
  {id:'mind',n:'Keen Mind',i:'🧠',base:15,mult:1.3,max:30,d:r=>`+${3*r}% class & profession XP`,ap:(d,r)=>{d.xp+=3*r;d.profXp+=3*r}},
  {id:'fortune',n:"Fortune's Favor",i:'🍀',base:20,mult:1.3,max:30,d:r=>`+${3*r}% gold & magic find`,ap:(d,r)=>{d.gold+=3*r;d.mf+=3*r}},
  {id:'relic',n:'Relic Sense',i:'🧭',base:40,mult:1.35,max:30,d:r=>`+${3*r}% odds for every relic`,ap:(d,r)=>d.relicLuck+=3*r},
  {id:'tracker',n:'Tracker',i:'🐾',base:20,mult:1.4,max:10,d:r=>`Monsters found ${6*r}% faster`,ap:(d,r)=>d.search+=6*r},
  {id:'zeal',n:'Daily Zeal',i:'📅',base:25,mult:1.4,max:10,d:r=>`+${50*r} daily bonus (×2 AP) actions`,ap:(d,r)=>d.dailyCap+=50*r},
  {id:'endure',n:'Endurance',i:'❤️',base:15,mult:1.3,max:25,d:r=>`+${3*r}% max HP`,ap:(d,r)=>d.hpPct+=3*r},
  {id:'disc',n:'Discipline',i:'🎯',base:30,mult:1.35,max:25,d:r=>`+${3*r}% Action Points from all sources`,ap:(d,r)=>d.apPct+=3*r},
  {id:'vigil',n:'Night Watch',i:'🌙',base:25,mult:1.3,max:20,d:r=>`Offline efficiency ${20+2*r}% (base 20%)`,ap:()=>{}},
  {id:'helpers',n:'Good Help',i:'🧑‍🔧',base:30,mult:1.35,max:20,d:r=>`Helpers work ${2*r}% faster`,ap:(d,r)=>d.helperEff+=2*r},
];
D.AP_CLASS=[
  {id:'tempo',n:'Battle Tempo',i:'⏩',base:10,mult:1.22,max:30,d:r=>`+${1.5*r}% attack speed`,ap:(d,r)=>d.haste+=1.5*r},
  {id:'prec',n:'Precision',i:'🎯',base:10,mult:1.25,max:25,d:r=>`+${r}% hit chance`,ap:(d,r)=>d.hit+=r},
  {id:'brutal',n:'Brutality',i:'💥',base:10,mult:1.2,max:40,d:r=>`+${3*r}% damage`,ap:(d,r)=>d.dmgPct+=3*r},
  {id:'hardy',n:'Hardiness',i:'🛡️',base:10,mult:1.2,max:40,d:r=>`+${3*r}% max HP`,ap:(d,r)=>d.hpPct+=3*r},
  {id:'study',n:'Studious',i:'📖',base:12,mult:1.22,max:30,d:r=>`+${4*r}% class XP`,ap:(d,r)=>d.xp+=4*r},
  {id:'scav',n:'Scavenger',i:'🦴',base:12,mult:1.22,max:30,d:r=>`+${3*r}% item drops & gold`,ap:(d,r)=>{d.dropPct+=3*r;d.gold+=3*r}},
  {id:'flow',n:'Resource Flow',i:'🌊',base:12,mult:1.25,max:20,d:r=>`+${3*r}% resource regeneration`,ap:(d,r)=>d.resRegen+=3*r},
];
D.AP_PROF=[
  {id:'eff',n:'Efficiency',i:'⚡',base:10,mult:1.2,max:40,d:r=>`+${3*r}% action speed`},
  {id:'steady',n:'Steady Hands',i:'✋',base:10,mult:1.22,max:30,d:r=>`+${1.5*r}% success chance`},
  {id:'bounty',n:'Bounty',i:'🧺',base:12,mult:1.22,max:40,d:r=>`+${3*r}% chance of bonus yield`},
  {id:'insight',n:'Insight',i:'💡',base:10,mult:1.2,max:30,d:r=>`+${4*r}% XP`},
  {id:'lucky',n:'Lucky Find',i:'🏺',base:25,mult:1.3,max:20,d:r=>`+${6*r}% odds for this profession's relics`},
  {id:'mentor',n:'Mentor',i:'🧑‍🏫',base:15,mult:1.25,max:10,d:r=>`Helpers work ${5*r}% faster at this`},
];
D.DEEDS=[
  {t:'kills',n:120,d:n=>`Defeat ${n} monsters`},{t:'elites',n:4,d:n=>`Defeat ${n} elites`},
  {t:'actions',n:250,d:n=>`Perform ${n} actions of any kind`},{t:'prof',n:60,d:(n,p)=>`Perform ${n} successful ${D.PROFS[p].n} actions`},
];
D.DAILY_CAP=300;
