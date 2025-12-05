const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable unstable package exports resolution to fix Supabase compatibility
config.resolver.unstable_enablePackageExports = false;

// Optimisations pour accélérer le démarrage
// Augmenter le nombre de workers pour la compilation parallèle
config.maxWorkers = Math.max(2, require('os').cpus().length - 1);

// Optimiser le watcher pour ignorer les fichiers inutiles
config.watchFolders = [__dirname];
config.resolver.blockList = [
  // Ignorer uniquement les fichiers de documentation et SQL (pas les JSON nécessaires)
  /.*\.md$/,
  /.*\.sql$/,
  /^.*\/supabase\/migrations\/.*$/,
  /^.*\/scripts\/.*$/,
];

module.exports = config;