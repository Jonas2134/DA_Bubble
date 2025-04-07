import { CommonModule } from '@angular/common';
import { AddChannelComponent } from './add-channel/add-channel.component';
import { inject, Component, Input} from '@angular/core';
import { Firestore, collectionData, collection} from '@angular/fire/firestore';
import { map } from 'rxjs/operators';


@Component({
  selector: 'app-channels',
  standalone: true,
  imports: [CommonModule, AddChannelComponent],
  templateUrl: './channels.component.html',
  styleUrl: './channels.component.scss'
})
export class ChannelsComponent{
  showAddChannel = false;
  showChannels = false;
  @Input() activeUserId!: string | null;
  private firestore = inject(Firestore);

  channels$ = collectionData(
    collection(this.firestore, 'channels'),
    { idField: 'id' }
  ).pipe(
    map((channels: any[]) =>
      channels
        .map(channel => ({
          id: channel.id,
          name: channel.cName,
          createdAt: channel.createdAt || 0, 
        }))
        .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))
    )
  );
  
  toggleAddChannel() {
    this.showAddChannel = !this.showAddChannel;
  }
  showAllChannels(){
    this.showChannels = !this.showChannels
  }
}
