import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { Message } from '../../../../shared/interfaces/message.interface';
import { Timestamp } from 'firebase/firestore';
import { UserService } from '../../../../shared/services/user.service';
import { User } from '../../../../shared/interfaces/user.interface';
import {
  GroupedReaction,
  Reaction,
} from '../../../../shared/interfaces/reaction.interface';
import { Subscription } from 'rxjs';
import { MessageService } from '../../../../shared/services/message.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { PermanentDeleteComponent } from '../../../general-components/permanent-delete/permanent-delete.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-message',
  imports: [PickerComponent, PermanentDeleteComponent, FormsModule],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss',
})
export class MessageComponent implements OnInit {
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private userSub?: Subscription;
  private threadSub?: Subscription;
  private senderSub?: Subscription;

  @Input() chatType: 'private' | 'channel' | 'thread' | 'new' | null = null;
  @Input() message!: Message;
  @Input() activeUserId: string | null = null;

  @Output() profileClick = new EventEmitter<string>();
  @Output() threadOpen = new EventEmitter<string>();

  @ViewChild('emojiPicker', { read: ElementRef }) emojiPickerRef?: ElementRef;
  @ViewChild('emojiBtn', { read: ElementRef }) emojiBtnRef?: ElementRef;
  @ViewChild('optionsMenu', { read: ElementRef }) optionsMenuRef?: ElementRef;
  @ViewChild('optionsBtn', { read: ElementRef }) optionsBtnRef?: ElementRef;
  @ViewChild('editTextarea', { read: ElementRef })
  editTextareaRef!: ElementRef<HTMLTextAreaElement>;

  activeUserData: User | null = null;
  senderData: User | null = null;
  groupedReactions: GroupedReaction[] = [];
  shownReactionNumber = 7;
  editText = '';
  replyCount = 0;
  lastReplyTime: Timestamp | null = null;

  isEmojiPickerOpen = false;
  isOptionsOpen = false;
  isPermanentDeleteOpen = false;
  isEditOpen = false;

  ngOnInit(): void {
    this.loadSenderData();
    this.loadActiveUserData();
    this.regroupReactions();
    this.loadThreadInfo();
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['message']) {
      this.regroupReactions();
      this.loadThreadInfo();
    }
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
    this.threadSub?.unsubscribe();
    this.senderSub?.unsubscribe();
  }

  private loadSenderData() {
    this.senderSub?.unsubscribe();
    this.senderSub = this.userService
      .getUserRealtime(this.message.mSenderId!)
      .subscribe({
        next: (u) => (this.senderData = u),
        error: (err) => console.error('Sender-Live', err),
      });
  }

  private loadActiveUserData() {
    if (!this.activeUserId) return;
    this.userSub?.unsubscribe();
    this.userSub = this.userService
      .getUserRealtime(this.activeUserId)
      .subscribe({
        next: (u) => (this.activeUserData = u),
        error: (err) => console.error('User-Live', err),
      });
  }

  private loadThreadInfo() {
    this.threadSub?.unsubscribe();
    this.replyCount = 0;
    this.lastReplyTime = null;

    if (!this.message.mThreadId || this.chatType === 'thread') return;

    this.threadSub = this.messageService
      .getThreadMessages(this.message.mThreadId)
      .subscribe((msgs) => {
        const replies = msgs.filter((m) => m.mId !== this.message.mId);
        this.replyCount = replies.length;
        this.lastReplyTime = (replies.at(-1)?.mTime as Timestamp) ?? null;
      });
  }

  regroupReactions() {
    this.groupedReactions =
      this.message.mReactions && this.activeUserId
        ? this.groupReactionsWithNames(
            this.message.mReactions,
            this.activeUserId
          )
        : [];
  }

  private groupReactionsWithNames(
    reactions: Reaction[],
    activeUserId: string
  ): GroupedReaction[] {
    const grouped = this.collectReactions(reactions, activeUserId);
    return this.mapBucketsToViewModel(grouped);
  }

  private collectReactions(
    reactions: Reaction[],
    activeUserId: string
  ): Map<string, { count: number; names: string[] }> {
    const grouped = new Map<string, { count: number; names: string[] }>();
    reactions.forEach((r) => {
      const key = r.reaction;
      const name = r.userId === activeUserId ? 'Du' : r.userName;
      const bucket = grouped.get(key) ?? { count: 0, names: [] };

      bucket.count++;
      if (!bucket.names.includes(name)) bucket.names.push(name);

      grouped.set(key, bucket);
    });
    return grouped;
  }

  private mapBucketsToViewModel(
    buckets: Map<string, { count: number; names: string[] }>
  ): GroupedReaction[] {
    return Array.from(buckets, ([reaction, data]) => ({
      reaction,
      count: data.count,
      names: data.names,
      namesLine: this.buildNameLine(data.names),
      actionLine: this.buildActionLine(data.names, data.count),
    }));
  }

  private buildNameLine(names: string[], max = 3): string {
    const list = [...names];
    const idxDu = list.indexOf('Du');
    if (idxDu > 0) {
      list.splice(idxDu, 1);
      list.unshift('Du');
    }

    if (list.length <= max) {
      return list.join(', ').replace(/, ([^,]*)$/, ' und $1');
    }
    const first = list.slice(0, max).join(', ');
    const rest = list.length - max;
    return `${first} und ${rest === 1 ? 'ein weiterer' : rest + ' weitere'}`;
  }

  private buildActionLine(names: string[], count: number): string {
    return count === 1
      ? names[0] === 'Du'
        ? 'hast reagiert'
        : 'hat reagiert'
      : 'haben reagiert';
  }

  setShownReactionNumber() {
    this.shownReactionNumber =
      this.shownReactionNumber < this.groupedReactions.length
        ? this.groupedReactions.length
        : 7;
  }

  getTimeInHours(ts: Timestamp | null): string | undefined {
    return ts instanceof Timestamp
      ? ts
          .toDate()
          .toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : undefined;
  }

  getDayLabel(mTime: any): string {
    const date =
      mTime instanceof Date ? mTime : mTime?.toDate?.() ?? new Date(mTime);
    const todayMid = new Date().setHours(0, 0, 0, 0);
    const msgMid = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ).getTime();

    if (msgMid === todayMid) return 'Heute';
    if (msgMid === todayMid - 86400000) return 'Gestern';

    return this.formatAsGermanDate(date);
  }

  private formatAsGermanDate(d: Date): string {
    return (
      `${String(d.getDate()).padStart(2, '0')}.` +
      `${String(d.getMonth() + 1).padStart(2, '0')}.` +
      d.getFullYear()
    );
  }

  addReaction(reaction: string) {
    if (!this.message.mId || !this.activeUserId) return;

    this.userService
      .editLastReactions(this.activeUserId, reaction)
      .catch(console.error);

    this.messageService
      .toggleReaction(this.message.mId, {
        reaction,
        userId: this.activeUserId,
        userName: this.activeUserData?.uName ?? '',
      })
      .catch(console.error);
  }

  onThreadClick() {
    if (!this.message.mId) return;

    const tid = this.message.mThreadId || this.message.mId;
    const ensureThread = this.message.mThreadId
      ? Promise.resolve()
      : this.messageService.startThread(this.message.mId);

    ensureThread.then(() => {
      this.message.mThreadId = tid;
      this.threadOpen.emit(tid);
    });
  }

  openProfil() {
    if (this.message.mSenderId) this.profileClick.emit(this.message.mSenderId);
  }

  toggleEmojiPicker(e: MouseEvent) {
    e.stopPropagation();
    this.isEmojiPickerOpen = !this.isEmojiPickerOpen;
  }
  toggleOptions(e: MouseEvent) {
    e.stopPropagation();
    this.isOptionsOpen = !this.isOptionsOpen;
  }
  toggleEdit() {
    this.isEditOpen = !this.isEditOpen;
  }
  togglePermanentDelete() {
    this.isPermanentDeleteOpen = !this.isPermanentDeleteOpen;
  }

  onEmojiPicked(e: any) {
    const char = e.emoji?.native ?? e.emoji;
    if (this.isEditOpen && this.editTextareaRef) {
      const ta = this.editTextareaRef.nativeElement;
      const pos = ta.selectionStart ?? this.editText.length;
      this.editText =
        this.editText.slice(0, pos) + char + this.editText.slice(pos);
      setTimeout(() =>
        ta.setSelectionRange(pos + char.length, pos + char.length)
      );
      return;
    }
    this.addReaction(char);
    this.isEmojiPickerOpen = false;
  }

  openEdit() {
    this.editText = this.message.mText ?? '';
    this.toggleEdit();
    setTimeout(() => this.editTextareaRef?.nativeElement.focus());
  }

  saveEdit() {
    if (!this.message.mId) return;
    const trimmed = this.editText.trim();
    if (trimmed === (this.message.mText ?? '').trim()) {
      this.toggleEdit();
      return;
    }
    this.messageService
      .editMessageText(this.message.mId, trimmed)
      .then(() => {
        this.message.mText = trimmed;
        this.toggleEdit();
        this.isOptionsOpen = false;
      })
      .catch(console.error);
  }

  handleDocumentClick(ev: MouseEvent) {
    if (this.isPermanentDeleteOpen) return;

    const target = ev.target as HTMLElement;

    this.maybeCloseEmojiPicker(target);
    this.maybeCloseOptionsMenu(target);
  }

  private maybeCloseEmojiPicker(target: HTMLElement): void {
    if (
      this.isEmojiPickerOpen &&
      !this.elementContains(this.emojiPickerRef, target) &&
      !this.elementContains(this.emojiBtnRef, target)
    ) {
      this.isEmojiPickerOpen = false;
    }
  }

  private maybeCloseOptionsMenu(target: HTMLElement): void {
    if (
      this.isOptionsOpen &&
      !this.elementContains(this.optionsMenuRef, target) &&
      !this.elementContains(this.optionsBtnRef, target)
    ) {
      this.isOptionsOpen = false;
    }
  }

  private elementContains(
    ref: ElementRef | undefined,
    target: HTMLElement
  ): boolean {
    return ref?.nativeElement?.contains(target) ?? false;
  }
}