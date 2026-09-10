import type {CellContext} from './world';
type Environment=Pick<CellContext,'fieldwork'>;
export const constructedInterior=(c:Environment)=>c.fieldwork.some(f=>f.id==='civilization.inside'&&f.present&&f.value>0);
export const sheltered=(c:Environment)=>constructedInterior(c)||c.fieldwork.some(f=>f.id==='biome.underground'&&f.present&&f.value>0);
/** Regional ground vegetation does not describe the floor of a constructed interior. */
export const environmentPromptFields=(c:Environment)=>c.fieldwork.filter(f=>(f.id!=='biome.groundcover'||!constructedInterior(c))&&(f.id!=='biome.weather_severity'||!sheltered(c)));
export const settingCachePrefix=(c:Environment)=>constructedInterior(c)?'setting-interior-v3:':'setting-v2:';
