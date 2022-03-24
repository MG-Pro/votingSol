import {task} from 'hardhat/config.js'

task('owner', "Prints owner of contract", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});
