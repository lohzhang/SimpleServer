'use strict'

let lgtv = require('lgtv');
let logger = require('./logger');
let arpscanner = require('arpscan');
let Promise = require('promise');

const tv_mac = ''; // Enter your TV Mac address here.
const timeout_ms = 500;
let tv_ip_address = '' // Set default TV IP address. This initial value does not matter because of IP detection mechanism below;

function discover_ip(callback) {
  arpscanner(function(err, data) {
    if (err) {
      console.log('Error occurred during ARP scan: ' + err);
      callback();
      return;
    }

    data.forEach((entry) => {
      if (entry.mac === tv_mac) {
        console.log('Found TV IP address: ' + entry.ip);
        tv_ip_address = entry.ip;
      }
    });

    callback();
  });
}

function callLgtvAPI(retryTimes) {
  return new Promise((resolve, reject) => {
    let timeout = setTimeout(() => {
      console.log('LGTV connection timeout');
      reject('operation timeout');
      return;
    }, timeout_ms);

    lgtv.connect(tv_ip_address, (err) => {
      clearTimeout(timeout);
      if (err) {
        reject('Error connecting to TV');
        return;
      }

      resolve();
    });
  });
}

let moduleFunctions = 
{
  toastFunction : function(message, retryTimes, res) {
    callLgtvAPI(retryTimes).then(() => {
      if (!message) {
        /*
         * Create default message if message is not provided. Default message
         * is created so as to avert any potential fury aroused by a disturbing
         * toast message dialog.
         */
        message = 'I Love my wife!';
      }

      lgtv.show_float(message, (err) => {
        if (!err) {
          lgtv.disconnect(() => {
            res.sendStatus(200);
          });
        }
      });
    }, (reject) => {
      console.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.toastFunction(message, retryTimes - 1, res);
      });
    }).catch((error) => {
      console.log(error);
      res.sendStatus(500);
    });
  },
  turnOffFunction : function(retryTimes, res) {
    callLgtvAPI(retryTimes).then(() => {
      lgtv.turn_off(() => {
        res.sendStatus(200);
      });
    }, (reject) => {
      console.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.turnOffFunction(retryTimes - 1, res);
      });
    }).catch((error) => {
      console.log(error);
      res.sendStatus(500);
    });
  },
  setVolumeFunction : function(vol, retryTimes, res) {
    callLgtvAPI(retryTimes).then(() => {
      if (!vol) {
        vol = 0;
      }

      if (vol > 100) {
        vol %= 100;
      }

      lgtv.set_volume(vol, function(err, response) {
        if (!err) {
          lgtv.disconnect(() => {
            res.sendStatus(200);
          });
        }
      });
    }, (reject) => {
      console.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.setVolumeFunction(vol, retryTimes - 1, res);
      });
    }).catch((error) => {
      console.log(error);
      res.sendStatus(500);
    });
  },
  getVolumeFunction : function(retryTimes, res) {
    callLgtvAPI(retryTimes).then(() => {
      lgtv.volume((err, retVolume) => {
        if (!err) {
          moduleFunctions.toastFunction(retVolume, retryTimes, res);
        }
      });
    }, (reject) => {
      console.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.getVolumeFunction(retryTimes - 1, res);
      });
    }).catch((error) => {
      console.log(error);
      res.sendStatus(500);
    });
  },
  toggleMuteFunction : function(retryTimes, res) {
    // TODO: re-implement this feature. Need to create separate mute and unmute functions.
    res.sendStatus(200);
  },
  playFunction : function(retryTimes, res) {
    callLgtvAPI(retryTimes).then(() => {
      lgtv.input_media_play((err, response) => {
        if (!err) {
          lgtv.disconnect(() => {
            res.sendStatus(200);
          });
        }
      });
    }, (reject) => {
      console.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.playFunction(retryTimes - 1, res);
      });
    }).catch((error) => {
      console.log(error);
      res.sendStatus(500);
    });
  },
  pauseFunction : function(retryTimes, res) {
    callLgtvAPI(retryTimes).then(() => {
      lgtv.input_media_pause((err, response) => {
        if (!err) {
          lgtv.disconnect(() => {
            res.sendStatus(200);
          });
        }
      });
    }, (reject) => {
      console.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.pauseFunction(retryTimes - 1, res);
      });
    }).catch((error) => {
      console.log(error);
      res.sendStatus(500);
    });
  },
  stopFunction : function(retryTimes, res) {
    callLgtvAPI(retryTimes).then(() => {
      lgtv.input_media_stop((err, response) => {
        if (!err) {
          lgtv.disconnect(() => {
            res.sendStatus(200);
          });
        }
      });
    }, (reject) => {
      console.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.stopFunction(retryTimes - 1, res);
      });
    }).catch((error) => {
      console.log(error);
      res.sendStatus(500);
    });
  },
  getAppListFunction : function(retryTimes, res) {
    callLgtvAPI(retryTimes).then(() => {
     lgtv.apps((err) => {
        if (!err) {
          lgtv.disconnect(() => {
            res.sendStatus(200);
          });
        }
      });
    }, (reject) => {
      console.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.getAppListFunction(retryTimes - 1, res);
      });
    }).catch((error) => {
      console.log(error);
      res.sendStatus(500);
    });
  },
  launchYoutubeFunction : function(retryTimes, res) {
    callLgtvAPI(retryTimes).then(() => {
      lgtv.start_app('youtube.leanback.v4', (err, response) => {
        if (!err) {
          lgtv.disconnect(() => {
            res.sendStatus(200);
          });
        }
      });
    }, (reject) => {
      console.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.launchYoutubeFunction(retryTimes - 1, res);
      });
    }).catch((error) => {
      console.log(error);
      res.sendStatus(500);
    });
  },
  launchAmazonInstantVideoFunction : function(retryTimes, res) {
    callLgtvAPI(retryTimes).then(() => {
      lgtv.start_app('amazon.html', function(err, response) {
        if (!err) {
          lgtv.disconnect(() => {
            res.sendStatus(200);
          });
        }
      });
    }, (reject) => {
      console.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.launchAmazonInstantVideoFunction(retryTimes - 1, res);
      });
    }).catch((error) => {
      console.log(error);
      res.sendStatus(500);
    });
  },
  switchToHDMI_1 : function(retryTimes, res) {
    callLgtvAPI(retryTimes).then(() => {
      lgtv.set_input('HDMI_1', (err, response) => {
        if (!err) {
          lgtv.disconnect(() => {
            res.sendStatus(200);
          });
        }
      });
    }, (reject) => {
      console.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.switchToHDMI_1(retryTimes - 1, res);
      });
    }).catch((error) => {
      console.log(error);
      res.sendStatus(500);
    });
  },
  sendKey : function(key, retryTimes, res) {
    callLgtvAPI(retryTimes).then(() => {
      lgtv.sendKey(key, (err, response) => {
        if (!err) {
          lgtv.disconnect(() => {
            res.sendStatus(200);
          });
        }
      });
    }, (reject) => {
      console.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.sendKey(key, retryTimes - 1, res);
      });
    }).catch((error) => {
      console.log(error);
      res.sendStatus(500);
    });
  },
  playNext : function(retryTimes, res) {
    callLgtvAPI(retryTimes).then(() => {
      lgtv.sendKey('RIGHT', (err, response) => {
        if (!err) {
          setTimeout(() => {
            lgtv.sendKey('ok', (err, response) => {
              lgtv.disconnect(() => {
                res.sendStatus(200);
              });
            });
          }, timeout_ms);
        }
      });
    }, (reject) => {
      console.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.playNext(retryTimes - 1, res);
      });
    }).catch((error) => {
      console.log(error);
      res.sendStatus(500);
    });
  },
  mediaForward : function(retryTimes, res) {
    if (retryTimes <= 0) {
      console.log('Max attempt reached.');
      res.sendStatus(500);
      return;
    }

    callLgtvAPI().then(() => {
      lgtv.input_media_forward((err) => {
        if (!err) {
          lgtv.disconnect(() => {
            res.sendStatus(200);
          });
        }
      });
    }, (reject) => {
      console.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.mediaForward(retryTimes - 1, res);
      });
    });
  },
  mediaRewind : function(retryTimes, res) {
    if (retryTimes <= 0) {
      console.log('Max attempt reached.');
      res.sendStatus(500);
      return;
    }

    callLgtvAPI().then(() => {
      lgtv.input_media_rewind((err) => {
        if (!err) {
          lgtv.disconnect(() => {
            res.sendStatus(200);
          });
        }
      });
    }, (reject) => {
      console.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.mediaRewind(retryTimes - 1, res);
      });
    });
  }
}

module.exports = moduleFunctions;
