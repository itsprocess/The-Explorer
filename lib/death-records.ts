export function deathRecordsQuery(character:string,offset=0){
 if(!/^[a-zA-Z0-9-]{1,80}$/.test(character)||!Number.isSafeInteger(offset)||offset<0||offset>100000)throw Error('Invalid death record request.');
 return {sql:"SELECT id,at,json_extract(value,'$.event.text') AS text,json_extract(value,'$.event.choice') AS choice FROM visits WHERE character=? AND json_extract(value,'$.event.kind')='death' ORDER BY at DESC,id DESC LIMIT 26 OFFSET ?",params:[character,offset]};
}
