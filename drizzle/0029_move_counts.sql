-- Convert historical displacement counters to completed moves without deleting records.
-- Preserve the original metrics for audit; returns and same-cell choice records are excluded.
WITH history AS (
 SELECT id,character,x,y,at,json_extract(value,'$.event.kind') kind,
 LAG(x) OVER(PARTITION BY character ORDER BY at,id) px,
 LAG(y) OVER(PARTITION BY character ORDER BY at,id) py,
 LAG(json_extract(value,'$.event.kind')) OVER(PARTITION BY character ORDER BY at,id) previous_kind
 FROM visits
), movements AS (
 SELECT *, CASE WHEN kind='return' THEN 0
 WHEN kind='portal' THEN 1
 WHEN px IS NOT NULL AND (x<>px OR y<>py) THEN 1
 WHEN kind='death' AND previous_kind='transport_pending' THEN 1 ELSE 0 END moved,
 SUM(CASE WHEN kind='return' THEN 1 ELSE 0 END) OVER(PARTITION BY character ORDER BY at,id ROWS UNBOUNDED PRECEDING) life
 FROM history
), totals AS (
 SELECT character,SUM(moved) total,
 SUM(CASE WHEN life=(SELECT MAX(m.life) FROM movements m WHERE m.character=movements.character) THEN moved ELSE 0 END) current_life
 FROM movements GROUP BY character
)
UPDATE characters SET value=json_set(value,
 '$.legacyDistanceLife',COALESCE(json_extract(value,'$.distanceLife'),0),
 '$.legacyDistanceTotal',COALESCE(json_extract(value,'$.distanceTotal'),0),
 '$.distanceLife',COALESCE((SELECT current_life FROM totals WHERE character=characters.id),0),
 '$.distanceTotal',COALESCE((SELECT total FROM totals WHERE character=characters.id),0)),revision=revision+1;

UPDATE characters SET value=json_set(value,
 '$.devState.distanceLife',json_extract(value,'$.distanceLife'),
 '$.devState.distanceTotal',json_extract(value,'$.distanceTotal'))
 WHERE json_type(value,'$.devState')='object';
