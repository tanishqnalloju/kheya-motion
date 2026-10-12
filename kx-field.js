/* Kheya philosophy hairline field: one set of lines morphs Divergence <-> Convergence <-> Emergence.
   Canvas only; lines draw once, then only dots move; pauses off-screen; reduced motion = static end state. */
(()=>{
const W=640,H=290,ROLES=['Team member','Approver','Operations owner','Engineer'];
// Emergence nodes match the engine's own stage-3 ringed points (Build, Test, Oversight, ...), plus one new centre node.
const NODES=[[120,145],[220,65],[420,65],[520,145],[420,225],[220,225]].map(([x,y])=>({x,y}));
const CENTRE={x:320,y:145};
const RING=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]],CHORDS=[[0,6],[6,3],[1,6],[6,4]];
const RM=matchMedia('(prefers-reduced-motion: reduce)');
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const lerp=(a,b,t)=>a+(b-a)*t;
const rand=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)};
const scurve=(A,B,a=.55,b=.38)=>[A,{x:A.x+(B.x-A.x)*a,y:A.y},{x:B.x-(B.x-A.x)*b,y:B.y},B];
function layout(n){
  const roleIdx=n>=8?[1,3,4,6]:[0,1,2,3];
  const ends=n>=8?[1,1,0,2,4,5,5,4]:[1,0,5,4];
  return Array.from({length:n},(_,i)=>{
    const y=28+i*(H-56)/(n-1),r=roleIdx.indexOf(i),S={x:22,y};
    const conv=scurve(S,{x:470,y:145});
    const G={x:170,y:145},jx=(rand(i)-.5)*70,jy=(rand(i+9)-.5)*26;
    const E={x:Math.min(618,600+jx*.3)-Math.abs(jx)*.5,y:Math.max(18,Math.min(H-18,y+jy))};
    const div=[G,{x:G.x+(E.x-G.x)*.38+jx*.4,y:G.y+(rand(i+3)-.5)*30},{x:E.x-(E.x-G.x)*.55,y:E.y+jy*.6},E];
    const emer=scurve(S,NODES[ends[i]],.5,.42);
    return{geo:{0:div,1:conv,2:emer},cur:conv,from:conv,role:r>=0?ROLES[r]:null,
      dots:[{t:rand(i+20),acc:rand(i+40)<.25},...(n>=8&&i%2?[]:[{t:(rand(i+60)+.5)%1,acc:rand(i+80)<.25}])]};
  });
}
// links between emergence nodes: gentle arcs bowing away from the centre
const linkGeo=([a,b])=>{const A=a===6?CENTRE:NODES[a],B=b===6?CENTRE:NODES[b];const mx=(A.x+B.x)/2,my=(A.y+B.y)/2;const dx=mx-CENTRE.x,dy=my-CENTRE.y,d=Math.hypot(dx,dy)||1,bow=a===6||b===6?10:22;
  const C={x:mx+dx/d*bow,y:my+dy/d*bow};return[A,{x:lerp(A.x,C.x,.66),y:lerp(A.y,C.y,.66)},{x:lerp(B.x,C.x,.66),y:lerp(B.y,C.y,.66)},B]};
const LINKS=[...RING,...CHORDS].map((l,i)=>({g:linkGeo(l),ring:i<RING.length,dots:[{t:rand(i+100),acc:rand(i+120)<.25}]}));
const bez=(p,t)=>{const u=1-t;return{x:u*u*u*p[0].x+3*u*u*t*p[1].x+3*u*t*t*p[2].x+t*t*t*p[3].x,y:u*u*u*p[0].y+3*u*u*t*p[1].y+3*u*t*t*p[2].y+t*t*t*p[3].y}};
const mix=(a,b,k)=>a.map((p,j)=>({x:lerp(p.x,b[j].x,k),y:lerp(p.y,b[j].y,k)}));
function attach(diagram){
  if(diagram.__kx)return;diagram.__kx=1;
  const engine=diagram.closest('.engine')||diagram.parentElement;
  const cv=document.createElement('canvas');cv.className='kx-field';cv.setAttribute('role','img');
  diagram.insertBefore(cv,diagram.firstChild);
  const ctx=cv.getContext('2d');
  let w=0,h=0,dpr=1,paths=[],n=0,colors={},visible=false,running=false,raf=0,last=0;
  let stage=-1,mt=1,mStart=0,draw=0,drawStart=0,linkDraw=0,linkStart=0,boost=1,boostTarget=1;
  const wt={0:0,1:1,2:0},wFrom={0:0,1:1,2:0},wTo={0:0,1:1,2:0};
  const stageOf=()=>{const s=engine.querySelector('.stage-dots');return s?Math.round(parseFloat(getComputedStyle(s).getPropertyValue('--stage-index'))||0):0};
  const nodeLabels=()=>[...engine.querySelectorAll('.point-target')].map(b=>b.getAttribute('aria-label')||'');
  function readColors(){const cs=getComputedStyle(engine);colors={line:cs.getPropertyValue('--color-muted').trim()||'#667',acc:cs.getPropertyValue('--color-accent').trim()||'#345',ink:cs.getPropertyValue('--color-heading').trim()||'#123'}}
  function size(){const r=diagram.getBoundingClientRect();if(!r.width)return;dpr=Math.min(2,devicePixelRatio||1);w=r.width;h=r.height;cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);
    const nn=w<480?4:8;if(nn!==n){n=nn;paths=layout(n);const s=Math.max(stage,0);for(const p of paths)p.cur=p.from=p.geo[s]}readColors();render()}
  function label(){cv.setAttribute('aria-label',stage===1?'Convergence: Team member, Approver, Operations owner and Engineer meet in one tested workflow':stage===0?'Divergence: one request fans out to Team member, Approver, Operations owner and Engineer along misaligned paths':'Emergence: the roles connect into a network of linked steps')}
  function setStage(s,instant){if(s===stage)return;stage=s;engine.dataset.kxStage=String(s);label();
    for(const k of [0,1,2]){wFrom[k]=wt[k];wTo[k]=k===s?1:0}
    for(const p of paths)p.from=p.cur;
    if(s===2&&!linkStart)linkStart=-1;
    if(instant||RM.matches){mt=1;for(const k of [0,1,2])wt[k]=wTo[k];for(const p of paths)p.cur=p.from=p.geo[s];if(s===2)linkDraw=1;render();return}
    mt=0;mStart=performance.now();start()}
  function stroke(g,prog,alpha,dash){ctx.globalAlpha=alpha;ctx.setLineDash(dash>.02?[4*dash,3*dash+.01]:[]);ctx.beginPath();const steps=48,end=Math.max(1,Math.round(steps*prog));
    for(let s=0;s<=end;s++){const q=bez(g,s/steps);s?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)}ctx.stroke();ctx.setLineDash([])}
  function dot(g,d,alpha){const q=bez(g,d.t);ctx.globalAlpha=alpha*(d.acc?.95:.55);ctx.fillStyle=d.acc?colors.acc:colors.line;ctx.fillRect(Math.round(q.x)-1.5,Math.round(q.y)-1.5,3,3)}
  function text(s,x,y,align,weight,alpha){ctx.globalAlpha=alpha;ctx.fillStyle=colors.ink;ctx.font=(weight||'')+' 11px system-ui,sans-serif';ctx.textAlign=align;ctx.fillText(s,x,y)}
  function render(){
    if(!w)return;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    const sx=w/W,sy=h/H,S=p=>({x:p.x*sx,y:p.y*sy}),sc=g=>g.map(S);
    ctx.lineWidth=1;ctx.strokeStyle=colors.line;
    const dv=wt[0],cvw=wt[1],ev=wt[2];
    // emergence links (draw in once, then static)
    if(ev>.01){for(const l of LINKS){const g=sc(l.g);ctx.strokeStyle=l.ring?colors.line:colors.acc;stroke(g,linkDraw,ev*(l.ring?.45:.35),0)}
      ctx.strokeStyle=colors.line;
      if(linkDraw>=1)for(const l of LINKS)for(const d of l.dots)dot(sc(l.g),d,ev);
      const c=S(CENTRE);ctx.globalAlpha=ev*Math.min(1,linkDraw*1.5);ctx.strokeStyle=colors.acc;ctx.beginPath();ctx.arc(c.x,c.y,8,0,7);ctx.stroke();ctx.fillStyle=colors.acc;ctx.fillRect(c.x-3,c.y-3,6,6);ctx.strokeStyle=colors.line;
      if(linkDraw>=1&&w>=480){const L=nodeLabels();NODES.forEach((nd,j)=>{if(!L[j])return;const q=S(nd),below=nd.y>170;text(L[j],q.x,q.y+(below?30:-20),'center','',ev*.85)})}}
    for(const p of paths){
      const g=sc(p.cur);ctx.strokeStyle=colors.line;stroke(g,draw,p.role?.55:.28,dv);
      if(draw>=1)for(const d of p.dots)dot(g,d,1);
      if(p.role&&draw>=1){const atEnd=dv>.5,q=atEnd?g[3]:g[0];text(p.role,q.x+(atEnd?-4:4),q.y-6,atEnd?'right':'left','',.9);
        ctx.globalAlpha=1;ctx.fillStyle=colors.line;ctx.fillRect(Math.round(q.x)-2,Math.round(q.y)-2,4,4)}
    }
    if(draw>=1)for(const [f,lab,wgt] of [[{x:470,y:145},'One tested workflow',cvw],[{x:170,y:145},'One request',dv]]){if(wgt<.02)continue;const q=S(f);
      ctx.globalAlpha=wgt;ctx.strokeStyle=colors.acc;ctx.beginPath();ctx.arc(q.x,q.y,9,0,7);ctx.stroke();ctx.fillStyle=colors.acc;ctx.fillRect(q.x-3,q.y-3,6,6);text(lab,q.x,q.y+24,'center','600',wgt)}
    ctx.globalAlpha=1;
  }
  function frame(now){
    raf=0;const dt=Math.min(64,now-(last||now));last=now;
    if(!drawStart)drawStart=now;draw=Math.min(1,(now-drawStart)/1100);
    if(mt<1){mt=Math.min(1,(now-mStart)/700);const e=ease(mt);for(const k of [0,1,2])wt[k]=lerp(wFrom[k],wTo[k],e);for(const p of paths)p.cur=mix(p.from,p.geo[stage],e)}
    if(linkStart===-1&&mt>=.6)linkStart=now;if(linkStart>0)linkDraw=Math.min(1,(now-linkStart)/900);
    boost+=(boostTarget-boost)*Math.min(1,dt/250);
    const v=dt/7000*boost;for(const p of paths)for(const d of p.dots)d.t=(d.t+v)%1;for(const l of LINKS)for(const d of l.dots)d.t=(d.t+v*1.4)%1;
    render();
    if(visible&&!document.hidden&&!RM.matches)raf=requestAnimationFrame(frame);else{running=false;last=0}
  }
  function start(){if(RM.matches){draw=1;mt=1;if(stage===2)linkDraw=1;render();return}if(!running&&visible){running=true;raf=requestAnimationFrame(frame)}}
  new IntersectionObserver(([e])=>{visible=e.isIntersecting;visible?start():(cancelAnimationFrame(raf),raf=0,running=false,last=0)}).observe(diagram);
  new ResizeObserver(size).observe(diagram);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)start()});
  RM.addEventListener('change',()=>{if(RM.matches){draw=1;mt=1;for(const k of [0,1,2])wt[k]=wTo[k];for(const p of paths)p.cur=p.geo[stage];if(stage===2)linkDraw=1;render()}else start()});
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{readColors();render()});
  new MutationObserver(()=>{readColors();render()}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  const sd=engine.querySelector('.stage-dots');
  if(sd)new MutationObserver(()=>setStage(stageOf())).observe(sd,{attributes:true,attributeFilter:['style']});
  for(const c of engine.querySelectorAll('.stage-card, .point-target')){c.addEventListener('pointerenter',()=>boostTarget=3);c.addEventListener('pointerleave',()=>boostTarget=1)}
  diagram.addEventListener('pointermove',e=>{const r=diagram.getBoundingClientRect(),ux=(e.clientX-r.left)*W/r.width,uy=(e.clientY-r.top)*H/r.height;
    const foci=stage===2?[CENTRE,...NODES]:[stage===1?{x:470,y:145}:{x:170,y:145}];boostTarget=foci.some(f=>Math.hypot(ux-f.x,uy-f.y)<40)?3:1},{passive:true});
  diagram.addEventListener('pointerleave',()=>boostTarget=1);
  if(RM.matches)draw=1;
  size();setStage(stageOf(),true);
}
let q=0;const scan=()=>{q=0;document.querySelectorAll('.engine.cursor-spotlight .diagram').forEach(attach)};
scan();new MutationObserver(()=>{q||=requestAnimationFrame(scan)}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
})();
