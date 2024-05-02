import { TaskTrackingService } from "../../src/TaskTracking/TaskTrackingService";
import { TaskTrackingCache } from "../../src/TaskTracking/Cache/TaskTrackingCache";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { ReferencedTrackingEntry } from "src/TaskTracking/Types/ReferencedTrackingEntry";

describe('Check if taskTrackingService is properly working', () => {
    let service: TaskTrackingService;
    const noteService = {
        "processFrontMatter": (date: string, fn: any) => {
            fn({
                "time_tracking": [
                    { start: "01:00", end: "", task: "Running Task" },
                ]
            }, {
                path: "/running-task"
            });
        }
    };

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
                    tasks: [
                        { text: "Page API Task 1" }
                    ]
                }
            })
        };

        // @ts-ignore
        service = new TaskTrackingService(plugin, cache, api, noteService);

        for (let i = 10; i < 30; i++) {
            cache.addEntry({
                date: `2020-01-${i}`,
                entry: {
                    start: `00:${i}`,
                    end: `01:${i}`,
                    task: `Task ${i - 9}`
                },
                taskReference: null,
            }, `/a-filepath-to-file-${i}`)
        }

        cache.addEntry({
            date: "2021-01-01",
            entry: {
                start: "01:00",
                end: "",
                task: "Running Task"
            },
            taskReference: null
        }, "/running-task");
    });

    test('Check if preselected task works properly', () => {
        expect(service.getListOfPreselectedTasks(10)).toHaveLength(10);
        expect(service.getListOfPreselectedTasks(3)).toHaveLength(3);
    });

    test('Check if list is filled up using dataview api to fetch new tasks', () => {
        const tasks = service.getListOfPreselectedTasks(21);

        expect(tasks).toHaveLength(21);

        const r = tasks.filter(t => t.text == 'Page API Task 1');
        expect(r).toHaveLength(1);
    });

    test('Check if stop will properly stop current running task entry', () => {
        expect(service.runningTaskEntry).toBeDefined();
        service.stopRunningTracking()

        expect(service.runningTaskEntry).toBeUndefined();
    });

    test('Check if start properly starts a task', () => {
        expect(service.runningTaskEntry).toBeDefined();
        expect(service.runningTaskEntry?.text).not.toEqual("Task 1");
        service.startTracking("Task 1");
        expect(service.runningTaskEntry).toBeDefined();
        expect(service.runningTaskEntry?.text).toEqual("Task 1");
    });

    test('Check if cache is properly updated for a file', () => {
        const file = {
            path: "/daily-note",
        }

        const plugin = {
            app: {
                vault: {
                    on: jest.fn()
                },
                metadataCache: {
                    getCache: jest.fn().mockReturnValueOnce({
                        frontmatter: {
                            "time_tracking": [
                                {
                                    task: "Give a cow more food",
                                    start: "04:00",
                                    end: "06:00"
                                }
                            ]
                        }
                    })
                }
            },
            registerEvent: jest.fn(),
        };

        const noteService = {
            findFileByDate: jest.fn().mockReturnValueOnce(file),
            getDateOfFilePath: jest.fn().mockReturnValue("2020-01-01"),
        };

        const api = {
            pages: jest.fn().mockReturnValue({
                file: { tasks: [] }
            })
        };

        const cache = new TaskTrackingCache();

        expect(cache.length).toBe(0);

        // @ts-ignore
        service = new TaskTrackingService(plugin, cache, api, noteService);
        service.cacheTrackingData();

        expect(cache.length).toBe(1);
        expect(cache.entries[0]).toStrictEqual({
            date: "2020-01-01",
            entry: {
                task: "Give a cow more food",
                start: "04:00",
                end: "06:00"
            },
            taskReference: null
        } as ReferencedTrackingEntry)
    });
});