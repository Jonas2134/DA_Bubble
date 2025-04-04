import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { MessageService } from '../../../shared/services/message.service';
import { Message } from '../../../shared/interfaces/message.interface';
import { CommonModule } from '@angular/common';
import { MessageComponent } from './message/message.component';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { UserService } from '../../../shared/services/user.service';
import { Channel } from '../../../shared/interfaces/channel.interface';
import { ChannelService } from '../../../shared/services/channel.service';

@Component({
  selector: 'app-message-area',
  imports: [CommonModule, MessageComponent],
  templateUrl: './message-area.component.html',
  styleUrls: ['./message-area.component.scss'],
})
export class MessageAreaComponent implements OnChanges, OnDestroy {
  private userService = inject(UserService);
  private channelService = inject(ChannelService);
  private messageService = inject(MessageService);

  private messagesSubscription: Subscription | null = null;

  @Input() chatType: 'private' | 'channel' | 'thread' | 'new' = 'private';
  @Input() chatId: string | null = null;
  @Input() activeUserId: string | null = null;

  messages: Message[] = [];

  chatPartner: UserInterface | null = null;

  channelData: Channel | null = null;
  channelMembers: UserInterface[] = [];

  loading = false;
  private loadingCount = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chatType'] || changes['chatId'] || changes['activeUserId']) {
      this.loadMessages();
      this.loadChatData();
    }
  }

  ngOnDestroy(): void {
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
  }

  loadMessages(): void {
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }

    if (!this.chatType || !this.chatId || !this.activeUserId) {
      this.messages = [];
      return;
    }

    this.messagesSubscription = this.messageService
      .getMessages(this.chatType, this.chatId, this.activeUserId)
      .subscribe((messages) => {
        this.messages = messages;
      });
  }

  loadChatData(): void {
    if (this.chatType === 'private') {
      this.loadChatPartnerData();
    } else {
      this.chatPartner = null;
    }

    if (this.chatType === 'channel') {
      this.loadChannelData();
    } else {
      this.channelData = null;
      this.channelMembers = [];
    }
  }

  loadChatPartnerData(): void {
    this.userService
      .getUser(this.chatId)
      .then((chatPartnerData) => {
        this.chatPartner = chatPartnerData;
      })
      .catch((error) => {
        console.error('Fehler beim Laden des Users:', error);
      });
  }

  //Es kann sein dass ich channelData mit subscribe() laden muss
  loadChannelData() {
    this.channelService
      .getChannel(this.chatId)
      .then((channelData) => {
        this.channelData = channelData;  
        this.loadChannelMembers();
      })
      .catch((error) => {
        console.error('Fehler beim Laden des Channels:', error);
      });
  }

  loadChannelMembers() {
    if (!this.channelData || !this.channelData.cUserIds) {
      this.channelMembers = [];      
      return;
    }
  
    const userIds = this.channelData.cUserIds;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      this.channelMembers = [];
      return;
    }
  
    this.userService
      .getFilteredUsers(userIds)
      .then((users) => {
        this.channelMembers = users;
      })
      .catch((error) => {
        console.error('Fehler beim Laden der Channel-Mitglieder:', error);
      });
  }
  

  shouldShowDateSeparator(index: number): boolean {
    if (index === 0) {
      return true;
    }
  
    const current = this.messages[index];
    const prev = this.messages[index - 1];
  
    if (!current || !prev) {
      return false;
    }
  
    const currentDate = this.extractDateOnly(current.mTime);
    const prevDate = this.extractDateOnly(prev.mTime);
  
    return currentDate.getTime() !== prevDate.getTime();
  }

  extractDateOnly(mTime: any): Date {
    let dateObj: Date;
    
    if (mTime && typeof mTime.toDate === 'function') {
      dateObj = mTime.toDate();
    } 
    else if (mTime instanceof Date) {
      dateObj = mTime;
    } 
    else {
      dateObj = new Date(mTime);
    }
    
    const d = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    return d;
  }

  getDateString(mTime: any): string {
    const date = this.extractDateOnly(mTime);
    
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }
  

  testMessage(): void {
    console.log('Testnachricht wird erstellt...');
    // const testMessage: Message = {
    //   mText: "Wenn wir das nochmal machen, kaufen wir bitte einen Spritzschutz! Oder wir basteln Noah ’nen Ganzkörperanzug. Alles für den Geschmack!",
    //   mReactions: ["😜", "🛡️"],
    //   mTime: "Donnerstag 08:00",
    //   mSenderId: "8nmFp28ZO3TOeDohgGQSqR0niUj1", // Bisasam
    //   mUserId: "",
    //   mChannelId: "KV14uSorBJhrWW92IeDS",
    //   mThreadId: ""
    // };
    // this.messageService.createMessage(testMessage);
  }


  // muss zu Alexander
  @Output() openChat = new EventEmitter<{ 
    chatType: 'private' | 'channel'; 
    chatId: string 
  }>();

  // muss zu Alexander
  selectPrivateChat(userId: string) {
    this.openChat.emit({
      chatType: 'private',
      chatId: userId
    });
  }

  // muss zu Alexander
  selectChannel(channelId: string) {
    this.openChat.emit({
      chatType: 'channel',
      chatId: channelId
    });
  }

}
