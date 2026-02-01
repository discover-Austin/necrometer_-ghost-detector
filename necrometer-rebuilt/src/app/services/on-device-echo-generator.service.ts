
import { Injectable } from '@angular/core';
import { TemporalEcho } from '../types';

@Injectable({
  providedIn: 'root'
})
export class OnDeviceEchoGeneratorService {

  private readonly periods = ['Roman Empire', 'Viking Age', 'Feudal Japan', 'The Wild West', 'The Roaring Twenties', 'The Digital Frontier'];
  private readonly events = ['a great battle', 'a secret coronation', 'a tragic love story', 'the signing of a treaty', 'a mysterious disappearance', 'the invention of a powerful artifact'];
  private readonly feelings = ['immense sorrow', 'unbridled joy', 'a chilling sense of dread', 'palpable ambition', 'overwhelming confusion', 'a feeling of profound peace'];

  constructor() { }

  generateEcho(): Promise<TemporalEcho> {
    return new Promise(resolve => {
      const echo: TemporalEcho = {
        period: this.getRandomElement(this.periods),
        event: this.getRandomElement(this.events),
        feeling: this.getRandomElement(this.feelings),
      };
      setTimeout(() => resolve(echo), 600 + Math.random() * 400);
    });
  }

  private getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}
