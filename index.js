'use strict';
const Dropbox = require('./node_modules/dropbox');
const fs = require('fs');
const replaceExt = require('replace-ext');
let myfilename = 'error.mp3';

exports.handler = (event, context, callback) => {
  const url = 'http://www.youtube.com/watch?v=' + event.queryStringParameters.url;

  let youtubedl = require('youtube-dl');
  let video = youtubedl(url,
    // Optional arguments passed to youtube-dl. 
    ['-x', '--audio-format', 'mp3', '--cache-dir', '/tmp/youtube-dl-cache'],
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
    uploadtoDropbox(myfilename, callback);
  });
};

function uploadtoDropbox(path, callback) {
  const dropbox = new Dropbox({ accessToken: process.env.DROPBOX_API_KEY });

  fs.readFile('/tmp/mysong.mp3', function (err, contents) {
    
    if (err) {
      console.log('Error: ', err);
    }

    // This uploads your file to the root of your dropbox. It also changes the extension to mp3.
    dropbox.filesUpload({ path: replaceExt(path, '.mp3'), contents: contents, mode: 'overwrite' })
    .then(function (response) {
      callback(null, {"statusCode": 200, "body": `${response.name} was successfully uploaded to dropbox.`})
    })
    .catch(function (err) {
      callback(err);
    });
  });
}
