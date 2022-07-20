import { LuaLibrary } from './lua/LuaLibrary';
import * as fs from 'fs';
import * as hljs from 'highlight.js';

const luaLibrary = new LuaLibrary();

// Entry Point from HTML.
export let start = function () {
  // const code = fs.readFileSync('./assets/media/ISUIElement.lua').toString();
  // const html = hljs.default.highlight(code, {language: 'lua'}).value;
  // let s = '<pre><code class="hljs language-lua">' + html + '</code></pre>'
  // document.getElementById('code').innerHTML = s;

  luaLibrary.scan();
  luaLibrary.parse();
};
