import { describe, it, expect, beforeEach } from "vitest";
import { usePlayerStore } from "./playerStore";

/* ─── Reset store before each test ─── */

beforeEach(() => {
  usePlayerStore.setState({
    volume: 75,
    isMuted: false,
  });
});

/* ─── Tests ──────────────────────────────────────────── */

describe("PlayerStore — Volume & Mute", () => {
  it("starts with default volume and unmuted", () => {
    const s = usePlayerStore.getState();
    expect(s.volume).toBe(75);
    expect(s.isMuted).toBe(false);
  });

  it("setVolume clamps between 0 and 100", () => {
    usePlayerStore.getState().setVolume(150);
    expect(usePlayerStore.getState().volume).toBe(100);

    usePlayerStore.getState().setVolume(-10);
    expect(usePlayerStore.getState().volume).toBe(0);

    usePlayerStore.getState().setVolume(50);
    expect(usePlayerStore.getState().volume).toBe(50);
  });

  it("toggleMute toggles isMuted", () => {
    usePlayerStore.getState().toggleMute();
    expect(usePlayerStore.getState().isMuted).toBe(true);

    usePlayerStore.getState().toggleMute();
    expect(usePlayerStore.getState().isMuted).toBe(false);
  });
});
