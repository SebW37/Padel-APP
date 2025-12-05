const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable unstable package exports resolution to fix Supabase compatibility
config.resolver.unstable_enablePackageExports = false;

module.exports = config;