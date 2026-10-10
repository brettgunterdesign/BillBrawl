const controls='button,input,select,textarea';
const usable=e=>!e.disabled&&!e.closest('.hidden,[hidden],[inert]')&&e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0;
const identity=e=>e.id||[...e.attributes].filter(a=>a.name.startsWith('data-')).map(a=>a.name+'='+a.value).join('|')+'@'+(e.closest('[data-slot]')?.dataset.slot??'');
const sample=g=>{const pressed=n=>!!g.buttons[n]?.pressed;return {x:(g.axes[0]||0)<-.5||pressed(14)?-1:(g.axes[0]||0)>.5||pressed(15)?1:0,y:(g.axes[1]||0)<-.5||pressed(12)?-1:(g.axes[1]||0)>.5||pressed(13)?1:0,a:pressed(0),b:pressed(1),start:pressed(9),lb:pressed(4),rb:pressed(5)};};

// One sampler owns button edges across every overlay, so a held confirm cannot
// activate a newly opened screen. Focus identities survive rebuilt crew/upgrade UI.
export class MenuController{
 constructor({cue=()=>{},edit=()=>{}}={}){this.cue=cue;this.edit=edit;this.previous=new Map();this.memory=new Map();this.scope=null;this.active=false;this.repeatAt=0;
  for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>{this.active=false;this.clear();});
 }
 clear(){document.querySelectorAll('.controller-focus').forEach(e=>e.classList.remove('controller-focus'));}
 buttons(){return this.scope?[...this.scope.root.querySelectorAll(controls)].filter(usable):[];}
 focus(e){if(!e||!usable(e))return;if(document.activeElement===e&&e.classList.contains('controller-focus'))return;this.clear();e.classList.add('controller-focus');e.focus({preventScroll:true});e.scrollIntoView({block:'nearest',inline:'nearest'});this.memory.set(this.scope.key,identity(e));}
 refresh(scope,connected){const changed=scope?.key!==this.scope?.key;this.scope=scope;
  if(!connected||!scope){this.clear();return;}
  if(!this.active)return;
  const buttons=this.buttons(),remembered=this.memory.get(scope.key),current=document.activeElement;
  if(!changed&&buttons.includes(current)){this.focus(current);return;}
  const initial=scope.initial?.();this.focus(buttons.find(e=>identity(e)===remembered)||(initial&&usable(initial)?initial:buttons[0]));
 }
 move(delta){const buttons=this.buttons(),at=buttons.indexOf(document.activeElement);if(!buttons.length)return;this.focus(buttons[(Math.max(0,at)+delta+buttons.length)%buttons.length]);this.cue();}
 adjust(delta){const e=document.activeElement;
  if(e?.tagName==='SELECT'){const available=[...e.options].filter(o=>!o.disabled),at=available.indexOf(e.selectedOptions[0]);if(!available.length)return;e.value=available[(Math.max(0,at)+delta+available.length)%available.length].value;e.dispatchEvent(new Event('change',{bubbles:true}));this.cue();return;}
  if(e?.type==='range'){e.value=String(Math.max(Number(e.min||0),Math.min(Number(e.max||100),Number(e.value)+delta*5)));e.dispatchEvent(new Event('input',{bubbles:true}));this.cue();return;}
  if(this.scope.horizontal?.(delta,e,this))return;this.move(delta);
 }
 activate(){const e=document.activeElement;if(!this.buttons().includes(e))return;
  if(this.scope.confirm?.(e,this))return;
  if(e.tagName==='BUTTON')e.click();else if(['text','search'].includes(e.type))this.edit(e);else if(e.tagName==='SELECT')this.adjust(1);
  this.scope.afterActivate?.(e,this);
 }
 poll(controllers,scope,{secondary=()=>{},start=()=>{}}={}){
  let startUsed=false;const now=new Map();controllers.forEach((g,index)=>{const state=sample(g),old=this.previous.get(g.index)||{},edge=key=>state[key]&&!old[key];now.set(g.index,state);
   if(index){secondary(index,state,edge,old);if(edge('start')&&!startUsed){startUsed=true;if(scope)scope.start?.(this);else start();}return;}
   const direction=state.y||state.x,axis=state.y?'y':'x',oldDirection=old[axis]||0,time=performance.now();
   const activity=!!direction||['a','b','start','lb','rb'].some(edge);if(activity||!this.previous.has(g.index))this.active=true;
   this.refresh(scope,true);
   if(!scope){if(edge('start')&&!startUsed){startUsed=true;start();}return;}
   if(direction&&(direction!==oldDirection||time>=this.repeatAt)){if(direction!==oldDirection)this.repeatAt=time+420;else this.repeatAt=time+140;
    if(state.y){if(!scope.vertical?.(state.y,document.activeElement,this))this.move(state.y);}else this.adjust(state.x);
   }else if(!direction)this.repeatAt=0;
   if(edge('lb')||edge('rb')){const delta=edge('rb')?1:-1;if(!scope.bumper?.(delta,this))this.move(delta);}
   if(edge('a'))this.activate();else if(edge('b'))scope.back?.(this);else if(edge('start')&&!startUsed){startUsed=true;scope.start?.(this);}
  });
  this.previous=now;if(!controllers.length)this.refresh(scope,false);
 }
}

// Controller text entry for online names and room codes; ordinary keyboard input
// keeps using the existing fields. Drafts are only applied when Done is selected.
export class ControllerKeyboard{
 constructor(){this.target=null;this.root=document.createElement('div');this.root.id='controller-keyboard';this.root.className='overlay hidden';this.root.setAttribute('role','dialog');this.root.setAttribute('aria-modal','true');this.root.setAttribute('aria-label','Controller keyboard');document.getElementById('screen').append(this.root);}
 open(target){this.target=target;this.draft=target.value;this.inertStates=[...this.root.parentElement.children].filter(e=>e!==this.root).map(e=>[e,e.inert]);for(const [e] of this.inertStates)e.inert=true;this.root.innerHTML='<div class="controller-keyboard-content"><h2></h2><output aria-live="polite"></output><div class="controller-keys"></div><div class="controller-key-actions"><button data-edit="delete">⌫</button><button data-edit="clear">CLEAR</button><button data-edit="cancel">BACK</button><button data-edit="done">DONE →</button></div></div>';
  this.root.querySelector('h2').textContent=target.id==='online-code'?'ROOM CODE.':'YOUR NAME.';
  const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'+(target.id==='online-code'?'23456789':'0123456789 -_');
  for(const char of letters){const b=document.createElement('button');b.dataset.char=char;b.textContent=char===' '?'SPACE':char;b.onclick=()=>{if(this.draft.length<target.maxLength)this.draft+=char;this.update();};this.root.querySelector('.controller-keys').append(b);}
  this.root.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{if(b.dataset.edit==='done')this.close(true);else if(b.dataset.edit==='cancel')this.close();else {this.draft=b.dataset.edit==='delete'?this.draft.slice(0,-1):'';this.update();}});this.root.classList.remove('hidden');this.update();
 }
 update(){this.root.querySelector('output').textContent=this.draft||'…';}
 close(save=false){if(!this.target)return;const target=this.target;if(save){target.value=this.draft;target.dispatchEvent(new Event('input',{bubbles:true}));target.dispatchEvent(new Event('change',{bubbles:true}));}this.target=null;this.root.classList.add('hidden');for(const [e,inert] of this.inertStates)e.inert=inert;target.focus({preventScroll:true});}
 scope(){if(!this.target)return null;return {key:'text-'+this.target.id,root:this.root,initial:()=>this.root.querySelector('[data-char]'),back:()=>this.close(),start:()=>this.close(true),horizontal:(delta,e,nav)=>{nav.move(delta);return true;},vertical:(delta,e,nav)=>{
   const chars=[...this.root.querySelectorAll('[data-char]')],at=chars.indexOf(e);if(at<0)return false;const columns=getComputedStyle(this.root.querySelector('.controller-keys')).gridTemplateColumns.split(' ').length,next=at+delta*columns;nav.focus(next<0?this.root.querySelector('[data-edit="done"]'):next>=chars.length?this.root.querySelector('[data-edit="delete"]'):chars[next]);return true;
  }};}
}
