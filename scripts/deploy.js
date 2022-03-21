const hre = require('hardhat')

async function main() {
  const [deployer] = await ethers.getSigners()

  console.log('Deploying contracts with the account:', deployer.address)

  console.log('Account balance:', (await deployer.getBalance()).toString())

  const Greeter = await hre.ethers.getContractFactory('Greeter')
  const greeter = await Greeter.deploy('Hello, Hardhat!')

  await greeter.deployed()

  console.log('Greeter deployed to:', greeter.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
