import { build } from 'esbuild';
import { resolve } from 'node:path';
await build({entryPoints:['src/game.js'],bundle:true,format:'iife',minify:true,legalComments:'inline',alias:{'three/addons/controls/OrbitControls.js':resolve('vendor/three/OrbitControls.js'),three:resolve('vendor/three/three.module.js')},outfile:'dist/game.js'});
