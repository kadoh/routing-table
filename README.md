KadOH routing table
-------------------

Kademlia routing table implementation roughly extracted from [KadOH](https://github.com/jinroh/kadoh).

```bash
$ npm install kadoh-routing-table
```

### Basic use

```js
var RoutingTable = require('kadoh-routing-table');
var rootID = 'e97750256dc9fd98a1f773448af26292d7ef7e02';

// create a routing table wit rootID as root node
var table = new RoutingTable(rootID);
// will starth the timers for 'refresh'
table.start();

// instanciate a new peer with a given address and given ID
var peer = new RoutingTable.Peer('173.194.40.96', 'd5496cba6d508edb8f007e8e3325b971866b6002');

// add a peer to the routing table: inside they are sorted into KBuckets
table.addPeer(peer);

// later, if you see activity of this peer 'touch' it to know
// that it's still fresh
peer.touch();

// to get the number of Kbuckets
howManyKBuckets.howManyKBuckets();

// get 3 closest peers to the given id:
// return a PeerArray
table.getClosePeers('605f2b13d7a53d4247a1d8bd37418c974c8306e3', 3);

table.on('refresh', function(kbucket) {
  // the given kbucket is not fresh anymore
  // you should probably launch find a way to
  // get in touch with peers from this kBucket range
  kbucket.getRange()
});

// stop the routing table
table.stop();

// other internal stuff, read the code
```

### Todo
- extract iterative lookup arlgorithm implementations: [IterativeFindNode](https://github.com/jinroh/kadoh/blob/master/lib/node.js#L407-L459) and [IterativeFindValue](https://github.com/jinroh/kadoh/blob/master/lib/node.js#L461-L521) based on [eventually](https://github.com/kadoh/eventually)
- externalize "crypto" stuff: distance, ..
- rename `PeerArray` into `PeerCollection` and add lodash magic (a la BackoneCollection)
- refactor implemnetaion to be lighter
- use/learn from https://github.com/tristanls/k-bucket
- other features?
