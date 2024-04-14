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
			.setDesc("test")
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

		new Setting(containerEl)
			.setHeading()
			.setName("MobaTime");

		new Setting(containerEl)
			.setName("Enable")
			.setDesc("Enables sync command to sync todays worktime with MobaTime")
			.addToggle(t => t
				.setValue(this.plugin.settings.moba.enabled)
				.onChange(async (value) => {
					this.plugin.settings.moba.enabled = value;
					await this.plugin.saveSettings();
				})
			)

		new Setting(containerEl)
			.setName("URL")
			.setDesc("Base URL for MobaTime")
			.addText(text => text
				.setValue(this.plugin.settings.moba.url)
				.onChange(async (value) => {
					this.plugin.settings.moba.url = value;
					await this.plugin.saveSettings();
				})
			)

		new Setting(containerEl)
			.setName("MandatorId")
			.setDesc("MandatorId for MobaTime to authenticate")
			.addText(text => text
				.setValue(this.plugin.settings.moba.mandatorId)
				.onChange(async (value) => {
					this.plugin.settings.moba.mandatorId = value;
					await this.plugin.saveSettings();
				})
			)

		new Setting(containerEl)
			.setName("EmployeeId")
			.setDesc("EmployeeId for MobaTime to authenticate")
			.addText(text => text
				.setValue(this.plugin.settings.moba.employeeId)
				.onChange(async (value) => {
					this.plugin.settings.moba.employeeId = value;
					await this.plugin.saveSettings();
				})
			)

		new Setting(containerEl)
			.setName("CA")
			.setDesc("CA to trust")
			.addTextArea(text => text
				.setValue(this.plugin.settings.moba.ca)
				.onChange(async (value) => {
					this.plugin.settings.moba.ca = value;
					await this.plugin.saveSettings();
				})
			)
	}
}