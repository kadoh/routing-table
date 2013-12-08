var Crypto  = require('./crypto');

// ID validator: B/4 hexadecimal characters
var REGEX_NODE_ID = /^[0-9a-fA-F]{40}$/;


/**
 * Peer constructor
 *
 * @param {String|Array} address Address of the Peer or tuple representation
 * @param {String}       id      ID of the Peer
 */
function Peer() {
  var args  = arguments;

  if (Array.isArray(args[0])) {
    args  = args[0];
  }

  this.touch();
  this._distance = null;
  this._address  = args[0];
  this._id       = args[1];

  if (!this._validateID(this._id)) {
    throw new Error('non valid ID');
  }
}

module.exports = Peer;

//
// Public
//

Peer.prototype.touch = function() {
  this._lastSeen = new Date().getTime();
  return this;
};

Peer.prototype.setID = function(id) {
  this._id = id;
};

Peer.prototype.setAddress = function(address) {
  this._address = address;
};

Peer.prototype.getLastSeen = function() {
  return this._lastSeen;
};

Peer.prototype.getID = function() {
  return this._id;
};

Peer.prototype.cacheDistance = function(id) {
  this._distance = this._distance || this.getDistanceTo(id);
  return this;
};

Peer.prototype.getDistance = function() {
  return this._distance;
};

Peer.prototype.getDistanceTo = function(id) {
   return Crypto.distance(this.getID(), id);
};

Peer.prototype.getAddress = function() {
  return this._address;
};

Peer.prototype.getTriple = function() {
  return [this._address, this._id];
};

Peer.prototype.equals = function(peer) {
  return (this._id === peer.getID());
};

Peer.prototype.toString = function() {
  return '<' + this._address + '#' + this._id + '>';
};

//
// Private
//

Peer.prototype._validateID = function(id) {
  return typeof id === 'string' && REGEX_NODE_ID.test(id);
};

Peer.prototype._generateID = function() {
  //return globals.DIGEST(this._address);
  return Crypto.digest.randomSHA1();
};
