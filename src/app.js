import{VERSION,ZONES,FISH,SHOP,getFishingSpot,biteDelay,newGame,sanitize,level,xpNext,byId,canTravel,selectFish,createCatch,landFish,purchase,equip,initialFight,fightStep,formatCoins}from'./logic.js';
import{createWorld}from'./world.js';
const $=id=>document.getElementById(id),KEY='fishing-world-v1';
const node=(tag,content='',cls='')=>{const e=document.createElement(tag);if(cls)e.className=cls;e.textContent=String(content);return e;};
let state;try{state=sanitize(JSON.parse(localStorage.getItem(KEY)||'null'))}catch{state=newGame()}
let world;try{world=createWorld($('world'));window.__fishingWorldReady=true;$('loading').textContent='一切准备就绪。'}catch(e){$('loading').textContent='3D 图形加载失败：'+e.message;throw e;}
let castPoint={x:0,z:7};
let phase='idle',weather='clear',hold=false,fish=null,catchItem=null,fight=null,challenge=1,elapsed=0,last=0,session=0,hideToast,weatherClock=0,started=false;
let audio;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}};
function tone(type='click'){
 if(!state.sound)return;try{
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
  audio=audio||new Audio();if(audio.state==='suspended')audio.resume();const t=audio.currentTime;
  const tones=type==='bite'?[[600,0,.1],[820,.12,.2]]:type==='catch'?[[390,0,.12],[520,.12,.12],[780,.25,.3]]:type==='fail'?[[270,0,.15],[190,.18,.27]]:type==='cast'?[[310,0,.08],[440,.1,.14]]:[[440,0,.09]];
  tones.forEach(([freq,delay,length])=>{const o=audio.createOscillator(),g=audio.createGain();o.type=type==='catch'?'sine':'triangle';o.frequency.setValueAtTime(freq,t+delay);if(type==='cast')o.frequency.exponentialRampToValueAtTime(freq*1.4,t+delay+length);g.gain.setValueAtTime(.00001,t+delay);g.gain.exponentialRampToValueAtTime(.055,t+delay+.02);g.gain.exponentialRampToValueAtTime(.00001,t+delay+length);o.connect(g);g.connect(audio.destination);o.start(t+delay);o.stop(t+delay+length+.01)});
 }catch{}
}
function notice(msg){$('notice').textContent=msg}
const activeSpot=()=>getFishingSpot(castPoint.x,castPoint.z)||getFishingSpot(0,7);
function updateSpot(){const s=activeSpot();$('spotTelemetry').textContent=s.name+' · 水深约 '+s.depth.toFixed(1)+' m · '+s.description;}
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(hideToast);hideToast=setTimeout(()=>$('toast').classList.remove('show'),3300);}
function setPhase(p,msg){phase=p;const label={idle:'准备就绪',casting:'抛投中',waiting:'等待鱼讯',bite:'有鱼咬钩！',fight:'正在搏鱼',result:'钓获成功'};const action={idle:['抛 竿','START FISHING','↝'],casting:['抛投中','CASTING','↝'],waiting:['等待鱼讯','WAITING','◌'],bite:['立刻提竿！','HOOK THE FISH','!'],fight:['正在搏鱼','FISH ON','↝'],result:['查看鱼获','SUCCESS','✦']};
 $('phaseLabel').textContent=label[p]||p;$('castLabel').textContent=action[p][0];$('castSub').textContent=action[p][1];$('castIcon').textContent=action[p][2];$('cast').classList.toggle('bite',p==='bite');$('cast').disabled=!['idle','bite'].includes(p);$('reel').disabled=p!=='fight';$('fightBars').hidden=p!=='fight';if(msg)notice(msg);
 if(p!=='fight'){hold=false;$('reel').classList.remove('holding');}
}
function ui(){
 $('coins').textContent=formatCoins(state.coins);const lv=level(state.xp),floor=lv===1?0:xpNext(lv-1),ceil=xpNext(lv);
 $('level').textContent='LV. '+lv;$('xpText').textContent=Math.floor(state.xp-floor)+' / '+(ceil-floor)+' XP';$('xpBar').style.width=(100*(state.xp-floor)/(ceil-floor)).toFixed(1)+'%';
 const z=byId(state.zone,ZONES);$('zoneName').textContent=z.name;$('zoneDescription').textContent=z.detail;
 $('questText').textContent='捕获 '+state.quest.target+' 条鱼，完成本轮湖畔委托。';$('questBar').style.width=(100*state.quest.progress/state.quest.target).toFixed(1)+'%';$('questProgress').textContent=state.quest.progress+' / '+state.quest.target;$('questReward').textContent='✦ '+formatCoins(state.quest.reward);
 $('gearLabel').textContent=byId(state.rod,SHOP).name+' · '+byId(state.lure,SHOP).name;
 $('sound').textContent=state.sound?'♫':'♩';$('sound').setAttribute('aria-label',state.sound?'关闭声音':'开启声音');
 save();
}
function updateFight(){if(!fight)return;$('progressBar').style.width=(100*fight.progress).toFixed(1)+'%';$('progressText').textContent=Math.round(fight.progress*100)+'%';$('tensionBar').style.width=Math.min(100,fight.tension*100).toFixed(1)+'%';$('tensionText').textContent=Math.round(Math.min(100,fight.tension*100))+'%';$('tensionBar').style.background=fight.tension>.78?'#f08e78':'#f2cd91';}
function cast(){if(phase!=='idle')return;const spot=activeSpot();session++;world.cast();setPhase('casting','鱼漂正飞向'+spot.name+'，水深约 '+spot.depth.toFixed(1)+' 米…');tone('cast');const tag=session;setTimeout(()=>{if(tag!==session||phase!=='casting')return;setPhase('waiting','正在'+spot.name+'等待鱼讯：'+spot.description+'。');setTimeout(()=>bite(tag),biteDelay(spot.id));},930);}
function bite(tag){if(tag!==session||phase!=='waiting')return;fish=selectFish(state.zone,state.lure,weather,Math.random,activeSpot().id);catchItem=createCatch(fish);setPhase('bite','鱼漂猛地沉入水中！现在提竿！');world.setPhase('bite');tone('bite');toast('鱼上钩了！及时点击「提竿」');setTimeout(()=>{if(tag===session&&phase==='bite')fail('错过了提竿时机，鱼儿溜走了。')},5200);}
function hook(){if(phase!=='bite')return;fight=initialFight();challenge=Math.max(.65,Math.min(2.65,(.58+fish.rarity*.18+catchItem.weight/fish.max*.53)*activeSpot().fightFactor));setPhase('fight','收线时注意鱼线张力。张力接近满格时，松开片刻。');world.setPhase('fight');updateFight();toast(fish.name+' 正在奋力挣扎！');tone('click');}
function fail(why){session++;world.reset();fight=null;fish=null;catchItem=null;setPhase('idle',why+' 调整节奏，再尝试一次。');tone('fail');toast(why);}
function success(){session++;world.showCatch();const result=landFish(state,catchItem);state=result.state;ui();const first=state.collection[catchItem.id]===1;const rarity=['','常见','少见','珍稀','史诗','传奇'][fish.rarity]||'罕见';
 $('resultRarity').textContent=rarity.toUpperCase()+' · '+(first?'NEW SPECIES DISCOVERED':'GREAT CATCH');
 $('resultName').textContent=catchItem.name;$('resultFlavor').textContent=fish.description;$('resultWeight').textContent=catchItem.weight.toFixed(2)+' kg';
 $('resultCoins').textContent='✦ +'+catchItem.coins+' 金币';$('resultXp').textContent='＋'+catchItem.xp+' XP';$('resultBonus').textContent=[first?'首次发现！已加入鱼类图鉴。':'',result.record?'✦ 新的个人重量纪录！':'',result.questCompleted?'委托完成，额外奖励已发放！':''].filter(Boolean).join('　');
 world.reset();fight=null;setPhase('result','恭喜钓获 '+catchItem.name+'！');tone('catch');$('catchDialog').showModal();toast('成功钓获 '+catchItem.weight.toFixed(2)+' kg '+catchItem.name);fish=null;catchItem=null;}
function action(){if(phase==='idle')cast();else if(phase==='bite')hook();}
$('cast').addEventListener('click',action);
function setHold(v){hold=v&&phase==='fight';$('reel').classList.toggle('holding',hold);}
$('reel').addEventListener('pointerdown',e=>{if(phase!=='fight')return;setHold(true);$('reel').setPointerCapture(e.pointerId);e.preventDefault();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('reel').addEventListener(event,()=>setHold(false));
window.addEventListener('blur',()=>setHold(false));
document.addEventListener('keydown',e=>{if(e.code!=='Space'||$('game').hidden||$('panel').open||$('catchDialog').open||(e.target instanceof Element&&e.target.matches('input,textarea,select')))return;e.preventDefault();if(phase==='fight'){setHold(true);return;}if(!e.repeat)action();});
document.addEventListener('keyup',e=>{if(e.code==='Space')setHold(false);});
function loop(time){requestAnimationFrame(loop);if(!started){last=time;return;}const dt=Math.min(.06,Math.max(0,(time-last)/1000));last=time;elapsed+=dt;weatherClock+=dt;
 if(weatherClock>95){weatherClock=0;chooseWeather();}
 if(phase==='fight'&&fight){fight=fightStep(fight,hold,dt,byId(state.rod,SHOP).power,challenge);world.setFight(fight.progress,fight.tension);updateFight();if(fight.result==='caught')success();else if(fight.result==='snap')fail('鱼线承受不住张力，断开了！');else if(fight.result==='escape')fail('长时间没有收线，鱼儿逃脱了！');}}
requestAnimationFrame(loop);
function chooseWeather(){const r=Math.random();weather=r<.58?'clear':r<.83?'cloud':'rain';world.setWeather(weather);const o={clear:['☀','晴朗','阳光洒在水面，鱼群活跃。'],cloud:['☁','多云','微风轻拂，水面出现涟漪。'],rain:['☂','小雨','雨滴打碎倒影，稀有鱼更活跃。']}[weather];$('weatherIcon').textContent=o[0];$('weatherName').textContent=o[1];$('weatherDesc').textContent=o[2];$('weatherTime').textContent='DAY 01 · '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});}
function panel(title,eyebrow){if(phase!=='idle'&&phase!=='result'){toast('请先完成当前垂钓，再打开其他面板。');return null;}$('panelTitle').textContent=title;$('panelEyebrow').textContent=eyebrow;$('panelBody').replaceChildren();$('panel').showModal();tone('click');return $('panelBody')}
function makeItem(title,tag,desc,meta,buttonLabel,onClick,disabled=false){const item=node('article','','item');item.append(node('div',tag,'tag'),node('h3',title),node('p',desc),node('div',meta,'meta'));if(buttonLabel){const b=node('button',buttonLabel);b.disabled=disabled;b.addEventListener('click',onClick);item.append(b);}return item;}
function group(){return node('div','','itemgrid')}
function openMap(){const body=panel('选择你的下一片水域','WORLD MAP / LOCATIONS');if(!body)return;const grid=group();for(const z of ZONES){const allowed=canTravel(state,z.id),current=state.zone===z.id;const el=makeItem(z.name,'REGION 0'+(ZONES.indexOf(z)+1),z.detail,'开放等级 · LV.'+z.level,current?'当前水域':allowed?'前往垂钓':'尚未解锁',()=>{if(!allowed||current)return;state.zone=z.id;world.setZone(z.id);world.reset();castPoint={x:0,z:7};updateSpot();session++;setPhase('idle','已抵达 '+z.name+'。这片水域有新的鱼种等待发现。');ui();$('panel').close();toast('抵达新地点：'+z.name);},!allowed||current);if(!allowed)el.classList.add('locked');grid.append(el);}body.append(grid);}
function openShop(){const body=panel('湖畔钓具商店','FISHING SUPPLIES / SHOP');if(!body)return;const intro=node('p','升级装备可以提高收线效率与捕捉稀有鱼的机会。购买后自动装备。金币：✦ '+formatCoins(state.coins),'noticeLine');body.append(intro);const grid=group();for(const x of SHOP){const owned=state.owned.includes(x.id),blocked=level(state.xp)<x.level||state.coins<x.price;const desc=x.desc;const meta='解锁 LV.'+x.level+' · '+(x.price?'✦ '+formatCoins(x.price):'初始装备')+(x.kind==='rod'?' · 强度 '+x.power.toFixed(2):'');const label=owned?'已拥有':level(state.xp)<x.level?'等级不足':state.coins<x.price?'金币不足':'购买并装备';const el=makeItem(x.name,x.kind==='rod'?'FISHING ROD':'LURE / BAIT',desc,meta,label,()=>{const result=purchase(state,x.id);if(!result.ok){toast(result.reason);return;}state=result.state;ui();tone('catch');toast('已购买并装备 '+x.name);$('panel').close();openShop();},owned||blocked);grid.append(el)}body.append(grid);}
function openGear(){const body=panel('装备管理','TACKLE BOX / OWNED ITEMS');if(!body)return;body.append(node('p','切换已购装备。更强的鱼竿有助于对抗巨鱼。','noticeLine'));const grid=group();for(const id of state.owned){const x=byId(id,SHOP);if(!x)continue;const on=x.kind==='rod'?state.rod===id:state.lure===id;grid.append(makeItem(x.name,x.kind==='rod'?'FISHING ROD':'LURE',x.desc,'需求等级 LV.'+x.level,on?'正在使用':'装备',()=>{const result=equip(state,id);if(!result.ok)return;state=result.state;ui();tone('click');$('panel').close();openGear();},on));}body.append(grid);}
function openBook(){const body=panel('鱼类百科图鉴','FIELD JOURNAL / 10 SPECIES');if(!body)return;const discovered=Object.keys(state.collection).length;body.append(node('p','已发现 '+discovered+' / '+FISH.length+' 种鱼 · 累计钓获 '+state.caught+' 条 · 总重量 '+state.totalWeight.toFixed(2)+' kg','noticeLine'));const grid=group();for(const f of FISH){const count=state.collection[f.id]||0,seen=count>0,z=byId(f.zone,ZONES);const el=makeItem(seen?f.name:'未发现的神秘鱼种',z.name+' · '+(f.rarity>=5?'LEGENDARY':f.rarity>=4?'EPIC':f.rarity>=2?'RARE':'COMMON'),seen?f.description:'在对应水域捕获后解锁完整资料。',seen?'累计 '+count+' 条 · 纪录 '+state.records[f.id].toFixed(2)+' kg':'未记录',null,null);if(seen)el.classList.add('record');else el.classList.add('locked');grid.append(el)}body.append(grid);}
function openHelp(){const body=panel('钓鱼手册','HOW TO PLAY / FIELD GUIDE');if(!body)return;const sections=[['01 · 抛竿','点击右下方「抛竿」或按空格。鱼漂落入水中后，请等待鱼讯。'],['02 · 提竿','出现「有鱼咬钩」提示时，在短暂窗口内点击「提竿」或按空格。'],['03 · 收线与张力','按住「收线」按钮，电脑也可按住空格。张力随收线增加；达到 100% 会断线。松开按钮降低张力，再继续收线，直至进度达到 100%。'],['04 · 购买与升级','出售鱼获所得金币和经验会自动结算。进入商店购买鱼竿、鱼饵；更强的鱼竿降低对抗难度。'],['05 · 解锁新区域','达到指定等级后，可在地图中探索新湖区。每个湖区拥有独特的鱼种，图鉴记录累计数量与重量纪录。'],['06 · 自动存档','钓获、装备、金币、等级和任务进度会保存在此浏览器 localStorage 中。清理浏览器站点数据会清空存档。'],['07 · 钓点与水深','点击湖面选择落点：芦苇浅滩咬钩快，深水鱼道等待久但稀有鱼机会更高、拉力更强。不同鱼种在三类栖息地的活跃程度不同。']];for(const [name,content] of sections){const x=node('div','','item');x.append(node('h3',name),node('p',content));body.append(x)}}
$('openMap').onclick=openMap;$('openShop').onclick=openShop;$('openGear').onclick=openGear;$('openBook').onclick=openBook;$('openHelp').onclick=openHelp;$('closePanel').onclick=()=>$('panel').close();
$('sound').onclick=()=>{state.sound=!state.sound;ui();toast(state.sound?'已开启声音':'已静音');if(state.sound)tone('click')};
$('resultContinue').onclick=()=>{$('catchDialog').close();setPhase('idle','很好的收获。继续抛竿，探索更多鱼群。');};
$('catchDialog').addEventListener('cancel',e=>{e.preventDefault();$('resultContinue').click()});
$('start').onclick=()=>{started=true;$('intro').hidden=true;$('game').hidden=false;world.setZone(state.zone);castPoint={x:0,z:7};updateSpot();chooseWeather();ui();setPhase('idle','欢迎来到 '+byId(state.zone,ZONES).name+'！试着抛出第一竿。');tone('click');last=performance.now();};
$('world').addEventListener('fishing:aim',e=>{
 const d=e.detail;if(phase!=='idle')return;castPoint={x:d.x,z:d.z};const spot=activeSpot();updateSpot();
 $('hint').textContent='抛投约 '+d.distance+' m · '+spot.name+' · '+spot.depth.toFixed(1)+' m';
 notice('已锁定'+spot.name+'。'+spot.description+'。点击「抛竿」开始。');
});
$('world').addEventListener('fishing:aim-error',()=>{
 if(phase==='idle')toast('请点按湖面内的水域选择抛投点。');
});
world.setZone(state.zone);updateSpot();ui();setPhase('idle','点击湖面选择抛投落点，随后抛竿。');
