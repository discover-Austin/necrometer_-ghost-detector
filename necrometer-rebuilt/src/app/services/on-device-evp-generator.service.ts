
import { Injectable } from '@angular/core';
import { EVPAnalysis } from '../types';

@Injectable({
  providedIn: 'root'
})
export class OnDeviceEVPGeneratorService {

  private readonly phrases = [
    "Get out",
    "Help me",
    "I'm here",
    "Leave this place",
    "Who are you?",
    "It's cold"
  ];

  constructor() { }

  getEVPMessage(): Promise<EVPAnalysis> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          transcription: this.phrases[Math.floor(Math.random() * this.phrases.length)],
          confidence: Math.random() * 0.6 + 0.4 // 40% to 100%
        });
      }, 800 + Math.random() * 700);
    });
  }
}
