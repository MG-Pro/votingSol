const {task} = require('hardhat/config.js')
const artifact = require('../artifacts/contracts/Voting.sol/Voting.json')
const contractAddr = process.env.CONTRACT

task('addCandidate', 'Add candidate')
  .addParam('candidate')
  .setAction(async (taskArgs, hre) => {
    const [owner] = await hre.ethers.getSigners()
    const contract = new hre.ethers.Contract(contractAddr, artifact.abi, owner)

    const tx = await contract.addCandidate(taskArgs.candidate)
    await tx.wait()
  })

task('sendFeeToOwner', 'Take fee')
  .setAction(async (taskArgs, hre) => {
    const [owner] = await hre.ethers.getSigners()
    const contract = new hre.ethers.Contract(contractAddr, artifact.abi, owner)
    await contract.sendFeeToOwner()
  })

task('getVotings', 'List of votings')
  .setAction(async (taskArgs, hre) => {
    const [owner] = await hre.ethers.getSigners()
    const contract = new hre.ethers.Contract(contractAddr, artifact.abi, owner)
    const result = await contract.getVotings()
    console.log(result)
  })

task('getCandidateByAddress', 'Candidate data')
  .addParam('candidate')
  .setAction(async (taskArgs, hre) => {
    const [owner] = await hre.ethers.getSigners()
    const contract = new hre.ethers.Contract(contractAddr, artifact.abi, owner)
    const result = await contract.getCandidateByAddress(taskArgs.candidate)
    console.log(result)
  })

task('getBalance', 'Balance')
  .setAction(async (taskArgs, hre) => {
    const [owner] = await hre.ethers.getSigners()
    const contract = new hre.ethers.Contract(contractAddr, artifact.abi, owner)
    const result = await contract.getBalance()
    console.log(result)
  })

task('getActiveVotingId', 'Active Voting Id')
  .setAction(async (taskArgs, hre) => {
    const [owner] = await hre.ethers.getSigners()
    const contract = new hre.ethers.Contract(contractAddr, artifact.abi, owner)
    const result = await contract.getActiveVotingId()
    console.log(result)
  })

task('vote', 'Vote')
  .addParam('candidate')
  .setAction(async (taskArgs, hre) => {
    const [owner] = await hre.ethers.getSigners()
    const contract = new hre.ethers.Contract(contractAddr, artifact.abi, owner)
    await contract.vote(taskArgs.candidate)
  })

task('stopVoting', 'Stop voting')
  .setAction(async (taskArgs, hre) => {
    const [owner] = await hre.ethers.getSigners()
    const contract = new hre.ethers.Contract(contractAddr, artifact.abi, owner)
    await contract.stopVoting()
  })
