export const serverStatsSQL=`SELECT
 (SELECT COUNT(*) FROM (SELECT DISTINCT x,y FROM visits)) AS locations,
 COALESCE(SUM(CAST(json_extract(value,'$.deaths') AS INTEGER)),0) AS deaths,
 COALESCE(MAX(CAST(json_extract(value,'$.furthest') AS REAL)),0) AS furthest,
 SUM(CASE WHEN CAST(json_extract(value,'$.furthest') AS REAL)>0 THEN 1 ELSE 0 END) AS explorers
 FROM characters`;
export const localPlayersSQL=`SELECT c.id,json_extract(c.value,'$.name') AS name
 FROM characters c JOIN character_presence p ON p.character=c.id
 WHERE p.seen>? AND c.id!=? AND json_extract(c.value,'$.x')=? AND json_extract(c.value,'$.y')=?
 ORDER BY name COLLATE NOCASE LIMIT 100`;
