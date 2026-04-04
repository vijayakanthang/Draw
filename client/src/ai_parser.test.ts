import { expect, test } from 'vitest';

function simulateAiParser(input: string) {
    if (!input.trim()) return [];
    const parts = input.split("->").map(p => p.trim());
    const shapes: any[] = [];
    const startX = 200;
    const startY = 300;
    const gap = 240;

    parts.forEach((label, i) => {
        const x = startX + i * gap;
        const y = startY;
        shapes.push({
            type: "rectangle",
            start: { x, y },
            end: { x: x + 140, y: y + 60 },
            text: label,
        });
        if (i < parts.length - 1) {
            shapes.push({
                type: "arrow",
                start: { x: x + 140, y: y + 30 },
                end: { x: x + gap, y: y + 30 },
            });
        }
    });
    return shapes;
}

test('AI Parser: converts "A -> B" correctly', () => {
    const result = simulateAiParser("Login -> Dashboard");
    expect(result).toHaveLength(3);
    expect(result[0].text).toBe("Login");
    expect(result[2].text).toBe("Dashboard");
});
