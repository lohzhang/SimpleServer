'use strict';

var handler = require('./tvHandler');
var myAuth = require('./auth');
var path = require('path');
var bodyParser = require('body-parser');
var logger = require('./logger');
var express = require('express');
var app = express();

const maxRetryTimes = 5;
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/webpages/index.html'));
});

app.post('/showToast', function(req, res) {
  logger.info('toast message is: ' + req.body.toastMessage);
  if (myAuth.isAuthenticated(req)) {
    handler.toastFunction(req.body.toastMessage, maxRetryTimes, res);
  } else {
    res.sendStatus(401);
  }
});

app.post('/turnOff', function(req, res) {
  if (myAuth.isAuthenticated(req)) {
    handler.turnOffFunction(maxRetryTimes, res);
  } else {
    res.sendStatus(401);
  }
});

app.post('/setVolume', function(req, res) {
  var volumeNumber = 0;
  try {
     volumeNumber = parseInt(req.body.volume);
  } catch(error) {
  	res.send('Invalid Input. Please provide an integer number.');	
  }

  if (myAuth.isAuthenticated(req)) {
    handler.setVolumeFunction(volumeNumber, maxRetryTimes, res);
  } else {
    res.sendStatus(401);
  }
});

app.get('/getVolume', function(req, res) {
  if (myAuth.isAuthenticated(req)) {
    handler.getVolumeFunction(maxRetryTimes, res);
  } else {
    res.sendStatus(401);
  }
});

app.post('/mute', function(req, res) {
  if (myAuth.isAuthenticated(req)) {
    handler.toggleMuteFunction(true, maxRetryTimes, res);
  } else {
    res.sendStatus(401);
  }
});

app.post('/unMute', function(req, res) {
  if (myAuth.isAuthenticated(req)) {
    handler.toggleMuteFunction(false, maxRetryTimes, res);
  } else {
    res.sendStatus(401);
  }
});

app.post('/play', function(req, res) {
  if (myAuth.isAuthenticated(req)) {
    handler.playFunction(maxRetryTimes, res);
  } else {
    res.sendStatus(401);
  }
});

app.post('/pause', function(req, res) {
  if (myAuth.isAuthenticated(req)) {
    handler.pauseFunction(maxRetryTimes, res);
  } else {
    res.sendStatus(401);
  }
});

app.post('/stop', function(req, res) {
  if (myAuth.isAuthenticated(req)) {
    handler.stopFunction(maxRetryTimes, res);
  } else {
    res.sendStatus(401);
  }
});

app.post('/playNext', function(req, res) {
  if (myAuth.isAuthenticated(req)) {
    handler.playNext(maxRetryTimes, res);
  } else {
    res.sendStatus(401);
  }
});

app.get('/getAppList', function(req, res) {
  if (myAuth.isAuthenticated(req)) {
      handler.getAppListFunction(maxRetryTimes, res);
  } else {
    res.sendStatus(401);
  }
});

app.post('/launchYoutube', function(req, res) {
  if (myAuth.isAuthenticated(req)) {
    handler.launchYoutubeFunction(maxRetryTimes, res);
  } else {
    res.sendStatus(401);
  }
});

app.post('/launchAmazonInstantVideo', function(req, res) {
  if (myAuth.isAuthenticated(req)) {
    handler.launchAmazonInstantVideoFunction(maxRetryTimes, res);
  } else {
    res.sendStatus(401);
  }
});

app.post('/switchToHDMI_1', function(req, res) {
  if (myAuth.isAuthenticated(req)) {
    handler.switchToHDMI_1(maxRetryTimes, res);
  } else {
    res.sendStatus(401);
  }
});

app.post('/goBack', function(req, res) {
  if (myAuth.isAuthenticated(req)) {
    handler.sendKey('BACK', maxRetryTimes, res);
  } else {
    console.log('not authorized');
    res.sendStatus(401);
  }
});

app.post('/select', function(req, res) {
  if (myAuth.isAuthenticated(req)) {
    handler.sendKey('ok', maxRetryTimes, res);
  } else {
    res.sendStatus(401);
  }
});

app.post('/moveUp', function(req, res) {
  if (myAuth.isAuthenticated(req)) {
    handler.sendKey('UP', maxRetryTimes, res);
  } else {
    res.sendStatus(401);
  }
});

app.post('/moveDown', function(req, res) {
  if (myAuth.isAuthenticated(req)) {
    handler.sendKey('DOWN', maxRetryTimes, res);
  } else {
    res.sendStatus(401);
  }
});

app.post('/moveLeft', function(req, res) {
  if (myAuth.isAuthenticated(req)) {
    handler.sendKey('LEFT', maxRetryTimes, res);
  } else {
    res.sendStatus(401);
  }
});

app.post('/moveRight', function(req, res) {
  if (myAuth.isAuthenticated(req)) {
    handler.sendKey('RIGHT', maxRetryTimes, res);
  } else {
    res.sendStatus(401);
  }
});

app.post('/mediaForward', function(req, res) {
  if (myAuth.isAuthenticated(req)) {
    handler.mediaForward(maxRetryTimes, res);
  } else {
    res.sendStatus(401);
  }
});

app.post('/mediaRewind', function(req, res) {
  if (myAuth.isAuthenticated(req)) {
    handler.mediaRewind(maxRetryTimes, res);
  } else {
    res.sendStatus(401);
  }
});

app.post('/passBeginning', function(req, res) {
  if (myAuth.isAuthenticated(req)) {
    handler.passBeginning(maxRetryTimes, res);
  } else {
    res.sendStatus(401);
  }
});

app.listen(port, function() {
  console.log('Server listening port 3000');
});
