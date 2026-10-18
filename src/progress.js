export const RECORD_KEY='last-bell-records-v1';
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
export function summarize(lesson){
 const s=lesson.stats||{},setups=s.setups;
 const variety=setups instanceof Set?setups.size:Array.isArray(setups)?new Set(setups).size:setups&&typeof setups==='object'?Object.values(setups).filter(Boolean).length:finite(setups);
 return {won:lesson.status==='won',mode:lesson.mode||'standard',difficulty:lesson.difficulty||'normal',seed:lesson.seed,seconds:Math.max(0,finite(lesson.duration,420)-finite(lesson.remaining)),hits:finite(lesson.hits),mistakes:finite(lesson.mistakes),maxMistakes:finite(lesson.maxMistakes,5),accuracy:s.shots?Math.min(100,Math.round(finite(s.accurateShots)/s.shots*100)):0,evasions:finite(s.evasions),variety,grade:lesson.grade||'—'};
}
export function readRecords(storage){try{const data=JSON.parse(storage.getItem(RECORD_KEY)||'{}');return data&&typeof data==='object'&&!Array.isArray(data)?data:{};}catch{return {};}}
export function recordResult(records,result){
 const key=`${result.mode}:${result.difficulty}`,old=records[key]||{},next={...old,attempts:(old.attempts||0)+1,last:result};
 if(result.won){next.wins=(old.wins||0)+1;next.bestTime=Math.min(finite(old.bestTime,Infinity),result.seconds);next.bestAccuracy=Math.max(finite(old.bestAccuracy),result.accuracy);next.bestEvasions=Math.max(finite(old.bestEvasions),result.evasions);next.bestVariety=Math.max(finite(old.bestVariety),result.variety);next.fewestMistakes=Math.min(finite(old.fewestMistakes,Infinity),result.mistakes);if(!old.best||result.seconds<old.best.seconds)next.best=result;}
 return {...records,[key]:next};
}
