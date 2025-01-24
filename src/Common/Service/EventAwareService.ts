import { Component } from "obsidian";

export class EventAwareService extends Component {
  protected eventTarget: EventTarget;

  /**
   * Wrapper for addEventListener.
   */
  public addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void {
    this.eventTarget.addEventListener(type, callback, options);
  }

  /**
   * Wrapper for removeEventListener.
   */
  public removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void {
    this.eventTarget.removeEventListener(type, callback, options);
  }

  constructor() {
    super();

    this.eventTarget = new EventTarget();
  }
} 