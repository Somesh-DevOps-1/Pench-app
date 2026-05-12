const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/private/defaults/exclusionList').default;
const path = require('path');

const config = getDefaultConfig(__dirname);

const rootNodeModules = path.resolve(__dirname, 'node_modules');
const deliveryNodeModules = path.resolve(__dirname, 'delivery-app', 'node_modules');

config.resolver = {
  ...config.resolver,
  blockList: exclusionList([
    new RegExp(`${deliveryNodeModules.replace(/[/\\]/g, '[/\\\\]')}[/\\\\].*`),
  ]),
  nodeModulesPaths: [rootNodeModules],
  extraNodeModules: new Proxy(
    {},
    {
      get: (_, name) => path.join(rootNodeModules, String(name)),
    },
  ),
};

module.exports = config;
