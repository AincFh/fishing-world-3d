export const VERSION=1;
export const ZONES=[
{id:'willow',name:'柳湾湖',level:1,detail:'晨雾、荷叶与安静的浅滩',color:'#5ac8bc'},
{id:'pine',name:'松林溪谷',level:3,detail:'冷泉与岩壁，适合中级垂钓',color:'#8bcfc2'},
{id:'dusk',name:'落日沼泽',level:6,detail:'深水暗流，巨型鱼出没',color:'#e5a66b'},
{id:'alpine',name:'星辉高山湖',level:9,detail:'极寒高山，寻找传奇鱼王',color:'#aeaddd'}];
export const FISH=[
{id:'bluegill',name:'蓝鳃太阳鱼',zone:'willow',rarity:1,min:.3,max:1.6,price:35,xp:20,color:0xd2a65a,description:'浅水区最常见的快乐小鱼'},
{id:'bass',name:'大口黑鲈',zone:'willow',rarity:2,min:1.1,max:5.2,price:95,xp:46,color:0x6c9876,description:'藏在水草边的敏捷猎手'},
{id:'golden',name:'金色鲤鱼',zone:'willow',rarity:4,min:2.1,max:8.4,price:240,xp:100,color:0xeac374,description:'传说给钓手带来好运的金鳞'},
{id:'trout',name:'虹鳟鱼',zone:'pine',rarity:1,min:.9,max:4.5,price:85,xp:43,color:0xbd8290,description:'溪流中的银色闪电'},
{id:'perch',name:'翡翠河鲈',zone:'pine',rarity:2,min:1.1,max:4.9,price:130,xp:64,color:0x79ad86,description:'追逐阳光与波纹'},
{id:'salmon',name:'王鲑',zone:'pine',rarity:4,min:3.6,max:13.2,price:365,xp:135,color:0xd2a59d,description:'长途洄游的强悍巨鱼'},
{id:'catfish',name:'巨须鲶鱼',zone:'dusk',rarity:1,min:4,max:21,price:260,xp:105,color:0x84938b,description:'沼泽阴影中的水下霸主'},
{id:'sturgeon',name:'远古鲟鱼',zone:'dusk',rarity:4,min:9,max:45,price:790,xp:240,color:0x92a4a4,description:'远古生命，考验钓手极限'},
{id:'arctic',name:'极地红点鲑',zone:'alpine',rarity:1,min:2.2,max:9.5,price:290,xp:110,color:0xc9b7c2,description:'冰川雪水孕育的珍贵鱼'},
{id:'moon',name:'月光锦鲤',zone:'alpine',rarity:5,min:3,max:17.5,price:1450,xp:390,color:0xe6d7d0,description:'只向最有耐心的垂钓者现身'}];
export const SHOP=[
{id:'starter',name:'竹影轻竿',kind:'rod',price:0,level:1,power:1,desc:'入门轻竿 · 完美学习抛投与提竿'},
{id:'carbon',name:'碳纤溪行',kind:'rod',price:450,level:2,power:1.45,desc:'碳纤维弹性，收线效率提升'},
{id:'aurora',name:'极光远征',kind:'rod',price:1550,level:5,power:1.95,desc:'抗拉耐久，挑战大型鱼种'},
{id:'titan',name:'泰坦深海',kind:'rod',price:4200,level:9,power:2.6,desc:'顶级强度，专为传奇鱼王打造'},
{id:'worm',name:'天然蚯蚓',kind:'lure',price:0,level:1,power:0,desc:'适用于所有水域的基础鱼饵'},
{id:'spinner',name:'银翼旋片',kind:'lure',price:280,level:3,power:.12,desc:'闪光刺激鱼群，提高稀有鱼上钩率'},
{id:'glow',name:'星辉夜光饵',kind:'lure',price:1100,level:6,power:.3,desc:'深水与夜间的传奇鱼饵'}];
export const newGame=()=>({version:VERSION,coins:160,xp:0,caught:0,totalWeight:0,collection:{},records:{},zone:'willow',owned:['starter','worm'],rod:'starter',lure:'worm',quest:{target:3,progress:0,reward:250,round:1},sound:true});
export function level(xp){return 1+Math.floor(Math.sqrt(Math.max(0,xp)/110));}
export function xpNext(lvl){return 110*lvl*lvl;}
export function byId(id,list){return list.find(x=>x.id===id);}
export function canTravel(state,zone){const z=byId(zone,ZONES);return !!z&&level(state.xp)>=z.level;}
export function sanitize(input){const d=newGame();if(!input||typeof input!=='object')return d;
const copy={...d};for(const k of ['coins','xp','caught','totalWeight'])if(Number.isFinite(input[k])&&input[k]>=0)copy[k]=Math.min(input[k],1e12);
copy.zone=canTravel(copy,input.zone)?input.zone:'willow';
copy.owned=Array.isArray(input.owned)?Array.from(new Set(['starter','worm',...input.owned.filter(id=>!!byId(id,SHOP))])):d.owned;
copy.rod=copy.owned.includes(input.rod)&&byId(input.rod,SHOP)?.kind==='rod'?input.rod:'starter';
copy.lure=copy.owned.includes(input.lure)&&byId(input.lure,SHOP)?.kind==='lure'?input.lure:'worm';
copy.collection={};copy.records={};for(const f of FISH){const n=input.collection?.[f.id];if(Number.isInteger(n)&&n>0)copy.collection[f.id]=Math.min(n,1e9);const w=input.records?.[f.id];if(Number.isFinite(w)&&w>=f.min&&w<=f.max)copy.records[f.id]=w;}
const q=input.quest;if(q&&Number.isInteger(q.round)&&q.round>=1&&q.round<=1e6)copy.quest={target:Math.min(100,3+q.round-1),progress:Math.min(Math.max(0,Number(q.progress)||0),3+q.round-1),reward:200+50*q.round,round:q.round};
copy.sound=input.sound!==false;return copy;}
export function selectFish(zone='willow',lure='worm',weather='clear',random=Math.random){const options=FISH.filter(f=>f.zone===zone);if(!options.length)return FISH[0];const bonus=byId(lure,SHOP)?.power||0;const weights=options.map(f=>{let w=1/Math.pow(f.rarity,1.9);if(f.rarity>=4)w*=1+bonus*2;if(weather==='rain'&&f.rarity>=2)w*=1.27;return w;});const total=weights.reduce((a,b)=>a+b,0);let roll=Math.max(0,Math.min(.999999,random()))*total;for(let i=0;i<options.length;i++){roll-=weights[i];if(roll<0)return options[i];}return options.at(-1);}
export function createCatch(fish,random=Math.random){const weight=+(fish.min+(fish.max-fish.min)*(.12+.88*Math.pow(random(),1.6))).toFixed(2);return{id:fish.id,name:fish.name,weight,rarity:fish.rarity,coins:Math.round(fish.price*(.6+.7*weight/fish.max)),xp:Math.round(fish.xp*(.7+.5*weight/fish.max))};}
export function landFish(state,fish){const s=sanitize(state);s.coins+=fish.coins;s.xp+=fish.xp;s.caught++;s.totalWeight=+(s.totalWeight+fish.weight).toFixed(2);s.collection[fish.id]=(s.collection[fish.id]||0)+1;const record=(s.records[fish.id]||0)<fish.weight;s.records[fish.id]=Math.max(s.records[fish.id]||0,fish.weight);s.quest.progress++;let questCompleted=false;if(s.quest.progress>=s.quest.target){s.coins+=s.quest.reward;s.xp+=75+s.quest.round*15;const round=s.quest.round+1;s.quest={round,target:Math.min(100,3+round-1),progress:0,reward:200+50*round};questCompleted=true;}return {state:s,record,questCompleted};}
export function purchase(state,id){const item=byId(id,SHOP);const s=sanitize(state);if(!item)return{ok:false,reason:'装备不存在',state:s};if(s.owned.includes(id))return{ok:false,reason:'已经拥有',state:s};if(level(s.xp)<item.level)return{ok:false,reason:'等级不足',state:s};if(s.coins<item.price)return{ok:false,reason:'金币不足',state:s};s.coins-=item.price;s.owned.push(id);if(item.kind==='rod')s.rod=id;else s.lure=id;return{ok:true,state:s,item};}
export function equip(state,id){const s=sanitize(state),item=byId(id,SHOP);if(!item||!s.owned.includes(id))return{ok:false,state:s};s[item.kind==='rod'?'rod':'lure']=id;return{ok:true,state:s};}
export function initialFight(){return{progress:0,tension:.2,slack:0,result:null};}
export function fightStep(fight,reeling,dt,rodPower=1,difficulty=1){dt=Math.min(.1,Math.max(0,dt));if(fight.result)return{...fight};
const f={...fight};if(reeling){f.progress=Math.min(1,f.progress+dt*(.15*rodPower/Math.max(.6,difficulty)));f.tension=Math.min(1.5,f.tension+dt*(.2*difficulty-.025*rodPower));f.slack=0;}else{f.progress=Math.max(0,f.progress-dt*.012);f.tension=Math.max(.03,f.tension-dt*.34);f.slack+=dt;}
if(f.tension>=1)f.result='snap';else if(f.slack>12)f.result='escape';else if(f.progress>=1)f.result='caught';return f;}
export function formatCoins(n){return Math.floor(n).toLocaleString('zh-CN');}