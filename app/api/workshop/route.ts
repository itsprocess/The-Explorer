import {requireOwner,errorResponse} from '../../../lib/auth';
import {workshopData} from '../../../lib/generation';
export async function GET(request:Request){try{await requireOwner();const url=new URL(request.url);return Response.json(await workshopData(Number(url.searchParams.get('x')??0),Number(url.searchParams.get('y')??0)));}catch(e){return errorResponse(e);}}
