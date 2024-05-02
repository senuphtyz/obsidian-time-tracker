import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { NoteService } from "../src/NoteService";
import moment from "moment";
import type { FrontMatterCache, TFile } from "obsidian";
import { DailyNoteMissingException } from "../src/Exception";

describe('Check if noteService is properly working', () => {
    let service: NoteService;
    let plugin: object;

    beforeEach(() => {
        plugin = {
            app: {
                fileManager: {},
                vault: {},
                internalPlugins: {
                    getPluginById: jest.fn().mockReturnValue({
                        instance: {
                            options: {
                                folder: "/Daily-Note-Folder",
                                format: "YYYY-DD-MM",
                                template: "/Template/DailyNote.md"
                            }
                        }
                    })
                }
            }
        };

        // @ts-ignore
        service = new NoteService(plugin);
    });

    test('Check if dailyNoteSettings are properly returned', () => {
        const dns = service.dailyNoteSettings;

        expect(dns).toBeDefined();
        expect(dns.folder).toBe("/Daily-Note-Folder");
        expect(dns.format).toBe("YYYY-DD-MM");
        expect(dns.template).toBe("/Template/DailyNote.md");
    });

    test('Check for dailyNote default setttings', () => {
        // @ts-ignore
        plugin.app.internalPlugins.getPluginById = jest.fn().mockReturnValue(undefined);

        const dns = service.dailyNoteSettings;
        expect(dns).toBeDefined();
        expect(dns.folder).toBe("");
        expect(dns.format).toBe("YYYY-MM-DD");
        expect(dns.template).toBe("");
    });

    test('Check if find by date find files', () => {
        // @ts-ignore
        plugin.app.vault.getFileByPath = jest.fn((path: string) => {
            return path == '/Daily-Note-Folder/2023-04-01.md' ? { path: "/Daily-Note-Folder/2023-04-01.md" } : null;
        });

        expect(service.findFileByDate("2023-04-01")).toStrictEqual({
            path: "/Daily-Note-Folder/2023-04-01.md"
        })
        expect(service.findFileByDate("2023-04-23")).toBeNull();
    });

    test('Check if findFileByPath properly works', () => {
        const fn = jest.fn();

        // @ts-ignore
        plugin.app.vault.getFileByPath = fn;

        service.findFileByDate("2023-04-01");
        expect(fn).toBeCalledWith("/Daily-Note-Folder/2023-04-01.md");

        service.findFileByDate(moment("2023-04-22", "YYYY-MM-DD"));
        expect(fn).toBeCalledWith("/Daily-Note-Folder/2023-22-04.md");
    });

    test('Check if date is properly returned from TAbstractFile', () => {
        // @ts-ignore
        const ret = service.getDateOfFilePath({
            name: "2023-22-03"
        })

        expect(ret).toBe("2023-03-22");
    });

    test('Check if processFrontMatter is properly called', () => {
        const fm: FrontMatterCache = {};
        const file = { path: "/path-of-a-cow-file.md" };

        // @ts-ignore
        plugin.app.fileManager.processFrontMatter = jest.fn((file: TFile, fn: (fm: FrontMatterCache) => void) => {
            fn(fm);
        });

        // @ts-ignore
        plugin.app.vault.getFileByPath = jest.fn((path: string) => {
            if (path == "/Daily-Note-Folder/2023-12-02.md") {
                return file;
            }

            return null;
        })

        const fn = jest.fn();

        service.processFrontMatter("2023-12-02", fn);

        // @ts-ignore
        expect(plugin.app.fileManager.processFrontMatter).toBeCalled();

        // @ts-ignore
        expect(plugin.app.vault.getFileByPath).toBeCalled();
        expect(fn).toBeCalledWith(fm, file);

        expect(() => {
            service.processFrontMatter("2023-12-03", fn);
        }).toThrow(DailyNoteMissingException);
    });
});