/* Kheya philosophy hairline field: divergence <-> convergence morph on one set of lines.
   Canvas only; lines draw once, dots flow slowly, pauses off-screen, reduced motion = static end state. */
(()=>{
const W=640,H=290,ROLES=['Team member','Approver','Operations owner','Engineer'];
const RM=matchMedia('(prefers-reduced-motion: reduce)');
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const lerp=(a,b,t)=>a+(b-a)*t;
function rand(i){const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)}
function layout(n){
  // n paths; roles sit on 4 evenly chosen indices
  const roleIdx=n>=8?[1,3,4,6]:[0,1,2,3];
  const paths=[];
  for(let i=0;i<n;i++){
    const y=n===1?H/2:28+i*(H-56)/(n-1);
    const r=roleIdx.indexOf(i);
    // convergence: edge (left) -> focal (right)
    const F={x:470,y:145},S={x:22,y};
    const conv=[S,{x:S.x+(F.x-S.x)*.55,y:S.y},{x:F.x-(F.x-S.x)*.38,y:F.y},F];
    // divergence (mirror): focal (left) -> apart, misaligned ends (right)
    const G={x:170,y:145},jx=(rand(i)-.5)*70,jy=(rand(i+9)-.5)*26;
    const E={x:Math.min(618,600+jx*.3)-Math.abs(jx)*.5,y:Math.max(18,Math.min(H-18,y+jy))};
    const div=[G,{x:G.x+(E.x-G.x)*.38+jx*.4,y:G.y+(rand(i+3)-.5)*30},{x:E.x-(E.x-G.x)*.55,y:E.y+jy*.6},E];
    paths.push({conv,div,role:r>=0?ROLES[r]:null,dots:[{t:rand(i+20),acc:rand(i+40)<.25},...(n>=8&&i%2?[]:[{t:(rand(i+60)+.5)%1,acc:rand(i+80)<.25}])]});
  }
  return paths;
}
function bez(p,t){const u=1-t;return{x:u*u*u*p[0].x+3*u*u*t*p[1].x+3*u*t*t*p[2].x+t*t*t*p[3].x,y:u*u*u*p[0].y+3*u*u*t*p[1].y+3*u*t*t*p[2].y+t*t*t*p[3].y}}
function mix(a,b,k){return a.map((p,j)=>({x:lerp(p.x,b[j].x,k),y:lerp(p.y,b[j].y,k)}))}
function attach(diagram){
  if(diagram.__kx)return;diagram.__kx=1;
  const engine=diagram.closest('.engine')||diagram.parentElement;
  const cv=document.createElement('canvas');cv.className='kx-field';cv.setAttribute('role','img');
  diagram.insertBefore(cv,diagram.firstChild);
  const ctx=cv.getContext('2d');
  let w=0,h=0,dpr=1,paths=[],n=0,colors={},visible=false,running=false,raf=0,last=0;
  let stage=0,k=0,kFrom=0,kTo=0,kStart=0,draw=0,drawStart=0,boost=1,boostTarget=1,emer=0,emerTo=0;
  const stageOf=()=>{const s=engine.querySelector('.stage-dots');return s?Math.round(parseFloat(getComputedStyle(s).getPropertyValue('--stage-index'))||0):0};
  function readColors(){const cs=getComputedStyle(engine);colors={line:cs.getPropertyValue('--color-muted').trim()||'#667',acc:cs.getPropertyValue('--color-accent').trim()||'#345',ink:cs.getPropertyValue('--color-heading').trim()||'#123'}}
  function size(){const r=diagram.getBoundingClientRect();if(!r.width)return;dpr=Math.min(2,devicePixelRatio||1);w=r.width;h=r.height;cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);const nn=w<480?4:8;if(nn!==n){n=nn;paths=layout(n)}readColors();render()}
  function label(){cv.setAttribute('aria-label',stage===1?'Convergence: Team member, Approver, Operations owner and Engineer meet in one tested workflow':stage===0?'Divergence: one request fans out to Team member, Approver, Operations owner and Engineer along misaligned paths':'Emergence: the pieces work together')}
  function setStage(s,instant){stage=s;engine.dataset.kxStage=String(s);label();const target=s===1?0:1;emerTo=s===2?1:0;
    if(instant||RM.matches){k=kFrom=kTo=target;emer=emerTo;render();return}
    kFrom=k;kTo=target;kStart=performance.now();start()}
  function render(now=performance.now()){
    if(!w)return;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    const sx=w/W,sy=h/H,a=1-emer;if(a<=.02)return;
    ctx.globalAlpha=a;ctx.lineWidth=1;
    for(const p of paths){
      const g=mix(p.conv,p.div,ease(k)).map(q=>({x:q.x*sx,y:q.y*sy}));
      ctx.strokeStyle=colors.line;ctx.globalAlpha=a*(p.role?.55:.28);
      ctx.setLineDash(k>.02?[4*k,3*k+.01]:[]);
      ctx.beginPath();const steps=48,end=Math.max(1,Math.round(steps*draw));
      for(let s=0;s<=end;s++){const q=bez(g,s/steps);s?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)}
      ctx.stroke();ctx.setLineDash([]);
      if(draw>=1)for(const d of p.dots){const q=bez(g,d.t);ctx.globalAlpha=a*(d.acc?.95:.55);ctx.fillStyle=d.acc?colors.acc:colors.line;ctx.fillRect(Math.round(q.x)-1.5,Math.round(q.y)-1.5,3,3)}
      if(p.role&&draw>=1){const q=k<.5?g[0]:g[3];ctx.globalAlpha=a*.9;ctx.fillStyle=colors.ink;ctx.font='11px system-ui,sans-serif';
        const right=k>=.5;ctx.textAlign=right?'right':'left';ctx.fillText(p.role,q.x+(right?-4:4),q.y-6);
        ctx.fillStyle=colors.line;ctx.fillRect(Math.round(q.x)-2,Math.round(q.y)-2,4,4)}
    }
    if(draw>=1){const f=mix([paths[0].conv[3]],[paths[0].div[0]],ease(k))[0];const fx=f.x*sx,fy=f.y*sy;
      ctx.globalAlpha=a;ctx.strokeStyle=colors.acc;ctx.beginPath();ctx.arc(fx,fy,9,0,7);ctx.stroke();ctx.fillStyle=colors.acc;ctx.fillRect(fx-3,fy-3,6,6);
      ctx.fillStyle=colors.ink;ctx.font='600 11.5px system-ui,sans-serif';ctx.textAlign='center';ctx.fillText(k<.5?'One tested workflow':'One request',fx,fy+24)}
    ctx.globalAlpha=1;
  }
  function frame(now){
    raf=0;const dt=Math.min(64,now-(last||now));last=now;
    if(!drawStart)drawStart=now;draw=Math.min(1,(now-drawStart)/1100);
    if(kFrom!==kTo){const t=Math.min(1,(now-kStart)/700);k=lerp(kFrom,kTo,t);if(t>=1)kFrom=kTo=k}
    emer+=(emerTo-emer)*Math.min(1,dt/180);
    boost+=(boostTarget-boost)*Math.min(1,dt/250);
    const v=dt/7000*boost;for(const p of paths)for(const d of p.dots)d.t=(d.t+v)%1;
    render(now);
    if(visible&&!document.hidden&&!RM.matches)raf=requestAnimationFrame(frame);else{running=false;last=0}
  }
  function start(){if(RM.matches){draw=1;render();return}if(!running&&visible){running=true;raf=requestAnimationFrame(frame)}}
  new IntersectionObserver(([e])=>{visible=e.isIntersecting;visible?start():(cancelAnimationFrame(raf),raf=0,running=false,last=0)}).observe(diagram);
  new ResizeObserver(size).observe(diagram);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)start()});
  RM.addEventListener('change',()=>{if(RM.matches){draw=1;k=kTo;emer=emerTo;render()}else start()});
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{readColors();render()});
  new MutationObserver(()=>{readColors();render()}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  const s=engine.querySelector('.stage-dots');
  if(s)new MutationObserver(()=>{const st=stageOf();if(st!==stage)setStage(st)}).observe(s,{attributes:true,attributeFilter:['style']});
  for(const c of engine.querySelectorAll('.stage-card')){c.addEventListener('pointerenter',()=>boostTarget=3);c.addEventListener('pointerleave',()=>boostTarget=1)}
  diagram.addEventListener('pointermove',e=>{const r=diagram.getBoundingClientRect();const f=mix([paths[0].conv[3]],[paths[0].div[0]],ease(k))[0];boostTarget=Math.hypot(e.clientX-r.left-f.x*r.width/W,e.clientY-r.top-f.y*r.height/H)<40?3:1},{passive:true});
  diagram.addEventListener('pointerleave',()=>boostTarget=1);
  if(RM.matches)draw=1;
  size();setStage(stageOf(),true);
}
let q=0;const scan=()=>{q=0;document.querySelectorAll('.engine.cursor-spotlight .diagram').forEach(attach)};
scan();new MutationObserver(()=>{q||=requestAnimationFrame(scan)}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
})();
