import { describe, test, expect } from "@jest/globals";
import { calculateWorkTime } from "../../src/Utils/TimeUtils";
import type WorkTimes from "../../src/Types/WorkTimes";

interface TestCase {
    id: string;
    times: WorkTimes;
    expected: string;
}


describe('Validate work time calucation', () => {
    const testCases: TestCase[] = [
        {
            id: "without pause",
            times: { work_start: "8:00", work_end: "12:00", pause_start: null, pause_end: null, },
            expected: "🕑 04:00"
        },
        {
            id: "with pause",
            times: { work_start: "8:00", work_end: "12:00", pause_start: "09:00", pause_end: "10:00", },
            expected: "🕑 03:00"
        },
        {
            id: "with missing pause end",
            times: { work_start: "8:00", work_end: "12:00", pause_start: "09:00", pause_end: null, },
            expected: "🕑 04:00"
        },
        {
            id: "with missing pause start",
            times: { work_start: "8:00", work_end: "12:00", pause_start: null, pause_end: "10:00", },
            expected: "🕑 04:00"
        },
        {
            id: "without times",
            times: { work_start: null, work_end: null, pause_start: null, pause_end: null, },
            expected: "🕑 Work not started"
        },
        {
            id: "with minute exact times #1",
            times: { work_start: "8:32", work_end: "10:33", pause_start: null, pause_end: null, },
            expected: "🕑 02:01"
        },
        {
            id: "with minute exact times #2",
            times: { work_start: "8:32", work_end: "10:31", pause_start: null, pause_end: null, },
            expected: "🕑 01:59"
        }
    ];

    for (const tc of testCases) {
        test(tc.id, () => {
            expect(calculateWorkTime(tc.times)).toBe(tc.expected);
        });
    }
});