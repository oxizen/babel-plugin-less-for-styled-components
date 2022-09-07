import transpileLess from "./transpileLess";

export default (source, state) => {
  let result = source;
  let cursor;
  let sq = 0;
  const tplDict = {};
  const topLevelDict = {};

  while ((cursor = result.indexOf('${')) > -1) {
    const start = cursor;
    cursor += 1;
    let close = start;
    let stack = 1;
    while (stack > 0) {
      close = result.indexOf('}', cursor + 1)
      if (close === -1) throw 'template brace not balanced';
      const open = result.indexOf('{', cursor + 1)
      if (open === -1 || open > close) {
        cursor = close;
        stack -= 1;
      } else {
        cursor = open;
        stack += 1;
      }
    }
    const tpl = result.slice(start, close + 1);
    const key = `var(--LESS-FOR-STYLED-${sq++})`;
    tplDict[key] = tpl;
    result = result.replace(tpl, key);
  }

  if (Array.isArray(state.opts.globalImports)) {
    result = state.opts.globalImports.map(f => `@import "${f}";`).join('') + result;
  }

  cursor = 0;
  let topLevelStyleAndSelectorEnd;
  while ((topLevelStyleAndSelectorEnd = result.indexOf('{', cursor)) > 1) {
    const topLevelStyleAndSelector = result.substring(cursor, topLevelStyleAndSelectorEnd);
    const start = cursor;
    cursor = topLevelStyleAndSelectorEnd;
    let close;
    let stack = 1;
    while (stack > 0) {
      close = result.indexOf('}', cursor + 1);
      if (close === -1) throw 'style brace not balanced';
      const open = result.indexOf('{', cursor + 1);
      if (open === -1 || open > close) {
        cursor = close + 1;
        stack -= 1;
      } else {
        cursor = open;
        stack += 1;
      }
    }
    const selectorIndex = topLevelStyleAndSelector.lastIndexOf(';') + 1;
    const selector = topLevelStyleAndSelector.substring(selectorIndex);
    if (selector.trim().startsWith('@media')) {
      cursor = topLevelStyleAndSelectorEnd + 2;
    } else if (selector.includes('&')) {
      const key = `.--LESS-FOR-STYLED-${sq++}`
      topLevelDict[key] = selector.trim();
      cursor += key.length - selector.length;
      result = result.substring(0, start + selectorIndex) + key + result.substring(start + selectorIndex + selector.length);
    }
  }

  try {
    let transpiled = transpileLess(result, state.file.opts.filename, state.opts);
    Object.keys(topLevelDict).forEach(k => transpiled = transpiled.replaceAll(k, topLevelDict[k]));
    Object.keys(tplDict).forEach(k => transpiled = transpiled.replaceAll(k, tplDict[k]));
    return transpiled;
  } catch (e) {
    console.error("Error converting the less syntax for the file:", state.file.opts.filename, source, e);
  }
}
