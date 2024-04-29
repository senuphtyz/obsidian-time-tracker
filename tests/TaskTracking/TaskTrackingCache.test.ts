import { TaskTrackingCache } from "../../src/TaskTracking/Cache/TaskTrackingCache";
import { beforeEach, describe, expect, test } from "@jest/globals";

describe('Check if cache logic is properly working', () => {
    let cache: TaskTrackingCache;

    beforeEach(() => {
        cache = new TaskTrackingCache();

        for (let i = 10; i < 20; i++) {
            cache.addEntry({
                date: `2000-01-${i}`,
                entry: { start: `00:${i}`, end: `01:${i}`, payload: {}, task: `Task ${i - 9}` },
                taskReference: null,
            }, `/a-nice-file/${i}`);
        }
    });

    test("Add some entries", () => {
        expect(cache.length).toBe(10);

        cache.addEntry({
            date: "2000-01-01",
            entry: { start: "00:00", end: "01:00", payload: {}, task: "a task" },
            taskReference: null,
        }, "/a-nice-file");

        expect(cache.length).toBe(11);
    });

    test("Check if running task handling properly works", () => {
        expect(cache.runningTaskEntry).toBeUndefined();

        cache.addEntry({
            date: "2000-01-01",
            entry: { start: "00:00", end: "", payload: {}, task: "running Task!" },
            taskReference: null,
        }, "/a-nice-file/for-a-running-task");

        expect(cache.runningTaskEntry).not.toBeUndefined();
        expect(cache.runningTaskEntry?.date).toBe("2000-01-01");
        expect(cache.runningTaskEntry?.entry.task).toBe("running Task!");

        cache.clearRunningTaskEntry();
        expect(cache.runningTaskEntry).toBeUndefined();
    });

    test("Check if last tracking is properly handled", () => {
        const beforeChange = cache.getLastTrack("Task 1");
        expect(beforeChange).not.toBeUndefined();

        cache.addEntry({
            date: `2000-01-11`,
            entry: { start: `04:00`, end: "05:12", payload: {}, task: `Task 1` },
            taskReference: null,
        }, `/a-nice-file/1`);

        const afterChange = cache.getLastTrack("Task 1");
        expect(afterChange).not.toBeUndefined();
        expect(beforeChange).not.toEqual(afterChange);
        expect(afterChange?.entry.start).toBe("04:00");
        expect(afterChange?.entry.end).toBe("05:12");
    });

    test("Check if hastDate properly working", () => {
        expect(cache.hasDate('2000-01-10')).toBeTruthy();
        expect(cache.hasDate('1999-01-01')).not.toBeTruthy();
    });

    test("Check if entries are returned", () => {
        const entries = cache.entries;
        expect(cache.length).toBe(entries.length);
    });
});