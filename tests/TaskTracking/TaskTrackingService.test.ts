import { TaskTrackingService } from "../../src/TaskTracking/TaskTrackingService";
import { TaskTrackingCache } from "../../src/TaskTracking/Cache/TaskTrackingCache";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";

describe('Check if taskTrackingService is properly working', () => {
    let service: TaskTrackingService;

    beforeEach(() => {
        const cache = new TaskTrackingCache();
        const plugin = {
            registerEvent: jest.fn(),
            app: {
                vault: {
                    on: jest.fn()
                }
            }
        };
        const api = {
            pages: jest.fn().mockReturnValue({
                file: {
                    tasks: []
                }
            })
        };
        const noteService = {};

        // @ts-ignore
        service = new TaskTrackingService(plugin, cache, api, noteService);

        for (let i = 10; i < 30; i++) {
            cache.addEntry({
                date: "",
                entry: {
                    start: `00:${i}`,
                    end: `01:${i}`,
                    task: `Task ${i - 9}`
                },
                taskReference: null,
            }, `/a-filepath-to-file-${i}`)
        }
    });

    test('Check if preselected task works properly', () => {
        const tasks = service.getListOfPreselectedTasks();
        expect(tasks).toHaveLength(10);

    });
    
    /*
    test("Add some entries", () => {
        expect(cache.length).toBe(10);

        cache.addEntry({
            date: "2000-01-01",
            entry: { start: "00:00", end: "01:00", payload: {}, task: "a task" },
            taskReference: null,
        }, "/a-nice-file");

        expect(cache.length).toBe(11);
    });
    */
});