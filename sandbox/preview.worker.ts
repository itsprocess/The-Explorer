import {traversalEvaluator} from './traversal';
import {overallMapEvaluator} from './overall-map';
import {civilizationEvaluator} from './civilization-view';
import { evaluator, type Project } from './model';
export type PreviewRequest = { project: Project; variableId: string; centerX: number; centerY: number; size: number; stride: number; stage: string; showCivilization?: boolean };
export type PreviewResponse = { values: Float32Array; colors?: Uint8Array; min: number; max: number; mean: number; nonzero: number };
self.onmessage = ({ data }: MessageEvent<PreviewRequest>) => {
  try {
    const { project, variableId, centerX, centerY, size, stride, stage } = data;
    const evaluate = evaluator(project), values = new Float32Array(size * size);
    const traversal=stage==='traversal'?traversalEvaluator(project):null;
    const civ=stage==='civilization'?civilizationEvaluator(project,false):null;
    const overall=stage==='overall'?overallMapEvaluator(project,data.showCivilization??true):null;
    const colors=civ||overall?new Uint8Array(size*size*3):undefined;
    let min = 1, max = 0, sum = 0, nonzero = 0;
    for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) {
      if(overall){
        const r=overall(centerX+(col-Math.floor(size/2))*stride,centerY+(row-Math.floor(size/2))*stride);
        const value=r.explorable?1:0;values[row*size+col]=value;colors!.set(r.rgb,(row*size+col)*3);
        min=Math.min(min,value);max=Math.max(max,value);sum+=value;nonzero+=value;continue;
      }
      if(civ){
        const r=civ(centerX+(col-Math.floor(size/2))*stride,centerY+(row-Math.floor(size/2))*stride);
        values[row*size+col]=r.footprint;colors!.set(r.rgb,(row*size+col)*3);
        min=Math.min(min,r.footprint);max=Math.max(max,r.footprint);sum+=r.footprint;if(r.footprint>0)nonzero++;
        continue;
      }
      const r = evaluate(variableId, centerX + (col - Math.floor(size / 2)) * stride, centerY + (row - Math.floor(size / 2)) * stride);
      const [kind, layerId] = stage.split('/');
      const trace = r.trace.find(t => t.id === layerId);
      const value = traversal ? (traversal(centerX + (col - Math.floor(size / 2)) * stride, centerY + (row - Math.floor(size / 2)) * stride).explorable?1:0) : kind === 'raw' ? r.raw : kind === 'source' ? trace?.source ?? 0 : kind === 'stack' ? trace?.accumulated ?? 0 : r.value;
      values[row * size + col] = value;
      min = Math.min(min, value); max = Math.max(max, value); sum += value; if (value > 0) nonzero++;
    }
    self.postMessage({ values, colors, min, max, mean: sum / values.length, nonzero: nonzero / values.length }, { transfer: [values.buffer,...(colors?[colors.buffer]:[])] });
  } catch (error) { self.postMessage({ error: (error as Error).message }); }
};
