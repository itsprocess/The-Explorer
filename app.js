// Passenger's conventional entry point. No top-level await, so Node 22's
// CommonJS Passenger loader can load this file and then import the ESM server.
import('./runtime/start.mjs').catch(error=>{
  console.error('Explorer startup failed:',error.message);
  process.exit(1);
});
