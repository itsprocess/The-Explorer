export function locationConcealed(hasCharacter:boolean,busy:boolean,hasCell:boolean,locationKey:string,readyImageKey:string){
 return hasCharacter&&(busy||!hasCell||locationKey!==readyImageKey);
}
