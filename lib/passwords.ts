import {scryptAsync} from '@noble/hashes/scrypt.js';
import {bytesToHex,hexToBytes} from '@noble/hashes/utils.js';
const options={N:16384,r:8,p:5,dkLen:32,maxmem:32*1024*1024};
export function characterName(value:unknown){
 if(typeof value!=='string')throw Error('Enter a character name.');
 const name=value.normalize('NFKC').trim();
 if(!/^[a-zA-Z0-9][a-zA-Z0-9 _-]{1,39}$/.test(name))throw Error('Use 2–40 letters, numbers, spaces, hyphens, or underscores.');
 return {name,key:name.toLowerCase()};
}
export function checkPassword(value:unknown):asserts value is string{if(typeof value!=='string'||value.length<8||value.length>128)throw Error('Use a password between 8 and 128 characters.');}
export async function hashPassword(password:string){
 checkPassword(password);const salt=crypto.getRandomValues(new Uint8Array(16));
 const derived=await scryptAsync(new TextEncoder().encode(password),salt,options);
 return 'scrypt$16384$8$5$'+bytesToHex(salt)+'$'+bytesToHex(derived);
}
export async function verifyPassword(password:string,encoded:string){
 const parts=encoded.split('$');if(parts.length!==6||parts.slice(0,4).join('$')!=='scrypt$16384$8$5'||!/^[0-9a-f]{32}$/.test(parts[4])||!/^[0-9a-f]{64}$/.test(parts[5]))return false;
 if(typeof password!=='string'||password.length>128)return false;
 const actual=await scryptAsync(new TextEncoder().encode(password),hexToBytes(parts[4]),options);
 const expected=hexToBytes(parts[5]);let difference=0;
 for(let i=0;i<actual.length;i++)difference|=actual[i]^expected[i];
 return difference===0;
}
export async function tokenHash(token:string){return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))));}
