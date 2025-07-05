import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { debounceTime } from 'rxjs/operators';
import { ExcelServiceService } from '../excel-service.service';

@Component({
  selector: 'app-rah-search',
  templateUrl: './rah-search.component.html',
  styleUrls: ['./rah-search.component.scss']
})
export class RahSearchComponent {
  rahIdControl = new FormControl('');
  result: any = null;
  loading = false;

  // ChatGPT related
  userMessage = '';
  chatHistory: { role: 'user' | 'assistant', content: string }[] = [];
 

  // Zoom/drag variables
  zoomLevel: number = 1;
  translateX: number = 0;
  translateY: number = 0;
  private isDragging: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private initialX: number = 0;
  private initialY: number = 0;

  constructor(
    private excelService: ExcelServiceService,
    private http: HttpClient
  ) {
    this.rahIdControl.valueChanges.pipe(debounceTime(300)).subscribe((rahId) => {
      if (rahId) this.searchRah(rahId);
    });
  }

  searchRah(rahId: string) {
    this.loading = true;
    this.excelService.getRahDetails(rahId.trim()).subscribe((data) => {
      this.result = data;
      this.loading = false;
    });
  }

  // Realistic Chatbot conversation
sendMessage() {
  const prompt = this.userMessage.trim();
  if (!prompt) return;

  // Add user message to chat history
  this.chatHistory.push({ role: 'user', content: prompt });
  this.userMessage = '';

  // Call your backend proxy URL instead of OpenAI directly
 const backendUrl = 'https://backendtest-c4ff.onrender.com/api/chat';
 // Replace with your actual backend URL + path

  const body = {
    model: 'gpt-3.5-turbo',
    messages: this.chatHistory.map(msg => ({ role: msg.role, content: msg.content }))
  };

  this.http.post<any>(backendUrl, body).subscribe(
    (response) => {
      const reply = response.choices?.[0]?.message?.content || 'No response.';
      this.chatHistory.push({ role: 'assistant', content: reply });

      // Auto-scroll to bottom
      setTimeout(() => {
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow) {
          chatWindow.scrollTop = chatWindow.scrollHeight;
        }
      }, 100);
    },
    (error) => {
      console.error('Backend proxy error:', error);
      this.chatHistory.push({ role: 'assistant', content: '⚠️ Failed to get response.' });
    }
  );
}


  // Zoom and drag logic
  zoomIn(): void {
    this.zoomLevel += 0.2;
  }

  zoomOut(): void {
    if (this.zoomLevel > 0.4) this.zoomLevel -= 0.2;
  }

  resetZoom(): void {
    this.zoomLevel = 1;
    this.translateX = 0;
    this.translateY = 0;
  }

  startDragging(event: MouseEvent): void {
    if (this.zoomLevel <= 1) return;
    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.initialX = this.translateX;
    this.initialY = this.translateY;
  }

  stopDragging(): void {
    this.isDragging = false;
  }

  onDrag(event: MouseEvent): void {
    if (!this.isDragging) return;
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    this.translateX = this.initialX + dx;
    this.translateY = this.initialY + dy;
  }
}
