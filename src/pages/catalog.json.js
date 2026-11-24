import { getLibrary, publicGuide } from '../lib/library.mjs';
import { conceptDefinitions } from '../data/concepts.mjs';
export function GET() {
  return new Response(JSON.stringify({
    guides: getLibrary().map(publicGuide),
    concepts: conceptDefinitions.map(({ id, name, aliases }) => ({ id, name, aliases })),
  }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
