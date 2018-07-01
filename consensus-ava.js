const sha256 = require('sha256')
const randomBytes = require('randombytes');
const crypto = require("crypto");
const eccrypto = require("eccrypto");


const maxFees = 5000
var accounts = generateAccounts(100)
var nodes = generateNodes(4, accounts)

function transactionFlood() {
  generateTransactions(50, nodes)
}

setInterval(transactionFlood, 500)
setInterval(gossip, 500)
setInterval(stats, 1000)


function stats() {
  console.log("=================================================================")
  for (var n = 0; n < nodes.length; n++) {
    var node = nodes[n]
    console.log("Node ID: "+node.hash)
    console.log("Total Time: "+node.totalTime)
    console.log("Total Transactions: "+node.totalTransactions)
    console.log("Pending Transactions: "+node.txPool.length)
    console.log("TPS: "+node.totalTransactions*60*100/node.totalTime)
  }
}

function generateNodes(total, accounts) {
  var nodes = []
  for (var i = 0; i < total; i++) {
    var node = {
      id: i,
      hash: sha256(""+i),
      stake: getRandomInt(1000),
      accounts: accounts,
      txPool: [],
      txPoolHashes: [],
      finalizedTransactions: [],
      finalizedTransactionHashes: [],
      totalTransactions: 0,
      totalTime: 0,
      startTime: new Date().getTime()
    }
    nodes.push(node)
  }
  return nodes
}

function generateAccounts(total) {
  var accounts = []
  for (var i = 0; i < total; i++) {
    const privateKey = crypto.randomBytes(32)
    const publicKey = eccrypto.getPublic(privateKey)
    var account = {
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

function generateTransactions(total, nodes) {
  for (var i = 0; i < total; i++) {
    var node = nodes[getRandomInt(nodes.length)]
    var from = node.accounts[getRandomInt(accounts.length)]
    var to = node.accounts[getRandomInt(accounts.length)]
    generateTransaction(from, to, node)
  }
}

function generateTransaction(from, to, node) {
  var transaction = {
    from: from.public,
    to: to.public,
    value: getRandomInt(from.balance),
    timestamp: new Date().getTime(),
    confidence: 0
  }
  var msg = crypto.createHash("sha256").update(JSON.stringify(transaction)).digest();
  eccrypto.sign(from.privateKey, msg).then(function(sig) {
    transaction.sig = sig.toString('hex')
    transaction.hash = crypto.createHash("sha256").update(JSON.stringify(transaction)).digest().toString('hex');
    node.txPool.push(transaction)
    node.txPoolHashes.push(transaction.hash)
  });
}

function gossip() {
  for (var n = 0; n < nodes.length; n++) {
    var node = nodes[n]
    for (var t = 0; t < node.txPool.length; t++) {
      var transaction = node.txPool.shift()
      var confidence = ask(transaction)
      if (transaction.confidence > nodes.length / 2 * 3) {
        node.totalTransactions++
        node.totalTime = new Date().getTime() - node.startTime
        node.finalizedTransactions.push(transaction)
        node.finalizedTransactionHashes.push(transaction.hash)
      } else {
        node.txPool.push(transaction)
      }
    }
  }
}

function ask(transaction) {
  var k = getRandomInt(nodes.length)
  var confidence = transaction.confidence
  for (var n = 0; n < k; n++) {
    var node = nodes[getRandomInt(nodes.length)]
    if (node.finalizedTransactionHashes.includes(transaction.hash)) {
      transaction.confidence += 2
    } else if (node.txPoolHashes.includes(transaction.hash)) {
      transaction.confidence += 1
    } else {
      transaction.confidence += 1
      node.txPool.push(transaction)
      node.txPoolHashes.push(transaction.hash)
    }
  }
  return confidence
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
