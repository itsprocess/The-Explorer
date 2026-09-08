export function locationConcealed(hasCharacter:boolean,busy:boolean,hasCell:boolean,_locationKey:string,_readyImageKey:string){
 return hasCharacter&&(busy||!hasCell);
}
