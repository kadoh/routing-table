var chai = require('chai'),
    expect = chai.expect;

chai.use(require('./helpers/chai-sorted'));

describe('KBucket', function() {
  var KBucket = require('../lib/kbucket'),
      Peer = require('../lib/peer'),
      PeerArray = require('../lib/peerarray'),
      crypto = require('../lib/crypto');

  var rID = crypto.digest.randomSHA1,
      SHA1 = crypto.digest.SHA1,
      min = 0,
      max = 160,
      address = 'foo@bar', id = rID(), kbucket,
      K = 8;

  beforeEach(function() {
    kbucket = new KBucket(id, min, max);
  });

  afterEach(function() {
      kbucket.stopRefreshTimeout();
  });

  it('should be a function', function() {
    expect(KBucket).to.be.a('function');
    expect(kbucket instanceof PeerArray).to.be.true;
  });

  describe('When I instanciate a new KBucket', function() {

    it('should be empty, from 1 to _B with the right parent id', function() {
      expect(kbucket.size()).to.equal(0);

      expect(kbucket.getRange().min).to.equal(0);
      expect(kbucket.getRange().max).to.equal(160);

      expect(kbucket._parentID).to.equal(id);
    });

    it('should have a new peer when i add one', function() {
      kbucket.addPeer(new Peer('127.0.0.1:1234', rID()));

      expect(kbucket.size()).to.equal(1);
    });

    it('should be empty when i add and remove a peer', function() {
      var peer = new Peer('127.0.0.1:1234', rID());
      kbucket.addPeer(peer);
      kbucket.removePeer(peer);

      expect(kbucket.size()).to.equal(0);
    });

    it('should update a peer if i add an already existing one', function() {
      var peer1 = new Peer('127.0.0.1:1234', rID());
      var peer2 = new Peer('127.0.0.1:4321', rID());
      kbucket.addPeer(peer1);
      kbucket.addPeer(peer2);

      expect(kbucket.getNewestPeer()).to.equal(peer2);

      kbucket.addPeer(peer1);
      expect(kbucket.getNewestPeer()).to.equal(peer1);
    });

    it('should be possible to retrieve a certain number of peers from it', function() {
      for (var i=0; i < K; i++) {
        kbucket.addPeer(new Peer('127.0.0.1:' + (1025+i), rID()));
      }
      expect(kbucket.getPeers().size()).to.equal(K);
      expect(kbucket.getPeers(3).size()).to.equal(3);
      expect(kbucket.getPeers(K).map(function(peer) {
        return peer.getAddress().split(':')[1];
      })).to.be.sorted(function(a,b) {
        return b-a;
      });
    });

    it('should exclude certain peers', function() {
      var exclude;
      for (var i=0; i < K; i++) {
        var peer = new Peer('127.0.0.1:' + (1025+i), rID());
        kbucket.addPeer(peer);
        if (i === 1) {
          exclude = [peer];
        }
      }
      expect(kbucket.getPeers(4, exclude).contains(exclude)).to.be.false;
      expect(kbucket.getPeers(4, exclude).size()).to.equal(4);
    });

    it('should return an empty PeerArray when empty', function() {
      expect(kbucket.getPeers(3, [new Peer(address, rID())])).to.deep.equal(new PeerArray());
    });
  });

  describe('When I have a full KBucket', function() {

    it('should not be able to add a new peer', function() {
      for (var i=0; i < K; i++) {
        kbucket.addPeer(new Peer('127.0.0.1:' + (1025+i), rID()));
      }
      expect(function() { kbucket.addPeer(new Peer('127.0.0.1:2000', rID())); }).to.throw('split');
    });

  });

  describe('When I want to split the KBucket', function() {

    var old_range, new_kbucket;

    beforeEach(function() {
      old_range = kbucket.getRange();
      new_kbucket = kbucket.split();
    });

    afterEach(function() {
      new_kbucket.stopRefreshTimeout();
    });

    it('should return me a new kbucket with the right range', function() {
      expect(new_kbucket.getRange().min).to.equal(0);
      expect(new_kbucket.getRange().max).to.equal(kbucket.getRange().min);
    });

    it('should change the KBucket\'s range min', function() {
      expect(kbucket.getRange().max).to.equal(old_range.max);
      expect(kbucket.getRange().min).to.equal(old_range.max - 1);
    });

  });
});
