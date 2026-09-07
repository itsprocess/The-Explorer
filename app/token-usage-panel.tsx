export default function TokenUsagePanel({data}:{data:any}){
 if(!data)return null;
 const n=(v:number|null|undefined)=>v==null?'—':v.toLocaleString();
 return <section className="token-usage"><h2>Cell Tokens</h2><div className="stats"><div><span>Reported Total</span><strong>{n(data.cell.total)}</strong></div><div><span>Input</span><strong>{n(data.cell.input)}</strong></div><div><span>Output</span><strong>{n(data.cell.output)}</strong></div></div>
 <p className="muted">{data.cell.requests} provider requests · {n(data.cell.cached)} cached input · {n(data.cell.reasoning)} reasoning (included in output)</p>
 <p className="muted">Includes retries and failed responses when usage was reported. {data.cell.requests-data.cell.reported} requests have unreported usage; totals are reported usage only.</p>
 <details><summary>Requests and Shared Regions</summary><p>Shared region tokens: {n(data.sharedRegions.total)}. These identities are generated once and reused; excluded from this cell’s total.</p><div className="usage-scroll"><table><thead><tr><th>Stage</th><th>Status</th><th>Input</th><th>Cached</th><th>Output</th><th>Total</th></tr></thead><tbody>{data.rows.map((r:any,i:number)=><tr key={i}><td>{r.shared?'Shared region':r.lane==='image'?'Image':'Scene'}<small>{r.model}</small></td><td>{r.status}</td><td>{n(r.usage.input)}</td><td>{n(r.usage.cached)}</td><td>{n(r.usage.output)}</td><td>{n(r.usage.total)}</td></tr>)}</tbody></table></div></details></section>;
}
