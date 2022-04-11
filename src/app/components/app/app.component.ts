import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from '@angular/core'
import {ethers, Signer, Contract} from 'ethers'
import artifact from 'artifacts/contracts/Voting.sol/Voting.json'
import {environment} from 'src/environments/environment'

interface ICandidate {
  id: string,
  votes: number,
}

interface IVoting {
  startDate: number,
  voters: string[],
  candidates: ICandidate[],
  winner: string,
}

const contract = environment.contract

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  public isOwner: boolean = false
  public userAddress: string
  public userBalance: string
  public contractBalance: string
  public addingMode: boolean = false
  public newCandidateAddress: string = '0xa19Ad61447e5EA79bdDCeB037986944c41e198BC'
  public invalidMsg: boolean = false
  public votings: IVoting[] = []
  public activeVotingId: number = null
  public shownVoting: IVoting
  private signer: Signer
  public contract: Contract

  constructor(private cd: ChangeDetectorRef) {
  }

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
    this.contract = new ethers.Contract(contract, artifact.abi, this.signer)
    this.isOwner = await this.contract['isOwner']()
    this.activeVotingId = (await this.contract['getActiveVotingId']()).toNumber()
    await this.update()
  }

  public showAddForm(): void {
    this.addingMode = true
  }

  public hideAddForm(): void {
    this.addingMode = false
    this.invalidMsg = false
    this.newCandidateAddress = ''
  }

  public async addCandidate(): Promise<void> {
    this.invalidMsg = false
    if (this.newCandidateAddress.length !== 42) {
      this.invalidMsg = true
      return
    }

    const tx = await this.contract['addCandidate'](this.newCandidateAddress)
    this.hideAddForm()
    await tx.wait()
    this.activeVotingId = (await this.contract['getActiveVotingId']()).toNumber()
    await this.update()
  }

  public async vote(candidate: ICandidate): Promise<void> {
    const tx = await this.contract['vote'](candidate.id, {
      value: ethers.utils.parseEther('0.01'),
    })
    await tx.wait()
    await this.update()
  }

  public async showActive(voting: IVoting): Promise<void> {
    this.shownVoting = voting
    this.cd.detectChanges()
  }

  public async stopVoting(): Promise<void> {
    await this.contract['stopVoting']()
    await this.update()
  }

  public async takeFee(): Promise<void> {
    await this.contract['sendFeeToOwner']()
  }

  private async getVotings(): Promise<void> {
    this.votings = (await this.contract['getVotings']()).map((voting) => {
      return {
        startDate: voting.startDate.toNumber(),
        voters: voting.voters,
        candidates: voting.candidates.map(({id, votes}) => ({
          id,
          votes: votes.toNumber(),
        })),
        winner: voting.winner === '0x0000000000000000000000000000000000000000' ? null : voting.winner,
      }
    })
    console.log(this.votings)
    if (this.votings.length) {
      await this.showActive(this.votings[0])
    }
  }

  private async update(): Promise<void> {
    await this.getVotings()
    if (this.isOwner) {
      this.contractBalance = ethers.utils.formatEther((await this.contract['getBalance']()))
    }
    this.cd.detectChanges()
  }
}
