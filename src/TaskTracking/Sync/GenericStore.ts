import { useSyncExternalStore } from "react";

export type Listener = () => void;

export class GenericStore<T> {
  private listener: Listener[] = [];
  private value: T;

  setValue(value: T) {
    this.value = value;

    for (const l of this.listener) {
      l();
    }
  }

  subscribe(listener: Listener): Listener {
    this.listener = [...this.listener, listener];

    return () => {
      this.listener = this.listener.filter(l => l !== listener);
    }
  }

  getSnapshot(): T {
    return this.value;
  }

  syncExternalStore(): T {
    return useSyncExternalStore<T>(this.subscribe.bind(this), this.getSnapshot.bind(this));
  }
}
