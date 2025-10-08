declare module '@capacitor/app' {
  export const App: {
    addListener(eventName: 'appStateChange', listener: (state: { isActive: boolean }) => void): { remove(): void };
    addListener(eventName: string, listener: (...args: any[]) => void): { remove(): void };
    removeAllListeners?(): void;
  };
}
