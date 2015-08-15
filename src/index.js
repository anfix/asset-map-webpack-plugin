import fs from 'fs';
import path from 'path';
import url from 'url';
import RequestShortener from 'webpack/lib/RequestShortener';

function ExtractAssets(modules, requestShortener, publicPath) {
  var emitted = false;
  var assets = modules
    .map(m => {
      var assets = m.assets || {};

      if (assets.length === 0) {
        return undefined;
      }

      var asset = assets[0];

      var name = '';
      if(m && m.reasons && m.reasons[0] && m.reasons[0].userRequest) {
        name = m.reasons[0].userRequest;
      } else {
        name = asset;
      }

      return {
        name: name,
        asset: asset
      };
    }).filter(m => {
      return m !== undefined;
    }).reduce((acc, m) => {
        acc[m.name] = url.resolve(publicPath, m.asset);
      return acc;
    }, {});

  return [true, assets];
}

function ExtractChunks(chunks, publicPath) {
  var emitted = false;
  var chunks = chunks
    .map(c => {
      return {
        name: c.names[0],
        files: c.files
          .filter(f => path.extname(f) !== '.map')
          .map(f => url.resolve(publicPath, f))
      };
    })
    .reduce((acc, c) => {
      acc[c.name] = c.files;
      return acc;
    }, {});

  return [emitted, chunks];
}

export default class AssetMapPlugin {
  /**
   * AssetMapPlugin
   *
   * @param {string} outputFile - Where to write the asset map file
   * @param {string} [relativeTo] - Key assets relative to this path, otherwise defaults to be relative to the directory where the outputFile is written
   */
  constructor(outputFile, relativeTo) {
    this.outputFile = outputFile;
    this.relativeTo = relativeTo;
  }

  apply(compiler) {
    compiler.plugin("emit", (curCompiler, callback) => {
      var stats = curCompiler.getStats().toJson();

      var publicPath = stats.publicPath;
      var requestShortener = new RequestShortener(this.relativeTo || path.dirname(this.outputFile));

      var [assetsEmitted, assets] = ExtractAssets(stats.modules, requestShortener, publicPath);
      var [chunksEmitted, chunks] = ExtractChunks(stats.chunks, publicPath);

      if (assetsEmitted || chunksEmitted) {
        var statsJson = JSON.stringify({ assets, chunks }, null, 2);

        curCompiler.assets[this.outputFile] = {
          source: function () {
            return statsJson;
          },
          size: function () {
            return statsJson.length;
          }
        };
      }

      callback();
    });

  }
}
