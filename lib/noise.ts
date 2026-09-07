export function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d); h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b); return (h ^ (h >>> 16)) >>> 0;
}
export const random = (seed: string, channel: string, x: number, y: number) => (hash(JSON.stringify([seed, channel, x, y])) + 0.5) / 4294967296;
export const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const oi = (v: number) => {if (!Number.isFinite(v)) throw Error('Non-finite rating');return Math.round(clamp(v, 0.000001, 0.999999) * 1e6) / 1e6;};
export const mix = (a: number, b: number, w: number) => a * (1 - w) + b * w;
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
export function perlin(seed: string, channel: string, x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const grad = (dx: number, dy: number) => {
    const g = hash(JSON.stringify([seed, channel, ix + dx, iy + dy])) & 7;
    const a = fx - dx, b = fy - dy;
    return [a, -a, b, -b, (a+b)*Math.SQRT1_2, (a-b)*Math.SQRT1_2, (-a+b)*Math.SQRT1_2, (-a-b)*Math.SQRT1_2][g];
  };
  return clamp(0.5 + mix(mix(grad(0,0),grad(1,0),fade(fx)),mix(grad(0,1),grad(1,1),fade(fx)),fade(fy)) * 0.7);
}
export function fbm(seed: string, id: string, x: number, y: number, wavelength: number, octaves = 3, gain = 0.5) {
  let sum = 0, weight = 0, amplitude = 1;
  for (let i=0;i<octaves;i++) {
    const ox = random(seed,id+':ox',i,0)*100, oy = random(seed,id+':oy',i,0)*100;
    sum += amplitude * perlin(seed,`${id}:${i}`,x/wavelength*2**i+ox,y/wavelength*2**i+oy);
    weight += amplitude; amplitude *= gain;
  }
  return sum/weight;
}
export function cellular(seed: string, id: string, x: number, y: number, size: number) {
  const px=x/size, py=y/size, ix=Math.floor(px), iy=Math.floor(py);let nearest=Infinity;
  for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++) {
    const a=ix+dx,b=iy+dy;nearest=Math.min(nearest,Math.hypot(px-a-random(seed,id+':x',a,b),py-b-random(seed,id+':y',a,b)));
  }return clamp(nearest/Math.SQRT2);
}
export function band(value: number, low: number, high: number, feather: number) {
  const smooth=(a:number,b:number,v:number)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
  return smooth(low-feather,low,value)*(1-smooth(high,high+feather,value));
}
