[![npm](https://img.shields.io/npm/v/babel-plugin-less-for-styled-components.svg)](https://www.npmjs.com/package/babel-plugin-less-for-styled-components)

## LESS for styled-components
It's a babel plugin that can use LESS syntax in the [styled-components](https://styled-components.com/)' style template.

- Template literal with props
```javascript
const Button = styled.button<{ disabled: boolean }>`
  .color(${props => (props.disabled ? 'gray' : 'red')});
`
```

- Referring to other components
```javascript
const Link = styled.a`
  .flex; .items-center; .p(5, 10);
`;

const Span = styled.span`
  .c(red);
  ${Link}:hover & { .c(blue) }
`;
```

### global import option
- add global imports option, it can be referenced in all the style blocks.
```javascript
[
  'babel-plugin-less-for-styled-components', 
  { globalImports: ['src/less/proj'] }
]
```

### Cautions
- When registering this plug-in, it must be registered before [`babel-plugin-styled-components`](https://www.npmjs.com/package/babel-plugin-styled-components).


function to detect template is from [styless](https://github.com/jean343/styless.git).
