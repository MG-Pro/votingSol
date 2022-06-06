import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core'
import {ethers, Signer, Contract} from 'ethers'
import artifact from 'artifacts/contracts/Voting.sol/Voting.json'

interface ICandidate {
  id: string,
  votes: number,
}

interface IVoting {
  id: number,
  fund: string,
  startDate: number,
  candidates: ICandidate[],
  winner: string,
  isActive: boolean,
  isExpired: boolean,
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class AppComponent implements OnInit {
  public isOwner: boolean = false
  public userAddress: string
  public userBalance: string
  public contractBalance: string
  public availableFees: string
  public addingMode: boolean = false
  public votings: IVoting[] = []
  private signer: Signer
  public contract: Contract
  public candidates: string[] = ['0xa19Ad61447e5EA79bdDCeB037986944c41e198BC', '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2']
  public validation: boolean[] = []
  private contractAddress = process.env['NG_APP_CONTRACT']

  constructor(private cd: ChangeDetectorRef) {}

  public async ngOnInit(): Promise<void> {
    const ethereum = (window as any).ethereum
    if (!ethereum) {
      return
    }
    const provider = new ethers.providers.Web3Provider(ethereum)
    await provider.send('eth_requestAccounts', [])

    this.signer = provider.getSigner()
    this.userAddress = await this.signer.getAddress()
    this.userBalance = ethers.utils.formatEther((await this.signer.getBalance()))
    this.contract = new ethers.Contract(this.contractAddress, artifact.abi, this.signer)
    this.isOwner = await this.contract['isOwner']()
    await this.update()
  }

  public showAddForm(): void {
    this.addingMode = true
  }

  public hideAddForm(): void {
    this.addingMode = false
    this.candidates = []
    this.validation = []
  }

  public addCandidate(): void {
    this.candidates.push('')
  }

  public removeCandidate(id: number): void {
    this.candidates = this.candidates.filter((c, i) => i !== id)
  }

  public async save(): Promise<void> {
    this.validation = this.candidates.map(c => !ethers.utils.isAddress(c))

    if(this.validation.includes(true)) {
      return
    }
    const tx = await this.contract['createVoting'](this.candidates)
    this.hideAddForm()
    await tx.wait()
    await this.update()
  }

  public async vote(votingId: number, candidate: ICandidate): Promise<void> {
    const tx = await this.contract['vote'](votingId, candidate.id, {
      value: ethers.utils.parseEther('0.01'),
    })
    await tx.wait()
    await this.update()
  }

  public async stopVoting(votingId: number,): Promise<void> {
    const tx = await this.contract['stopVoting'](votingId)
    await tx.wait()
    await this.update()
  }

  public async takeFee(): Promise<void> {
    const tx = await this.contract['sendFeesToOwner']()
    await tx.wait()
    await this.update()
  }

  private async getVotings(): Promise<void> {
    this.votings = (await this.contract['getVotings']()).map((voting) => {
      console.log(voting.isExpired)
      return {
        id: voting.id.toNumber(),
        fund: ethers.utils.formatEther(voting.fund),
        startDate: voting.startDate.toNumber() * 1000,
        candidates: voting.candidates.map(({id, votes}) => ({
          id,
          votes: votes.toNumber(),
        })),
        winner: voting.winner !== ethers.constants.AddressZero ? voting.winner : null,
        isActive: voting.isActive,
        isExpired: voting.isExpired,
      }
    })
  }

  private async update(): Promise<void> {
    await this.getVotings()
    if (this.isOwner) {
      const balances: string[] = await this.contract['getBalances']()
      this.contractBalance = ethers.utils.formatEther(balances[0])
      this.availableFees = ethers.utils.formatEther(balances[1])
    }
    this.cd.detectChanges()
  }
}
