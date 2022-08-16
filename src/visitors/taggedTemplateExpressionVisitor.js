import {isStyled, isPureHelper} from "../utils/detectors";
import transpileLess from "./transpileLess";
import generate from '@babel/generator';

const regex = /`([\s\S]*)`/;

export default (path, state, {types: t}) => {
  if (!(isStyled(t)(path.node.tag, state) || isPureHelper(t)(path.node.tag || path.node.callee, state))) {
    return;
  }

  // Find the TemplateLiteral in the TaggedTemplateExpression
  path.traverse({
    TemplateLiteral(p) {
      if (p.isClean) return;
      p.stop(); // Only traverse the first TemplateLiteral of TaggedTemplateExpression

      let rawSource = p.getSource();
      if (!rawSource) {
        const {code} = generate({
          type: 'Program',
          body: [path.node]
        });
        rawSource = code;
      }

      let [, source] = regex.exec(rawSource);
      if (!source) return;
      p.isClean = true;
      let cursor;
      let sq = 0;
      const dict = {};
      while ((cursor = source.indexOf('${')) > -1) {
        const start = cursor;
        cursor += 1;
        let close;
        let stack = 1;
        while (stack > 0) {
          close = source.indexOf('}', cursor + 1)
          if (close === -1) throw 'template brace not balanced';
          const open = source.indexOf('{', cursor + 1)
          if (open === -1 || open > close) {
            cursor = close;
            stack -= 1;
          } else {
            cursor = open;
            stack += 1;
          }
        }
        const tpl = source.slice(start, close + 1);
        const key = `var(--LESS-FOR-STYLED-${sq++})`
        dict[key] = tpl;
        source = source.replace(tpl, key);
      }
      source = source.replaceAll(/&\.[\w-]+/g, org => {
        const key = `var(--LESS-FOR-STYLED-${sq++})`
        dict[key] = org;
        return key;
      });
      if (Array.isArray(state.opts.globalImports)) {
        source = state.opts.globalImports.map(f => `@import "${f}";`).join('') + source;
      }
      try {
        let raw = transpileLess(source, state.file.opts.filename, state.opts);
        Object.keys(dict).forEach(k => raw = raw.replace(k, dict[k]));
        if (source !== raw) {
          p.replaceWithSourceString('`' + raw + '`');
        }
      } catch (e) {
        console.error("Error converting the less syntax for the file:", state.file.opts.filename, rawSource, e);
      }
    },
  });
}