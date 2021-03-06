var PeerArray = require('./peerarray');
var Crypto    = require('./crypto');

// constants:

// Size of the space in bits
var B = 160;
// Maximum number of contacts in a k-bucket
var K = 8;
// Refresh timeout for kbuckets in milliseconds
var TIMEOUT_REFRESH = 3600 * 1000;
// Readujst the timeout refresh around a random window, in percent
var TIMEOUT_REFRESH_WINDOW = 0.1;


/**
 *
 * Represents a KBucket.
 * @constructs
 * @param  {Node|String} node - Node instance or parent node ID
 * @param  {Number} [min=0] - Min limit of this KBucket (expressed as bit position)
 * @param  {Number} [max=B] - Max limit of this KBucket (expressed as bit position)
 */
function KBucket(rt, min, max) {
  PeerArray.call(this);
  if (arguments.length > 0) {
    this._routingTable = rt;
    this._parentID     = (typeof rt.getParentID === 'function') ? rt.getParentID() : rt;
    this._min          = min || 0;
    this._max          = max || B;
    this._timeoutID    = undefined;
    this.touch();
  }
}

require('util').inherits(KBucket, PeerArray);

module.exports = KBucket;

// Public

/**
 * Add then given Peer to the KBucket
 * If the Peer is already in the KBucket, it will be updated
 *
 * @param {Peer} peer - The peer to add or update
 * @return {KBucket} self to allow chaining
 */
KBucket.prototype.addPeer = function(peer) {
  var index = this.find(peer);
  if (~index) {
    this.getPeer(index).touch();
    this.move(index, 0);
    this.touch();
  } else {
    if (!this.isFull()) {
      peer.cacheDistance(this._parentID);
      if (!this.peerInRange(peer)) {
        throw new Error(peer + ' is not in range for ' + this);
      }
      this.array.unshift(peer);
      this.touch();
    }
    else {
      if (!this.isSplittable()) {
        var oldest = this.getOldestPeer();
        if (oldest) {
          this.removePeer(oldest);
          this.addPeer(peer);
          this.touch();
        }
      } else {
        throw 'split';
      }
    }
  }
  return this;
};

/**
 * Get the latest seen Peer.
 *
 * @return {Peer}
 */
KBucket.prototype.getNewestPeer = function() {
  return this.getPeer(0);
};

/**
 * Get the least recent Peer.
 *
 * @return {Peer}
 */
KBucket.prototype.getOldestPeer = function() {
  return this.getPeer(this.size() - 1);
};

/**
 * Get all the peers from the KBucket
 *
 * @param {Integer} number - fix the number of peers to get
 * @param {Peer|Peer[]} [exclude] - the {@link Peer}s to exclude
 * @return {Array}
 */
KBucket.prototype.getPeers = function(number, exclude) {
  var clone = new PeerArray(this);
  if (exclude)
    clone = clone.difference(exclude);
  if (number > 0)
    clone = clone.first(number);
  return clone;
};

KBucket.prototype.peerInRange = function(peer) {
  return this.distanceInRange(peer.getDistance());
};

/**
 * Check wether or not the given NodeID
 * is in range of the KBucket
 *
 * @param {String} id - NodeID to check
 * @return {Boolean} true if it is in range.
 */
KBucket.prototype.idInRange = function(id) {
  return this.distanceInRange(Crypto.distance(id, this._parentID));
};

/**
 * Check wether or not a given distance is in range of the
 *
 * @param {String} distance - distance to check
 * @return {Boolean}
 */
KBucket.prototype.distanceInRange = function(distance) {
  return (this._min < distance) && (distance <= this._max);
};

/**
 * Get an `Object` with the `min` and `max` values
 * of the KBucket's range (expressed as bit position).
 *
 * @return {Object} range - range object
 * @return {Integer} range.min - minimum bit position
 * @return {Integer} renage.max - maximum bit position
 */
KBucket.prototype.getRange = function() {
  return {
    min: this._min,
    max: this._max
  };
};

/**
 * Set the range of the KBucket (expressed as bit position)
 *
 * @param {Object} range - range object
 * @param {Integer} range.min - minimum bit position
 * @param {Integer} range.max - maximum bit position
 * @return {KBucket} self to allow chaining
 */
KBucket.prototype.setRange = function(range) {
  this._min = range.min;
  this._max = range.max;
  return this;
};

/**
 * Set the range min of the KBucket (expressed as bit position)
 *
 * @param {Integer} min - minimum bit position
 * @return {KBucket} self to allow chaining
 */
KBucket.prototype.setRangeMin = function(min) {
  this._min = min;
  return this;
};

/**
 * Set the range max of the KBucket (expressed as bit position)
 *
 * @param {Integer} max - max bit position
 * @return {KBucket} self to allow chaining
 */
KBucket.prototype.setRangeMax = function(max) {
  this._max = max;
  return this;
};

/**
 * Split the KBucket range in half (higher range)
 * and return a new KBucket with the lower range
 *
 * @return {KBucket} The created KBucket
 */
KBucket.prototype.split = function() {
  var split_value = this._max - 1;

  var new_kbucket = new this.constructor(this._routingTable, this.min, split_value);
  this.setRangeMin(split_value);

  var i = this.size() - 1;
  if (i > 0) {
    var trash = [];
    for (; i >= 0; i--) {
      var peer = this.array[i];
      if (new_kbucket.peerInRange(peer)) {
        trash.push(peer);
        new_kbucket.addPeer(peer);
      }
    }
    this.remove(trash);
  }
  return new_kbucket;
};

/**
 * Check wether or not the KBucket is splittable
 *
 * @return {Boolean} true if splittable
 */
KBucket.prototype.isSplittable = function() {
  return (this._min === 0);
};

/**
 * Check wether or not the KBucket is full
 *
 * @return {Boolean} true if full
 */
KBucket.prototype.isFull = function() {
  return (this.size() == K);
};

/**
 * Initiates the refresh process
 */
KBucket.prototype.setRefreshTimeout = function() {
  this._timeoutID = setTimeout(function(self) {
    self._routingTable.emit('refresh', self);
    self.touch();
  }, (this._refreshTime - new Date().getTime()), this);
  return this;
};

/**
 * Stop refresh timeout
 */
KBucket.prototype.stopRefreshTimeout  = function() {
  if (this._timeoutID) {
    clearTimeout(this._timeoutID);
    this._timeoutID = undefined;
  }
  return this;
};

/**
 * To be called whenever the KBucket is updated
 * This function re-initiate de refresh process
 */
KBucket.prototype.touch = function() {
  // if the refreshTime is in the past (the app wasn't running)
  this._refreshTime = new Date().getTime() +
                      Math.floor(TIMEOUT_REFRESH*(1+(2*Math.random()-1)*TIMEOUT_REFRESH_WINDOW));
  return this.stopRefreshTimeout()
             .setRefreshTimeout();
};

/**
 * Represent the KBucket as a String
 *
 * @return {String} representation of the KBucket
 */
KBucket.prototype.toString = function() {
  return '<' + this._min + ':' + this._max + '><#' + this.size() + '>';
};

//
// Export
//

KBucket.prototype.exports = function(options) {
  var peers = [];

  if (options && (options.include_lastseen || options.include_distance)) {
    this.forEach(function(peer) {
      var ar = peer.getTriple();
      if (options.include_lastseen) ar.push(peer.getLastSeen());
      if (options.include_distance) ar.push(peer.getDistance());
      peers.push(ar);
    });
  } else {
    peers = this.getTripleArray();
  }

  return {
    range   : this.getRange(),
    peers   : peers,
    refresh : this._refreshTime
  };
};

KBucket.prototype.imports = function(kbucket) {
  try {
    this.setRange(kbucket.range);
    this.add(kbucket.peers);
    this._refreshTime = kbucket.refresh;
    this.stopRefreshTimeout()
        .setRefreshTimeout();
    return true;
  } catch(e) {
    return false;
  }
};
