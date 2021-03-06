var Peer = require('./peer');

function PeerArray(peers) {
  this.array = [];
  if (peers) {
    this.add(peers);
  }
}

module.exports = PeerArray;

//
// Mutator methods
//

PeerArray.prototype.add = function(peers) {
  var that = this;
  peers.forEach(function(peer) {
    that.addPeer(peer);
  });
  return this;
};

PeerArray.prototype.addPeer = function(peer) {
  peer = (peer instanceof Peer) ? peer : new Peer(peer);
  if (!this.contains(peer)) {
    this.array.push(peer);
  }
  return this;
};

PeerArray.prototype.remove = function(rmPeers) {
  this.array = this.array.filter(function(peer) {
    return rmPeers.every(function(rmPeer) {
      return !(rmPeer.equals(peer));
    });
  });
  return this;
};

PeerArray.prototype.removePeer = function (rmPeer) {
  var index = this.find(rmPeer);
  if (~index)
    this.array.splice(index, 1);

  return this;
};

PeerArray.prototype.move = function(oldIndex, newIndex) {
  if (newIndex < 0 || newIndex >= this.size())
    throw new RangeError('new index out of range');

  this.array.splice(newIndex, 0, this.array.splice(oldIndex, 1)[0]);
  return this;
};

PeerArray.prototype.sort = function(compareFn) {
  this.array.sort(compareFn);
  return this;
};

//
// Accessor Methods
//

PeerArray.prototype.toArray = function() {
  return this.array;
};

PeerArray.prototype.getTripleArray = function() {
  return this.array.map(function(peer) {
    return peer.getTriple();
  });
};

PeerArray.prototype.getPeer = function(index) {
  if (index instanceof Peer) {
    index = this.find(index);
    if (index === -1)
      throw new ReferenceError('this peer does not exist');
  } else {
    if (index < 0 || index >= this.size())
      throw new RangeError(index + ' out of range');
  }
  return this.array[index];
};

PeerArray.prototype.size = function() {
  return this.array.length;
};

PeerArray.prototype.find = function(peer) {
  var i = this.array.indexOf(peer);
  if (~i) {
    return i;
  } else {
    var l = this.size();
    for (i = 0; i < l; i++)
      if (peer.equals(this.array[i]))
        return i;
  }
  return -1;
};

PeerArray.prototype.contains = function(sample) {
  if (sample instanceof Peer) {
    return (this.find(sample) !== -1);
  }

  var that = this;
  return sample.every(function(samplePeer) {
    return that.array.some(function(peer) {
      return peer.equals(samplePeer);
    });
  });
};

PeerArray.prototype.equals = function(peers) {
  peers = (peers instanceof PeerArray) ? peers : (new PeerArray(peers));
  return this.contains(peers) && peers.contains(this);
};

PeerArray.prototype.empty = function() {
  return this.array.length === 0;
};

PeerArray.prototype.join = function(separator) {
  return this.array.join(separator);
};

PeerArray.prototype.clone = function(array) {
  if (array || array === null) {
    var clone = new this.constructor();
    clone.array = array || [];
    for (var prop in this) {
      if (this.hasOwnProperty(prop) && !Array.isArray(this[prop]))
        clone[prop] = this[prop];
    }
    return clone;
  } else {
    return this.clone(this.array.slice());
  }
};

PeerArray.prototype.union = function(peers) {
  return this.clone().add(peers);
};

PeerArray.prototype.difference = function(peers) {
  var clone = this.clone();
  if (peers instanceof Peer) {
    clone.removePeer(peers);
  } else {
    clone.remove(peers);
  }
  return clone;
};

PeerArray.prototype.first = function(number, iterator) {
  if (!number) {
    number = 1;
  } else if (typeof number === 'function') {
    iterator = number;
    number = 1;
  }

  if (iterator) {
    var clone = this.clone(null),
        i = 0, r = 0, l = this.size();
    while (r < number && i < l) {
      if (iterator.call(null, this.array[i]) === true) {
        clone.addPeer(this.array[i]);
        r++;
      }
      i++;
    }
    return clone;
  } else {
    return this.clone(this.array.slice(0, number));
  }
};

//
// Iteration methods
//

PeerArray.prototype.forEach = function(iterator, context) {
  this.array.forEach(iterator, context);
  return this;
};

PeerArray.prototype.map = function(iterator, context) {
  return this.array.map(iterator, context);
};

PeerArray.prototype.reduce = function(iterator, context) {
  return this.array.reduce(iterator, context);
};

PeerArray.prototype.filter = function(iterator, context) {
  return this.clone(this.array.filter(iterator, context));
};

PeerArray.prototype.some = function(iterator, context) {
  return this.array.some(iterator, context);
};

PeerArray.prototype.every = function(iterator, context) {
  return this.array.every(iterator, context);
};

// -- DEPRECATED --
PeerArray.prototype.sendThemFindRPC = function(iter_lookup) {
  iter_lookup.sendFindRPC(this);
  return this;
};
