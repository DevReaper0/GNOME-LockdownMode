glib-compile-schemas schemas/
sudo cp -f schemas/org.gnome.shell.extensions.lockdown-mode.gschema.xml /usr/share/glib-2.0/schemas/
cd /usr/share/glib-2.0/schemas/
sudo glib-compile-schemas .
