import {sha256} from '@noble/hashes/sha2.js';
import {bytesToHex} from '@noble/hashes/utils.js';
import {appPath} from './app-path';
export const badgeToken=(id:string)=>bytesToHex(sha256(new TextEncoder().encode(id)));
export const badgeLink=(character:string,id:string)=>appPath('/badge/')+encodeURIComponent(character)+'/'+badgeToken(id);
export const badgeProse=(text:string)=>text.replace(/\(?-?\d+,\s*-?\d+\)?/g,'an undisclosed place');
