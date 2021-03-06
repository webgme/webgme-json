'use strict';

var config = require('./config.webgme'),
    validateConfig = require('webgme/config/validator');

// Add/overwrite any additional settings here
// config.server.port = 8080;
// config.mongo.uri = 'mongodb://127.0.0.1:27017/webgme_my_app';

config.seedProjects.defaultProject = 'JSON';

config.requirejsPaths['vs'] = './node_modules/monaco-editor/min/vs';
config.core.overlayShardSize = 100000;

validateConfig(config);
module.exports = config;
