const {Meta, Gio, St, GObject} = imports.gi;
const Mainloop = imports.mainloop;
const QuickSettings = imports.ui.quickSettings;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

// This is the live instance of the Quick Settings menu
const QuickSettingsMenu = imports.ui.main.panel.statusArea.quickSettings;

const ExitMode = {
    DELETE: 0,
    KILL: 1,
    MINIMIZE: 2,
    HIDE_UNDER: 3
};
const ExitFilter = {
    ALL: 0,
    NOT_HIDDEN: 1,
    FOCUSED: 2
};

let timerId = null;
let braveApp = null;

class Extension {
    constructor() {
        this.settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.lockdown-mode');
        this._indicator = null;
    }

    checkWindows = () => {
        if (this.settings.get_boolean('enabled')) {
            const windows = global.display.get_tab_list(Meta.TabList.NORMAL_ALL, this.settings.get_boolean('only-current-workspace') ? global.workspace_manager.get_active_workspace() : null);
            for (let i = 0; i < windows.length; i++) {
                if ((this.settings.get_enum('exit-filter') === ExitFilter.FOCUSED && !windows[i].has_focus()) || (this.settings.get_enum('exit-filter') === ExitFilter.NOT_HIDDEN && windows[i].is_hidden())) {
                    continue;
                }

                let wmClass = windows[i].get_wm_class();
                if (!wmClass) {
                    // Window does not have a WM_CLASS property, skip it
                    continue;
                }

                let appInfo = Gio.AppInfo.create_from_commandline(wmClass, null, Gio.AppInfoCreateFlags.NONE);
                if (!wmClass) {
                    // Could not retrieve app info, skip it
                    continue;
                }

                let appExecutable = appInfo.get_executable();
                if (!appExecutable) {
                    // Could not retrieve app executable, skip it
                    continue;
                }

                // Check if the application executable is the Brave browser
                // TODO: Don't hardcode this!
                if (appExecutable != braveApp && appExecutable != "Brave-browser" && appExecutable != "Brave-browser-beta") {
                    if (this.settings.get_enum('exit-mode') === ExitMode.HIDE_UNDER) {
                        windows[i].lower();
                    }
                    else if (this.settings.get_enum('exit-mode') === ExitMode.MINIMIZE) {
                        windows[i].minimize();
                    }
                    else if (this.settings.get_enum('exit-mode') === ExitMode.KILL) {
                        windows[i].kill();
                    }
                    else {
                        windows[i].delete(global.get_current_time());
                    }
                }
            }
        }

        // Keep checking if enabled and not set to run only once
        timerId = Mainloop.timeout_add_seconds(5, this.checkWindows);

        // If set to run only once, disable the extension after first run
        if (this.settings.get_boolean('only-once')) {
            this.settings.set_boolean('enabled', false);
        }
    }


    enable() {
        this._indicator = new FeatureIndicator();

        // Find the Brave browser app
        let appSys = Gio.AppInfo.get_default_for_type('x-scheme-handler/http', true);
        braveApp = appSys.get_executable();
        log('[EXTENSION_LOG]', braveApp);

        // Start checking for non-Brave windows
        timerId = Mainloop.timeout_add_seconds(5, this.checkWindows);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;

        if (timerId) {
            Mainloop.source_remove(timerId);
            timerId = null;
        }
    }
}

function init() {
  return new Extension();
}







const FeatureToggle = GObject.registerClass(
class FeatureToggle extends QuickSettings.QuickToggle {
    _init() {
        super._init({
            label: 'Lockdown Mode',
            iconName: 'enabled',
            toggleMode: true,
        });

        // Binding the toggle to a GSettings key
        this._settings = new Gio.Settings({
            schema_id: 'org.gnome.shell.extensions.lockdown-mode',
        });

        this._settings.bind('enabled',
            this, 'checked',
            Gio.SettingsBindFlags.DEFAULT);
    }
});

const FeatureIndicator = GObject.registerClass(
class FeatureIndicator extends QuickSettings.SystemIndicator {
    _init() {
        super._init();

        // Create the icon for the indicator
        this._indicator = this._addIndicator();
        this._indicator.icon_name = 'selection-mode-symbolic';

        // Showing the indicator when the feature is enabled
        this._settings = new Gio.Settings({
            schema_id: 'org.gnome.shell.extensions.lockdown-mode',
        });

        this._settings.bind('enabled',
            this._indicator, 'visible',
            Gio.SettingsBindFlags.DEFAULT);
        
        // Create the toggle and associate it with the indicator, being sure to
        // destroy it along with the indicator
        this.quickSettingsItems.push(new FeatureToggle());
        
        this.connect('destroy', () => {
            this.quickSettingsItems.forEach(item => item.destroy());
        });
        
        // Add the indicator to the panel and the toggle to the menu
        QuickSettingsMenu._indicators.add_child(this);
        QuickSettingsMenu._addItems(this.quickSettingsItems);
    }
});
