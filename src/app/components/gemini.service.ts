import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private apiKey: string = 'AIzaSyBrHloGeU9a-KFbjI7pg-czxkol16-oNvg';
  private apiUrl: string = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;

  constructor(private http: HttpClient) {}

  getGeneratedContent(prompt: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Referer': 'http://localhost:4200' // Update this if your frontend runs elsewhere
    });

    const body = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ]
    };

    return this.http.post(this.apiUrl, body, { headers }).pipe(
      catchError(error => {
        console.error('Gemini API error:', error);
        return throwError(() => new Error('Failed to fetch response from Gemini API'));
      })
    );
  }
}
