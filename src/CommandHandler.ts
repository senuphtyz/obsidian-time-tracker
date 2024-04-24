import { App, type Command } from "obsidian";
import TimeTrackerPlugin from "./TimeTrackerPlugin";
import MobaTimeClient from "./MobaTimeClient/MobaTimeClient";
import { findDailyNoteOfToday, setCurrentTimeToProperty } from "./Utils/NoteUtils";


export default class CommandHandler {
    constructor(
        private readonly app: App,
        private readonly plugin: TimeTrackerPlugin,
    ) {
    }

    /**
     * Internal helper to add a command.
     */
    private addCommand(cmd: Command) {
        return this.plugin.addCommand({
            id: `tt-${cmd.id}`,
            name: `Time-Tracker: ${cmd.name}`,
            callback: cmd.callback,
            checkCallback: cmd.checkCallback,
        })
    }

    /**
     * Register commands.
     */
    register() {
        const settings = this.plugin.settings;

        this.addCommand({ id: 'start-work', name: 'Start work', callback: this.buildPropertyCallback(settings.property_work_start) });
        this.addCommand({ id: 'start-pause', name: 'Start pause', callback: this.buildPropertyCallback(settings.property_pause_start) });
        this.addCommand({ id: 'end-pause', name: 'Stop pause', callback: this.buildPropertyCallback(settings.property_pause_end) });
        this.addCommand({ id: 'end-work', name: 'Stop work', callback: this.buildPropertyCallback(settings.property_work_end) });

        this.addCommand({
            id: 'sync-day',
            name: 'Sync current day',
            checkCallback: (checking: boolean) => {
                if (checking) {
                    return this.plugin.settings.moba.enabled;
                }

                this.syncCommand();
                return true;
            },
        });
    }

    /**
     * Handler for sync command.
     */
    private async syncCommand() {
        const dailyNote = findDailyNoteOfToday(this.app);

        if (!dailyNote) {
            return;
        }

        if (this.plugin.settings.moba.enabled) {
            const client = new MobaTimeClient(this.app, this.plugin.settings);
            await client.synchronize(dailyNote);
        }
    }

    /**
     * Generate a handler based on 
     * @param property 
     * @returns 
     */
    private buildPropertyCallback(property: string) {
        const app = this.app;
        const plugin = this.plugin;

        return async function () {
            await setCurrentTimeToProperty(app, property);
            plugin.updateView();
        }
    }
}