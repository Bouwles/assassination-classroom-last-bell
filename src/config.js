export const STAGES = [
 {name:'Show Me Your Plan',goal:3},
 {name:"I’m Paying Attention Now",goal:4},
 {name:'One Last Attempt',goal:5},
];
export const MOVEMENT = Object.freeze({walk:3.9,sprint:6.2,crouch:2.05,acceleration:32,brake:42,airControl:.68,dashSpeed:12.5,dashDuration:.19,dashRecovery:1.35,slideSpeed:7.8,slideDuration:.62,slideRecovery:.8,jumpSpeed:4.2,gravity:14,vaultDuration:.43,vaultReach:1.05});
const common={duration:480,magazine:10,shotCooldown:.18,knifeCooldown:.34,reload:.92,commitment:2.35,followMin:.24,followWindow:1.65,knifeFollowWindow:.85,recovery:1.1,tagProtection:2.3,sweepRange:3.65,sweepArc:1.35,sweepHeight:1.2,sweepDuration:.36,trapArm:.8,trapBind:2.3,allyKarma:10,allyKaede:12};
export const DIFFICULTIES = Object.freeze({
 normal:Object.freeze({...common,maxMistakes:5,tagTell:.88,tagSpeed:11,tagRecovery:1.55,attackInterval:4.5,sweepTell:.88,angleThreshold:.4,adaptation:23}),
 hard:Object.freeze({...common,maxMistakes:4,tagTell:.69,tagSpeed:12.4,tagRecovery:1.15,attackInterval:3.6,sweepTell:.7,angleThreshold:.49,followWindow:1.32,knifeFollowWindow:.68,commitment:1.95,adaptation:31}),
});
