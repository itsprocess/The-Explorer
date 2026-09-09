import {civilizationEventDrive} from './encounter-refinement';
import { clamp, perlin, random } from '../lib/noise';

export const SOURCES = ['perlin', 'fbm', 'ridged', 'cellular', 'white', 'patches', 'sparks', 'constant', 'variable'] as const;
export const MAX_VARIABLES=48;
export const BLENDS = ['replace', 'add', 'subtract', 'multiply', 'min', 'max', 'screen'] as const;
export type Source = typeof SOURCES[number];
export type Blend = typeof BLENDS[number];
export type Layer = {
  id: string; name: string; enabled: boolean; source: Source; channel: string;
  reference: string; blend: Blend; weight: number;
  scaleX: number; scaleY: number; offsetX: number; offsetY: number; rotation: number;
  octaves: number; persistence: number; lacunarity: number; gain: number; bias: number;
  invert: boolean; constant: number;
  noiseTransform?: 'value' | 'distance' | 'band'; noiseTarget?: number;
  bandLow?: number; bandHigh?: number;
  referenceMode?: 'value' | 'at-most' | 'at-least' | 'fade-below' | 'fade-above'; referenceCutoff?: number;
  fadeLow?: number; fadeHigh?: number;
  patchSpacing?: number; patchChance?: number; patchMinDiameter?: number; patchMaxDiameter?: number;
  patchRoughness?: number;
  sparkCutoff?: number; sparkFloor?: number;
};
export type EnumStep = { id: string; name: string; cutoff: number; description: string };
export type Variable = {
  presenceReference?: string;
  traversal?: { mode: 'passable' | 'positive' | 'threshold'; cutoff?: number };
  category: 'biome' | 'civilization' | 'variation' | 'occurrences';
  id: string; appName: string; naturalName: string; description: string; color: string;
  type: 'boolean' | 'enum' | 'gradient'; cutoff: number;
  off: string; on: string; low: string; high: string;
  steps: EnumStep[]; layers: Layer[];
};
export type Project = { occurrenceCivilizationBoost?: number; uniquenessRevision?: number; uniquenessEscalation?: {enabled:boolean;reach:number;power:number}; version: 3; name: string; seed: string; variables: Variable[]; biomeRecipeRevision?: number; riverStudyRevision?: number; ecologyRevision?: number; climateRevision?: number; waterFissureRevision?: number; traversalRevision?: number; civilizationRevision?: number; infrastructureRevision?: number; civilizationShapeRevision?: number; civilizationImpactRevision?: number; organicCivilizationRevision?: number; riverCrossingRevision?: number; civilizationObeysTraversal?: boolean };
export type Trace = { id: string; source: number; adjusted: number; accumulated: number };
export type Result = { present?: boolean; raw: number; value: number; label: string; description: string; trace: Trace[] };
export const uid = () => globalThis.crypto.randomUUID();
export const newLayer = (index = 0): Layer => ({
  id: uid(), name: index ? 'Detail' : 'Base field', enabled: true,
  source: index ? 'perlin' : 'fbm', channel: uid(), reference: '', blend: index ? 'add' : 'replace', weight: index ? .25 : 1,
  scaleX: index ? 12 : 48, scaleY: index ? 12 : 48, offsetX: 0, offsetY: 0,
  rotation: 0, octaves: 4, persistence: .5, lacunarity: 2, gain: 1, bias: 0, invert: false, constant: .5,
});
export function newVariable(index: number): Variable {
  return { category: 'biome', id: uid(), appName: `sandbox.variable_${index}`, naturalName: `Variable ${index}`, description: '',
    color: ['#55c9a5', '#eeb55b', '#6babef', '#ce97e8'][index % 4], type: 'gradient', cutoff: .5,
    off: 'Absent', on: 'Present', low: 'Low intensity', high: 'High intensity',
    steps: [{ id: uid(), name: 'Low', cutoff: 0, description: 'A low amount.' },
      { id: uid(), name: 'Medium', cutoff: .4, description: 'A moderate amount.' },
      { id: uid(), name: 'High', cutoff: .65, description: 'A high amount.' }], layers: [newLayer()] };
}
export function starter(): Project {
  const v = newVariable(1);
  v.naturalName = 'Terrain height'; v.appName = 'sandbox.terrain_height'; v.color = '#55c9a5';
  v.description = 'An experimental surface-height field. Use it to explore broad regions and local detail.';
  v.low = 'Low-lying basins and hollows'; v.high = 'High ridges and uplands';
  v.layers[0].channel = 'terrain-base'; v.layers[0].gain = 2.4; v.layers[0].bias = -.7;
  return { version: 3, name: 'Untitled field study', seed: 'field-study-001', variables: [v] };
}

export function classify(v: Variable, raw: number): Omit<Result, 'trace'> {
  raw = clamp(raw);
  if (v.type === 'boolean') {
    const active = raw >= v.cutoff;
    return { raw, value: active ? 1 : 0, label: active ? 'On' : 'Off', description: active ? v.on : v.off };
  }
  if (v.type === 'enum') {
    const steps = [...v.steps].sort((a, b) => a.cutoff - b.cutoff);
    let i = 0;
    for (let j = 0; j < steps.length; j++) if (raw >= steps[j].cutoff) i = j;
    const step = steps[i];
    return { raw, value: steps.length > 1 ? i / (steps.length - 1) : 0,
      label: step?.name ?? 'Undefined', description: step?.description ?? '' };
  }
  return { raw, value: raw, label: `${(raw * 100).toFixed(1)}%`, description: `${v.low} ↔ ${v.high}` };
}

export function blend(base: number, input: number, mode: Blend, weight: number) {
  const target = mode === 'replace' ? input : mode === 'add' ? base + input : mode === 'subtract' ? base - input :
    mode === 'multiply' ? base * input : mode === 'min' ? Math.min(base, input) : mode === 'max' ? Math.max(base, input) : 1 - (1 - base) * (1 - input);
  return clamp(base + (target - base) * weight);
}

function primitive(seed: string, layer: Layer, x: number, y: number,drive=1): number {
  // Offset is in world cells. Half-cell sampling avoids integer-lattice Perlin artifacts.
  const a = layer.rotation * Math.PI / 180;
  const dx = x + .5 + layer.offsetX, dy = y + .5 + layer.offsetY;
  const px = (dx * Math.cos(a) - dy * Math.sin(a)) / layer.scaleX;
  const py = (dx * Math.sin(a) + dy * Math.cos(a)) / layer.scaleY;
  const channel = layer.channel;
  if (layer.source === 'constant') return layer.constant;
  if(layer.source==='sparks'){
    const ix=Math.floor(dx),iy=Math.floor(dy),r=random(seed,channel,ix,iy);
    if(r<Math.pow(layer.sparkCutoff??.998,drive))return 0;
    // Local maxima cannot share an edge or corner: sparks remain single cells.
    for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)if(i||j){
      const neighbor=random(seed,channel,ix+i,iy+j);
      if(neighbor>r||(neighbor===r&&(i<0||(i===0&&j<0))))return 0;
    }
    const floor=layer.sparkFloor??.5;
    return floor+(1-floor)*random(seed,channel+':amplitude',ix,iy);
  }
  if (layer.source === 'patches') {
    // Compact support in world cells, with a gap between neighboring blocks.
    // Scale and rotation do not alter these explicitly bounded diameters.
    const spacing=layer.patchSpacing??32,low=layer.patchMinDiameter??5,high=layer.patchMaxDiameter??8;
    if(low>high||spacing<high+2)throw Error('Patch spacing must exceed maximum diameter by at least 2 cells; minimum diameter must not exceed maximum.');
    const ix=Math.floor(dx/spacing),iy=Math.floor(dy/spacing);
    if(random(seed,channel+':occupied',ix,iy)>=(layer.patchChance??.25))return 0;
    const margin=high/2+1,room=spacing-2*margin;
    const cx=ix*spacing+margin+room*random(seed,channel+':x',ix,iy);
    const cy=iy*spacing+margin+room*random(seed,channel+':y',ix,iy);
    const diameter=low+(high-low)*random(seed,channel+':diameter',ix,iy);
    let radius=diameter/2;
    const roughness=layer.patchRoughness??0;
    if(roughness>0){
      const angle=Math.atan2(dy-cy,dx-cx);
      const ux=Math.cos(angle),uy=Math.sin(angle);
      const broad=perlin(seed,channel+':boundary',ix*13.7+ux*1.2,iy*17.3+uy*1.2);
      const detail=perlin(seed,channel+':boundary-detail',ix*19.1+ux*3.2,iy*11.9+uy*3.2);
      const lobes=Math.max(-1,Math.min(1,((broad-.5)*.8+(detail-.5)*.2)*5));
      // A seeded, smooth irregular boundary inside the original diameter envelope.
      radius*=1-roughness*.3+roughness*.3*lobes;
    }
    const t=clamp(1-Math.hypot(dx-cx,dy-cy)/radius);
    return t*t*(3-2*t);
  }
  if (layer.source === 'white') return random(seed, channel, Math.floor(px), Math.floor(py));
  if (layer.source === 'perlin') return perlin(seed, channel, px, py);
  if (layer.source === 'cellular') {
    let nearest = Infinity;
    const ix = Math.floor(px), iy = Math.floor(py);
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
      const cx = ix + i, cy = iy + j;
      nearest = Math.min(nearest, Math.hypot(px - cx - random(seed, channel + ':x', cx, cy), py - cy - random(seed, channel + ':y', cx, cy)));
    }
    return clamp(nearest / Math.SQRT2);
  }
  let total = 0, weights = 0, amplitude = 1, frequency = 1;
  for (let i = 0; i < layer.octaves; i++) {
    const n = perlin(seed, `${channel}:${i}`, px * frequency + 17.137 * i, py * frequency + 9.731 * i);
    total += (layer.source === 'ridged' ? 1 - Math.abs(2 * n - 1) : n) * amplitude;
    weights += amplitude; amplitude *= layer.persistence; frequency *= layer.lacunarity;
  }
  return total / weights;
}

export function generateNoise(seed:string, layer:Layer, x:number, y:number,drive=1):number {
  return primitive(seed,layer,x,y,drive);
}

export function uniquenessDrive(project:Project,x:number,y:number):number {
  const s=project.uniquenessEscalation;
  return s?.enabled?Math.pow(1+Math.hypot(x,y)/s.reach,s.power):1;
}
export function growUniqueness(value:number,drive:number):number {
  return value<=0?0:value>=1?1:Math.min(1-Number.EPSILON,Math.pow(value,1/drive));
}

export function adjustNoise(source:number,layer:Layer):number {
  if(layer.source==='variable'&&(layer.referenceMode==='fade-below'||layer.referenceMode==='fade-above')) {
    const low=layer.fadeLow??.55,high=layer.fadeHigh??.85;
    if(!(high>low))throw Error('Fade end must be greater than fade start.');
    const t=clamp((source-low)/(high-low)),smooth=t*t*(3-2*t);
    source=layer.referenceMode==='fade-below'?1-smooth:smooth;
  }
  if(layer.source==='variable'&&layer.referenceMode==='at-most')source=source<=(layer.referenceCutoff??.42)?1:0;
  if(layer.source==='variable'&&layer.referenceMode==='at-least')source=source>=(layer.referenceCutoff??.42)?1:0;
  const noise=layer.invert?1-source:source;
  const supported=layer.source==='perlin'||layer.source==='fbm';
  if(supported&&layer.noiseTransform==='band') {
    const low=layer.bandLow??.495,high=layer.bandHigh??.505;
    if(!(high>low))throw Error('Contour band high must be greater than low.');
    // Keep the signed ridge unbounded until AFTER gain and offset.
    const ridge=1-Math.abs(2*(noise-low)/(high-low)-1);
    return clamp(ridge*layer.gain+layer.bias);
  }
  const scaled=noise*layer.gain+layer.bias;
  return clamp(supported&&layer.noiseTransform==='distance'?1-Math.abs(scaled-(layer.noiseTarget??.5)):scaled);
}

/** Reuses a per-coordinate cache across dependency branches; no game state is read. */
export function evaluator(project: Project) {
  const vars = new Map(project.variables.map(v => [v.id, v]));
  const blockers=project.variables.filter(v=>v.category==='biome'&&v.traversal&&v.traversal.mode!=='passable');
  if(project.civilizationObeysTraversal){const errors=traversalIssues(project);if(errors.length)throw Error(errors.join(' '));}
  return (id: string, x: number, y: number): Result => {
    const cache = new Map<string, Result>(), active = new Set<string>();
    const evaluate = (key: string): Result => {
      const cached = cache.get(key); if (cached) return cached;
      if (active.has(key)) throw new Error('Circular variable dependency. Remove one of the reference layers.');
      const v = vars.get(key); if (!v) throw new Error('Choose an existing variable for every reference layer.');
      active.add(key);
      const drive=v.category==='variation'?uniquenessDrive(project,x,y):1;
      const sparkDrive=v.category==='occurrences'&&project.occurrenceCivilizationBoost?civilizationEventDrive(project.variables.filter(f=>f.category==='civilization'&&['civilization.density','civilization.footprint','civilization.infrastructure'].includes(f.appName)).map(f=>evaluate(f.id).value),project.occurrenceCivilizationBoost):drive;
      let value = 0;
      const trace: Trace[] = [];
      for (const layer of v.layers) {
        if (!layer.enabled) continue;
        const source = layer.source === 'variable' ? evaluate(layer.reference).value : generateNoise(project.seed, layer, x, y,sparkDrive);
        const adjusted = adjustNoise(source,layer);
        value = blend(value, adjusted, layer.blend, layer.weight);
        trace.push({ id: layer.id, source, adjusted, accumulated: value });
      }
      const blocked=project.civilizationObeysTraversal&&v.category==='civilization'&&blockers.some(b=>{const r=evaluate(b.id);return r.present!==false&&blocksExploration(b,r.value);});
      const present=!blocked&&(!v.presenceReference||evaluate(v.presenceReference).value>0);
      const result:Result = present?{ ...classify(v, growUniqueness(value,drive)),present:true, trace }:{raw:value,value:0,label:'Absent',description:blocked?'Excluded by combined biome traversability.':'Outside this variable’s presence footprint.',present:false,trace};
      active.delete(key); cache.set(key, result); return result;
    };
    return evaluate(id);
  };
}

export function blocksExploration(variable:Variable,value:number):boolean {
  if(variable.category!=='biome')return false;
  const rule=variable.traversal;
  return rule?.mode==='positive'?value>0:rule?.mode==='threshold'?value>=(rule.cutoff??.5):false;
}

export function traversalIssues(project:Project):string[] {
  const vars=new Map(project.variables.map(v=>[v.id,v])),errors:string[]=[];
  const visited=new Set<string>();
  const visit=(id:string)=>{
    if(visited.has(id))return;visited.add(id);
    const v=vars.get(id);if(!v)return;
    if(v.category!=='biome'){errors.push(`Traversal can only depend on Biome variables; remove the reference to ${v.naturalName} from the blocking dependency chain.`);return;}
    if(v.presenceReference)visit(v.presenceReference);
    for(const l of v.layers)if(l.source==='variable')visit(l.reference);
  };
  project.variables.filter(v=>v.category==='biome'&&v.traversal&&v.traversal.mode!=='passable').forEach(v=>visit(v.id));
  return errors;
}

export function issues(project: Project): string[] {
  const errors: string[] = [], names = new Set<string>();
  for (const v of project.variables) {
    const title = v.naturalName || 'Unnamed variable';
    for(const l of v.layers)if(l.source==='patches'&&((l.patchMinDiameter??5)>(l.patchMaxDiameter??8)||(l.patchSpacing??32)<(l.patchMaxDiameter??8)+2))errors.push(`${title}: patch spacing must exceed maximum diameter by at least 2 cells, and minimum diameter must not exceed maximum.`);
    if (!/^[a-zA-Z][a-zA-Z0-9_.]*$/.test(v.appName)) errors.push(`${title}: app name must begin with a letter and use letters, numbers, underscores or dots.`);
    if (names.has(v.appName)) errors.push(`${title}: app names must be unique.`);
    names.add(v.appName);
    for(const l of v.layers)if(l.noiseTransform==='band'&&!( (l.bandHigh??.505)>(l.bandLow??.495)))errors.push(`${title}: contour band high must be greater than low.`);
    for(const l of v.layers)if(l.source==='variable'&&(l.referenceMode==='fade-below'||l.referenceMode==='fade-above')&&!((l.fadeHigh??.85)>(l.fadeLow??.55)))errors.push(`${title}: fade end must be greater than fade start.`);
    if (!v.naturalName.trim()) errors.push(`${v.appName}: enter a natural name.`);
    if (v.type === 'enum') {
      const sorted = [...v.steps].sort((a, b) => a.cutoff - b.cutoff);
      if (!sorted.length || sorted[0].cutoff !== 0) errors.push(`${title}: the lowest enum cutoff must be 0 to cover the full range.`);
      if (new Set(sorted.map(s => s.cutoff)).size !== sorted.length) errors.push(`${title}: enum cutoffs must be distinct.`);
      if (sorted.some(s => !s.name.trim())) errors.push(`${title}: name every enum step.`);
      if (new Set(sorted.map(s => s.name.trim())).size !== sorted.length) errors.push(`${title}: enum names must be distinct.`);
    }
  }
  // Graph validation includes disabled reference layers, so later enabling one is safe.
  const vars = new Map(project.variables.map(v => [v.id, v])), visited = new Set<string>(), active = new Set<string>();
  const visit = (id: string) => {
    if (active.has(id)) throw Error('Circular dependency: variables must form a one-way graph.');
    if (visited.has(id)) return;
    const v = vars.get(id); if (!v) throw Error('A reference layer needs an existing source variable.');
    active.add(id);
    if(v.presenceReference)visit(v.presenceReference);
    for (const l of v.layers) if (l.source === 'variable') visit(l.reference);
    active.delete(id); visited.add(id);
  };
  try { project.variables.forEach(v => visit(v.id)); } catch (e) { errors.push((e as Error).message); }
  return [...errors,...traversalIssues(project)];
}

/** Import is a data-only format. Reject malformed values before any evaluation. */
export function parseProject(text: string): Project {
  if (text.length > 2_000_000) throw Error('Project files must be smaller than 2 MB.');
  const p = JSON.parse(text) as Project;
  if (p && (p as {version:number}).version === 1 && Array.isArray(p.variables)) {
    p.version=3;p.variables=p.variables.map(v=>({...v,category:'biome'}));
  }
  if (p && (p as {version:number}).version === 2 && Array.isArray(p.variables)) {
    p.version=3;p.variables=p.variables.map(v=>({...v,category:(v.category as string)==='man-made'?'civilization':v.category}));
  }
  const fail = () => { throw Error('Invalid sandbox project. Check the version, fields and numeric limits.'); };
  const str = (x: unknown) => typeof x === 'string' && x.length <= 8000;
  const num = (x: unknown, min: number, max: number) => typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max;
  if(p?.occurrenceCivilizationBoost!==undefined&&!num(p.occurrenceCivilizationBoost,1,10))return fail();
  if(p?.ecologyRevision!==undefined&&(!num(p.ecologyRevision,0,100)||!Number.isInteger(p.ecologyRevision)))return fail();
  if(p?.waterFissureRevision!==undefined&&(!num(p.waterFissureRevision,0,100)||!Number.isInteger(p.waterFissureRevision)))return fail();
  if(p?.civilizationObeysTraversal!==undefined&&typeof p.civilizationObeysTraversal!=='boolean')return fail();
  if(p?.uniquenessRevision!==undefined&&(!num(p.uniquenessRevision,0,100)||!Number.isInteger(p.uniquenessRevision)))return fail();
  if(p?.uniquenessEscalation!==undefined&&(!p.uniquenessEscalation||typeof p.uniquenessEscalation.enabled!=='boolean'||!num(p.uniquenessEscalation.reach,1,1000000)||!num(p.uniquenessEscalation.power,.01,2)))return fail();
  if(p?.organicCivilizationRevision!==undefined&&(!num(p.organicCivilizationRevision,0,100)||!Number.isInteger(p.organicCivilizationRevision)))return fail();
  if(p?.riverCrossingRevision!==undefined&&(!num(p.riverCrossingRevision,0,100)||!Number.isInteger(p.riverCrossingRevision)))return fail();
  if(p?.civilizationImpactRevision!==undefined&&(!num(p.civilizationImpactRevision,0,100)||!Number.isInteger(p.civilizationImpactRevision)))return fail();
  if(p?.civilizationShapeRevision!==undefined&&(!num(p.civilizationShapeRevision,0,100)||!Number.isInteger(p.civilizationShapeRevision)))return fail();
  if(p?.infrastructureRevision!==undefined&&(!num(p.infrastructureRevision,0,100)||!Number.isInteger(p.infrastructureRevision)))return fail();
  if(p?.civilizationRevision!==undefined&&(!num(p.civilizationRevision,0,100)||!Number.isInteger(p.civilizationRevision)))return fail();
  if(p?.traversalRevision!==undefined&&(!num(p.traversalRevision,0,100)||!Number.isInteger(p.traversalRevision)))return fail();
  if(p?.climateRevision!==undefined&&(!num(p.climateRevision,0,100)||!Number.isInteger(p.climateRevision)))return fail();
  if (!p || p.version !== 3 || !str(p.name) || !str(p.seed) || !Array.isArray(p.variables) || p.variables.length > MAX_VARIABLES || (p.biomeRecipeRevision !== undefined && (!Number.isInteger(p.biomeRecipeRevision) || p.biomeRecipeRevision < 0))) return fail();
  const ids = new Set<string>();
  const unique = (id: unknown) => { if (!str(id) || !id || ids.has(id as string)) fail(); ids.add(id as string); };
  for (const v of p.variables) {
    if(v?.presenceReference!==undefined&&!str(v.presenceReference))return fail();
    if(v?.traversal!==undefined&&(!v.traversal||!['passable','positive','threshold'].includes(v.traversal.mode)||(v.traversal.cutoff!==undefined&&!num(v.traversal.cutoff,0,1))))return fail();
    if (!v || ![v.id,v.appName,v.naturalName,v.description,v.color,v.off,v.on,v.low,v.high].every(str) ||
      !['biome','civilization','variation','occurrences'].includes(v.category) || !/^#[0-9a-f]{6}$/i.test(v.color) || !['boolean','enum','gradient'].includes(v.type) || !num(v.cutoff,0,1) ||
      !Array.isArray(v.steps) || v.steps.length > 32 || !Array.isArray(v.layers) || v.layers.length > 24) return fail();
    unique(v.id);
    for (const s of v.steps) { if (!s || ![s.id,s.name,s.description].every(str) || !num(s.cutoff,0,1)) return fail(); unique(s.id); }
    for (const l of v.layers) {
      if (!l || ![l.id,l.name,l.channel,l.reference].every(str) || !SOURCES.includes(l.source) || !BLENDS.includes(l.blend) ||
        typeof l.enabled !== 'boolean' || typeof l.invert !== 'boolean' || !num(l.weight,0,1) ||
        (l.noiseTransform!==undefined&&!['value','distance','band'].includes(l.noiseTransform)) ||
        (l.noiseTarget!==undefined&&!num(l.noiseTarget,0,1)) ||
        (l.bandLow!==undefined&&!num(l.bandLow,0,1)) || (l.bandHigh!==undefined&&!num(l.bandHigh,0,1)) ||
        (l.referenceMode!==undefined&&!['value','at-most','at-least','fade-below','fade-above'].includes(l.referenceMode)) ||
        (l.referenceCutoff!==undefined&&!num(l.referenceCutoff,0,1)) ||
        (l.fadeLow!==undefined&&!num(l.fadeLow,0,1)) || (l.fadeHigh!==undefined&&!num(l.fadeHigh,0,1)) ||
        (l.patchSpacing!==undefined&&!num(l.patchSpacing,3,100000)) || (l.patchChance!==undefined&&!num(l.patchChance,0,1)) ||
        (l.sparkCutoff!==undefined&&!num(l.sparkCutoff,0,1)) || (l.sparkFloor!==undefined&&!num(l.sparkFloor,0,1)) ||
        (l.patchRoughness!==undefined&&!num(l.patchRoughness,0,1)) ||
        (l.patchMinDiameter!==undefined&&!num(l.patchMinDiameter,1,10000)) || (l.patchMaxDiameter!==undefined&&!num(l.patchMaxDiameter,1,10000)) ||
        (l.source==='patches'&&((l.patchMinDiameter??5)>(l.patchMaxDiameter??8)||(l.patchSpacing??32)<(l.patchMaxDiameter??8)+2)) ||
        !num(l.scaleX,.1,100000) || !num(l.scaleY,.1,100000) || !num(l.offsetX,-1000000,1000000) || !num(l.offsetY,-1000000,1000000) ||
        !num(l.rotation,-360,360) || !num(l.octaves,1,8) || !Number.isInteger(l.octaves) || !num(l.persistence,0,1) ||
        !num(l.lacunarity,1,4) || !num(l.gain,0,20) || !num(l.bias,-20,20) || !num(l.constant,0,1)) return fail();
      unique(l.id);
    }
  }
  return p;
}
