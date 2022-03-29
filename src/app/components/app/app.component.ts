import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from '@angular/core'
import {ethers, Signer, Contract} from 'ethers'
import artifact from 'artifacts/contracts/Voting.sol/Voting.json'
import { environment } from 'src/environments/environment'
interface ICandidate {
  candidateAddress: string,
  votes: number,
}

interface IVoting {
  id: number,
  startDate: number,
  candidates: string[],
  voters: string[],
  winner: string,
  winnerObj: ICandidate,
  candidatesObj: ICandidate[],
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
    const tx = await this.contract['vote'](candidate.candidateAddress, {
      value: ethers.utils.parseEther('0.01'),
    })
    await tx.wait()
    await this.update()
  }

  public async showActive(voting: IVoting): Promise<void> {
    this.shownVoting = voting
    await this.getCandidates()
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
    this.votings = (await this.contract['getVotings']()).map(voting => {
      return {
        id: voting.id.toNumber(),
        startDate: voting.startDate.toNumber(),
        candidates: voting.candidates,
        winner: voting.winner === '0x0000000000000000000000000000000000000000' ? null : voting.winner,
      }
    })
    if (this.votings.length) {
      await this.showActive(this.votings[0])
    }
  }

  private async getCandidates(): Promise<void> {
    const reqCandidates = this.shownVoting.candidates.map(addr => {
      return this.contract['getCandidateByAddress'](addr)
    })

    const candidatesObj = (await Promise.all(reqCandidates)).map(item => {
      return {
        candidateAddress: item.candidateAddress,
        votes: item.votes.toNumber(),
      }
    })
    this.shownVoting = {...this.shownVoting, candidatesObj}
  }

  private async update(): Promise<void> {
    await this.getVotings()
    if (this.isOwner) {
      this.contractBalance = ethers.utils.formatEther((await this.contract['getBalance']()))
    }
    this.cd.detectChanges()
  }
}
