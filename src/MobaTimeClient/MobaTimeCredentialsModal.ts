import { App, Modal, Setting } from "obsidian";


export interface MobaTimeCredentialsData {
    username: string;
    password: string;
}

export default class MobaTimeCredentialsModal extends Modal {
    private onSubmit: (result: MobaTimeCredentialsData) => void;

    constructor(app: App, onSubmit: (result: MobaTimeCredentialsData) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const result: MobaTimeCredentialsData = {
            username: "",
            password: "",
        };

        let { contentEl } = this;
        new Setting(contentEl)
            .setHeading()
            .setName("MobaTime credentials");

        new Setting(contentEl)
            .setName("Username")
            .setDesc("Username to authenticate against MobaTime")
            .addText(text => text
                .onChange((value) => {
                    result.username = value;
                })
            )

        new Setting(contentEl)
            .setName("Password")
            .setDesc("Password to authenticate against MobaTime")
            .addText((text) => {
                text.inputEl.setAttr("type", "password");
                text.onChange((value) => {
                    result.password = value;
                });
            }
            )

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText("Übernehmen")
                .onClick((evt) => {
                    this.close();
                    this.onSubmit(result);
                })
            )
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}