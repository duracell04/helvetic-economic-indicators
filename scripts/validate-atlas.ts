import { readAtlas, validateAtlas } from './lib/atlas-data.ts';
const data = await readAtlas(process.cwd());
validateAtlas(data, true);
console.log(`Validated ${data.topics.length} topics and ${data.presets.length} configuration-driven presets.`);
