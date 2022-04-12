const {task} = require('hardhat/config.js')
const artifact = require('../artifacts/contracts/Voting.sol/Voting.json')
const {CONTRACT, API_URL, PRIVATE_KEY, API_KEY} = process.env

task('addCandidate', 'Add candidate')
  .addParam('candidate')
  .addParam('privateKey', '', PRIVATE_KEY)
  .setAction(async (taskArgs, hre) => {
    const provider = hre.ethers.getDefaultProvider(API_URL, API_KEY)
    const signer = new hre.ethers.Wallet(taskArgs.privateKey, provider)
    const contract = new hre.ethers.Contract(CONTRACT, artifact.abi, signer)

    const tx = await contract.addCandidate(taskArgs.candidate)
    await tx.wait()
  })

task('sendFeeToOwner', 'Take fee')
  .addParam('privateKey', '', PRIVATE_KEY)
  .setAction(async (taskArgs, hre) => {
    const provider = hre.ethers.getDefaultProvider(API_URL, API_KEY)
    const signer = new hre.ethers.Wallet(taskArgs.privateKey, provider)
    const contract = new hre.ethers.Contract(CONTRACT, artifact.abi, signer)
    await contract.sendFeeToOwner()
  })

task('getVotings', 'List of votings')
  .addParam('privateKey', '', PRIVATE_KEY)
  .setAction(async (taskArgs, hre) => {
    const provider = hre.ethers.getDefaultProvider(API_URL, API_KEY)
    const signer = new hre.ethers.Wallet(taskArgs.privateKey, provider)
    const contract = new hre.ethers.Contract(CONTRACT, artifact.abi, signer)
    const result = await contract.getVotings()
    console.log(result)
  })

task('getBalance', 'Balance')
  .addParam('privateKey', '', PRIVATE_KEY)
  .setAction(async (taskArgs, hre) => {
    const provider = hre.ethers.getDefaultProvider(API_URL, API_KEY)
    const signer = new hre.ethers.Wallet(taskArgs.privateKey, provider)
    const contract = new hre.ethers.Contract(CONTRACT, artifact.abi, signer)

    const result = await contract.getBalance()
    console.log(result)
  })

task('getActiveVotingId', 'Active Voting Id')
  .addParam('privateKey', '', PRIVATE_KEY)
  .setAction(async (taskArgs, hre) => {
    const provider = hre.ethers.getDefaultProvider(API_URL, API_KEY)
    const signer = new hre.ethers.Wallet(taskArgs.privateKey, provider)
    const contract = new hre.ethers.Contract(CONTRACT, artifact.abi, signer)
    const result = await contract.getActiveVotingId()
    console.log(result)
  })

task('vote', 'Vote')
  .addParam('candidate')
  .addParam('privateKey', '', PRIVATE_KEY)
  .setAction(async (taskArgs, hre) => {
    const provider = hre.ethers.getDefaultProvider(API_URL, API_KEY)
    const signer = new hre.ethers.Wallet(taskArgs.privateKey, provider)
    const contract = new hre.ethers.Contract(CONTRACT, artifact.abi, signer)
    await contract.vote(taskArgs.candidate)
  })

task('stopVoting', 'Stop voting')
  .addParam('privateKey', '', PRIVATE_KEY)
  .setAction(async (taskArgs, hre) => {
    const provider = hre.ethers.getDefaultProvider(API_URL, API_KEY)
    const signer = new hre.ethers.Wallet(taskArgs.privateKey, provider)
    const contract = new hre.ethers.Contract(CONTRACT, artifact.abi, signer)
    await contract.stopVoting()
  })
