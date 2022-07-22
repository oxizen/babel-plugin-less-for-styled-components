import path from "path";
import Less from "less/lib/less";
import FileManager from "less/lib/less-node/file-manager";

export default (source, filename) => {
    const fileManager = new FileManager();
    const less = new Less(undefined, [fileManager]);
    less.PluginLoader = class PluginLoader {};

    const paths = [path.dirname(filename)];
    source = source.trim();
    if (!source.endsWith(";")) source += ";";

    const parseOpts = { math: 0, paths, syncImport: true };

    let root, imports, options;
    less.parse(source, parseOpts, (e, _root, _imports, _options) => {
        root = _root;
        imports = _imports;
        options = _options;
    });

    if (!root) {
        console.error("Failed to parse", source);
        return source;
    }
    root.firstRoot = false;
    const parseTree = new less.ParseTree(root, imports);
    const {css} = parseTree.toCSS(options);
    return css;
}
