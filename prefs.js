'use strict';

const { Adw, Gio, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


function init() {
}

function fillPreferencesWindow(window) {
    // Use the same GSettings schema as in `extension.js`
    const settings = ExtensionUtils.getSettings(
        'org.gnome.shell.extensions.lockdown-mode');
    
    // Create a preferences page and group
    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup();
    page.add(group);

    {
        const row = new Adw.ActionRow({ title: 'Only Once (For Debugging)' });
        group.add(row);

        const toggle = new Gtk.Switch({
            active: settings.get_boolean('only-once'),
            valign: Gtk.Align.CENTER,
        });
        settings.bind(
            'only-once',
            toggle,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        row.add_suffix(toggle);
        row.activatable_widget = toggle;
    }
    {
        const row = new Adw.ActionRow({ title: 'Only Current Workspace' });
        group.add(row);

        const toggle = new Gtk.Switch({
            active: settings.get_boolean('only-current-workspace'),
            valign: Gtk.Align.CENTER,
        });
        settings.bind(
            'only-current-workspace',
            toggle,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        row.add_suffix(toggle);
        row.activatable_widget = toggle;
    }
    /*{
        const row = new Adw.ActionRow({ title: 'Exit Mode' });
        group.add(row);

        const dropdown = new Gtk.ListBox({
            //
            valign: Gtk.Align.CENTER,
        });
        settings.bind(
            'exit-mode',
            dropdown,
            //
            Gio.SettingsBindFlags.DEFAULT
        );

        row.add_suffix(dropdown);
        //
    }*/
    // TODO: Add exit-filter

    // Add our page to the window
    window.add(page);
}
