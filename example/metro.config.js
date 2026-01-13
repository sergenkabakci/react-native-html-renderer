const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the library source
config.watchFolders = [workspaceRoot];

// Resolve modules from both project and workspace
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// Force React and React Native to use the example's versions (single copy)
config.resolver.extraNodeModules = {
    'react': path.resolve(projectRoot, 'node_modules/react'),
    'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
    '@sergenkabakci/react-native-html-renderer': path.resolve(workspaceRoot, 'src'),
};

// Block the library from using its own React
config.resolver.blockList = [
    new RegExp(`${workspaceRoot.replace(/\\/g, '\\\\')}[\\\\/]node_modules[\\\\/]react[\\\\/].*`),
    new RegExp(`${workspaceRoot.replace(/\\/g, '\\\\')}[\\\\/]node_modules[\\\\/]react-native[\\\\/].*`),
];

// Source extensions
config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx'];

module.exports = config;
