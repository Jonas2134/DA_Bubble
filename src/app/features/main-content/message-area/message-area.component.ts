import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MessageService } from '../../../shared/services/message.service';
import { UserService } from '../../../shared/services/user.service';
import { ChannelService } from '../../../shared/services/channel.service';
import { Message } from '../../../shared/interfaces/message.interface';
import { User } from '../../../shared/interfaces/user.interface';
import { Channel } from '../../../shared/interfaces/channel.interface';
import { MessageComponent } from './message/message.component';
import { ChannelLeaveComponent } from '../../general-components/channel-leave/channel-leave.component';
import { ProfilComponent } from '../../general-components/profil/profil.component';
import { ChannelMembersComponent } from './channel-members/channel-members.component';
import { AddNewMembersComponent } from '../../general-components/add-new-members/add-new-members.component';
import { MessageComposerComponent } from './message-composer/message-composer.component';

@Component({
  selector: 'app-message-area',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MessageComponent,
    ChannelLeaveComponent,
    ProfilComponent,
    ChannelMembersComponent,
    AddNewMembersComponent,
    MessageComposerComponent,
  ],
  templateUrl: './message-area.component.html',
  styleUrls: ['./message-area.component.scss'],
})
export class MessageAreaComponent implements OnChanges, OnDestroy {
  private userService = inject(UserService);
  private channelService = inject(ChannelService);
  private messageService = inject(MessageService);

  private messagesSub?: Subscription;
  private channelSub?: Subscription;
  private chatPartnerSub?: Subscription;
  private channelMemberSubs: Subscription[] = [];

  @Input() chatType: 'private' | 'channel' | 'thread' | 'new' = 'private';
  @Input() chatId: string | null = null;
  @Input() activeUserId: string | null = null;

  @Output() openThread = new EventEmitter<string>();
  @Output() closeThread = new EventEmitter<string>();
  @Output() openChat = new EventEmitter<{
    chatType: 'private' | 'channel';
    chatId: string;
  }>();

  @ViewChild('scrollContainer') private scrollCont!: ElementRef<HTMLDivElement>;

  isLoading = true;
  isEditChannelOpen = false;
  isProfilOpen = false;
  isChannelMemberOpen = false;
  messages: Message[] = [];
  chatPartner: User | null = null;
  channelData: Channel | null = null;
  channelMembers: User[] = [];
  userProfil: User | null = null;
  threadContextName = '';
  threadReplyCount = 0;
  showNewSuggestions = false;
  foundUsersNew: User[] = [];
  foundChannelsNew: Channel[] = [];
  newChatInput = '';
  newChannelMembers = false;
  addMemberPopUp = false;

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.isLoading = false;
      setTimeout(() => this.scrollToBottom(), 2000);
    }, 500);
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['chatType'] || ch['chatId'] || ch['activeUserId']) {
      this.prepareForReload();
      this.loadMessages();
      this.loadChatData();
    }
  }

  ngOnDestroy(): void {
    this.messagesSub?.unsubscribe();
    this.channelSub?.unsubscribe();
    this.chatPartnerSub?.unsubscribe();
    this.channelMemberSubs.forEach((s) => s.unsubscribe());
  }

  private prepareForReload() {
    this.isLoading = true;
    setTimeout(() => (this.isLoading = false), 500);
  }

  private loadMessages() {
    this.messagesSub?.unsubscribe();

    if (!this.chatType || !this.chatId || !this.activeUserId) {
      this.resetMessages();
      return;
    }

    this.messagesSub = this.messageService
      .getMessages(this.chatType, this.chatId, this.activeUserId)
      .subscribe((msgs) => this.handleIncomingMessages(msgs));
  }

  private resetMessages() {
    this.messages = [];
    this.threadReplyCount = 0;
  }

  private handleIncomingMessages(msgs: Message[]) {
    const hasNew = msgs.length > this.messages.length;
    this.messages = msgs;

    if (this.chatType === 'thread') {
      this.threadReplyCount = Math.max(0, msgs.length - 1);
      this.setThreadContextName(msgs[0]);
    }

    if (hasNew) setTimeout(() => this.scrollToBottom(), 1000);
  }

  private setThreadContextName(parent: Message) {
    if (parent.mChannelId) {
      this.channelService
        .getChannel(parent.mChannelId)
        .then((ch) => (this.threadContextName = `#${ch.cName}`));
    } else if (parent.mUserId) {
      this.userService
        .getUser(parent.mUserId)
        .then((u) => (this.threadContextName = `@${u.uName}`));
    }
  }

  private loadChatData(): void {
    this.channelSub?.unsubscribe();
    this.chatPartnerSub?.unsubscribe();
    this.channelMemberSubs.forEach((s) => s.unsubscribe());

    this.chatPartner = null;
    this.channelData = null;
    this.channelMembers = [];

    if (this.chatType === 'private' && this.chatId) {
      this.loadChatPartnerData();
      return;
    }
    if (this.chatType === 'channel' && this.chatId) {
      this.subscribeChannelRealtime();
      return;
    }
  }

  private loadChatPartnerData() {
    if (!this.chatId) return;
    this.chatPartnerSub = this.userService
      .getUserRealtime(this.chatId)
      .subscribe({
        next: (u) => (this.chatPartner = u),
        error: (err) => console.error('User-Live', err),
      });
  }

  private subscribeChannelRealtime() {
    this.channelSub = this.channelService
      .getChannelRealtime(this.chatId!)
      .subscribe({
        next: (ch) => {
          this.channelData = ch;
          this.loadChannelMembers();
        },
        error: (err) => console.error('Channel-Realtime', err),
      });
  }

  private loadChannelMembers() {
    this.channelMemberSubs.forEach((s) => s.unsubscribe());
    this.channelMemberSubs = [];
    this.channelMembers = [];

    if (!this.channelData?.cUserIds?.length) return;

    for (const uid of this.channelData.cUserIds) {
      const sub = this.userService.getUserRealtime(uid).subscribe({
        next: (u) => this.mergeMember(u),
        error: (err) => console.error('User-Realtime', err),
      });
      this.channelMemberSubs.push(sub);
    }
  }

  private mergeMember(u: User | null) {
    if (!u) return;
    const idx = this.channelMembers.findIndex((m) => m.uId === u.uId);
    idx > -1 ? (this.channelMembers[idx] = u) : this.channelMembers.push(u);
    this.sortMembers();
  }
  private sortMembers() {
    this.channelMembers.sort((a, b) => {
      if (a.uId === this.activeUserId) return -1;
      if (b.uId === this.activeUserId) return 1;
      return 0;
    });
  }

  private scrollToBottom() {
    if (this.scrollCont)
      this.scrollCont.nativeElement.scrollTop =
        this.scrollCont.nativeElement.scrollHeight;
  }

  handleThreadClick(id: string) {
    this.openThread.emit(id);
  }
  handleCloseThread() {
    this.closeThread.emit();
  }

  toggleEdit() {
    this.isEditChannelOpen = !this.isEditChannelOpen;
  }

  toggleProfile(u: User | null) {
    this.userProfil = u;
    this.isProfilOpen = !this.isProfilOpen;
  }

  openUserProfil(id: string) {
    this.userService
      .getUser(id)
      .then((u) => (this.userProfil = u))
      .catch(console.error);
    this.isProfilOpen = true;
  }

  toggleChannelMembers() {
    this.isChannelMemberOpen = !this.isChannelMemberOpen;
  }

  addChannelMember() {
    this.newChannelMembers = true;
  }
  openAddMemberPopUp() {
    this.addMemberPopUp = true;
  }
  closeAddMember() {
    this.addMemberPopUp = false;
  }

  onNewInputChange() {
    const val = this.newChatInput.trim();
    this.showNewSuggestions = !!val;

    if (!val) {
      this.foundUsersNew = [];
      this.foundChannelsNew = [];
      return;
    }

    const first = val.charAt(0);
    const query = val.slice(1).toLowerCase();

    if (first === '@') {
      this.userService.getAllUsers().then((all) => {
        this.foundUsersNew = all.filter((u) =>
          u.uName.toLowerCase().includes(query)
        );
        this.foundChannelsNew = [];
      });
    } else if (first === '#') {
      this.channelService.getAllChannels().then((all) => {
        this.foundChannelsNew = all.filter((c) =>
          c.cName.toLowerCase().includes(query)
        );
        this.foundUsersNew = [];
      });
    } else {
      this.userService.getAllUsers().then((all) => {
        this.foundUsersNew = all.filter((u) =>
          u.uEmail.toLowerCase().includes(val.toLowerCase())
        );
        this.foundChannelsNew = [];
      });
    }
  }

  selectUserNew(u: User) {
    this.finishNewTarget('private', u.uId!);
  }
  selectChannelNew(c: Channel) {
    this.finishNewTarget('channel', c.cId!);
  }

  private finishNewTarget(type: 'private' | 'channel', id: string) {
    this.newChatInput = '';
    this.showNewSuggestions = false;
    this.openChat.emit({ chatType: type, chatId: id });
  }

  sendMessageFromComposer(text: string) {
    this.newMessageText = text;
    this.sendMessage();
  }

  private newMessageText = '';

  private async sendMessage() {
    const txt = this.newMessageText.trim();
    if (!txt) return;

    if (this.chatType === 'thread' && this.chatId) {
      await this.messageService.replyInThread(
        this.chatId,
        txt,
        this.activeUserId!
      );
    } else {
      const msg: Partial<Message> = {
        mText: txt,
        mReactions: [],
        mSenderId: this.activeUserId!,
        mUserId: this.chatType === 'private' ? this.chatId! : '',
        mChannelId: this.chatType === 'channel' ? this.chatId! : '',
        mThreadId: '',
      };
      await this.messageService.createMessage(msg);
    }
    this.newMessageText = '';
    setTimeout(() => this.scrollToBottom(), 1000);
  }

  shouldShowDateSeparator(i: number): boolean {
    if (i === 0) return true;
    return (
      this.getDay(this.messages[i].mTime) !==
      this.getDay(this.messages[i - 1].mTime)
    );
  }
  private getDay(t: any): number {
    const d = t?.toDate?.() ?? t ?? new Date(t);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }
  getDateString(t: any): string {
    const d = t?.toDate?.() ?? t ?? new Date(t);
    const diff = this.getDay(d) - this.getDay(new Date());

    if (diff === 0) return 'Heute';
    if (diff === -86400000) return 'Gestern';

    return d.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  getPlaceholder(): string {
    switch (this.chatType) {
      case 'private':
        return `Nachricht an ${this.chatPartner?.uName || 'unbekannter User'}`;
      case 'channel':
        return `Nachricht an #${
          this.channelData?.cName || 'unbekannter Kanal'
        }`;
      case 'thread':
        return 'Antworten...';
      default:
        return 'Starte eine neue Nachricht';
    }
  }

  onAvatarError(ev: Event): void {
    const img = ev.target as HTMLImageElement;
    if (!img.dataset['fallback']) {
      img.dataset['fallback'] = 'true';
      img.src = 'assets/img/profile.png';
    }
  }
}
