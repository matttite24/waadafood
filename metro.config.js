const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// Project root is the current directory
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Watch files within the project directory
config.watchFolders = [projectRoot];

// Resolve packages from local node_modules
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
];

// Force Metro to resolve specific packages from local node_modules
config.resolver.extraNodeModules = {
    'react-native-svg': path.resolve(projectRoot, 'node_modules/react-native-svg'),
    'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
    'react-native-reanimated': path.resolve(projectRoot, 'node_modules/react-native-reanimated'),
    'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
    'react': path.resolve(projectRoot, 'node_modules/react'),
};

module.exports = withNativeWind(config, { input: './global.css' });
