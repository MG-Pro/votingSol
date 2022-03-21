import {Component} from '@angular/core'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public isOwner: boolean = true
  public addingMode: boolean = true
  public candidateAddress: string = ''
  public invalidMsg: boolean = false
  public candidatesAddress: string[] = [
    '0x6459B6FEBCA2f92122Cc741eC5d477ccEa1AA28c',
    '0x6459B6FEBCA2f92122Cc741eC5d477ccEa1AA29c',
    '0x6459B6FEBCA2f92122Cc741eC5d477ccEa1AA27c']

  public showAddForm(): void {
    this.addingMode = true
  }

  public hideAddForm(): void {
    this.addingMode = false
    this.invalidMsg = false
    this.candidateAddress = ''
  }

  public addCandidate(): void {
    this.invalidMsg = false
    if (this.candidateAddress.length === 42) {
      this.invalidMsg = true
      return
    }
    this.hideAddForm()
  }
}
