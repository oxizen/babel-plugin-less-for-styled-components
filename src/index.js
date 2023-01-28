import taggedTemplateExpressionVisitor from './visitors/taggedTemplateExpressionVisitor'

export default babel => ({
    visitor: {
        Program(programPath, state) {
            programPath.traverse({
                TaggedTemplateExpression(path) {
                    taggedTemplateExpressionVisitor(path, state, babel);
                },
            });
        },
    }
});
