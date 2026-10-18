export function formatTime(seconds){const whole=Math.max(0,Math.ceil(seconds));return `${Math.floor(whole/60)}:${String(whole%60).padStart(2,'0')}`;}
export function targetSide(player,target){const right=(target.x-player.x)*Math.cos(player.yaw)-(target.z-player.z)*Math.sin(player.yaw);return right<0?'left':'right';}
