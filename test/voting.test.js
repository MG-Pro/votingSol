const {expect} = require('chai')
const {ethers, network} = require('hardhat')

describe('Voting', function () {
  const threeDays = 60 * 60 * 24 * 3
  const oneDay = 60 * 60 * 24

  let deployer
  let user1
  let user2
  let user3
  let candidate1
  let candidate2
  let contract

  beforeEach(async () => {
    [deployer, user1, user2, candidate1, candidate2, user3] = await ethers.getSigners()
    const Voting = await ethers.getContractFactory('Voting', deployer)
    contract = await Voting.deploy()
    await contract.deployed()
  })

  it('Should return balance 0', async () => {
    expect(await contract.getBalance()).to.equal(0)
  })

  it('Should return false if not owner', async () => {
    expect(await contract.connect(user1).isOwner()).to.equal(false)
  })

  it('Should return true if owner', async () => {
    expect(await contract.connect(deployer).isOwner()).to.equal(true)
  })

  it('Vote should revert if there is not active voting', async () => {
    const req = contract.connect(user1).vote(candidate2.address, {
      value: ethers.utils.parseEther('0.01'),
    })
    await expect(req).to.revertedWith('Not active votings!')
  })

  it('Should return -1 if there is not any voting', async () => {
    expect(await contract.connect(user1).getActiveVotingId()).to.equal(0)
  })

  it('Stop vote should revert if there is not active voting', async () => {
    await expect(contract.connect(user1).stopVoting()).to.revertedWith('Not active votings!')
  })

  describe('Adding candidates', () => {
    it('Should revert if not owner', async () => {
      await expect(contract.connect(user1).addCandidate(candidate1.address)).to.reverted
    })

    it('Should add candidate if there is active voting', async () => {
      await contract.connect(deployer).addCandidate(candidate1.address)
      const [voting] = await contract.connect(deployer).getVotings()
      expect(voting.candidates[0].id).to.equal(candidate1.address)
    })

    it('Should revert if candidate was added', async () => {
      await contract.connect(deployer).addCandidate(candidate1.address)
      await expect(contract.connect(deployer).addCandidate(candidate1.address))
        .to.revertedWith('Candidate exist!')
    })
  })

  describe('Voting', () => {
    let votings
    let voting

    beforeEach(async () => {
      await contract.connect(deployer).addCandidate(candidate1.address)
      votings = await contract.connect(user1).getVotings()
      voting = votings[0]
    })

    it('Should create voting if to add first candidate', async () => {
      expect(votings.length).to.equal(1)
      expect(await contract.connect(user1).getActiveVotingId()).to.equal(1)
    })

    it('Voting should be active', async () => {
      expect(voting.isActive).to.equal(true)
    })

    it('Voting should not to have a winner', async () => {
      expect(voting.winner).to.hexEqual('0x0')
    })

    it('Voting should have one candidate', async () => {
      expect(voting.candidates[0].id).to.equal(candidate1.address)
    })

    it('Voting should have second candidates', async () => {
      await contract.connect(deployer).addCandidate(candidate2.address)
      votings = await contract.connect(user1).getVotings()
      expect(votings[0].candidates[1].id).to.equal(candidate2.address)
    })

    it('Should return active voting id if exist one', async () => {
      expect(await contract.connect(user1).getActiveVotingId()).to.equal(1)
    })

    it('Should revert if there is voting time not expired yet', async () => {
      await network.provider.send('evm_increaseTime', [oneDay])
      await network.provider.send('evm_mine')
      await expect(contract.connect(user1).stopVoting()).to.reverted
    })

    it('Should stop voting', async () => {
      await network.provider.send('evm_increaseTime', [threeDays])
      await network.provider.send('evm_mine')
      await contract.connect(user1).stopVoting()
      votings = await contract.connect(user1).getVotings()
      expect(votings[0].isActive).to.equal(false)
    })

    it('Should revert if there is voting time expired', async () => {
      await network.provider.send('evm_increaseTime', [threeDays])
      await network.provider.send('evm_mine')
      await expect(contract.connect(user1).vote(candidate1.address, {
        value: ethers.utils.parseEther('0.01'),
      })).to.reverted
    })

    it('Should set winner', async () => {
      await contract.connect(deployer).addCandidate(candidate2.address)
      await contract.connect(user1).vote(candidate2.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      await contract.connect(user2).vote(candidate1.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      await network.provider.send('evm_increaseTime', [threeDays])
      await network.provider.send('evm_mine')
      await contract.connect(user2).stopVoting()
      votings = await contract.connect(user1).getVotings()
      expect(votings[0].winner).to.hexEqual(candidate2.address)
    })

    it('Should not set winner if there are not votes', async () => {
      await contract.connect(deployer).addCandidate(candidate2.address)

      await network.provider.send('evm_increaseTime', [threeDays])
      await network.provider.send('evm_mine')
      await contract.connect(user2).stopVoting()
      votings = await contract.connect(user1).getVotings()
      expect(votings[0].winner).to.hexEqual('0x0')
    })

    it('Should send reward to winner', async () => {
      await contract.connect(deployer).addCandidate(candidate2.address)
      await contract.connect(deployer).vote(candidate2.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      await contract.connect(user1).vote(candidate2.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      await contract.connect(user2).vote(candidate2.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      await contract.connect(user3).vote(candidate2.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      const balanceBeforeStop = await contract.getBalance()
      await network.provider.send('evm_increaseTime', [threeDays])
      await network.provider.send('evm_mine')
      const tx = await contract.connect(user2).stopVoting()
      await tx.wait()
      const balanceAfterStop = await contract.getBalance()
      const winnerReward = balanceBeforeStop.div(100).mul(90)

      expect(balanceAfterStop).to.equal(balanceBeforeStop.sub(winnerReward))
    })

    it('Should revert if fund not equal 0.01', async () => {
      await contract.connect(deployer).addCandidate(candidate2.address)
      const req = contract.connect(user1).vote(candidate2.address, {
        value: ethers.utils.parseEther('0.015'),
      })

      await expect(req).to.reverted
    })

    it('Should revert if user already voted', async () => {
      await contract.connect(user1).vote(candidate1.address, {
        value: ethers.utils.parseEther('0.01'),
      })

      const req = contract.connect(user1).vote(candidate1.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      await expect(req).to.reverted
    })

    it('Should add vote to candidate', async () => {
      await contract.connect(user1).vote(candidate1.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      const [voting] = await contract.connect(user1).getVotings()
      await expect(voting.candidates[0].votes).to.equal(1)
    })

    it('Should revert if candidate do not exist', async () => {
      const req = contract.connect(user1).vote(candidate2.address, {
        value: ethers.utils.parseEther('0.01'),
      })

      await expect(req).to.reverted
    })

    it('Balance should be 0.01 after first vote', async () => {
      await contract.connect(user1).vote(candidate1.address, {
        value: ethers.utils.parseEther('0.01'),
      })

      expect(await contract.getBalance()).to.equal(ethers.utils.parseEther('0.01'))
    })

    it('Should send fee to owner', async () => {
      await contract.connect(deployer).addCandidate(candidate2.address)

      await contract.connect(deployer).vote(candidate2.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      await contract.connect(user1).vote(candidate2.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      await contract.connect(user2).vote(candidate2.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      await contract.connect(user3).vote(candidate2.address, {
        value: ethers.utils.parseEther('0.01'),
      })

      await network.provider.send('evm_increaseTime', [threeDays])
      await network.provider.send('evm_mine')
      const tx = await contract.connect(user2).stopVoting()
      await tx.wait()

      await contract.connect(deployer).sendFeeToOwner()

      expect(await contract.getBalance()).to.equal(0)
    })

    it('Should revert if fee send not owner', async () => {
      await expect(contract.connect(user1).sendFeeToOwner()).to.reverted
    })

    it('Should revert if voting not expired', async () => {
      await expect(contract.connect(deployer).sendFeeToOwner()).to.revertedWith('Voting is active. Wait!')
    })

    it('Should return -1 if there is not active voting', async () => {
      await contract.connect(deployer).addCandidate(candidate2.address)
      await contract.connect(user1).vote(candidate2.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      await contract.connect(user2).vote(candidate1.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      await network.provider.send('evm_increaseTime', [threeDays])
      await network.provider.send('evm_mine')
      await contract.connect(user2).stopVoting()
      votings = await contract.connect(user1).getVotings()
      expect(await contract.connect(user1).getActiveVotingId()).to.equal(0)
    })
  })
})
