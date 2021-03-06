"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var fs = _interopRequire(require("fs"));

var path = _interopRequire(require("path"));

var url = _interopRequire(require("url"));

var RequestShortener = _interopRequire(require("webpack/lib/RequestShortener"));

function ExtractAssets(modules, requestShortener, publicPath) {
  var emitted = false;
  var assets = modules.map(function (m) {
    var assets = m.assets || {};

    if (assets.length === 0) {
      return undefined;
    }

    var asset = assets[0];

    var name = "";
    if (m && m.reasons && m.reasons[0] && m.reasons[0].userRequest) {
      name = m.reasons[0].userRequest;
    } else {
      name = asset;
    }

    return {
      name: name,
      asset: asset
    };
  }).filter(function (m) {
    return m !== undefined;
  }).reduce(function (acc, m) {
    acc[m.name] = url.resolve(publicPath, m.asset);
    return acc;
  }, {});

  return [true, assets];
}

function ExtractChunks(chunks, publicPath) {
  var emitted = false;
  var chunks = chunks.map(function (c) {
    return {
      name: c.names[0],
      files: c.files.filter(function (f) {
        return path.extname(f) !== ".map";
      }).map(function (f) {
        return url.resolve(publicPath, f);
      })
    };
  }).reduce(function (acc, c) {
    acc[c.name] = c.files;
    return acc;
  }, {});

  return [emitted, chunks];
}

var AssetMapPlugin = (function () {
  /**
   * AssetMapPlugin
   *
   * @param {string} outputFile - Where to write the asset map file
   * @param {string} [relativeTo] - Key assets relative to this path, otherwise defaults to be relative to the directory where the outputFile is written
   */

  function AssetMapPlugin(outputFile, relativeTo) {
    _classCallCheck(this, AssetMapPlugin);

    this.outputFile = outputFile;
    this.relativeTo = relativeTo;
  }

  _createClass(AssetMapPlugin, {
    apply: {
      value: function apply(compiler) {
        var _this = this;

        compiler.plugin("emit", function (curCompiler, callback) {
          var stats = curCompiler.getStats().toJson();

          var publicPath = stats.publicPath;
          var requestShortener = new RequestShortener(_this.relativeTo || path.dirname(_this.outputFile));

          var _ExtractAssets = ExtractAssets(stats.modules, requestShortener, publicPath);

          var _ExtractAssets2 = _slicedToArray(_ExtractAssets, 2);

          var assetsEmitted = _ExtractAssets2[0];
          var assets = _ExtractAssets2[1];

          var _ExtractChunks = ExtractChunks(stats.chunks, publicPath);

          var _ExtractChunks2 = _slicedToArray(_ExtractChunks, 2);

          var chunksEmitted = _ExtractChunks2[0];
          var chunks = _ExtractChunks2[1];

          if (assetsEmitted || chunksEmitted) {
            var statsJson = JSON.stringify({ assets: assets, chunks: chunks }, null, 2);

            curCompiler.assets[_this.outputFile] = {
              source: function source() {
                return statsJson;
              },
              size: function size() {
                return statsJson.length;
              }
            };
          }

          callback();
        });
      }
    }
  });

  return AssetMapPlugin;
})();

module.exports = AssetMapPlugin;