
import { Injectable } from '@angular/core';
import { DetectedEntity } from '../types';

// This type is a subset of DetectedEntity, representing the fields this service will generate.
export type GeneratedProfile = Omit<DetectedEntity, 'id' | 'timestamp' | 'emfReading' | 'contained' | 'instability'>;

@Injectable({
  providedIn: 'root'
})
export class OnDeviceProfileGeneratorService {

  private readonly entityNames = ['The Weeping Phantom', 'The Shadow of Yharnam', 'The Grieving Spirit', 'The Poltergeist of the Manor', 'The Spectral Librarian', 'The Forgotten Child', 'The Glitch in the Code', 'The Bell Tower Sentinel'];
  private readonly entityTypes = ['Vengeful Spirit', 'Lost Soul', 'Poltergeist', 'Residual Haunting', 'Intelligent Haunting', 'Shadow Person', 'Demonic Entity', 'Glitch Entity'];
  private readonly temperaments = ['Malevolent', 'Benevolent', 'Neutral', 'Mischievous', 'Confused', 'Angry', 'Territorial', 'Shy'];
  private readonly abilities = [
    'Can manipulate electronic devices.',
    'Causes sudden drops in temperature.',
    'Is known to move objects.',
    'Can manifest as a full-bodied apparition.',
    'Communicates through EVP (Electronic Voice Phenomena).',
    'Creates feelings of dread and paranoia.',
    'Is tied to a specific object or location.',
    'Can interfere with recording equipment.'
  ];
  private readonly historicalContexts = [
    'A soul from the Victorian era, searching for a lost love.',
    'The result of a tragic accident on this very spot centuries ago.',
    'An entity that has been dormant for decades, recently awakened.',
    'Not a human spirit, but something older and more primal.',
    'A digital ghost, born from the ether of old technology.',
    'The collective psychic energy of a past tragedy.',
    'A guardian spirit, bound to protect this location.',
    'A playful but powerful entity that enjoys interacting with the living.'
  ];


  constructor() { }

  /**
   * Generates a plausible entity profile based on the strength of the detection.
   * @param strength A number from 0 to 100 representing the detection strength.
   * @returns A promise that resolves to a generated entity profile.
   */
  generateProfile(strength: number): Promise<GeneratedProfile> {
    return new Promise(resolve => {
      const profile: GeneratedProfile = {
        name: this.getRandomElement(this.entityNames),
        type: this.getRandomElement(this.entityTypes),
        temperament: this.getRandomElement(this.temperaments),
        abilities: this.getRandomAbilities(strength),
        historicalContext: this.getRandomElement(this.historicalContexts),
        containmentProtocol: this.generateContainmentProtocol(strength),
      };
      // Simulate a brief "analysis" period
      setTimeout(() => resolve(profile), 800 + Math.random() * 500);
    });
  }

  private getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private getRandomAbilities(strength: number): string[] {
    const numAbilities = Math.max(1, Math.ceil((strength / 100) * 4));
    const shuffled = [...this.abilities].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numAbilities);
  }

  private generateContainmentProtocol(strength: number): string {
    if (strength < 30) {
      return 'Standard observation protocols are sufficient. Entity is weak and poses no immediate threat.';
    } else if (strength < 70) {
      return 'Active monitoring required. Use EMF dampeners to discourage manifestation. Do not engage directly.';
    } else {
      return 'High-level alert. Metaphysical containment field is advised. Avoid all direct communication. Entity is powerful and potentially hostile.';
    }
  }
}
