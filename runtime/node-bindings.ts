// Replaced at build time only for the portable Node target. Never imported by clients.
export const env = new Proxy({}, {get(_target, key) {
  const bindings = (globalThis as any).__explorerBindings;
  if (!bindings) throw new Error('Start the portable build with npm start.');
  return bindings[key];
}});
