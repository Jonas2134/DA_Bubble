import { CommonModule } from '@angular/common';
import { Component} from '@angular/core';
import { SearchInformationComponent } from '../../search-information/search-information.component';
import { DeviceVisibleComponent } from '../../../../shared/services/responsive';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, SearchInformationComponent, DeviceVisibleComponent],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss'
})

export class SearchBarComponent{
  searchValue: string = '';
  searchText: string = '';
  charCount:number = 0
  showInformation: boolean = false;

  
  onKey(event: KeyboardEvent) {
    const input = (event.target as HTMLInputElement).value;
    this.searchValue = input;    
    this.charCount = input.length;
    if(this.charCount >= 3){
      this.showInformation = true;
    }
    else{
      this.showInformation = false;
    }
  }
 

  closeSearchInfo() {
    this.searchValue = '';
    this.showInformation = false;
  }
  

}
