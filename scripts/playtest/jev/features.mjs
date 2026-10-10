// Only present, camera-visible game information reaches Jev. No RNG, bot brain, future input, or reward.
const visible=(a,c)=>a.x<c.x+c.width&&a.x+(a.w||16)>c.x&&a.y<c.y+c.height&&a.y+(a.h||22)>c.y;
export const ACTIONS={advance:{},jump_advance:{jump:true},crouch_advance:{down:true},drop:{down:true,jump:true},attack:{fire:true},interact:{grab:true},retreat:{},explore:{},release_charge:{}};
export function featuresFor(observation,id=0){
 const {state,terrain,camera}=observation,self=state.players.find(p=>p.id===id),actors=state.players.filter(p=>p.id!==id&&(p.alive||p.downed)&&visible(p,camera)),enemies=terrain.enemies.filter(a=>visible(a,camera)),items=terrain.items.filter(a=>visible(a,camera)),surfaces=terrain.platforms.filter(a=>!a.destroyed&&visible(a,camera)),objects=terrain.objects.filter(a=>!a.destroyed&&visible(a,camera));
 const nearest=list=>[...list].sort((a,b)=>Math.hypot(a.x-self.x,a.y-self.y)-Math.hypot(b.x-self.x,b.y-self.y))[0];
 const partner=state.mode==='zombie'?nearest(actors.filter(a=>a.downed)):null,target=state.mode==='zombie'?nearest(enemies):nearest(actors.filter(a=>a.alive));
 let goal=partner||(!self.weapon||self.ammo===0?nearest(items.filter(a=>a.ammo!==0&&!['medkit','ammo'].includes(a.type))):target);
 goal??=nearest(surfaces.filter(a=>a.y<self.y&&a.y>self.y-95));goal??={x:terrain.width/2,y:self.y};
 const dx=goal.x-self.x,dy=goal.y-self.y,dir=dx>=0?1:-1;
 const ahead=objects.filter(a=>a.solid&&!a.open&&a.y<self.y+self.h&&a.y+a.h>self.y&&Math.abs(a.x-self.x)<60);
 const hazards=terrain.hazards.filter(a=>visible(a,camera));
 return {self,phase:state.phase,round:state.round,arena:state.arena,wave:state.wave,mode:state.mode,goal:{x:goal.x,y:goal.y,dx,dy,dir,type:goal.type||goal.kind||'combatant'},target:target?{x:target.x,y:target.y,dx:target.x-self.x,dy:target.y-self.y,kind:target.kind||'player'}:null,nearbyPartner:partner?{x:partner.x,y:partner.y,distance:Math.hypot(partner.x-self.x,partner.y-self.y)}:null,pickups:items.map(a=>({x:a.x,y:a.y,type:a.type,ammo:a.ammo})),surfaces:surfaces.map(a=>({x:a.x,y:a.y,w:a.w,h:a.h,oneWay:a.oneWay,material:a.material})),objects:objects.map(a=>({type:a.type,x:a.x,y:a.y,w:a.w,h:a.h,solid:a.solid,open:a.open})),hazards,ahead,camera};
}
export function actionInput(action,f,tick){
 if(!Object.hasOwn(ACTIONS,action))throw Error('Jev selected an unknown action');const i={...ACTIONS[action]};
 const move=action==='retreat'?-f.goal.dir:action==='explore'?(Math.floor(tick/90)%2?1:-1):f.goal.dir;
 if(['advance','jump_advance','crouch_advance','retreat','explore'].includes(action)){i.left=move<0;i.right=move>0;}
 if(action==='attack'&&f.target){const targetDir=f.target.dx>=0?1:-1;if(f.self.dir!==targetDir){i.left=targetDir<0;i.right=targetDir>0;}else i.strafe=true;}
 // A pressed action must have a release tick to create a fresh jump/grab edge.
 if(action==='jump_advance'||action==='drop')i.jump=tick%3!==2;
 if(action==='interact'&&!f.nearbyPartner)i.grab=tick%2===0;
 return i;
}
