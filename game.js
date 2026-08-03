let S=[],C=null,sel=0,opened=0,currentCasePage=0,filteredCases=[];
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function view(id){$$('.view').forEach(x=>x.classList.toggle('active',x.id===id));if(id==='dashboard')dash();if(id==='journal')journal();if(id==='cases'){currentCasePage=0;cases()}scrollTo({top:0,behavior:'smooth'})}
fetch('scenarios.json').then(r=>r.json()).then(x=>{S=x;setupFilters();cases();dash();journalSelect()});
$$('[data-v]').forEach(b=>b.onclick=()=>view(b.dataset.v));$('#journalBtn').onclick=()=>view('journal');$('#back').onclick=()=>view('cases');

function setupFilters(){
  const bs=[...new Set(S.map(s=>s.bigBehavior))];
  $('#behaviorFilter').innerHTML='<option value="all">All five behaviors</option>'+bs.map(b=>`<option value="${b}">${b.replace('Failing to ','')}</option>`).join('');
  $('#behaviorFilter').onchange=()=>{currentCasePage=0;cases()};
  $('#statusFilter').onchange=()=>{currentCasePage=0;cases()};
  $('#prevCases').onclick=()=>{if(currentCasePage>0){currentCasePage--;renderCasePage()}};
  $('#nextCases').onclick=()=>{const pageSize=getPageSize();if((currentCasePage+1)*pageSize<filteredCases.length){currentCasePage++;renderCasePage()}};
}
function getPageSize(){
  if(innerWidth<=650)return 1;
  if(innerWidth<=900)return 2;
  if(innerWidth<=1200)return 3;
  return 5;
}
function caseArt(index){
  const art=['assets/oracle-character.jpg','assets/case-ui.jpg','assets/dco-character.jpg','assets/wayfinding.jpg','assets/bestiary.jpg'];
  return art[index%art.length];
}
function cases(){
  if(!S.length)return;
  const p=get('docProgress',{}),bf=$('#behaviorFilter')?.value||'all',sf=$('#statusFilter')?.value||'all';
  filteredCases=S.filter(s=>{
    const done=!!p[s.id];
    return (bf==='all'||s.bigBehavior===bf)&&(sf==='all'||(sf==='complete'&&done)||(sf==='new'&&!done));
  });
  $('#caseCount').textContent=`${filteredCases.length} matching case files`;
  renderCasePage();
}
function renderCasePage(){
  const p=get('docProgress',{}),pageSize=getPageSize();
  const pageCount=Math.max(1,Math.ceil(filteredCases.length/pageSize));
  currentCasePage=Math.min(currentCasePage,pageCount-1);
  const list=filteredCases.slice(currentCasePage*pageSize,currentCasePage*pageSize+pageSize);
  $('#caseGrid').innerHTML=list.map(s=>{
    const i=S.indexOf(s),done=p[s.id];
    return `<button class="case-card" data-i="${i}">
      <span class="case-top"><span>CASE ${s.caseNumber}</span><span class="${done?'status-done':'status-new'}">${done?`COMPLETED · ${done.score}%`:'NOT STARTED'}</span></span>
      <span class="case-body">
        <h3>${s.title}</h3>
        <span class="behavior">${s.bigBehavior.replace('Failing to ','')}</span>
        <img class="case-art" src="${caseArt(i)}" alt="">
        <span class="proclamation-preview">“${s.proclamation}”</span>
      </span>
      <span class="case-action"><span>${done?'REVIEW CASE':'OPEN CASE FILE'}</span><span>→</span></span>
    </button>`;
  }).join('');
  $$('.case-card').forEach(b=>b.onclick=()=>start(+b.dataset.i));
  $('#prevCases').disabled=currentCasePage===0;
  $('#nextCases').disabled=currentCasePage>=pageCount-1;
  $('#casePages').textContent=`CASE DRAWER ${currentCasePage+1} OF ${pageCount}`;
}
addEventListener('resize',()=>{if($('#cases').classList.contains('active'))renderCasePage()});
function start(i){C=S[i];opened=0;$('#caseNo').textContent='CASE FILE '+C.caseNumber;$('#caseTitle').textContent=C.title;$('#speaker').textContent=C.speaker;$('#question').textContent='“'+C.question+'”';$('#proclamation').textContent='“'+C.proclamation+'”';$('#score').textContent='0%';$('#aside').textContent='“The Oracle has spoken. Regrettably, the rest of us still have to work.”';p1();view('play')}
function p1(){$('#phase').textContent='1 · DO WE ACTUALLY MEAN THE SAME THING?';$('#stage').innerHTML=`<h3>Choose the interpretation you would act on.</h3><p>All three are plausible. Only one tests the hidden assumption before work begins.</p><div class="options">${C.options.map((o,i)=>`<button class="option" data-o="${i}"><b>${String.fromCharCode(65+i)}</b><br><br>${o}</button>`).join('')}</div>`;$$('.option').forEach(b=>b.onclick=()=>{sel=+b.dataset.o;p2()})}
function p2(){$('#phase').textContent='2 · IF NOT, WHAT QUESTIONS SHOULD I ASK?';$('#aside').textContent='“Questions. A controversial approach, but still legal in most provinces.”';$('#stage').innerHTML=`<p><b>Your interpretation:</b> ${C.options[sel]}</p><h3>Open all three interviews to collect evidence.</h3><div class="interviews">${C.questions.map((q,i)=>`<article class="interview"><h4>${q.text}</h4><button data-q="${i}">ASK THIS QUESTION</button><div class="evidence" id="e${i}" hidden>${q.evidence}</div></article>`).join('')}</div><div class="actions"><button id="commit" class="primary" disabled>COMMIT TO INTERPRETATION</button></div>`;$$('[data-q]').forEach(b=>b.onclick=()=>{const e=$('#e'+b.dataset.q);if(e.hidden){e.hidden=false;opened++;b.disabled=true;b.textContent='EVIDENCE COLLECTED'}if(opened===3)$('#commit').disabled=false});$('#commit').onclick=p3}
function p3(){const score=sel===C.optimalIndex?92:54;$('#score').textContent=score+'%';$('#phase').textContent='3 · WHAT HAPPENS IF I GET IT WRONG?';$('#stage').innerHTML=`<h3>Consequence Cascade</h3><p>The Department acts on your interpretation.</p><div class="cascade">${C.cascade.map((x,i)=>`<div><b>${i+1}.</b> ${x}</div>`).join('')}</div><div class="actions"><button id="reveal" class="primary">OPEN MENTAL MODEL REVEAL</button></div>`;$('#reveal').onclick=()=>p4(score)}
function p4(score){const ok=sel===C.optimalIndex;$('#phase').textContent='4 · WHAT WAS REALLY GOING ON, AND HOW CAN I DO BETTER NEXT TIME?';$('#stage').innerHTML=`<div class="reveal"><div><h3>Mental Model Reveal</h3><p><b>Five Big Behavior</b><br>${C.bigBehavior}</p><p><b>Hidden assumption</b><br>The Oracle assumed everyone shared the same meaning without checking.</p><p><b>Replacement action</b><br>${C.replacement}</p></div><div><h3>Performance: ${score}%</h3><p>${ok?'You tested the assumption before acting.':'You selected a plausible interpretation without resolving the hidden assumption.'}</p><label>What assumption did you notice?<textarea id="r1" rows="3"></textarea></label><label>What question will you ask next time?<textarea id="r2" rows="3"></textarea></label></div></div><div class="actions"><button id="finish" class="primary">FILE REPORT IN TRIPLICATE</button>${ok?'':'<button id="retry" class="danger">TRY ANOTHER INTERPRETATION</button>'}</div>`;if($('#retry'))$('#retry').onclick=p1;$('#finish').onclick=()=>finish(score)}
function finish(score){const p=get('docProgress',{});p[C.id]={score,behavior:C.bigBehavior};set('docProgress',p);const a=$('#r1').value.trim(),q=$('#r2').value.trim();if(a||q){const j=get('docJournal',[]);j.unshift({date:new Date().toLocaleDateString(),title:C.title,assumption:a,question:q});set('docJournal',j)}view('dashboard')}
function dash(){if(!S.length)return;const p=get('docProgress',{}),v=Object.values(p),n=v.length,avg=n?Math.round(v.reduce((a,b)=>a+b.score,0)/n):0;$('#done').textContent=n+'/25';$('#avg').textContent=avg+'%';$('#rank').textContent=n>=25?'Chief Clarifier':n>=15?'Senior Damage Controller':n>=5?'Licensed Assumption Auditor':'Probationary Clarifier';$('#progress').innerHTML=[...new Set(S.map(s=>s.bigBehavior))].map(b=>{const x=v.filter(y=>y.behavior===b).length;return `<div class="progressRow"><span>${b}</span><div class="bar"><i style="width:${x/5*100}%"></i></div><b>${x}/5</b></div>`}).join('')}
function journalSelect(){$('#jc').innerHTML=S.map(s=>`<option>${s.title}</option>`).join('')}
$('#save').onclick=()=>{const j=get('docJournal',[]);j.unshift({date:new Date().toLocaleDateString(),title:$('#jc').value,assumption:$('#ja').value.trim(),question:$('#jq').value.trim()});set('docJournal',j);$('#ja').value=$('#jq').value='';journal()};
function journal(){const j=get('docJournal',[]);$('#entries').innerHTML=j.length?j.map(x=>`<article class="entry"><b>${x.title}</b> · ${x.date}<p><strong>Assumption:</strong> ${x.assumption||'Not recorded'}</p><p><strong>Next question:</strong> ${x.question||'Not recorded'}</p></article>`).join(''):'<p>No entries yet. The Oracle calls this efficient recordkeeping.</p>'}


// Build 11 landing navigation delegation.
document.addEventListener("click", function(event){
  const control = event.target.closest("#landing [data-v]");
  if (!control) return;
  event.preventDefault();
  view(control.dataset.v);
});
