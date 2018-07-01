const sha256 = require('sha256')
const randomBytes = require('randombytes');
const crypto = require("crypto");
const eccrypto = require("eccrypto");


const maxFees = 5000
var validatedNodes = []
var accounts = generateAccounts(100)
var nodes = generateNodes(4, accounts)

function transactionFlood() {
  generateTransactions(20, nodes)
}

setInterval(transactionFlood, 500)
setInterval(generateBlocks, 500)
setInterval(stats, 1000)


function stats() {
  console.log("=================================================================")
  for (var n = 0; n < nodes.length; n++) {
    var node = nodes[n]
    console.log("Node ID: "+node.hash)
    console.log("BlockChain Head: "+node.blockChain[node.blockChain.length-1].hash)
    var blockTime = 0
    if (node.blockChain.length > 2) {
      blockTime = node.blockChain[node.blockChain.length-1].timestamp-node.blockChain[node.blockChain.length-2].timestamp
    }
    var transactionCount = node.blockChain[node.blockChain.length-1].transactions.length
    console.log("Block Time: "+blockTime)
    node.totalTime += blockTime
    console.log("Total Time: "+node.totalTime)
    console.log("Transactions: "+transactionCount)
    node.totalTransactions += transactionCount
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
      blockChain: [{
        id: 'genesis',
        hash: 'AEEBAD4A796FCC2E15DC4C6061B45ED9B373F26ADFC798CA7D2D8CC58182718E',
        transactions: []
      }],
      accounts: accounts,
      txPool: [],
      block: {
        hash: '',
        previousHash: '',
        fees: 0,
        transactions: [],
        timestamp: ''
      },
      totalTransactions: 0,
      totalTime: 0
    }
    if (getRandomInt(2)) {
      validatedNodes.push(node.hash)
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
  var node = nodes[getRandomInt(nodes.length)]
  for (var i = 0; i < total; i++) {
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
    timestamp: new Date().getTime()
  }
  var msg = crypto.createHash("sha256").update(JSON.stringify(transaction)).digest();
  eccrypto.sign(from.privateKey, msg).then(function(sig) {
    transaction.sig = sig.toString('hex')
    transaction.hash = crypto.createHash("sha256").update(JSON.stringify(transaction)).digest().toString('hex');
    node.txPool.push(transaction)
  });
}

function generateBlocks() {
  for (var n = 0; n < nodes.length; n++) {
    var node = nodes[n]
    if (node.txPool.length > 0) {
      while (node.block.fees < maxFees && node.txPool.length > 0) {
        var transaction = node.txPool.pop()
        node.block.fees += transaction.value
        node.block.transactions.push(transaction)
      }
      if (node.block.fees >= maxFees) {
        node.block.timestamp = new Date().getTime()
        node.block.hash = crypto.createHash("sha256").update(JSON.stringify(node.block.transactions)).digest().toString('hex');
        node.block.previousHash = node.blockChain[node.blockChain.length-1].hash
        node.block.signer = node.hash

        propagateBlock(node.block)

        node.block = {
          id: '',
          hash: '',
          previousHash: '',
          fees: 0,
          transactions: [],
          timestamp: ''
        }
      }
    }
  }
}

function propagateBlock(block) {
  for (var n = 0; n < nodes.length; n++) {
    var node = nodes[n]
    if (node.blockChain[node.blockChain.length-1].hash == block.previousHash&&validatedNodes.includes(block.signer)) {
      node.blockChain.push(block)
    }
  }
}


function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
