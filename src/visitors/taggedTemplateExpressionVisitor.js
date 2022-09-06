import { isStyled, isPureHelper } from "../utils/detectors";
import generate from '@babel/generator';
import transpile from "./transpile";

const regex = /`([\s\S]*)`/;

export default (path, state, { types: t }) => {
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
        const { code } = generate({
          type: 'Program',
          body: [path.node]
        });
        rawSource = code;
      }
      let [, source] = regex.exec(rawSource);
      if (!source) return;
      p.isClean = true;
      const transpiled = transpile(source, state);
      if (source !== transpiled) p.replaceWithSourceString('`' + transpiled + '`')
    },
  });
}
