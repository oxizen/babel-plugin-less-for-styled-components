const VALID_TOP_LEVEL_IMPORT_PATHS = [
  'styled-components',
  'styled-components/no-tags',
  'styled-components/native',
  'styled-components/primitives',
  '@emotion/styled',
  '@emotion/css',
];

export const isValidTopLevelImport = x =>
  VALID_TOP_LEVEL_IMPORT_PATHS.includes(x);

const localNameCache = {};

export const importLocalName = (name, state, bypassCache = false) => {
  const cacheKey = name + state.file.opts.filename

  if (!bypassCache && cacheKey in localNameCache) {
    return localNameCache[cacheKey]
  }

  let localName = state.styledRequired
    ? name === 'default'
      ? 'styled'
      : name
    : false

  state.file.path.traverse({
    ImportDeclaration: {
      exit(path) {
        const {node} = path;

        if (isValidTopLevelImport(node.source.value)) {
          for (const specifier of path.get('specifiers')) {
            if (specifier.isImportDefaultSpecifier()) {
              localName = specifier.node.local.name
            }

            if (
              specifier.isImportSpecifier() &&
              specifier.node.imported.name === name
            ) {
              localName = specifier.node.local.name
            }

            if (specifier.isImportNamespaceSpecifier()) {
              localName = specifier.node.local.name
            }
          }
        }
      },
    },
  });
  localNameCache[cacheKey] = localName
  return localName
};

export const isStyled = t => (tag, state) => {
  if (tag.property && tag.property.name === "extend") {
    return true;
  }

  if (
    t.isCallExpression(tag) &&
    t.isMemberExpression(tag.callee) &&
    tag.callee.property.name !== 'default'
  ) {
    return isStyled(t)(tag.callee.object, state)
  } else {
    return (
      (t.isMemberExpression(tag) &&
        tag.object.name === importLocalName('default', state)) ||
      (t.isCallExpression(tag) &&
        tag.callee.name === importLocalName('default', state)) ||
      (state.styledRequired &&
        t.isMemberExpression(tag) &&
        t.isMemberExpression(tag.object) &&
        tag.object.property.name === 'default' &&
        tag.object.object.name === state.styledRequired) ||
      (state.styledRequired &&
        t.isCallExpression(tag) &&
        t.isMemberExpression(tag.callee) &&
        tag.callee.property.name === 'default' &&
        tag.callee.object.name === state.styledRequired)
    )
  }
};

export const isCSSHelper = t => (tag, state) => t.isIdentifier(tag) && tag.name === importLocalName('css', state);

export const isCreateGlobalStyleHelper = t => (tag, state) => t.isIdentifier(tag) && tag.name === importLocalName('createGlobalStyle', state);

export const isKeyframesHelper = t => (tag, state) => t.isIdentifier(tag) && tag.name === importLocalName('keyframes', state);

export const isPureHelper = t => (tag, state) => isCSSHelper(t)(tag, state) || isKeyframesHelper(t)(tag, state) || isCreateGlobalStyleHelper(t)(tag, state);