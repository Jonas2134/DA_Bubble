import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { ContactBarComponent } from './contact-bar/contact-bar.component';
import { MessageAreaComponent } from './message-area/message-area.component';
import { SearchBarComponent } from "./header/search-bar/search-bar.component";
import { DeviceVisibleComponent } from '../../shared/services/responsive';


@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    ContactBarComponent,
    MessageAreaComponent,
    SearchBarComponent,
    DeviceVisibleComponent
],
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.scss'],
})
export class MainContentComponent {
  private route = inject(ActivatedRoute);
  smallSize: boolean = false;
  messageIn: boolean = false;
  activeUserId: string | null = null;

  chatType: 'private' | 'channel' | 'thread' | 'new' = 'channel';
  // muss später getauscht werden:
  chatId: string | null = 'KV14uSorBJhrWW92IeDS'; //ENTWICKLER
  // chatId: string | null = 'SsuHUPJxACsAfBVbJPn6'; //TEST
  // chatId: string | null = 'sEg8GcSNNZ6YWhxRs4SE'; //NOAH
  // chatId: string | null = '8nmFp28ZO3TOeDohgGQSqR0niUj1'; //BISASAM

  // chatId: string | null = null;
  threadId: string | null = null;
  isThreadOpen: boolean = false;

  sectionVisible = true;

  ngOnInit(): void {
    this.activeUserId = this.route.snapshot.paramMap.get('activeUserId');    

    // muss später aktiviert werden:
    // this.chatId = this.activeUserId;

    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
  }

  checkScreenSize() {
    this.smallSize = window.innerWidth < 1000;
  }

  toggleSection() {
    this.sectionVisible = !this.sectionVisible;
  }

  handleMessageInToggle(state: boolean) {
    this.messageIn = state;
  }

  handleOpenChat(eventData: { chatType: 'private' | 'channel'; chatId: string }) {
    this.chatType = eventData.chatType;
    this.chatId = eventData.chatId;
    this.isThreadOpen = false;
    this.threadId = '';
  }

  openThread(threadId: string) {
    this.isThreadOpen = true;
    this.threadId = threadId;
  }
}
