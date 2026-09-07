import {checkOrigin,requireOwner,errorResponse} from '../../../../lib/auth';
import {resumeProvider} from '../../../../lib/provider-health';
export async function POST(request:Request){try{checkOrigin(request);await requireOwner();await resumeProvider();return Response.json({ready:true},{headers:{'Cache-Control':'no-store'}});}catch(e){return errorResponse(e);}}
