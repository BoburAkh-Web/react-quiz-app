import { describe, expect, it } from "vitest";
import { formatClock, formatMinutes, percent, scoreTone, shuffle } from "./utils";

describe("utils", () => {
  it("shuffle elementlarni yo'qotmaydi va asl massivni o'zgartirmaydi", () => {
    const items = [1, 2, 3, 4, 5, 6];
    const result = shuffle(items);
    expect(result).toHaveLength(6);
    expect([...result].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("percent nolga bo'linmaydi", () => {
    expect(percent(15, 20)).toBe(75);
    expect(percent(5, 0)).toBe(0);
  });

  it("formatClock 10 daqiqadan ko'p va manfiy vaqtni to'g'ri ko'rsatadi", () => {
    expect(formatClock(725)).toBe("12:05");
    expect(formatClock(59.2)).toBe("01:00");
    expect(formatClock(-3)).toBe("00:00");
  });

  it("formatMinutes kamida 1 daqiqa qaytaradi", () => {
    expect(formatMinutes(20)).toBe("1 daqiqa");
    expect(formatMinutes(150)).toBe("3 daqiqa");
  });

  it("scoreTone chegaralari", () => {
    expect(scoreTone(80)).toBe("success");
    expect(scoreTone(50)).toBe("warning");
    expect(scoreTone(49)).toBe("error");
  });
});
