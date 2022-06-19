const {task} = require('hardhat/config.js')
const {NG_APP_CONTRACT: CONTRACT, API_URL, PRIVATE_KEY, API_KEY} = process.env

task('createVoting', 'Create Voting')
  .addParam('candidates', 'Array of candidates')
  .addParam('privateKey', '', PRIVATE_KEY)
  .setAction(async (taskArgs, hre) => {
    const provider = hre.ethers.getDefaultProvider(API_URL, API_KEY)
    const signer = new hre.ethers.Wallet(taskArgs.privateKey, provider)
    const contract = await hre.ethers.getContractAt('Voting', CONTRACT, signer)
    const tx = await contract.createVoting(taskArgs.candidates)
    await tx.wait()
  })

task('sendFeesToOwner', 'Take fees')
  .addParam('privateKey', '', PRIVATE_KEY)
  .setAction(async (taskArgs, hre) => {
    const provider = hre.ethers.getDefaultProvider(API_URL, API_KEY)
    const signer = new hre.ethers.Wallet(taskArgs.privateKey, provider)
    const contract = await hre.ethers.getContractAt('Voting', CONTRACT, signer)
    await contract.sendFeesToOwner()
  })

task('getVotings', 'List of votings')
  .addParam('privateKey', '', PRIVATE_KEY)
  .setAction(async (taskArgs, hre) => {
    const provider = hre.ethers.getDefaultProvider(API_URL, API_KEY)
    const signer = new hre.ethers.Wallet(taskArgs.privateKey, provider)
    const contract = await hre.ethers.getContractAt('Voting', CONTRACT, signer)
    return await contract.getVotings()
  })

task('getBalances', 'Balance')
  .addParam('privateKey', '', PRIVATE_KEY)
  .setAction(async (taskArgs, hre) => {
    const provider = hre.ethers.getDefaultProvider(API_URL, API_KEY)
    const signer = new hre.ethers.Wallet(taskArgs.privateKey, provider)
    const contract = await hre.ethers.getContractAt('Voting', CONTRACT, signer)
    return await contract.getBalances()
  })

task('vote', 'Vote')
  .addParam('votingId')
  .addParam('candidate')
  .addParam('privateKey', '', PRIVATE_KEY)
  .setAction(async (taskArgs, hre) => {
    const provider = hre.ethers.getDefaultProvider(API_URL, API_KEY)
    const signer = new hre.ethers.Wallet(taskArgs.privateKey, provider)
    const contract = await hre.ethers.getContractAt('Voting', CONTRACT, signer)
    await contract.vote(taskArgs.votingId, taskArgs.candidate)
  })

task('stopVoting', 'Stop voting')
  .addParam('votingId')
  .addParam('privateKey', '', PRIVATE_KEY)
  .setAction(async (taskArgs, hre) => {
    const provider = hre.ethers.getDefaultProvider(API_URL, API_KEY)
    const signer = new hre.ethers.Wallet(taskArgs.privateKey, provider)
    const contract = await hre.ethers.getContractAt('Voting', CONTRACT, signer)
    await contract.stopVoting(taskArgs.votingId)
  })
