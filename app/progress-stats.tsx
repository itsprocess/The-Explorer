export default function ProgressStats({character:c,badges}:{character:any;badges:number}){
 return <div className="stats">
  <div><span>Distance traveled · this life</span><strong>{(c.distanceLife??0).toLocaleString()}</strong></div>
  <div><span>Distance traveled · total</span><strong>{(c.distanceTotal??0).toLocaleString()}</strong></div>
  <div><span>Distance from origin</span><strong>{Math.hypot(c.x,c.y).toFixed(1)}</strong></div>
  <div><span>Furthest from origin</span><strong>{c.furthest.toFixed(1)}</strong></div>
  <div><span>Relics uncovered · this life</span><strong>{c.relicsLife??0}</strong></div>
  <div><span>Relics uncovered · total</span><strong>{c.relicsTotal??0}</strong></div>
  <div><span>Deaths</span><strong>{c.deaths}</strong></div>
  <div><span>Badges</span><strong>{badges}</strong></div>
 </div>;
}
