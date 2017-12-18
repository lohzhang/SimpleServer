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
      logger.error('Error occurred during ARP scan: ' + err);
      callback();
      return;
    }

    data.forEach((entry) => {
      if (entry.mac === tv_mac) {
        logger.info('Found TV IP address: ' + entry.ip);
        tv_ip_address = entry.ip;
      }
    });

    callback();
  });
}

function callLgtvAPI(retryTimes) {
  return new Promise((resolve, reject) => {
    let timeout = setTimeout(() => {
      logger.error('LGTV connection timeout');
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
    if (retryTimes <= 0) {
      logger.error('Max attempt reached.');
      res.sendStatus(500);
      return;
    }

    callLgtvAPI().then(() => {
      if (!message) {
        /*
         * Create default message if message is not provided. Default message
         * is created so as to avert any potential fury aroused by a disturbing
         * toast message dialog.
         */
        message = 'I Love my wife!';
      }

      lgtv.show_float(message, (err) => {
        lgtv.disconnect(() => {
          if (!err) {
            res.sendStatus(200);
          } else {
            logger.error('Error toastFunction: ' + err);
            res.sendStatus(500);
          }
        });
      });
    }, (reject) => {
      console.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.toastFunction(message, retryTimes - 1, res);
      });
    });
  },
  turnOffFunction : function(retryTimes, res) {
    if (retryTimes <= 0) {
      logger.error('Max attempt reached.');
      res.sendStatus(500);
      return;
    }

    callLgtvAPI().then(() => {
      lgtv.turn_off(() => {
        res.sendStatus(200);
      });
    }, (reject) => {
      console.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.turnOffFunction(retryTimes - 1, res);
      });
    });
  },
  setVolumeFunction : function(vol, retryTimes, res) {
    if (retryTimes <= 0) {
      logger.error('Max attempt reached.');
      res.sendStatus(500);
      return;
    }

    callLgtvAPI().then(() => {
      if (!vol) {
        vol = 0;
      }

      if (vol > 100) {
        vol %= 100;
      }

      lgtv.set_volume(vol, function(err, response) {
        lgtv.disconnect(() => {
          if (!err) {
            res.sendStatus(200);
          } else {
            logger.error('Error setVolumeFunction: ' + err);
            res.sendStatus(500);
          }
        });
      });
    }, (reject) => {
      logger.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.setVolumeFunction(vol, retryTimes - 1, res);
      });
    });
  },
  /*
   * This function is created just for testing purpose.
   * Have not thought about how to use it...
   */
  volumeUpFunction : function(retryTimes, res) {
    if (retryTimes <= 0) {
      logger.error('Max attempt reached.');
      res.sendStatus(500);
      return;
    }

    callLgtvAPI().then(() => {
      lgtv.input_volumeup((err, response) => {
        lgtv.disconnect(() => {
          if (!err) {
            res.sendStatus(200);
          } else {
            logger.error('Error volumeUpFunction: ' + err);
            res.sendStatus(500);
          }
        });
      });
    }, (reject) => {
      logger.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.volumeUpFunction(retryTimes - 1, res);
      });
    });
  },
  /*
   * This function is created just for testing purpose.
   * Have not thought about how to use it...
   */
  volumeDownFunction : function(retryTimes, res) {
    if (retryTimes <= 0) {
      logger.error('Max attempt reached.');
      res.sendStatus(500);
      return;
    }


    callLgtvAPI().then(() => {
      lgtv.input_volumedown((err, response) => {
        lgtv.disconnect(() => {
          if (!err) {
            res.sendStatus(200);
          } else {
            logger.error('Error volumeDownFunction: ' + err);
            res.sendStatus(500);
          }
        });
      });
    }, (reject) => {
      logger.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.volumeDownFunction(retryTimes - 1, res);
      });
    });
  },
  controlVolumeFunction : function(volumeChange, volumeChangeDirection, retryTimes, res) {
    if (retryTimes <= 0) {
      logger.error('Max attempt reached.');
      res.sendStatus(500);
      return;
    }

    if (!volumeChange || !volumeChangeDirection ||
        (volumeChangeDirection.toLowerCase() != 'up' && volumeChangeDirection.toLowerCase() != 'down')) {
      logger.error('Invalid volume control parameters. volumeChange: ' + volumeChange
                                        + ', volumeChangeDirection: ' + volumeChangeDirection);
      res.sendStatus(400);
      return;
    }

    callLgtvAPI().then(() => {
      lgtv.volume((err, currentVolume) => {
        if (!err) {
          let newVolume = 0;
          if (volumeChangeDirection === 'up') {
            newVolume = currentVolume + volumeChange;
          } else {
            newVolume = currentVolume - volumeChange;
          }
          newVolume = Math.max(newVolume, 0);
          newVolume = Math.min(newVolume, 100);
          lgtv.set_volume(newVolume, function(err, response) {
            lgtv.disconnect(() => {
              if (!err) {
                res.sendStatus(200);
              } else {
                logger.error('Error in volume control function:' + err);
                res.sendStatus(500);
              }
            });
          });
        }
      });
    }, (reject) => {
      logger.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.controlVolumeFunction(volumeChange, volumeChangeDirection, retryTimes - 1, res);
      });
    });
  },
  getVolumeFunction : function(retryTimes, res) {
    if (retryTimes <= 0) {
      logger.error('Max attempt reached.');
      res.sendStatus(500);
      return;
    }

    callLgtvAPI().then(() => {
      lgtv.volume((err, retVolume) => {
        if (!err) {
          moduleFunctions.toastFunction(retVolume, retryTimes, res);
          res.sendStatus(200);
        } else {
          logger.error('Error getVolumeFunction: ' + err);
          res.sendStatus(500);
        }
      });
    }, (reject) => {
      logger.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.getVolumeFunction(retryTimes - 1, res);
      });
    });
  },
  toggleMuteFunction : function(setMute, retryTimes, res) {
    if (retryTimes <= 0) {
      logger.error('Max attempt reached.');
      res.sendStatus(500);
      return;
    }

    callLgtvAPI().then(() => {
      lgtv.set_mute(setMute, (err) => {
        lgtv.disconnect(() => {
          if (!err) {
            res.sendStatus(200);
          } else {
            logger.error('Error toggleMuteFunction: ' + err);
            res.sendStatus(500);
          }
        });
      });
    }, (reject) => {
      logger.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.toggleMuteFunction(setMute, retryTimes - 1, res);
      });
    });
  },
  playFunction : function(retryTimes, res) {
    if (retryTimes <= 0) {
      logger.error('Max attempt reached.');
      res.sendStatus(500);
      return;
    }

    callLgtvAPI().then(() => {
      lgtv.input_media_play((err, response) => {
        lgtv.disconnect(() => {
          if (!err) {
            res.sendStatus(200);
          } else {
            logger.error('Error playFunction: ' + err);
            res.sendStatus(500);
          }
        });
      });
    }, (reject) => {
      logger.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.playFunction(retryTimes - 1, res);
      });
    });
  },
  pauseFunction : function(retryTimes, res) {
    if (retryTimes <= 0) {
      logger.error('Max attempt reached.');
      res.sendStatus(500);
      return;
    }

    callLgtvAPI().then(() => {
      lgtv.input_media_pause((err, response) => {
        lgtv.disconnect(() => {
          if (!err) {
            res.sendStatus(200);
          } else {
            logger.error('Error pauseFunction: ' + err);
            res.sendStatus(500);
          }
        });
      });
    }, (reject) => {
      logger.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.pauseFunction(retryTimes - 1, res);
      });
    });
  },
  stopFunction : function(retryTimes, res) {
    if (retryTimes <= 0) {
      logger.error('Max attempt reached.');
      res.sendStatus(500);
      return;
    }

    callLgtvAPI().then(() => {
      lgtv.input_media_stop((err, response) => {
        lgtv.disconnect(() => {
          if (!err) {
            res.sendStatus(200);
          } else {
            logger.error('Error stopFunction: ' + err);
            res.sendStatus(500);
          }
        });
      });
    }, (reject) => {
      logger.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.stopFunction(retryTimes - 1, res);
      });
    });
  },
  getAppListFunction : function(retryTimes, res) {
    if (retryTimes <= 0) {
      logger.error('Max attempt reached.');
      res.sendStatus(500);
      return;
    }

    callLgtvAPI().then(() => {
     lgtv.apps((err) => {
        lgtv.disconnect(() => {
          if (!err) {
            res.sendStatus(200);
          } else {
            logger.error('Error getAppListFunction: ' + err);
            res.sendStatus(500);
          }
        });
      });
    }, (reject) => {
      logger.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.getAppListFunction(retryTimes - 1, res);
      });
    });
  },
  launchYoutubeFunction : function(retryTimes, res) {
    if (retryTimes <= 0) {
      logger.error('Max attempt reached.');
      res.sendStatus(500);
      return;
    }

    callLgtvAPI().then(() => {
      lgtv.start_app('youtube.leanback.v4', (err, response) => {
        lgtv.disconnect(() => {
          if (!err) {
            res.sendStatus(200);
          } else {
            logger.error('Error launchYoutubeFunction: ' + err);
            res.sendStatus(500);
          }
        });
      });
    }, (reject) => {
      logger.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.launchYoutubeFunction(retryTimes - 1, res);
      });
    });
  },
  launchAmazonInstantVideoFunction : function(retryTimes, res) {
    if (retryTimes <= 0) {
      logger.error('Max attempt reached.');
      res.sendStatus(500);
      return;
    }

    callLgtvAPI().then(() => {
      lgtv.start_app('amazon.html', function(err, response) {
        lgtv.disconnect(() => {
          if (!err) {
            res.sendStatus(200);
          } else {
            logger.error('Error launchAmazonInstantVideoFunction: ' + err);
            res.sendStatus(500);
          }
        });
      });
    }, (reject) => {
      logger.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.launchAmazonInstantVideoFunction(retryTimes - 1, res);
      });
    });
  },
  switchToHDMI_1 : function(retryTimes, res) {
    if (retryTimes <= 0) {
      logger.error('Max attempt reached.');
      res.sendStatus(500);
      return;
    }

    callLgtvAPI().then(() => {
      lgtv.set_input('HDMI_1', (err, response) => {
        lgtv.disconnect(() => {
          if (!err) {
            res.sendStatus(200);
          } else {
            logger.error('Error switchToHDMI_1: ' + err);
            res.sendStatus(500);
          }
        });
      });
    }, (reject) => {
      logger.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.switchToHDMI_1(retryTimes - 1, res);
      });
    });
  },
  sendKey : function(key, retryTimes, res) {
    if (retryTimes <= 0) {
      logger.error('Max attempt reached.');
      res.sendStatus(500);
      return;
    }

    callLgtvAPI().then(() => {
      lgtv.sendKey(key, (err, response) => {
        lgtv.disconnect(() => {
          if (!err) {
            res.sendStatus(200);
          } else {
            logger.error('Error sendKey(' + key + '): ' + err);
            res.sendStatus(500);
          }
        });
      });
    }, (reject) => {
      logger.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.sendKey(key, retryTimes - 1, res);
      });
    });
  },
  playNext : function(retryTimes, res) {
    if (retryTimes <= 0) {
      logger.error('Max attempt reached.');
      res.sendStatus(500);
      return;
    }

    callLgtvAPI().then(() => {
      lgtv.sendKey('RIGHT', (err, response) => {
        if (!err) {
          setTimeout(() => {
            lgtv.sendKey('ok', (err, response) => {
              lgtv.disconnect(() => {
                if (!err) {
                  res.sendStatus(200);
                } else {
                  res.sendStatus(500);
                }
              });
            });
          }, timeout_ms);
        } else {
          logger.error('Error playNext: ' + err);
        }
      });
    }, (reject) => {
      logger.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.playNext(retryTimes - 1, res);
      });
    });
  },
  mediaForward : function(retryTimes, res) {
    if (retryTimes <= 0) {
      logger.error('Max attempt reached.');
      res.sendStatus(500);
      return;
    }

    callLgtvAPI().then(() => {
      lgtv.input_media_forward((err) => {
        lgtv.disconnect(() => {
          if (!err) {
            res.sendStatus(200);
          } else {
            logger.error('Error mediaForward: ' + err);
            res.sendStatus(500);
          }
        });
      });
    }, (reject) => {
      logger.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.mediaForward(retryTimes - 1, res);
      });
    });
  },
  mediaRewind : function(retryTimes, res) {
    if (retryTimes <= 0) {
      logger.error('Max attempt reached.');
      res.sendStatus(500);
      return;
    }

    callLgtvAPI().then(() => {
      lgtv.input_media_rewind((err) => {
        lgtv.disconnect(() => {
          if (!err) {
            res.sendStatus(200);
          } else {
            logger.error('Error mediaRewind: ' + err);
            res.sendStatus(500);
          }
        });
      });
    }, (reject) => {
      logger.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.mediaRewind(retryTimes - 1, res);
      });
    });
  },
  playProgressControl : function(direction, step, retryTimes, res) {
    if (retryTimes <= 0) {
      logger.error('Max attempt reached.');
      res.sendStatus(500);
      return;
    }

    const defaultStep = 1;
    if (step === '?' || step == undefined) {
      step = defaultStep;
    }

    const defaultDirection = 'MOVE';
    if (direction === '?') {
      direction = defaultDirection;
    }

    callLgtvAPI().then(() => {
      let callbackFunction = (err, response) => {
        lgtv.disconnect(() => {
          if (!err) {
            res.sendStatus(200);
          } else {
            logger.error('Error playProgressControl: ' + err);
            res.sendStatus(500);
          }
        });
      };

      const playBackDelay = 200;
      let playControlRecursive = (step, isForward, fn, err, response) => {
        if (step == 0) {
          lgtv.input_media_play((err, response) => {
            callbackFunction(err, response);
            return;
          })
        }

        if (isForward) {
          lgtv.input_media_forward((err) => {
            setTimeout(() => {
              playControlRecursive(step - 1, true, fn, err, response);
            }, playBackDelay);
          });
        } else {
          lgtv.input_media_rewind((err) => {
            setTimeout(() => {
              playControlRecursive(step - 1, false, fn, err, response);
            }, playBackDelay);
          });
        }
      };

      if (direction.toUpperCase() === 'FORWARD' || direction.toUpperCase() === 'MOVE') {
        playControlRecursive(step, true, callbackFunction);
      } else {
        playControlRecursive(step, false, callbackFunction);
      }
    }, (reject) => {
      logger.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.playProgressControl(direction, step, retryTimes - 1, res);
      });
    });
  },
  passBeginning : function(retryTimes, res) {
    if (retryTimes <= 0) {
      logger.error('Max attempt reached.');
      res.sendStatus(500);
      return;
    }

    callLgtvAPI().then(() => {
      /*
       * Each Forward function forwards 10 seconds.
       * Usually header part is ~1minute to 1minute and a half.
       */
      const rewindStep = 8;
      const forwardDelay = 200;
      let rewindCall = (rewindStep) => {
        setTimeout(() => {
          lgtv.input_media_forward((err) => {
            if (err) {
              logger.error("Error: " + err);
              return;
            }

            if (rewindStep <= 0) {
              lgtv.input_media_play((err, response) => {
                lgtv.disconnect(() => {
                  if(!err) {
                    res.sendStatus(200);
                  } else {
                    logger.error('Error passBeginning: ' + err);
                    res.sendStatus(500);
                  }
                });
              });
              return;
            }

            return rewindCall(rewindStep - 1);
          });
        }, forwardDelay);
      };

      rewindCall(rewindStep);
    }, (reject) => {
      logger.error(reject + ' Retrying');
      discover_ip(() => {
        moduleFunctions.passBeginning(retryTimes - 1, res);
      });
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
