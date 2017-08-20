'use strict';
var Dropbox = require('./node_modules/dropbox');
var fs = require('fs');
var path = require('path');
var replaceExt = require('replace-ext');
var myfilename = 'error.mp3';

exports.handler = (event, context, callback) => {

  let url = 'http://www.youtube.com/watch?v=' + event.queryStringParameters.url;

  var youtubedl = require('youtube-dl');
  var video = youtubedl(url,
    // Optional arguments passed to youtube-dl. 
    ['-x', '--audio-format', 'mp3'],
    // Additional options can be given for calling `child_process.execFile()`. 
    { cwd: __dirname });
 
  // Will be called when the download starts. 
  video.on('info', function(info) {
    console.log('Download started');
    // TODO: Put check in here to prevent download if duration is deemed too long.
    myfilename = '/' + info._filename;
  });

  video.pipe(fs.createWriteStream('/tmp/mysong.mp3'));

  video.on('end', function() {
    var dbx = new Dropbox({ accessToken: <<DROPBOX ACCESS TOKEN>> });

    fs.readFile(path.join('/tmp/mysong.mp3'), function (err, contents) {
    if (err) {
      console.log('Error: ', err);
    }

    // This uploads basic.js to the root of your dropbox
    dbx.filesUpload({ path: replaceExt(myfilename, '.mp3'), contents: contents, mode: 'overwrite' })
      .then(function (response) {
        console.log(response);
        callback(null, 'Success, file uploaded!!');
      })
      .catch(function (err) {
        console.log(err);
        callback(err);
      });
    });
  });
};
