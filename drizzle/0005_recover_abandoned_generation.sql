-- Custom SQL migration file, put your code below! --
-- Recover the interrupted generation reported during this rollout. Preserve every saved stage.
-- Four idle minutes exceeds either provider request timeout; do not disturb recent work.
UPDATE packages SET token=NULL,lease=0
WHERE value IS NULL AND updated < (unixepoch()*1000-240000)
AND NOT EXISTS (SELECT 1 FROM packages AS recent WHERE recent.updated >= (unixepoch()*1000-240000));
