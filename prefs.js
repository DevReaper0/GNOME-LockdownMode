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
    {
      const row = new Adw.ActionRow({ title: 'Interval' });
      group.add(row);

      let spinButton = new Gtk.SpinButton();
      spinButton.set_sensitive(true);
      spinButton.set_digits(3);
      spinButton.set_range(0.001, 60);
      spinButton.set_value(settings.get_double('interval'));
      spinButton.set_increments(0.25, 0.25);
      spinButton.width_chars = -1;
      settings.bind(
        'interval',
        spinButton,
        'value',
        Gio.SettingsBindFlags.DEFAULT
      );

      row.add_suffix(spinButton);
      row.activatable_widget = spinButton;
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
    {
        const row = new Adw.ActionRow({ title: 'Whitelist' });
        group.add(row);

        const listBox = new Gtk.ListBox();
        row.add_suffix(listBox);

        const whitelist = settings.get_strv('whitelist');
        for (const appId of whitelist) {
            const listBoxRow = createAppIdRow(appId, settings, listBox);
            listBox.append(listBoxRow);
        }
        
        // Add 'Add' button to add new application id strings
        const addButton = new Gtk.Button({ label: 'Add' });
        addButton.connect('clicked', () => {
            const listBoxRow = createAppIdRow('', settings, listBox);
            listBox.append(listBoxRow, -1);
        });
        row.add_suffix(addButton);
    }
    // Add our page to the window
    window.add(page);

    window.search_enabled = true;
}

function createAppIdRow(appId, settings, listBox) {
    const listBoxRow = new Gtk.ListBoxRow({ selectable: false });
    const entry = new Gtk.Entry({ text: appId });
    entry.connect('changed', () => {
        const newAppId = entry.get_text();
        const allowedApps = settings.get_strv('whitelist');
        const index = allowedApps.indexOf(appId);
        if (newAppId === '') {
            if (index >= 0) {
                allowedApps.splice(index, 1);
                listBox.remove(listBoxRow);
            }
        } else {
            if (index >= 0) {
                allowedApps.splice(index, 1, newAppId);
            } else {
                allowedApps.push(newAppId);
            }
            appId = newAppId;
        }
        settings.set_strv('whitelist', allowedApps);
    });

    const removeButton = new Gtk.Button({
        label: 'Remove',
        margin_start: 6,
        halign: Gtk.Align.END,
    });
    removeButton.connect('clicked', () => {
        const allowedApps = settings.get_strv('whitelist');
        const index = allowedApps.indexOf(appId);
        if (index >= 0) {
            allowedApps.splice(index, 1);
            settings.set_strv('whitelist', allowedApps);
        }
        listBox.remove(listBoxRow);
    });

    const grid = new Gtk.Grid();
    grid.attach(entry, 0, 0, 1, 1);
    grid.attach(removeButton, 1, 0, 1, 1);

    listBoxRow.set_child(grid);
    return listBoxRow;
}

