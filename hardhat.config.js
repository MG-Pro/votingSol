require('dotenv').config()
require('solidity-coverage')
require('@nomiclabs/hardhat-waffle')

module.exports = {
  solidity: '0.7.3',
  networks: {
    ropsten: {
      url: `https://eth-ropsten.alchemyapi.io/v2/${process.env.API_KEY}`,
      accounts:
        [process.env.PRIVATE_KEY],
    },
  },
}
