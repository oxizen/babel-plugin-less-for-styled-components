import transpile from '../src/visitors/transpile';

const testOption = {
  opts: {
    globalImports: ['test/less/global.less'],
    compress: true
  },
  file: {
    opts: {
      filename: '/test-path/test.jsx'
    }
  }
}

test('template literal', () => {
  expect(transpile("body { .c(${props => (props.disabled ? `${good}` : `${bad}`)}); }", testOption))
    .toBe("body{color:${props => (props.disabled ? `${good}` : `${bad}`)}}")
})

test('top level ampersand selector', () => {
  expect(transpile("&.top { &.left { .c(@red); } &.right { .c(@blue); } }", testOption))
    .toBe("&.top.left{color:#f00}&.top.right{color:#00f}");

  expect(transpile(".top & { .c(@red); }", testOption))
    .toBe(".top &{color:#f00}");

  expect(transpile(".top & { &.left { .c(@red); } }", testOption))
    .toBe(".top &.left{color:#f00}");

  expect(transpile("${Root} & { .c(@red); }", testOption))
    .toBe("${Root} &{color:#f00}");
})


test('top level ampersand with media query', () => {
  expect(transpile("@media (min-width: 700px) { &.top { &.left { .c(@red); } &.right { .c(@blue); } } }", testOption))
    .toBe("@media (min-width:700px){&.top.left{color:#f00}&.top.right{color:#00f}}");
})
