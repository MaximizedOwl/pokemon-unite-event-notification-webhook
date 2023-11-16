// メッセージ特に使いまわすメッセージはないのでメッセージ類はべた書き
/* 
  Path
*/
const HREFS_PATH = 'data/hrefs.txt';
const PREHREFS_PATH = 'data/preHrefs.txt';

/* 
  URL
*/
const COMPETIITON_URL = 'https://tonamel.com/competition';
const TONAMEL_URL = `https://tonamel.com/competitions?game=pokemon_unite&region=JP`;

/* 
  execScript
*/
const EXEC_SCRIPT_GET_SCROLLHEIGHT = 'return document.body.scrollHeight;';
const EXEC_SCRIPT_SCROLLING = 'return document.body.scrollHeight;';

/* 
  Other
*/
const ENCODING_TYPE = 'utf-8';

module.exports = {
  COMPETIITON_URL,
  HREFS_PATH,
  PREHREFS_PATH,
  TONAMEL_URL,
  EXEC_SCRIPT_GET_SCROLLHEIGHT,
  EXEC_SCRIPT_SCROLLING,
  ENCODING_TYPE,
};
