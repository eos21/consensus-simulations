# consensus-simulations

Objective: Comparison of Consensus protocols

Disclaimer: This is meant to be a comparative benchmark of similar implementations, this is not a comment on specific implementations of consensus algorithms.

Constraints;

- No adversarial targets
- Perfect network
- Transaction backlog near empty
- No transaction validation

Parameters;

- Throughput
- Time To Finality (TTF)
- Data size
- Network awareness
- Generalized setup;

- 100 active balance accounts

```
generateAccounts(total) {
  accounts = []
  for (i = 0; i < total; i++) {
    privateKey = crypto.randomBytes(32)
    publicKey = eccrypto.getPublic(privateKey)
    account = {
      // A new random 32-byte private key.
      privateKey: privateKey,
      // Corresponding uncompressed (65-byte) public key.
      publicKey: publicKey,
      public: publicKey.toString('hex'),
      balance: 1000
    }
    accounts.push(account)
  }
  return accounts
}
```

- 4 node participants (different implementation for each iteration)

```
generateNodes(total, accounts) {
  nodes = []
  for (i = 0; i < total; i++) {
    node = {
      id: i,
      hash: sha256(i),
      stake: getRandomInt(1000),
      accounts: accounts,
      txPool: [],
      txPoolHashes: [], //Avalanche
      finalizedTransactions: [], //Avalance, EC
      finalizedTransactionHashes: [], //Avalance
      totalTransactions: 0, //Avalance, EC
      totalTime: 0,
      startTime: new Date().getTime() //Avalance, EC
    }
    nodes.push(node)
  }
  return nodes
}
```

- 50 new transactions randomly assigned to nodes every 500 miliseconds

```
generateTransaction(from, to, node) {
  transaction = {
    from: from.public,
    to: to.public,
    value: getRandomInt(from.balance),
    timestamp: new Date().getTime(),
    confidence: 0 //Avalance
  }
  var msg = crypto.createHash("sha256").update(JSON.stringify(transaction)).digest();
  eccrypto.sign(from.privateKey, msg).then(function(sig) {
    transaction.sig = sig.toString('hex')
    transaction.hash = crypto.createHash("sha256").update(JSON.stringify(transaction)).digest().toString('hex');
    node.txPool.push(transaction)
    node.txPoolHashes.push(transaction.hash)
  });
}
```

#Proof of Work

Constraints;

- 1 second block times
- Maximum 5000 total block value

Observations;

- Averaged ~60 Transactions Per Second
- No finality, longest chain ~3 minutes
- 3.975 KB / transaction
- Full awareness not required

Comments;

- Transaction backlog increasing

#Proof of Authority

Constraints;

- Randomly genesis assigned validators
- 5000 total block value

Observations;

- 1/4 validators ~90 TPS, 2/4 validators ~120, 3/4 validators ~180
- No finality, longest chain ~1 minute
- 1.887 KB / transaction
- Validator only awareness required

Comments;

- Direct correlation between validator / nodes, the higher the validator ratio the higher the throughput

#Proof of Stake

Constraints;

- Classical implementation
- Stake only contribution
- 5000 total block value

Observations;

- ~400 TPS
- Finality after ~1 second
- 3.652 KB / transaction
- Full network awareness required (with this implementation)

#Avalanche

Constraints;

- n & k randomly selected each meta test
- Confidence 1 assigned for existing transaction pool, 2 assigned for finalization
- Confidence 2/3 nodes required

Observations;

- ~500 TPS
- Finality after ~1 second
- 1.196 KB / transaction
- Partial network awareness required

#Eventual Consistency

Constraints;

- Stake only contribution

Observations;

- ~900 TPS
- Finality after ~1 second
- 0.927 KB / transaction
- Full network awareness required

#Results

While we are happy with the throughput of EC, it suffers the same problems of other gossip based implementations, in that it needs full network awareness. Our Avalanche test showed slightly less throughput, but a considerably higher decentralization score.

We will use the latest research available to reincorporate into our design, we believe a similar gossip based function of n/k such as Avalanche combined with the Eventual Consistency Consensus will be able to give us the right mix of throughput and decentralization.
