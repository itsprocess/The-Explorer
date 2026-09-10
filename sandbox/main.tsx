import {tuneEncounterBalance} from './encounter-balance';
import {enlivenWorld} from './living-settings';
import {enrichEncounters} from './encounter-refinement';
import {refineActivity} from './activity-refinement';
import {expandInteriorOptions} from './interior-options';
import {enrichLanguage} from './language-palette';
import {expandUniqueness} from './uniqueness-expansion';
import {organicCivilization} from './organic-civilization';
import reviewedProject from './reviewed-project.json';
import {configureRiverCrossings} from './river-crossings';
import {expandCivilizationImpact} from './civilization-impact';
import {shapeCivilization} from './civilization-shapes';
import {civilizationEvaluator} from './civilization-view';
import {expandInfrastructure} from './infrastructure-expansion';
import {expandCivilization} from './civilization-expansion';
import {configureTraversal,biomeContext} from './traversal';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Plus, Layers, ArrowUp, ArrowDown, Trash2, Copy, Download, Upload, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Minus, Crosshair, FlaskConical } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { MAX_VARIABLES, uniquenessDrive, growUniqueness, BLENDS, SOURCES, evaluator, issues, newLayer, newVariable, parseProject, starter, uid, type Layer, type Project, type Variable } from './model';
import type { PreviewResponse } from './preview.worker';
import './sandbox.css';
import { CATEGORIES, CATEGORY_DESCRIPTIONS, STORAGE_KEY, loadProject, proposalProject } from './project-defaults';
import {ComponentList} from './component-list';
import {gateOcean} from './ocean-gate';
import {expandBiomes} from './biome-expansion';
import {expandClimate} from './climate-expansion';
import {expandWaterFissures} from './water-fissure-expansion';

const sourceNames: Record<Layer['source'], string> = { perlin: 'Perlin', fbm: 'Fractal (fBm)', ridged: 'Ridged fractal', cellular: 'Cellular distance', white: 'White noise / blocks', patches: 'Bounded smooth patches', sparks: 'Isolated single-cell sparks', constant: 'Constant', variable: 'Variable reference' };
const blendNames: Record<Layer['blend'], string> = { replace: 'Replace / mix', add: 'Add', subtract: 'Subtract', multiply: 'Multiply / mask', min: 'Minimum', max: 'Maximum', screen: 'Screen' };
const fmt = (n: number) => n.toFixed(3);

function NumberField({ label, value, onChange, min = -1000000, max = 1000000, step = 1 }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return <label className="field"><span>{label}</span><Input type="number" value={draft} min={min} max={max} step={step}
    onChange={e => { const s = e.target.value; setDraft(s); const n = Number(s); if (s !== '' && Number.isFinite(n) && n >= min && n <= max && (step !== 1 || Number.isInteger(n))) onChange(n); }}
    onBlur={() => setDraft(String(value))} /></label>;
}
function TextField({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (s: string) => void; multiline?: boolean }) {
  return <label className="field"><span>{label}</span>{multiline ? <Textarea value={value} maxLength={8000} onChange={e => onChange(e.target.value)} /> : <Input value={value} maxLength={8000} onChange={e => onChange(e.target.value)} />}</label>;
}
function IconButton({ label, children, onClick, disabled = false }: { label: string; children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return <Button className="icon-button" title={label} aria-label={label} onClick={onClick} disabled={disabled}>{children}</Button>;
}

function App() {
  const [project, setProject] = useState<Project>(() => configureRiverCrossings(expandCivilizationImpact(shapeCivilization(expandInfrastructure(expandCivilization(configureTraversal(expandWaterFissures(expandClimate(expandBiomes(proposalProject()))))))))));
  const [selectedId, select] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [canRestore,setCanRestore]=useState(false);
  const [status, setStatus] = useState('Loading local draft…');
  const [category, setCategory] = useState<Variable['category']>('biome');
  const [view, setView] = useState<'list'|'map'>('map');
  const [tab, setTab] = useState<'signal' | 'output' | 'language'>('signal');
  const [stage, setStage] = useState('overall');
  const [showCivilization,setShowCivilization]=useState(true);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const [stride, setStride] = useState<1|10>(10);
  const [size, setSize] = useState(96);
  const [palette, setPalette] = useState('color');
  const [cell, setCell] = useState({ x: 0, y: 0 });
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [fileError, setFileError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const history = useRef<Project[]>([]), [historyLength, setHistoryLength] = useState(0);
  const visibleVariables=project.variables.filter(v=>v.category===category);
  const variable = visibleVariables.find(v => v.id === selectedId) ?? visibleVariables[0];
  const errors = useMemo(() => issues(project), [project]);
  const errorText = errors.join('\n');

  useEffect(() => {
    try {
      const before=localStorage.getItem(STORAGE_KEY);
      if(!localStorage.getItem(STORAGE_KEY+'-default-stack-sky-1')){
        localStorage.setItem(STORAGE_KEY+'-activity-refinement-1','1');
        localStorage.setItem(STORAGE_KEY+'-encounter-refinement-1','1');
        localStorage.setItem(STORAGE_KEY+'-living-settings-1','1');
        localStorage.setItem(STORAGE_KEY+'-encounter-balance-1','1');
        const imported=parseProject(JSON.stringify(reviewedProject));
        localStorage.setItem(STORAGE_KEY+'-interior-options-1','1');
        localStorage.setItem(STORAGE_KEY+'-language-palette-1','1');
        if(before){localStorage.setItem(STORAGE_KEY+'-before-import-seven',before);history.current=[parseProject(before)];setHistoryLength(1);}
        localStorage.setItem(STORAGE_KEY,JSON.stringify(imported));
        localStorage.setItem(STORAGE_KEY+'-import-seven-occurrences','1');localStorage.setItem(STORAGE_KEY+'-default-stack-sky-1','1');
        setProject(imported);setView('map');setStage('overall');setLoaded(true);return;
      }
      let next=loadProject(localStorage);
      if(!localStorage.getItem(STORAGE_KEY+"-ocean-gate-applied")){const gated=gateOcean(next);if(gated!==next){history.current=[next];setHistoryLength(1);next=gated;}localStorage.setItem(STORAGE_KEY+"-ocean-gate-applied","1");}
      if(before){const previous=parseProject(before);if(previous.riverStudyRevision!==2){
        history.current=[{...previous,biomeRecipeRevision:1,riverStudyRevision:2}];setHistoryLength(1);
      }}
      if(next.ecologyRevision!==2){
        const previous=next;
        next=expandBiomes(next);
        if(!localStorage.getItem(STORAGE_KEY+'-before-ecology'))localStorage.setItem(STORAGE_KEY+'-before-ecology',JSON.stringify(previous));
        history.current=[{...previous,ecologyRevision:2}];setHistoryLength(1);
      }
      if(next.climateRevision!==1){
        const previous=next;next=expandClimate(next);
        if(!localStorage.getItem(STORAGE_KEY+'-before-climate'))localStorage.setItem(STORAGE_KEY+'-before-climate',JSON.stringify(previous));
        history.current=[{...previous,climateRevision:1}];setHistoryLength(1);
      }
      if(next.waterFissureRevision!==1){
        const previous=next;next=expandWaterFissures(next);
        if(!localStorage.getItem(STORAGE_KEY+'-before-water-fissures'))localStorage.setItem(STORAGE_KEY+'-before-water-fissures',JSON.stringify(previous));
        history.current=[{...previous,waterFissureRevision:1}];setHistoryLength(1);
      }
      if(next.traversalRevision!==1){
        const previous=next;next=configureTraversal(next);
        if(!localStorage.getItem(STORAGE_KEY+'-before-traversal'))localStorage.setItem(STORAGE_KEY+'-before-traversal',JSON.stringify(previous));
        history.current=[{...previous,traversalRevision:1}];setHistoryLength(1);
      }
      if(next.civilizationRevision!==1){
        const previous=next;next=expandCivilization(next);
        if(!localStorage.getItem(STORAGE_KEY+'-before-civilization'))localStorage.setItem(STORAGE_KEY+'-before-civilization',JSON.stringify(previous));
        history.current=[{...previous,civilizationRevision:1}];setHistoryLength(1);
        setCategory('civilization');setView('list');select('');
      }
      if(next.infrastructureRevision!==1){
        const previous=next;next=expandInfrastructure(next);
        if(!localStorage.getItem(STORAGE_KEY+'-before-infrastructure'))localStorage.setItem(STORAGE_KEY+'-before-infrastructure',JSON.stringify(previous));
        history.current=[{...previous,infrastructureRevision:1}];setHistoryLength(1);
      }
      if(next.civilizationShapeRevision!==1){
        const previous=next;next=shapeCivilization(next);
        if(!localStorage.getItem(STORAGE_KEY+'-before-civilization-shapes'))localStorage.setItem(STORAGE_KEY+'-before-civilization-shapes',JSON.stringify(previous));
        history.current=[{...previous,civilizationShapeRevision:1}];setHistoryLength(1);
        setCategory('civilization');setView('map');
      }
      if(next.civilizationImpactRevision!==1){
        const previous=next;next=expandCivilizationImpact(next);
        if(!localStorage.getItem(STORAGE_KEY+'-before-civilization-impact'))localStorage.setItem(STORAGE_KEY+'-before-civilization-impact',JSON.stringify(previous));
        history.current=[{...previous,civilizationImpactRevision:1}];setHistoryLength(1);
      }
      if(next.riverCrossingRevision!==3){
        const previous=next;next=configureRiverCrossings(next);
        if(!localStorage.getItem(STORAGE_KEY+'-before-larger-river-relief'))localStorage.setItem(STORAGE_KEY+'-before-larger-river-relief',JSON.stringify(previous));
        history.current=[{...previous,riverCrossingRevision:3,organicCivilizationRevision:1,uniquenessRevision:3}];setHistoryLength(1);
      }
      if(next.organicCivilizationRevision!==1){
        const previous=next;next=organicCivilization(next);
        if(!localStorage.getItem(STORAGE_KEY+'-before-organic-civ'))localStorage.setItem(STORAGE_KEY+'-before-organic-civ',JSON.stringify(previous));
        history.current=[{...previous,organicCivilizationRevision:1,uniquenessRevision:3}];setHistoryLength(1);
      }
      if(next.uniquenessRevision!==3){
        const previous=next;next=expandUniqueness(next);
        if(!localStorage.getItem(STORAGE_KEY+'-before-occurrences'))localStorage.setItem(STORAGE_KEY+'-before-occurrences',JSON.stringify(previous));
        history.current=[{...previous,uniquenessRevision:3}];setHistoryLength(1);
        setCategory('occurrences');setView('list');
      }
      if(!localStorage.getItem(STORAGE_KEY+'-language-palette-1')){
        localStorage.setItem(STORAGE_KEY+'-before-language-palette-1',JSON.stringify(next));
        history.current=[next];setHistoryLength(1);next=enrichLanguage(next);
        localStorage.setItem(STORAGE_KEY+'-language-palette-1','1');
      }
      if(!localStorage.getItem(STORAGE_KEY+'-interior-options-1')){
        localStorage.setItem(STORAGE_KEY+'-before-interior-options-1',JSON.stringify(next));
        history.current=[next];setHistoryLength(1);next=expandInteriorOptions(next);
        localStorage.setItem(STORAGE_KEY+'-interior-options-1','1');
      }
      if(!localStorage.getItem(STORAGE_KEY+'-activity-refinement-1')){
        localStorage.setItem(STORAGE_KEY+'-before-activity-refinement-1',JSON.stringify(next));
        history.current=[next];setHistoryLength(1);next=refineActivity(next);
        localStorage.setItem(STORAGE_KEY+'-activity-refinement-1','1');
      }
      if(!localStorage.getItem(STORAGE_KEY+'-encounter-refinement-1')){
        localStorage.setItem(STORAGE_KEY+'-before-encounter-refinement-1',JSON.stringify(next));
        history.current=[next];setHistoryLength(1);next=enrichEncounters(next);
        localStorage.setItem(STORAGE_KEY+'-encounter-refinement-1','1');
      }
      if(!localStorage.getItem(STORAGE_KEY+'-living-settings-1')){
        localStorage.setItem(STORAGE_KEY+'-before-living-settings-1',JSON.stringify(next));
        history.current=[next];setHistoryLength(1);next=enlivenWorld(next);
        localStorage.setItem(STORAGE_KEY+'-living-settings-1','1');
      }
      if(!localStorage.getItem(STORAGE_KEY+'-encounter-balance-1')){
        localStorage.setItem(STORAGE_KEY+'-before-encounter-balance-1',JSON.stringify(next));
        history.current=[next];setHistoryLength(1);next=tuneEncounterBalance(next);
        localStorage.setItem(STORAGE_KEY+'-encounter-balance-1','1');
      }
      if(!localStorage.getItem(STORAGE_KEY+'-psychedelic-terrifying-1')){
        const additions=parseProject(JSON.stringify(reviewedProject)).variables.filter(v=>['variation.psychedelic','variation.terrifying'].includes(v.appName)&&!next.variables.some(old=>old.appName===v.appName));
        next={...next,variables:[...next.variables,...additions]};
        localStorage.setItem(STORAGE_KEY,JSON.stringify(next));localStorage.setItem(STORAGE_KEY+'-psychedelic-terrifying-1','1');
      }
      if(!next.variables.some(v=>v.appName==='variation.surreal')&&next.variables.length<MAX_VARIABLES){
        const surreal=parseProject(JSON.stringify(reviewedProject)).variables.find(v=>v.appName==='variation.surreal')!;
        next={...next,variables:[...next.variables,surreal]};
        localStorage.setItem(STORAGE_KEY,JSON.stringify(next));
      }
      setProject(next);setCanRestore(!!localStorage.getItem(STORAGE_KEY+'-before-river-study'));
      if(window.location.search)window.history.replaceState(null,'',window.location.pathname);
    }
    catch { setStorageBlocked(true); setStatus('Saved draft could not be opened. Export this session to keep it.'); }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded || storageBlocked) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(project)); setStatus('Saved in this browser'); }
    catch { setStatus('Browser storage unavailable. Export to keep your work.'); }
  }, [project, loaded, storageBlocked]);
  useEffect(() => { setStage(current=>current==='overall'?'overall':'output'); setExpanded(null); }, [variable?.id]);
  useEffect(() => {
    if (stage.includes('/') && !variable?.layers.some(l => l.id === stage.split('/')[1] && l.enabled)) setStage('output');
  }, [variable, stage]);

  function commit(next: Project | ((p: Project) => Project)) {
    history.current = [...history.current.slice(-39), project]; setHistoryLength(history.current.length);
    setProject(typeof next === 'function' ? next(project) : next);
  }
  function updateVariable(patch: Partial<Variable>) {
    if (variable) commit(p => ({ ...p, variables: p.variables.map(v => v.id === variable.id ? { ...v, ...patch } : v) }));
  }
  function updateLayer(id: string, patch: Partial<Layer>) { updateVariable({ layers: variable.layers.map(l => l.id === id ? { ...l, ...patch } : l) }); }
  function addVariable() {
    let index = project.variables.length + 1;
    while (project.variables.some(v => v.appName === `sandbox.variable_${index}`)) index++;
    const v = {...newVariable(index),category}; commit({ ...project, variables: [...project.variables, v] }); select(v.id); setTab('signal'); setView('map');
  }
  function duplicate() {
    const v: Variable = { ...structuredClone(variable), id: uid(), naturalName: `${variable.naturalName} copy`, appName: `${variable.appName}_copy`,
      layers: variable.layers.map(l => ({ ...l, id: uid() })), steps: variable.steps.map(s => ({ ...s, id: uid() })) };
    while (project.variables.some(other => other.appName === v.appName)) v.appName += '_copy';
    commit({ ...project, variables: [...project.variables, v] }); select(v.id);
  }
  const dependents = variable ? project.variables.filter(v => (v.presenceReference===variable.id||v.layers.some(l => l.source === 'variable' && l.reference === variable.id))) : [];
  function removeVariable() {
    if (dependents.length) return;
    commit({ ...project, variables: project.variables.filter(v => v.id !== variable.id) }); select('');
  }
  function moveLayer(index: number, direction: number) {
    const layers = [...variable.layers]; [layers[index], layers[index + direction]] = [layers[index + direction], layers[index]]; updateVariable({ layers });
  }
  function exportProject() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'fieldwork-project.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw Error('Project files must be smaller than 2 MB.');
      const next = parseProject(await file.text()); commit({...next,biomeRecipeRevision:1,riverStudyRevision:2,ecologyRevision:2,climateRevision:1,waterFissureRevision:1,traversalRevision:1,civilizationRevision:1,infrastructureRevision:1,civilizationShapeRevision:1,civilizationImpactRevision:1,riverCrossingRevision:3,organicCivilizationRevision:1,uniquenessRevision:3}); select(''); setFileError(''); setStorageBlocked(false);
    } catch (e) { setFileError((e as Error).message); }
    if (fileInput.current) fileInput.current.value = '';
  }

  useEffect(() => {
    setPreview(null); setPreviewError('');
    if (!loaded || !variable || errorText || view==='list') { setBusy(false); return; }
    setBusy(true);
    let worker: Worker | undefined;
    const timer = window.setTimeout(() => {
      worker = new Worker(new URL('./preview.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = ({ data }) => { if (data.error) setPreviewError(data.error); else setPreview(data); setBusy(false); worker?.terminate(); };
      worker.onerror = () => { setPreviewError('Preview failed. Reduce the sample size or simplify the stack.'); setBusy(false); worker?.terminate(); };
      worker.postMessage({ project, variableId: variable.id, centerX: center.x, centerY: center.y, size, stride, stage, showCivilization });
    }, 180);
    return () => { clearTimeout(timer); worker?.terminate(); };
  }, [project, variable?.id, center, size, stride, stage, loaded, errorText, view, showCivilization]);

  useEffect(() => {
    if (!preview || !canvas.current || !variable) return;
    const ctx = canvas.current.getContext('2d'); if (!ctx) return;
    const rgb = [1,3,5].map(i => parseInt(variable.color.slice(i,i + 2),16));
    const pixels = ctx.createImageData(size, size);
    preview.values.forEach((n, i) => {
      const color = ['civilization','overall'].includes(stage)&&preview.colors ? Array.from(preview.colors.slice(i*3,i*3+3)) : stage==='traversal' ? (n?[85,201,165]:[171,65,79]) : palette === 'gray' ? [n*255,n*255,n*255] : rgb.map((v,j) => {
        const dark = [13,25,36][j]; return n < .7 ? dark + (v-dark)*(n/.7) : v + (242-v)*(n-.7)/.3;
      });
      pixels.data.set([...color.map(Math.round),255], i*4);
    });
    ctx.putImageData(pixels,0,0);
  }, [preview, variable?.color, size, palette, stage]);

  const inspected = useMemo(() => {
    if (!variable || errors.length) return null;
    try { return evaluator(project)(variable.id,cell.x,cell.y); } catch { return null; }
  }, [project, variable, cell, errors]);
  const compiledBiome=useMemo(()=>{
    if(errors.length)return null;
    try{return biomeContext(project,cell.x,cell.y);}catch{return null;}
  },[project,cell,errors]);
  const compiledCiv=useMemo(()=>{
    if((category!=='civilization'&&stage!=='overall')||errors.length)return null;
    try{return civilizationEvaluator(project)(cell.x,cell.y);}catch{return null;}
  },[project,cell,category,errors,stage]);
  const originX = center.x - Math.floor(size/2)*stride, originY = center.y - Math.floor(size/2)*stride;
  const markerX = (cell.x-originX)/stride, markerY = (cell.y-originY)/stride;
  const pan = (dx: number, dy: number) => setCenter(p => ({ x: Math.max(-1000000,Math.min(1000000,p.x+dx*size*stride/4)), y: Math.max(-1000000,Math.min(1000000,p.y+dy*size*stride/4)) }));

  return <div className="workbench">
    <header className="topbar"><div className="brand"><span className="brand-mark"><FlaskConical size={22}/></span><div><strong>Fieldwork</strong><span>The Explorer / generation sandbox</span></div></div>
      <div className="project-name"><Input aria-label="Project name" value={project.name} onChange={e => commit({ ...project, name: e.target.value })}/><span className="save-status" role="status">{status}</span></div>
      <div className="header-actions">{canRestore&&<Button title="Restore the variables saved before simplifying to Altitude, Ocean and River" onClick={()=>{const saved=localStorage.getItem(STORAGE_KEY+"-before-river-study");if(saved){commit({...parseProject(saved),biomeRecipeRevision:1,riverStudyRevision:2,ecologyRevision:2,climateRevision:1,waterFissureRevision:1,traversalRevision:1,civilizationRevision:1,infrastructureRevision:1,civilizationShapeRevision:1,civilizationImpactRevision:1,riverCrossingRevision:3,organicCivilizationRevision:1,uniquenessRevision:3});select("");setView("list");setCanRestore(false);}}}>Undo simplification</Button>}<Button disabled={!historyLength} onClick={() => { const previous = history.current.pop(); if (previous) setProject(previous); setHistoryLength(history.current.length); }}>Undo</Button><Button onClick={() => fileInput.current?.click()}><Upload size={15}/> Import</Button><Button onClick={exportProject}><Download size={15}/> Export</Button><input hidden ref={fileInput} type="file" accept=".json,application/json" onChange={e => void importFile(e.target.files?.[0])}/></div>
    </header>
    {fileError && <div className="notice error" role="alert">{fileError}<Button onClick={() => setFileError('')}>Dismiss</Button></div>}
    <div className="workspace">
      <aside className="library"><div className="section-title"><h2>Variables</h2><span className="count">{project.variables.length}</span></div>
        <Button className="primary add-variable" disabled={project.variables.length >= MAX_VARIABLES} onClick={addVariable}><Plus size={16}/> Add a variable</Button>
<div className="category-list">{Object.entries(CATEGORIES).map(([id,label])=><Button key={id} aria-pressed={category===id} onClick={()=>{setCategory(id as Variable["category"]);select("");setView("list");}}>{label} · {project.variables.filter(v=>v.category===id).length}</Button>)}</div>
        <nav aria-label="Variables">{visibleVariables.map((v,index) => <button key={v.id} className={`variable-item ${variable?.id === v.id ? 'selected' : ''}`} onClick={() => {select(v.id);setStage('output');setView('map');}} aria-current={variable?.id === v.id ? 'true' : undefined}>
          <span className="variable-index">{String(index+1).padStart(2,'0')}</span><span className="variable-info"><strong>{v.naturalName || 'Unnamed variable'}</strong><small>{v.appName}</small><span className="variable-meta"><i style={{ background:v.color }}/>{v.type} · {v.layers.length} layers</span></span></button>)}</nav>
        <div className="library-note"><span className="eyebrow">LOCAL EXPERIMENT</span><p>Build a field. Shape its output. Give it meaning.</p><p className="muted">Drafts live in this browser. Export a project to keep or move it.</p><span className="version">Schema v3 · up to 48 variables</span></div>
      </aside>
      <main className="map-column">
        <div className="map-heading"><div><span className="eyebrow">{CATEGORIES[category].toUpperCase()}</span><h1>{view==="list"?CATEGORIES[category]+" components":stage==='overall'?'Overall map':variable?.naturalName || "Your first field starts here"}</h1></div><span className="local-badge"><i/> Sandbox</span></div>
        <p className="hint">{CATEGORY_DESCRIPTIONS[category]}</p>
        {category==='occurrences'&&<NumberField label="Maximum civilization frequency multiplier" value={project.occurrenceCivilizationBoost??1} min={1} max={10} step={.1} onChange={occurrenceCivilizationBoost=>commit({...project,occurrenceCivilizationBoost})}/>}
        {variable&&category==='biome'&&<label className="check-field"><input type="checkbox" checked={variable.distanceEscalation??false} onChange={e=>commit({...project,variables:project.variables.map(v=>v.id===variable.id?{...v,distanceEscalation:e.target.checked}:v)})}/> Escalate this field with distance from origin</label>}{category==='civilization'&&<label className="check-field"><input type="checkbox" checked={project.civilizationObeysTraversal??false} onChange={e=>commit({...project,civilizationObeysTraversal:e.target.checked})}/> All Civilization fields obey biome traversability</label>}{category==='variation'&&<details className="viewport-settings" open><summary>Uniqueness · shared distance escalation</summary><label className="check-field"><input type="checkbox" checked={project.uniquenessEscalation?.enabled??false} onChange={e=>commit({...project,uniquenessEscalation:{reach:200,power:.5,...project.uniquenessEscalation,enabled:e.target.checked}})}/> Escalate with distance from 0,0</label><div className="form-grid"><NumberField label="Distance reach · cells" value={project.uniquenessEscalation?.reach??200} min={1} max={1000000} onChange={reach=>commit({...project,uniquenessEscalation:{enabled:true,power:.5,...project.uniquenessEscalation,reach}})}/><NumberField label="Escalation power" value={project.uniquenessEscalation?.power??.5} min={.01} max={2} step={.01} onChange={power=>commit({...project,uniquenessEscalation:{enabled:true,reach:200,...project.uniquenessEscalation,power}})}/></div><p className="hint">Drive = (1 + distance / reach)^power. Strength = base^(1 / drive); zero stays zero. Spark candidates pass at cutoff^drive, with adjacent candidates suppressed.</p><p className="hint">A base of 10% becomes {[0,100,1000,10000].map(d=>d+' cells: '+(growUniqueness(.1,uniquenessDrive(project,d,0))*100).toFixed(1)+'%').join(' · ')}.</p></details>}<div className="review-switch"><Button aria-pressed={stage==='overall'&&view==='map'} onClick={()=>{setView('map');setStage('overall');}}>Overall map</Button>{category==='civilization'&&<Button aria-pressed={stage==='civilization'&&view==='map'} onClick={()=>{setView('map');setStage('civilization');}}>Combined civilization</Button>}<Button aria-pressed={view==="list"} onClick={()=>setView("list")}>Component list</Button><Button disabled={!variable} aria-pressed={view==="map"} onClick={()=>setView("map")}>Inspect map</Button></div>
        {view==="list" ? <ComponentList variables={visibleVariables} project={project} inspect={id=>{select(id);setView("map");setTab("signal");}}/> : <>
        {stage==='overall'&&<label className="check-field"><input type="checkbox" checked={showCivilization} onChange={e=>setShowCivilization(e.target.checked)}/> Show Civilization overlay</label>}<div className="map-toolbar"><TextField label="Seed" value={project.seed} onChange={seed => commit({...project,seed})}/>
          <label className="field stage-select"><span>Inspect</span><select value={stage} onChange={e => setStage(e.target.value)}><option value="overall">Overall map</option><option value="output">Interpreted output</option><option value="raw">Final continuous signal</option>{category==='civilization'&&<option value="civilization">Combined civilization map</option>}{category==='biome'&&<option value="traversal">Combined biome traversability</option>}{variable?.layers.filter(l=>l.enabled).map((l,i)=><React.Fragment key={l.id}><option value={`source/${l.id}`}>{i+1}. {l.name} · source</option><option value={`stack/${l.id}`}>{i+1}. {l.name} · blended stack</option></React.Fragment>)}</select></label>
          <label className="field"><span>Palette</span><select disabled={stage==='civilization'||stage==='overall'} value={palette} onChange={e => setPalette(e.target.value)}><option value="color">Field color</option><option value="gray">Grayscale</option></select></label>
        </div>
        <div className="map-surface">
          <div className="map-meta"><span>{size*stride} × {size*stride} cell extent</span><span>North / −Y ↑</span></div>
          <div className="map-frame" style={{aspectRatio:'1'}}>
            <canvas ref={canvas} width={size} height={size} aria-label="Top-down variable map. Click a sample to inspect it; exact coordinates are also available below." onClick={e => { if(!preview)return;const rect=e.currentTarget.getBoundingClientRect(); const col=Math.min(size-1,Math.floor((e.clientX-rect.left)/rect.width*size)),row=Math.min(size-1,Math.floor((e.clientY-rect.top)/rect.height*size));setCell({x:originX+col*stride,y:originY+row*stride}); }}/>
            {preview && markerX >=0 && markerX<size && markerY>=0 && markerY<size && <span className="cell-marker" style={{left:`${(markerX+.5)/size*100}%`,top:`${(markerY+.5)/size*100}%`}}/>}
            {(!variable || busy || errors.length>0 || previewError) && <div className="map-state" role="status">{!variable ? <><Layers size={32}/><strong>Add a variable to begin</strong><span>Start with a signal, then shape its meaning.</span></> : errors.length ? <><strong>Definition needs attention</strong><span>Fix the items in the editor to resume the preview.</span></> : previewError ? <span>{previewError}</span> : <><span className="spinner"/><strong>Sampling the field…</strong></>}</div>}
          </div>
          <div className="map-navigation"><div className="pan-controls"><IconButton label="Pan west" onClick={()=>pan(-1,0)}><ChevronLeft size={17}/></IconButton><IconButton label="Pan north" onClick={()=>pan(0,-1)}><ChevronUp size={17}/></IconButton><IconButton label="Return to origin" onClick={()=>setCenter({x:0,y:0})}><Crosshair size={16}/></IconButton><IconButton label="Pan south" onClick={()=>pan(0,1)}><ChevronDown size={17}/></IconButton><IconButton label="Pan east" onClick={()=>pan(1,0)}><ChevronRight size={17}/></IconButton></div>
            <div className="zoom-controls"><Button aria-pressed={stride===1} onClick={()=>setStride(1)}>Every cell</Button><Button aria-pressed={stride===10} onClick={()=>setStride(10)}>Every 10 cells</Button></div></div>
        </div>
        <><div className="legend"><span>0</span><div style={{background:stage==='overall'?'linear-gradient(90deg,#000,#6b6248,#8baa4d,#265e36,#43b2d5)':stage==='civilization'?'linear-gradient(90deg,#0d1924,#e8a045,#649edf,#f0e0b9)':stage==='traversal'?'linear-gradient(90deg,#ab414f,#55c9a5)':palette==='gray'?'linear-gradient(90deg,#000,#fff)':`linear-gradient(90deg,#0d1924,${variable?.color ?? '#55c9a5'} 70%,#f2f2f2)`}}/><span>1</span><span className="legend-description">{stage==='overall'?'Black: chasms and void · Green: vegetation · Gray: rock · Blue: water · Amber/cream: habitation · Lavender: past impact':stage==='civilization'?'Dark: no civ impact · Amber: inhabited · Blue: past impact · Cream: inhabited + built':stage==='traversal'?'Blocked (0, red) / Explorable (1, green)':stage==='output' && variable?.type==='boolean'?'Off / On':stage==='output' && variable?.type==='enum'?'Ordered enum bands':'Signal intensity'}</span></div>
        <div className="sample-stats"><span>Min <b>{preview?fmt(preview.min):'—'}</b></span><span>Max <b>{preview?fmt(preview.max):'—'}</b></span><span>Mean <b>{preview?fmt(preview.mean):'—'}</b></span><span>{stage==='overall'?'Explorable':stage==='civilization'?'Civilization footprint':stage==='traversal'?'Explorable':'Nonzero'} <b>{preview?`${(preview.nonzero*100).toFixed(1)}%`:'—'}</b></span></div></>
        <details className="viewport-settings"><summary>Map coordinates & sampling</summary><div className="form-grid"><NumberField label="Center X" value={center.x} onChange={x=>setCenter({...center,x})}/><NumberField label="Center Y" value={center.y} onChange={y=>setCenter({...center,y})}/><label className="field"><span>Sample grid</span><select value={size} onChange={e=>setSize(Number(e.target.value))}><option value={48}>48 × 48</option><option value={96}>96 × 96</option><option value={128}>128 × 128</option></select></label></div><p className="hint">Statistics describe this sampled viewport only. Zoom to every cell to inspect narrow features.</p></details>
        <section className="cell-inspector"><div className="section-title"><h2>Cell inspector</h2><span className="mono">{cell.x}, {cell.y}</span></div><div className="form-grid"><NumberField label="Inspect X" value={cell.x} onChange={x=>setCell({...cell,x})}/><NumberField label="Inspect Y" value={cell.y} onChange={y=>setCell({...cell,y})}/></div>
          {compiledCiv&&<div className="language-preview"><h3>Civilization at this cell</h3><p>{compiledCiv.footprint===0?'No civilization impact footprint':compiledCiv.density>0?compiledCiv.infrastructure>0?'Inhabited and built':'Inhabited, little or no infrastructure':'Past-impact site without current habitation'}</p><table><thead><tr><th>Variable</th><th>Output</th></tr></thead><tbody>{compiledCiv.fields.map(f=><tr key={f.id}><td>{f.name}</td><td>{f.present?f.label:'Absent'}</td></tr>)}</tbody></table></div>}
          {compiledBiome&&<div className="language-preview"><strong>{compiledBiome.traversal.explorable?'Explorable':'Blocked from exploration'}</strong><p>{compiledBiome.traversal.blockedBy.length?'Blocked by: '+compiledBiome.traversal.blockedBy.map(v=>v.name).join(', '):'No biome rule blocks this cell.'}</p><details><summary>Computed biome context</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify(compiledBiome,null,2)}</pre></details><p className="hint">Only Biome rules determine exploration. This computed context can feed later natural-setting prompts.</p></div>}
          {inspected && <><div className="cell-result"><strong>{inspected.label}</strong><span>Signal {fmt(inspected.raw)} → output {fmt(inspected.value)}</span></div><p className="descriptor">{inspected.description}</p><details><summary>Trace the signal</summary><table><thead><tr><th>Layer</th><th>Source</th><th>Adjusted</th><th>Stack</th></tr></thead><tbody>{inspected.trace.map(t=><tr key={t.id}><td>{variable.layers.find(l=>l.id===t.id)?.name}</td><td>{fmt(t.source)}</td><td>{fmt(t.adjusted)}</td><td>{fmt(t.accumulated)}</td></tr>)}</tbody></table></details></>}
        </section></>}
      </main>
      <aside className="editor" aria-label="Variable editor">
        {variable ? <><div className="editor-title"><div><span className="eyebrow">VARIABLE DEFINITION</span><h2>Edit field</h2></div><div><IconButton label="Duplicate variable" disabled={project.variables.length>=MAX_VARIABLES} onClick={duplicate}><Copy size={16}/></IconButton><IconButton label={dependents.length?'Remove references before deleting this variable':'Delete variable (Undo available)'} disabled={!!dependents.length} onClick={removeVariable}><Trash2 size={16}/></IconButton></div></div>
          <div className="identity-fields"><label className="field"><span>Category</span><select value={variable.category} onChange={e=>{const next=e.target.value as Variable["category"];updateVariable({category:next});setCategory(next);}}>{Object.entries(CATEGORIES).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><TextField label="Natural name" value={variable.naturalName} onChange={naturalName=>updateVariable({naturalName})}/><TextField label="App layer name" value={variable.appName} onChange={appName=>updateVariable({appName})}/><label className="color-field">Map color <input type="color" aria-label="Map color" value={variable.color} onChange={e=>updateVariable({color:e.target.value})}/></label></div>
          {errors.length>0 && <div className="validation" role="alert">{errors.map(e=><p key={e}>{e}</p>)}</div>}
          <div className="editor-tabs" role="tablist" aria-label="Variable settings">{(['signal','output','language'] as const).map(t=><button role="tab" key={t} id={`tab-${t}`} aria-controls={`panel-${t}`} aria-selected={tab===t} onClick={()=>setTab(t)}>{t==='signal'?'01 Signal':t==='output'?'02 Output':'03 Language'}</button>)}</div>
          <div className="editor-content" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
            {tab==='signal' && <><div className="section-title"><h3>Noise & influence stack</h3><span className="count">{variable.layers.length}</span></div><p className="hint">Runs top to bottom, starting at 0. Each layer blends into the previous result.</p>
              {variable.layers.map((layer,index)=><section key={layer.id} className={`layer-card ${!layer.enabled?'disabled-layer':''}`}><div className="layer-heading"><input type="checkbox" aria-label={`Enable ${layer.name}`} checked={layer.enabled} onChange={e=>updateLayer(layer.id,{enabled:e.target.checked})}/><button className="layer-expand" onClick={()=>setExpanded(expanded===layer.id?'':layer.id)} aria-expanded={expanded===layer.id || (expanded===null && index===0)}><span className="mono">{String(index+1).padStart(2,'0')}</span><strong>{layer.name || sourceNames[layer.source]}</strong><small>{sourceNames[layer.source]}</small></button><span className="layer-actions"><IconButton label={`Move layer ${index+1} up`} disabled={index===0} onClick={()=>moveLayer(index,-1)}><ArrowUp size={13}/></IconButton><IconButton label={`Move layer ${index+1} down`} disabled={index===variable.layers.length-1} onClick={()=>moveLayer(index,1)}><ArrowDown size={13}/></IconButton><IconButton label={`Remove layer ${index+1}`} onClick={()=>updateVariable({layers:variable.layers.filter(l=>l.id!==layer.id)})}><Trash2 size={13}/></IconButton></span></div>
                {(expanded===layer.id || (expanded===null && index===0)) && <div className="layer-body"><TextField label="Layer name" value={layer.name} onChange={name=>updateLayer(layer.id,{name})}/><div className="form-grid"><label className="field"><span>Source</span><select value={layer.source} onChange={e=>updateLayer(layer.id,{source:e.target.value as Layer['source']})}>{SOURCES.map(s=><option key={s} value={s}>{sourceNames[s]}</option>)}</select></label><label className="field"><span>Blend</span><select value={layer.blend} onChange={e=>updateLayer(layer.id,{blend:e.target.value as Layer['blend']})}>{BLENDS.map(b=><option key={b} value={b}>{blendNames[b]}</option>)}</select></label></div>
                  {layer.source==='variable' ? <><label className="field"><span>Source variable</span><select value={layer.reference} onChange={e=>updateLayer(layer.id,{reference:e.target.value})}><option value="">Choose a variable…</option>{project.variables.filter(v=>v.id!==variable.id).map(v=><option key={v.id} value={v.id}>{v.naturalName}</option>)}</select></label><p className="hint">Uses the source’s interpreted output at the same cell: boolean 0/1, enum index normalized to 0–1, or gradient strength.</p><label className="field"><span>Reference operation</span><select value={layer.referenceMode??'value'} onChange={e=>updateLayer(layer.id,{referenceMode:e.target.value as Layer['referenceMode']})}><option value="value">Use value</option><option value="at-most">Gate · at or below</option><option value="at-least">Gate · at or above</option><option value="fade-below">Fade out as value rises</option><option value="fade-above">Fade in as value rises</option></select></label>{['at-most','at-least'].includes(layer.referenceMode??'')&&<NumberField label="Gate cutoff" value={layer.referenceCutoff??.42} min={0} max={1} step={.01} onChange={referenceCutoff=>updateLayer(layer.id,{referenceCutoff})}/>}{['fade-below','fade-above'].includes(layer.referenceMode??'')?<><div className="form-grid"><NumberField label="Fade start" value={layer.fadeLow??.55} min={0} max={1} step={.01} onChange={fadeLow=>updateLayer(layer.id,{fadeLow})}/><NumberField label="Fade end" value={layer.fadeHigh??.85} min={0} max={1} step={.01} onChange={fadeHigh=>updateLayer(layer.id,{fadeHigh})}/></div><p className="hint">Smooth transition {layer.referenceMode==='fade-below'?'from 1 to 0':'from 0 to 1'} between these bounds. Multiply at weight 1 to fade the existing signal. Place before subtractive detail to thin and erase weaker patches.</p></>:<p className="hint">Gates return exactly 1 when the condition passes, otherwise 0. Multiply at weight 1 to restrict the existing shape.</p>}</> : layer.source==='constant' ? <NumberField label="Constant value" value={layer.constant} min={0} max={1} step={.01} onChange={constant=>updateLayer(layer.id,{constant})}/> : <><div className="form-grid">{!['patches','sparks'].includes(layer.source)&&<><NumberField label="Scale X · cells" value={layer.scaleX} min={.1} max={100000} step={.1} onChange={scaleX=>updateLayer(layer.id,{scaleX})}/><NumberField label="Scale Y · cells" value={layer.scaleY} min={.1} max={100000} step={.1} onChange={scaleY=>updateLayer(layer.id,{scaleY})}/></> }{layer.source==='sparks'&&<><NumberField label="Candidate cutoff · at origin" value={layer.sparkCutoff??.998} min={0} max={1} step={.0001} onChange={sparkCutoff=>updateLayer(layer.id,{sparkCutoff})}/><NumberField label="Minimum spark intensity" value={layer.sparkFloor??.5} min={0} max={1} step={.01} onChange={sparkFloor=>updateLayer(layer.id,{sparkFloor})}/><p className="hint">Seeded local maxima produce isolated single cells. In Uniqueness, distance increases candidate frequency. Scale and rotation do not apply.</p></>}{layer.source==='patches'&&<><div className="form-grid"><NumberField label="Patch spacing · cells" value={layer.patchSpacing??32} min={3} max={100000} step={.01} onChange={patchSpacing=>updateLayer(layer.id,{patchSpacing})}/><NumberField label="Occupied patch blocks · fraction" value={layer.patchChance??0.25} min={0} max={1} step={.01} onChange={patchChance=>updateLayer(layer.id,{patchChance})}/><NumberField label="Minimum diameter · cells" value={layer.patchMinDiameter??5} min={1} max={10000} step={.01} onChange={patchMinDiameter=>updateLayer(layer.id,{patchMinDiameter})}/><NumberField label="Boundary roughness" value={layer.patchRoughness??0} min={0} max={1} step={.01} onChange={patchRoughness=>updateLayer(layer.id,{patchRoughness})}/><NumberField label="Maximum diameter · cells" value={layer.patchMaxDiameter??8} min={1} max={10000} step={.01} onChange={patchMaxDiameter=>updateLayer(layer.id,{patchMaxDiameter})}/></div><p className="hint">Isolated patches with diameters in world cells. Boundary roughness adds seeded lobes and indentations inside that envelope. Spacing must be at least maximum diameter + 2. Gain, offset and blending still apply.</p></>}<NumberField label="Offset X · cells" value={layer.offsetX} step={.1} onChange={offsetX=>updateLayer(layer.id,{offsetX})}/><NumberField label="Offset Y · cells" value={layer.offsetY} step={.1} onChange={offsetY=>updateLayer(layer.id,{offsetY})}/>{layer.source!=='patches'&&<NumberField label="Rotation · degrees" value={layer.rotation} min={-360} max={360} step={.1} onChange={rotation=>updateLayer(layer.id,{rotation})}/>}</div>
                    {['fbm','ridged'].includes(layer.source) && <div className="form-grid"><NumberField label="Octaves" value={layer.octaves} min={1} max={8} onChange={octaves=>updateLayer(layer.id,{octaves})}/><NumberField label="Persistence" value={layer.persistence} min={0} max={1} step={.01} onChange={persistence=>updateLayer(layer.id,{persistence})}/><NumberField label="Lacunarity" value={layer.lacunarity} min={1} max={4} step={.1} onChange={lacunarity=>updateLayer(layer.id,{lacunarity})}/></div>}
                    <TextField label="Noise channel · stable seed address" value={layer.channel} onChange={channel=>updateLayer(layer.id,{channel})}/></>}
                  {['perlin','fbm'].includes(layer.source) && <><label className="field"><span>Noise value</span><select value={layer.noiseTransform??'value'} onChange={e=>updateLayer(layer.id,{noiseTransform:e.target.value as Layer['noiseTransform']})}><option value="value">Original noise value</option><option value="distance">Proximity to target</option><option value="band">Contour band · low / high</option></select></label>{layer.noiseTransform==='band' && <><div className="form-grid"><NumberField label="Band low · raw noise" value={layer.bandLow??.495} min={0} max={1} step={.0001} onChange={bandLow=>updateLayer(layer.id,{bandLow})}/><NumberField label="Band high · raw noise" value={layer.bandHigh??.505} min={0} max={1} step={.0001} onChange={bandHigh=>updateLayer(layer.id,{bandHigh})}/></div><p className="hint">Low → midpoint → high becomes 0 → 1 → 0. Narrower bounds make thinner contours. Gain and offset shape the ridge before clamping. Keep gain 1 and offset 0 to match the selected bounds exactly.</p></>}{layer.noiseTransform==='distance' && <><NumberField label="Target value" value={layer.noiseTarget??.5} min={0} max={1} step={.01} onChange={noiseTarget=>updateLayer(layer.id,{noiseTarget})}/><p className="hint">Applies gain and offset first, then 1 − |value − target|, then clamp and blend. One at the target; decreases with distance.</p></>}</>}
                  <div className="form-grid"><NumberField label="Blend weight" value={layer.weight} min={0} max={1} step={.01} onChange={weight=>updateLayer(layer.id,{weight})}/><NumberField label="Gain" value={layer.gain} min={0} max={20} step={.1} onChange={gain=>updateLayer(layer.id,{gain})}/><NumberField label="Value offset" value={layer.bias} min={-20} max={20} step={.01} onChange={bias=>updateLayer(layer.id,{bias})}/><label className="check-field"><input type="checkbox" checked={layer.invert} onChange={e=>updateLayer(layer.id,{invert:e.target.checked})}/> Invert source</label></div>
                  {index===0 && ['multiply','min','subtract'].includes(layer.blend) && <p className="inline-warning">The stack starts at 0. This blend leaves the first layer at 0; use Replace to establish a base.</p>}
                  <p className="formula">{['perlin','fbm'].includes(layer.source)&&layer.noiseTransform==='band'?'noise → invert → 1 − |2 × (noise − low) / (high − low) − 1| → gain + offset → clamp → blend → clamp':<>noise → invert → gain + offset {['perlin','fbm'].includes(layer.source)&&layer.noiseTransform==='distance'?'→ 1 − |value − target| ':''}→ clamp → blend → clamp</>}</p></div>}
              </section>)}
              <Button className="full-button" disabled={variable.layers.length>=24} onClick={()=>{const l=newLayer(variable.layers.length);updateVariable({layers:[...variable.layers,l]});setExpanded(l.id);}}><Plus size={16}/> Add a layer</Button>
              <details className="help"><summary>How blending works</summary><p>Replace mixes toward the incoming layer. Add and Subtract apply its weighted amount. Multiply uses it as a mask. Minimum, Maximum and Screen mix toward their respective result. Weight 0 leaves the stack unchanged; weight 1 applies the full operation. Signals are clamped to 0–1 after adjustment and blending.</p></details>
            </>}
            {tab==='output' && <><h3>Interpret the signal</h3><p className="hint">Cutoffs apply to the final continuous signal, including equality.</p><label className="field"><span>Variable type</span><select value={variable.type} onChange={e=>updateVariable({type:e.target.value as Variable['type']})}><option value="gradient">Gradient · continuous 0–1</option><option value="boolean">Boolean · off / on</option><option value="enum">Enum · named bands</option></select></label>
              {variable.type==='boolean' && <><NumberField label="On at or above" value={variable.cutoff} min={0} max={1} step={.01} onChange={cutoff=>updateVariable({cutoff})}/><div className="threshold-bar"><span style={{width:`${variable.cutoff*100}%`}}>Off</span><span>On</span></div><p className="hint">Below {variable.cutoff}: false / 0. At or above: true / 1.</p></>}
              {variable.type==='enum' && <><p className="hint">Each cutoff is an inclusive lower bound. Bands are evaluated in cutoff order; the first must start at 0.</p>{variable.steps.map((s,index)=><div className="enum-step" key={s.id}><div className="form-grid"><TextField label={`Step ${index+1} name`} value={s.name} onChange={name=>updateVariable({steps:variable.steps.map(t=>t.id===s.id?{...t,name}:t)})}/><NumberField label="Starts at" value={s.cutoff} min={0} max={1} step={.01} onChange={cutoff=>updateVariable({steps:variable.steps.map(t=>t.id===s.id?{...t,cutoff}:t)})}/></div><TextField multiline label="Natural-language descriptor" value={s.description} onChange={description=>updateVariable({steps:variable.steps.map(t=>t.id===s.id?{...t,description}:t)})}/><Button disabled={variable.steps.length<=1} onClick={()=>updateVariable({steps:variable.steps.filter(t=>t.id!==s.id)})}><Trash2 size={13}/> Remove step</Button></div>)}<Button className="full-button" disabled={variable.steps.length>=32} onClick={()=>{let cutoff=0;while(variable.steps.some(s=>s.cutoff===cutoff)&&cutoff<1)cutoff=Math.round((cutoff+.05)*100)/100;updateVariable({steps:[...variable.steps,{id:uid(),name:`Band ${variable.steps.length+1}`,cutoff,description:''}]});}}><Plus size={16}/> Add enum step</Button></>}
              {variable.type==='gradient' && <div className="gradient-explainer"><div className="gradient-strip" style={{background:`linear-gradient(90deg,#0d1924,${variable.color},#f2f2f2)`}}/><div><span>0 · low pole</span><span>1 · high pole</span></div><p>The output retains the continuous signal. Define both poles in Language; no cutoff is applied.</p></div>}
              {variable.category==='biome'?<div className="language-preview"><h3>Traversability</h3><label className="field"><span>Exploration rule</span><select value={variable.traversal?.mode??'passable'} onChange={e=>updateVariable({traversal:{mode:e.target.value as 'passable'|'positive'|'threshold',cutoff:variable.traversal?.cutoff??.5}})}><option value="passable">Does not block exploration</option><option value="positive">Block when output is above zero</option><option value="threshold">Block at or above a cutoff</option></select></label>{variable.traversal?.mode==='threshold'&&<NumberField label="Blocking output cutoff" value={variable.traversal.cutoff??.5} min={0} max={1} step={.01} onChange={cutoff=>updateVariable({traversal:{mode:'threshold',cutoff}})}/>}<p className="hint">Uses interpreted output: boolean 0/1, gradient strength, or normalized enum index. Any blocking biome wins; passable variables cannot override it.</p></div>:<p className="hint">Only Biome variables can affect traversability.</p>}
              <label className="field"><span>Presence footprint</span><select value={variable.presenceReference??''} onChange={e=>updateVariable({presenceReference:e.target.value})}><option value="">Present everywhere</option>{project.variables.filter(v=>v.id!==variable.id).map(v=><option key={v.id} value={v.id}>{v.naturalName}</option>)}</select></label><p className="hint">Output is absent where this reference is zero. Where present, the full trait value is retained—even zero and the first enum option. Raw signal remains inspectable.</p>
              <Button className="full-button" onClick={()=>setTab('language')}>Edit language descriptors <ChevronRight size={16}/></Button>
            </>}
            {tab==='language' && <><h3>Give the variable meaning</h3><TextField multiline label="What does this variable describe?" value={variable.description} onChange={description=>updateVariable({description})}/>
              {variable.type==='boolean' && <><TextField multiline label="Off · false / absent" value={variable.off} onChange={off=>updateVariable({off})}/><TextField multiline label="On · true / present" value={variable.on} onChange={on=>updateVariable({on})}/></>}
              {variable.type==='gradient' && <><TextField multiline label="Low pole · 0" value={variable.low} onChange={low=>updateVariable({low})}/><TextField multiline label="High pole · 1" value={variable.high} onChange={high=>updateVariable({high})}/></>}
              {variable.type==='enum' && <><p className="hint">Names and descriptors travel with each enum step.</p>{[...variable.steps].sort((a,b)=>a.cutoff-b.cutoff).map(s=><TextField key={s.id} multiline label={`${s.name} · from ${s.cutoff}`} value={s.description} onChange={description=>updateVariable({steps:variable.steps.map(t=>t.id===s.id?{...t,description}:t)})}/>)}</>}
              <div className="language-preview"><span className="eyebrow">CONTEXT PREVIEW · SELECTED CELL</span>{inspected ? <><p><strong>{variable.naturalName}</strong> <code>{variable.appName}</code></p><p>{variable.description || 'No definition written yet.'}</p><p>{variable.type==='gradient'?`Value: ${fmt(inspected.value)} on a 0–1 scale. Low pole: ${variable.low}. High pole: ${variable.high}.`:`State: ${inspected.label}. ${inspected.description}`}</p></> : <p>Complete a valid definition to preview its context.</p>}<span className="hint">A deterministic context fragment for review. Prompt composition comes in a later pass.</span></div>
            </>}
          </div>
        </> : <div className="empty-editor"><Layers size={32}/><h2>A blank sandbox</h2><p>Add a variable to define its signal, output and language.</p><Button className="primary" onClick={addVariable}><Plus size={16}/> Add a variable</Button></div>}
      </aside>
    </div>
  </div>;
}

createRoot(document.getElementById('root')!).render(<App/>);
