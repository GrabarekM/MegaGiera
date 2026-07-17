export class NotificationService {
  constructor() { this.history = []; this.listeners = new Set() }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  notify(message, data = {}) { const notification = Object.freeze({ message, ...data }); this.history.push(notification); for (const listener of this.listeners) listener(notification); return notification }
}
