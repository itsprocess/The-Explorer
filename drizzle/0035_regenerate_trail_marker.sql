-- Owner-requested regeneration of (3, -4) only. Preserve terrain, shared boundaries, history and character effects.
INSERT OR REPLACE INTO server_settings(key,value)
SELECT 'retired-image:' || key,json_extract(value,'$.objectKey') FROM packages
WHERE key='keys-beneath-the-lanterns:fieldwork-1:image:3:-4' AND json_extract(value,'$.objectKey') IS NOT NULL;
--> statement-breakpoint
DELETE FROM packages WHERE key IN (
 'keys-beneath-the-lanterns:fieldwork-1:cell:3:-4',
 'keys-beneath-the-lanterns:fieldwork-1:details:3:-4',
 'keys-beneath-the-lanterns:fieldwork-1:image:3:-4',
 'keys-beneath-the-lanterns:fieldwork-1:occurrence-text-interior-v7:3:-4',
 'keys-beneath-the-lanterns:fieldwork-1:occurrence-text-v7:3:-4'
);
--> statement-breakpoint
DELETE FROM generation_jobs WHERE scope='keys-beneath-the-lanterns:fieldwork-1:cell:3:-4';
--> statement-breakpoint
DELETE FROM server_settings WHERE key='keys-beneath-the-lanterns:fieldwork-1:image:3:-4:initial';
