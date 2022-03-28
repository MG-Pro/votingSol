const {expect} = require('chai')
const {ethers} = require('hardhat')
const hre = require('hardhat')

describe('Voting', function () {
  it('Should return balance', async function () {
    const Voting = await hre.ethers.getContractFactory('Voting')
    const voting = await Voting.deploy()
    await voting.deployed()

    // expect(await greeter.greet()).to.equal("Hello, world!");
    //
    // const setGreetingTx = await greeter.setGreeting("Hola, mundo!");
    //
    // // wait until the transaction is mined
    // await setGreetingTx.wait();

    // expect(await greeter.greet()).to.equal("Hola, mundo!");
  })
})
