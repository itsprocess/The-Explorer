export const tileIcons=[{id:'relic',icon:'✧',label:'Relic'},{id:'star',icon:'★',label:'Interesting'},{id:'danger',icon:'⚠',label:'Danger'},{id:'treasure',icon:'◆',label:'Treasure'},{id:'return',icon:'↩',label:'Return here'},{id:'portal',icon:'◎',label:'Travel'},{id:'question',icon:'?',label:'Investigate'}] as const;
export const tileTagPrefix=(character:string)=>'personal-tile:'+character+':';
