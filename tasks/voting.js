const {task} = require('hardhat/config.js')
const artifact = require('../artifacts/contracts/Voting.sol/Voting.json')
const {NG_APP_CONTRACT: CONTRACT, API_URL, PRIVATE_KEY, API_KEY} = process.env

task('createVoting', 'Create Voting')
  .addParam('candidates', 'Array of candidates')
  .addParam('privateKey', '', PRIVATE_KEY)
  .setAction(async (taskArgs, hre) => {
    const provider = hre.ethers.getDefaultProvider(API_URL, API_KEY)
    const signer = new hre.ethers.Wallet(taskArgs.privateKey, provider)
    const contract = new hre.ethers.Contract(CONTRACT, artifact.abi, signer)

    const tx = await contract.createVoting(taskArgs.candidates)
    await tx.wait()
  })

task('sendFeesToOwner', 'Take fees')
  .addParam('privateKey', '', PRIVATE_KEY)
  .setAction(async (taskArgs, hre) => {
    const provider = hre.ethers.getDefaultProvider(API_URL, API_KEY)
    const signer = new hre.ethers.Wallet(taskArgs.privateKey, provider)
    const contract = new hre.ethers.Contract(CONTRACT, artifact.abi, signer)
    await contract.sendFeesToOwner()
  })

task('getVotings', 'List of votings')
  .addParam('privateKey', '', PRIVATE_KEY)
  .setAction(async (taskArgs, hre) => {
    const provider = hre.ethers.getDefaultProvider(API_URL, API_KEY)
    const signer = new hre.ethers.Wallet(taskArgs.privateKey, provider)
    const contract = new hre.ethers.Contract(CONTRACT, artifact.abi, signer)
    const result = await contract.getVotings()
    console.log(result)
    return result
  })

task('getBalances', 'Balance')
  .addParam('privateKey', '', PRIVATE_KEY)
  .setAction(async (taskArgs, hre) => {
    const provider = hre.ethers.getDefaultProvider(API_URL, API_KEY)
    const signer = new hre.ethers.Wallet(taskArgs.privateKey, provider)
    const contract = new hre.ethers.Contract(CONTRACT, artifact.abi, signer)

    const result = await contract.getBalances()
    console.log(result)
    return result
  })

task('vote', 'Vote')
  .addParam('votingId')
  .addParam('candidate')
  .addParam('privateKey', '', PRIVATE_KEY)
  .setAction(async (taskArgs, hre) => {
    const provider = hre.ethers.getDefaultProvider(API_URL, API_KEY)
    const signer = new hre.ethers.Wallet(taskArgs.privateKey, provider)
    const contract = new hre.ethers.Contract(CONTRACT, artifact.abi, signer)
    await contract.vote(taskArgs.votingId, taskArgs.candidate)
  })

task('stopVoting', 'Stop voting')
  .addParam('votingId')
  .addParam('privateKey', '', PRIVATE_KEY)
  .setAction(async (taskArgs, hre) => {
    const provider = hre.ethers.getDefaultProvider(API_URL, API_KEY)
    const signer = new hre.ethers.Wallet(taskArgs.privateKey, provider)
    const contract = new hre.ethers.Contract(CONTRACT, artifact.abi, signer)
    await contract.stopVoting(taskArgs.votingId)
  })
