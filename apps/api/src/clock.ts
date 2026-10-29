/** Demo clock: virtual "now" in IST that can be set and sped up. Real clock when never touched. */
export interface ClockState {
  date: string;
  minute: number;
  speed: number;
  running: boolean;
  serverNowMs: number;
}

const istParts = (ms: number) => {
  const d = new Date(ms + 330 * 60000);
  return { date: d.toISOString().slice(0, 10), minute: d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60 };
};

export class Clock {
  private anchorMs = Date.now();
  private date: string;
  private minute: number;
  speed = 1;
  running = true;
  constructor() {
    const p = istParts(Date.now());
    this.date = p.date;
    this.minute = p.minute;
  }
  now(): { date: string; minute: number } {
    if (!this.running) return { date: this.date, minute: this.minute };
    const elapsed = ((Date.now() - this.anchorMs) / 60000) * this.speed;
    const m = this.minute + elapsed;
    return { date: this.date, minute: Math.min(m, 1439.99) };
  }
  set(p: Partial<Pick<ClockState, "date" | "minute" | "speed" | "running">>) {
    const cur = this.now();
    this.date = p.date ?? this.date;
    this.minute = p.minute ?? cur.minute;
    this.speed = p.speed ?? this.speed;
    this.running = p.running ?? this.running;
    this.anchorMs = Date.now();
  }
  state(): ClockState {
    const n = this.now();
    return { date: n.date, minute: n.minute, speed: this.speed, running: this.running, serverNowMs: Date.now() };
  }
}
