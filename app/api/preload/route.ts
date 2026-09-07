// Compatibility endpoint for older open tabs. Never starts or queues generation.
export async function POST(){return Response.json({ready:false,disabled:true},{headers:{'Cache-Control':'no-store'}});}
