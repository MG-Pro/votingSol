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
  let candidate3
  let candidate4
  let candidate5
  let candidate6
  let candidate7
  let contract

  beforeEach(async () => {
    [deployer, user1, user2, user3, candidate1, candidate2, candidate3, candidate4, candidate5, candidate6, candidate7] = await ethers.getSigners()
    const Voting = await ethers.getContractFactory('Voting', deployer)
    contract = await Voting.deploy()
    await contract.deployed()
  })

  it('Should return contract balances 0', async () => {
    const balances = await contract.getBalances()
    expect((balances[0])).to.equal(0)
    expect((balances[1])).to.equal(0)
  })

  it('Should return false if not owner', async () => {
    expect(await contract.connect(user1).isOwner()).to.equal(false)
  })

  it('Should return true if owner', async () => {
    expect(await contract.connect(deployer).isOwner()).to.equal(true)
  })

  it('Vote should revert if there is not active voting', async () => {
    const req = contract.connect(user1).vote(1, candidate2.address, {
      value: ethers.utils.parseEther('0.01'),
    })
    await expect(req).to.revertedWith('Voting does not active!')
  })

  it('Stop vote should revert if voting does not active', async () => {
    await expect(contract.connect(user1).stopVoting(1)).to.revertedWith('Voting does not active!')
  })

  it('Should revert empty array if there are not votings', async () => {
    const votings = await contract.connect(user1).getVotings()
    expect(votings.length).to.equal(0)
  })

  it('Should revert if not owner', async () => {
    await expect(contract.connect(user1).createVoting([candidate1.address])).to.revertedWith('Only for owner')
  })

  it('Should revert if send two the same candidates', async () => {
    await expect(
      contract.connect(deployer).createVoting([candidate1.address, candidate1.address]),
    ).to.revertedWith('Candidate duplicated!')
  })

  describe('Voting actions', () => {
    let candidates
    let votings
    let voting

    beforeEach(async () => {
      candidates = [
        candidate1.address,
        candidate2.address,
        candidate3.address,
        candidate4.address,
        candidate5.address,
        candidate6.address,
      ]

      await contract.connect(deployer).createVoting(candidates)
      votings = await contract.connect(user1).getVotings()
      voting = votings[0]
    })

    it('Should return voting with candidates by id', async () => {
      const voting = await contract.connect(user1).getVotingById(1)
      expect(voting.candidates.length).to.equal(candidates.length)
    })

    it('Should revert if there isn`t voting', async () => {

      await expect(contract.connect(user1).getVotingById(0))
        .to.revertedWith('There is not voting')

      await expect(contract.connect(user1).getVotingById(2))
        .to.revertedWith('There is not voting')
    })


    it('Should create voting with candidates', async () => {
      expect(votings.length).to.equal(1)
      expect(voting.candidates.length).to.equal(candidates.length)
    })

    it('Voting should be active', async () => {
      expect(voting.isActive).to.equal(true)
    })

    it('Voting should not to have a winner', async () => {
      expect(voting.winner).to.hexEqual('0x0')
    })

    it('Voting should have second candidates', async () => {
      expect(votings[0].candidates[1].id).to.equal(candidate2.address)
    })

    it('Should revert if there is voting time not expired yet', async () => {
      await network.provider.send('evm_increaseTime', [oneDay])
      await network.provider.send('evm_mine')
      await expect(contract.connect(user1).stopVoting(voting.id)).to.revertedWith('Voting time not expired')
    })

    it('Should stop voting', async () => {
      await network.provider.send('evm_increaseTime', [threeDays])
      await network.provider.send('evm_mine')
      await contract.connect(user1).stopVoting(voting.id)
      votings = await contract.connect(user1).getVotings()
      expect(votings[0].isActive).to.equal(false)
    })

    it('Should revert if there is voting time expired', async () => {
      await network.provider.send('evm_increaseTime', [threeDays])
      await network.provider.send('evm_mine')
      await expect(contract.connect(user1).vote(voting.id, candidate1.address, {
        value: ethers.utils.parseEther('0.01'),
      })).to.revertedWith('Voting time expired!')
    })

    it('Should set winner', async () => {
      await contract.connect(user1).vote(voting.id, candidate2.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      await contract.connect(user2).vote(voting.id, candidate1.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      await contract.connect(user3).vote(voting.id, candidate1.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      await network.provider.send('evm_increaseTime', [threeDays])
      await network.provider.send('evm_mine')
      await contract.connect(user2).stopVoting(voting.id)
      votings = await contract.connect(user1).getVotings()
      expect(votings[0].winner).to.hexEqual(candidate1.address)
    })

    it('Should not set winner if there are not votes', async () => {
      await network.provider.send('evm_increaseTime', [threeDays])
      await network.provider.send('evm_mine')
      await contract.connect(user2).stopVoting(voting.id)
      votings = await contract.connect(user1).getVotings()
      expect(votings[0].winner).to.hexEqual('0x0')
    })

    it('Should send reward to winner', async () => {
      await contract.connect(deployer).vote(voting.id, candidate2.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      await contract.connect(user1).vote(voting.id, candidate2.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      await contract.connect(user2).vote(voting.id, candidate2.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      await contract.connect(user3).vote(voting.id, candidate2.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      const [balanceBeforeStop] = await contract.getBalances()
      await network.provider.send('evm_increaseTime', [threeDays])
      await network.provider.send('evm_mine')
      const tx = await contract.connect(user2).stopVoting(voting.id)
      await tx.wait()
      const [balanceAfterStop] = await contract.getBalances()
      const winnerReward = balanceBeforeStop.div(100).mul(90)

      expect(balanceAfterStop).to.equal(balanceBeforeStop.sub(winnerReward))
    })

    it('Should revert if fund not equal 0.01', async () => {
      const req = contract.connect(user1).vote(voting.id, candidate2.address, {
        value: ethers.utils.parseEther('0.015'),
      })

      await expect(req).to.revertedWith('Pay 0.01 eth')
    })

    it('Should revert if user already voted', async () => {
      await contract.connect(user1).vote(voting.id, candidate1.address, {
        value: ethers.utils.parseEther('0.01'),
      })

      const req = contract.connect(user1).vote(voting.id, candidate1.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      await expect(req).to.revertedWith('Already voted!')
    })

    it('Should add votes to candidate', async () => {
      await contract.connect(user1).vote(voting.id, candidate1.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      await contract.connect(user2).vote(voting.id, candidate1.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      const [voting1] = await contract.connect(user1).getVotings()
      await expect(voting1.candidates[0].votes).to.equal(2)
    })

    it('Should revert if candidate do not exist', async () => {
      const req = contract.connect(user1).vote(voting.id, candidate7.address, {
        value: ethers.utils.parseEther('0.01'),
      })

      await expect(req).to.revertedWith('Candidate do not exist!')
    })

    it('Balance should be 0.01 after first vote', async () => {
      await contract.connect(user1).vote(voting.id, candidate1.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      const [balance] = await contract.getBalances()
      expect(balance).to.equal(ethers.utils.parseEther('0.01'))
    })

    it('Should send fee to owner', async () => {
      await contract.connect(deployer).vote(voting.id, candidate2.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      await contract.connect(user1).vote(voting.id, candidate2.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      await contract.connect(user2).vote(voting.id, candidate2.address, {
        value: ethers.utils.parseEther('0.01'),
      })
      await contract.connect(user3).vote(voting.id, candidate2.address, {
        value: ethers.utils.parseEther('0.01'),
      })

      await network.provider.send('evm_increaseTime', [threeDays])
      await network.provider.send('evm_mine')
      const tx = await contract.connect(user2).stopVoting(voting.id)
      await tx.wait()

      await contract.connect(deployer).sendFeesToOwner()
      const [balance] = await contract.getBalances()
      expect(balance).to.equal(0)
    })

    it('Should revert if fee send not owner', async () => {
      await expect(contract.connect(user1).sendFeesToOwner()).to.revertedWith('Only for owner')
    })

    it('Should revert if nothing to withdraw', async () => {
      await expect(contract.connect(deployer).sendFeesToOwner()).to.revertedWith('Not available to withdraw')
    })

    it('Should create three votings with candidates', async () => {
      await contract.connect(deployer).createVoting(candidates)
      await contract.connect(deployer).createVoting(candidates)
      votings = await contract.connect(user1).getVotings()
      expect(votings.length).to.equal(3)
      expect(voting.candidates.length).to.equal(candidates.length)
    })

    it('Should create voting with 100 candidates', async () => {
      candidates = Array(100).fill(0x0).map(() => {
        return ethers.Wallet.createRandom().address
      })
      await contract.connect(deployer).createVoting(candidates)
      voting = await contract.connect(user1).getVotingById(2)
      expect(voting.candidates.length).to.equal(candidates.length)
    })

    it('Should stop second voting', async () => {
      await contract.connect(deployer).createVoting(candidates)
      await contract.connect(deployer).createVoting(candidates)
      await network.provider.send('evm_increaseTime', [threeDays])
      await network.provider.send('evm_mine')
      let [_, voting2] = await contract.connect(user1).getVotings()

      await contract.connect(user1).stopVoting(voting2.id);

      [_, voting2] = await contract.connect(user1).getVotings()
      expect(voting2.isActive).to.equal(false)
    })
  })
})
