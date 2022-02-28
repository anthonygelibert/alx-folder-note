import "./main.less";

import { FolderNoteAPI, getApi } from "@aidenlx/folder-note-core";
import { Notice, Plugin } from "obsidian";

import { ClickNotice } from "./misc";
import {
  ALxFolderNoteSettings,
  ALxFolderNoteSettingTab,
  DEFAULT_SETTINGS,
  MobileNoClickMark,
  noHideNoteMark,
} from "./settings";
import { monkeyPatch } from "./fe-patch";

const foldervNotifiedKey = "foldervNotified";

export default class ALxFolderNote extends Plugin {
  settings: ALxFolderNoteSettings = DEFAULT_SETTINGS;

  get CoreApi(): FolderNoteAPI {
    let message;
    const api = getApi(this);
    if (api) {
      return api;
    } else {
      message =
        "Failed to initialize alx-folder-note: Click here for more details";
      new ClickNotice(message, () =>
        this.app.setting.openTabById(this.manifest.id),
      );
      throw new Error(message);
    }
  }

  noticeFoldervChange() {
    if (
      !this.app.plugins.plugins["alx-folder-note-folderv"] && // not installed
      !Number(localStorage.getItem(foldervNotifiedKey)) // not notified
    ) {
      new ClickNotice(
        (frag) => {
          frag.appendText(
            "Since v0.13.0, folder overview (folderv) has become an optional component " +
              "that requires a dedicated plugin, ",
          );
          frag
            .createEl("button", {
              text: "Go to Folder Overview Section of the Setting Tab to Install",
            })
            .addEventListener("click", () =>
              this.app.setting.openTabById(this.manifest.id),
            );
          frag.createEl("button", {
            text: "Don't show this again",
          });
        },
        () => localStorage.setItem(foldervNotifiedKey, "1"),
        5e3,
      );
    }
  }

  initialized = false;
  initialize() {
    if (this.initialized) return;
    monkeyPatch(this);
    document.body.toggleClass(
      MobileNoClickMark,
      !this.settings.mobileClickToOpen,
    );
    document.body.toggleClass(
      noHideNoteMark,
      !this.settings.hideNoteInExplorer,
    );
    this.initialized = true;
  }

  async onload() {
    console.log("loading alx-folder-note");

    await this.loadSettings();

    let tab = new ALxFolderNoteSettingTab(this.app, this);
    if (!tab.checkMigrated())
      new Notice(
        "Old config not yet migrated, \n" +
          "Open Settings Tab of ALx Folder Note for details",
      );
    this.addSettingTab(tab);

    this.app.workspace.onLayoutReady(this.initialize.bind(this));
    this.noticeFoldervChange();
  }

  async loadSettings() {
    this.settings = { ...this.settings, ...(await this.loadData()) };
    this.setupLongPressDelay();
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  get longPressDelay(): number {
    return this.settings.longPressDelay;
  }
  set longPressDelay(delay: number) {
    this.settings.longPressDelay = delay;
    document.body.dataset[longPressDelayDataKey] = `${delay}`;
  }
  setupLongPressDelay() {
    // set long press delay to the body
    this.longPressDelay = this.longPressDelay;
    this.register(() => delete document.body.dataset[longPressDelayDataKey]);
  }
}

const longPressDelayDataKey = "longPressDelay";
