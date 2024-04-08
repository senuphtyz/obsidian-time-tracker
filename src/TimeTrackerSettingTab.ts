import { App, PluginSettingTab, Setting } from "obsidian";
import TimeTrackerPlugin from "./TimeTrackerPlugin";

export default class TimeTrackerSettingTab extends PluginSettingTab {
	plugin: TimeTrackerPlugin;

	constructor(app: App, plugin: TimeTrackerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl).setHeading().setName("Time Tracker");

		new Setting(containerEl)
			.setName("Datetime format to use")
			.setDesc("MomentJS format used to format time")
			.addMomentFormat(fmt => fmt
				.setDefaultFormat("HH:mm")
				.setValue(this.plugin.settings.time_format)
				.onChange(async (value) => {
					this.plugin.settings.time_format = value;
					await this.plugin.saveSettings();
				})
			)

		new Setting(containerEl)
			.setName('Property for work start')
			.addText(text => text
				.setValue(this.plugin.settings.property_work_start)
				.onChange(async (value) => {
					this.plugin.settings.property_work_start = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Property for work end')
			.addText(text => text
				.setValue(this.plugin.settings.property_work_end)
				.onChange(async (value) => {
					this.plugin.settings.property_work_end = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Property for pause start')
			.addText(text => text
				.setValue(this.plugin.settings.property_work_start)
				.onChange(async (value) => {
					this.plugin.settings.property_work_start = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Property for pause end')
			.addText(text => text
				.setValue(this.plugin.settings.property_work_end)
				.onChange(async (value) => {
					this.plugin.settings.property_work_end = value;
					await this.plugin.saveSettings();
				}));
	}
}