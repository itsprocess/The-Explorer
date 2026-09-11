import type {fieldworkAt} from './fieldwork';
type Environment={fieldwork:ReturnType<typeof fieldworkAt>['fields']};
export const constructedInterior=(c:Environment)=>c.fieldwork.some(f=>f.id==='civilization.inside'&&f.present&&f.value>0);
export const sheltered=(c:Environment)=>constructedInterior(c)||c.fieldwork.some(f=>f.id==='biome.underground'&&f.present&&f.value>0);
export const ignoresLocalRiver=(c:Environment)=>constructedInterior(c)||c.fieldwork.some(f=>f.present&&((f.id==='biome.underground'&&f.value>0)||(f.id==='civilization.footprint'&&f.value>=.35)));
/** Regional ground vegetation does not describe the floor of a constructed interior. */
export const environmentPromptFields=(c:Environment)=>c.fieldwork.filter(f=>(!['biome.river','biome.river_barrier'].includes(f.id)||!ignoresLocalRiver(c))&&(f.id!=='biome.groundcover'||!constructedInterior(c))&&(f.id!=='biome.weather_severity'||!sheltered(c)));
export const settingCachePrefix=(c:Environment)=>constructedInterior(c)?'setting-interior-v4:':'setting-v3:';
