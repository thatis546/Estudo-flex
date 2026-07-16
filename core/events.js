const bus=new EventTarget();
export const events={
 on:(e,cb)=>bus.addEventListener(e,cb),
 off:(e,cb)=>bus.removeEventListener(e,cb),
 emit:(e,d)=>bus.dispatchEvent(new CustomEvent(e,{detail:d}))
};