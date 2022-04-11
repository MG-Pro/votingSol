require('dotenv').config()
require('solidity-coverage')
require('@nomiclabs/hardhat-waffle')
require("hardhat-gas-reporter")
require('./tasks/voting.js')

module.exports = {
  solidity: '0.8.3',
  networks: {
    ropsten: {
      url: `https://eth-ropsten.alchemyapi.io/v2/${process.env.API_KEY}`,
      accounts:
        [process.env.PRIVATE_KEY]
    },
    hardhat: {
      chainId: 1337
    }
  },
  gasReporter: {
    enabled: !!(process.env.REPORT_GAS)
  }
}
