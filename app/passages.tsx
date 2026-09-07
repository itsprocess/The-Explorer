export default function Passages({exits,blocked=[]}:{exits:{direction:string;description:string;glimpse?:string}[];blocked?:{direction:string;reason:string}[]}){
 return <div className="passages-card"><ul className="passage-list">{exits.map(e=><li key={e.direction}><strong>{e.direction}</strong><div><p>{e.description}</p>{e.glimpse&&<span className="terrain-hint">{e.glimpse}</span>}</div></li>)}{blocked.map(b=><li className="closed-passage" key={b.direction}><strong>{b.direction}</strong><div><p>{b.reason}</p></div></li>)}</ul></div>;
}
