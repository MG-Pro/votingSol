import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from '@angular/core'
import {ethers, Signer, Contract} from 'ethers'
import artifact from 'artifacts/contracts/Voting.sol/Voting.json'


interface ICandidate {
  address: string,
  votes: number,
}

interface IVoting {
  id: number,
  startDate: number,
  candidates: string[],
  winner: string,
}
const contract = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'

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
  public addingMode: boolean = false
  public newCandidateAddress: string = '0xa19Ad61447e5EA79bdDCeB037986944c41e198BC'
  public invalidMsg: boolean = false
  public votings: IVoting[] = []
  public activeVotingId: number = null
  public candidates: Map<string, ICandidate> = new Map()
  public shownVoting: IVoting
  private signer: Signer
  private signature: string;
  private contract: Contract

  constructor(private cd: ChangeDetectorRef) {
  }

  public async ngOnInit(): Promise<void> {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      return;
    }
    const provider = new ethers.providers.Web3Provider(ethereum)
    await provider.send('eth_requestAccounts', [])
    this.signer = provider.getSigner()
    this.userAddress = await this.signer.getAddress()
    this.userBalance = ethers.utils.formatEther((await this.signer.getBalance()))
    this.contract = new ethers.Contract(contract, artifact.abi, this.signer)
    console.log(await this.contract['getVotings']())
    this.isOwner = await this.contract['isOwner']()
    this.cd.detectChanges()
  }

  public showAddForm(): void {
    this.addingMode = true
  }

  public hideAddForm(): void {
    this.addingMode = false
    this.invalidMsg = false
    this.newCandidateAddress = ''
  }

  public addCandidate(): void {
    this.invalidMsg = false
    if (this.newCandidateAddress.length !== 42) {
      this.invalidMsg = true
      return
    }

    this.candidates.set(
      this.newCandidateAddress,
      {address: this.newCandidateAddress, votes: 0},
    )

    if (!this.activeVotingId) {
      this.createVoting()
    } else {
      this.updateVoting()
    }

    this.hideAddForm()
  }

  public async vote(candidate: ICandidate): Promise<void> {

    this.signature = await this.signer.signMessage('Approve it, pls')
    console.log(this.signature)
  }



  private updateVoting(): void {
    this.votings = this.votings.map(voting => {
      if (this.activeVotingId === voting.id) {

        const upVoting = {
          ...voting,
          candidates: [...voting.candidates, this.newCandidateAddress],
        }
        this.showActive(upVoting)
        return upVoting
      }
      return voting
    })
  }

  private createVoting(): void {
    const newVoting: IVoting = {
      id: 1,
      startDate: Date.now(),
      candidates: [this.newCandidateAddress],
      winner: null,
    }
    this.votings.push(newVoting)
    this.activeVotingId = newVoting.id
    this.showActive(newVoting)
  }

  public showActive(voting: IVoting): void {
    this.shownVoting = voting
  }

  public get candidatesList(): ICandidate[] {
    return this.shownVoting?.candidates.map(item => {
      return this.candidates.get(item)
    }) ?? []
  }
}
