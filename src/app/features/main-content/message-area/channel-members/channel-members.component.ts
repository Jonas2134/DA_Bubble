import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { User } from '../../../../shared/interfaces/user.interface';
import { ProfilComponent } from '../../../general-components/profil/profil.component';
import { AddNewMembersComponent } from '../../../general-components/add-new-members/add-new-members.component';
import { MemberListComponent } from '../../../general-components/member-list/member-list.component';

@Component({
  selector: 'app-channel-members',
  imports: [
    CommonModule,
    ProfilComponent,
    AddNewMembersComponent,
    MemberListComponent,
  ],
  templateUrl: './channel-members.component.html',
  styleUrl: './channel-members.component.scss',
})

export class ChannelMembersComponent{
  @Input() channelMembers: User[] = [];
  @Input() activeUserId: string | null = null;
  @Input() channelId: any;
  @Input() channelName: any = '';
  @Input() activChannelMemberProfil: User | null = null;
  @Input() newChannelMembers: boolean = false;
  @Input() isChannelMemberProfilOpen: boolean = false;

  @Output() newChannelMembersChange = new EventEmitter<boolean>(); // keine Ahnung was das ist 


  @Output() close = new EventEmitter<void>();
  @Output() openChat = new EventEmitter<{chatType: 'private'; chatId: string}>();
  @ViewChild('channelWrapper') channelWrapper?: ElementRef;
  @ViewChild('memberAddWrapper') memberAddWrapper?: ElementRef;

  

  closeChannelMembers() { 
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent) {
    const target = event.target as Node;

    // falls gerade Add-Members-Modal offen ist …
    if (this.newChannelMembers) {
      // … und Klick außerhalb seines Wrappers war
      if (this.memberAddWrapper && !this.memberAddWrapper.nativeElement.contains(target)) {
        this.closeAddMembers();
      }
    } else {
      // sonst: Channel-Members-Modal war offen
      if (this.channelWrapper && !this.channelWrapper.nativeElement.contains(target)) {
        this.closeChannelMembers();
      }
    }
  }

  toggleMemberProfil(member?: User) {
    const isOpen = !this.isChannelMemberProfilOpen;
    this.isChannelMemberProfilOpen = isOpen;
    this.activChannelMemberProfil = member || null;
  }

  closeAddMembers() {
    this.newChannelMembers = false;
    this.newChannelMembersChange.emit(false);
  }

  addChannelMember() {
    this.newChannelMembers = true;
    this.newChannelMembersChange.emit(true);
  }
}
