import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/ru",
}));

import { HeroSection } from "../../components/landing/HeroSection";

describe("HeroSection video loop", () => {
  it("uses one stable native-looping video source", () => {
    render(<HeroSection />);

    const video = screen.getByLabelText(
      "SUNLUK eyewear accessory editorial video",
    ) as HTMLVideoElement;
    const sources = video.querySelectorAll("source");

    expect(video.loop).toBe(true);
    expect(sources).toHaveLength(1);
    expect(sources[0]).toHaveAttribute("src", "/videos/hero-live-frame.mp4");
  });
});
