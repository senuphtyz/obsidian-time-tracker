import { App, TFile, requestUrl } from "obsidian";
import MobaTimeCredentialsModal from "./MobaTimeCredentialsModal";
import { getWorkTimesOfFile } from "../Utils/TimeUtils";
import { type TimeTrackerSettings } from "../Types/TimeTrackerSettings";
import { type MobaTimeEntry } from "./MobaTimeEntry";
import { EntryCode } from "./EntryCode";
import moment from "moment";

export default class MobaTimeClient {
    constructor(
        private app: App,
        private settings: TimeTrackerSettings,
    ) {

    }

    /**
     * Login to create a session and return needed cookie.
     */
    private async login(): Promise<string[]> {
        return new Promise((resolve) => {
            const modal = new MobaTimeCredentialsModal(this.app, (data) => {
                const url = new URL(this.settings.moba.url);
                const req = requestUrl({
                    url: this.settings.moba.url + "Account/LogOn",
                    method: "POST",
                    contentType: "application/json; charset=utf-8",
                    headers: {
                        "Origin": url.protocol + "//" + url.host,
                        "Referer": this.settings.moba.url,
                    },
                    body: JSON.stringify({
                        "username": data.username,
                        "password": data.password,
                        "mandatorId": this.settings.moba.mandatorId,
                        "errors": [],
                    })
                })

                req.then((value) => {
                    // @ts-ignore
                    resolve(value.headers["set-cookie"]);
                }).catch((err) => {
                    console.error(err);
                })
            });
            modal.open();
        });
    }

    private async logoff(cookies: string[]): Promise<void> {
        const url = new URL(this.settings.moba.url);

        await requestUrl({
            url: this.settings.moba.url + "Account/LogOff",
            method: "POST",
            headers: {
                "Origin": url.protocol + "//" + url.host,
                "Referer": this.settings.moba.url,
            },
        })
    }

    /**
     * Store given date to moba time.
     */
    private async store_value(cookies: string[], dateTime: string, entryCode: EntryCode) {
        const dt = moment(dateTime);

        const data: MobaTimeEntry = {
            periode0Date: dt.format("DD.MM.YYYY"),
            periode0Time: dt.format("HH:mm"),
            employeeId: this.settings.moba.employeeId,
            selectedEntryCode: entryCode,
            selectedPeriodType: 0,
            note: ".."
        };

        const url = new URL(this.settings.moba.url);
        const req = requestUrl({
            url: this.settings.moba.url + "Entry/SaveEntry",
            method: "POST",
            contentType: "application/json; charset=utf-8",
            headers: {
                "Origin": url.protocol + "//" + url.host,
                "Referer": this.settings.moba.url,
                "Cookie": cookies[0],
            },
            body: JSON.stringify(data),
        })

        await req;
    }

    /**
     * Synchronize given file times with moba time.
     */
    async synchronize(file: TFile) {
        const cookies = await this.login();

        try {
            const wt = getWorkTimesOfFile(this.app, file, this.settings, true);

            if (!wt.work_start || !wt.work_end) {
                throw new Error("Cannot synchronize without work_start");
            }

            await this.store_value(cookies, wt.work_start, EntryCode.WORK_START);

            if (!!wt.pause_start && !!wt.pause_end) {
                await this.store_value(cookies, wt.pause_start, EntryCode.PAUSE_START);
                await this.store_value(cookies, wt.pause_end, EntryCode.PAUSE_END);
            }

            await this.store_value(cookies, wt.work_end, EntryCode.WORK_END);
        } finally {
            await this.logoff(cookies);
        }
    }
}