import{n as e,s as t}from"./server-Cvtl7jXY.js";import{n,r}from"./auth-BMjJcZX1.js";import{i}from"./character-auth-JRI9rVZR.js";import{t as a}from"./game-DA_br28R.js";var o=`SELECT
 (SELECT COUNT(*) FROM (SELECT DISTINCT x,y FROM visits)) AS locations,
 COALESCE(SUM(CAST(json_extract(value,'$.deaths') AS INTEGER)),0) AS deaths,
 COALESCE(MAX(CAST(json_extract(value,'$.furthest') AS REAL)),0) AS furthest,
 SUM(CASE WHEN CAST(json_extract(value,'$.furthest') AS REAL)>0 THEN 1 ELSE 0 END) AS explorers
 FROM characters`,s=`SELECT c.id,json_extract(c.value,'$.name') AS name
 FROM characters c JOIN character_presence p ON p.character=c.id
 WHERE p.seen>? AND c.id!=? AND json_extract(c.value,'$.x')=? AND json_extract(c.value,'$.y')=?
 ORDER BY name COLLATE NOCASE LIMIT 100`;async function c(c){try{n(c);let r=await i(c),l=await c.text();if(l.length>256)throw new t(`Request too large.`,413);let u;try{u=JSON.parse(l)}catch{throw new t(`Invalid request.`)}let d=JSON.parse((await a(r.owner,r.id)).value);if(u?.x!==d.x||u?.y!==d.y)throw new t(`The character has moved.`,409);let f=Date.now();await e().prepare(`INSERT INTO character_presence(character,seen) VALUES(?,?) ON CONFLICT(character) DO UPDATE SET seen=excluded.seen`).bind(d.id,f).run();let[p,m]=await Promise.all([e().prepare(s).bind(f-9e4,d.id,d.x,d.y).all(),e().prepare(o).first()]);return Response.json({x:d.x,y:d.y,nearby:p.results,stats:m},{headers:{"Cache-Control":`no-store`}})}catch(e){return r(e)}}export{c as POST};