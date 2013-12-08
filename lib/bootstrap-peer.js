var Peer = require('./peer');


function BootstrapPeer() {
  var args  = arguments;

  if (Array.isArray(args[0])) {
    args  = args[0];
  }

  this.touch();
  this._distance = null;
  this._address  = args[0];
  this._id       = null;
}

require('util').inherits(BootstrapPeer, Peer);

module.exports = BootstrapPeer;
