const hre = require('hardhat')

async function main() {
  const [deployer] = await ethers.getSigners()

  console.log('Deploying contracts with the account:', deployer.address)

  console.log('Account balance:', (await deployer.getBalance()).toString())

  const Voting = await hre.ethers.getContractFactory('Voting')
  const voting = await Voting.deploy()

  await voting.deployed()

  console.log('Contract deployed to:', voting.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
