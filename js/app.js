(function() {

    // Represents single task. Contains observable properties
    // `name`, `min`, `max` and `editing`. The `editing`
    // property is used for editing mode.

    var Task = function(data) {
        var self = this;

        self.name = ko.observable(data.name);
        self.min = ko.observable(data.min);
        self.max = ko.observable(data.max);

        // Property `editing` is used for setting
        // editing mode.

        self.editing = ko.observable(false);

        // Turns on the editing mode.

        self.edit = function() {
            self.editing(true);
        };

        // Turns off the editing mode.

        self.save = function() {
            self.editing(false);
        };

        // Returns current task as JS object. Used to
        // converting data back to JSON. This computed
        // property is also used for tracking changes.

        self.json = ko.computed(function() {
            return { name: self.name(), min: self.min(), max: self.max() };
        });
    };

    // Represents a project component. Contains observable
    // properties `name`, `description` and `tasks`.

    var Component = function(data) {
        var self = this;

        self.name = ko.observable(data.name);
        self.description = ko.observable(data.description);
        self.tasks = ko.observableArray(wrap(data.tasks, Task));

        // Calculates the total min hours for the component.
        // Finds the sum of its tasks' `min` value.

        self.totalMin = ko.computed(function() {
            var total = 0;
            for (var i = 0; i < self.tasks().length; i++) {
                total += parseFloat(self.tasks()[i].min());
            }
            return total;
        });

        // Calculates the total max hours for the component.
        // Finds the sum of its tasks' `max` value.

        self.totalMax = ko.computed(function() {
            var total = 0;
            for (var i = 0; i < self.tasks().length; i++) {
                total += parseFloat(self.tasks()[i].max());
            }
            return total;
        });

        // Adds new task with the default value.

        self.create = function() {
            self.tasks.push(new Task({ name: 'Unnamed', min: 1.0, max: 2.0 }));
        };

        // Removes the task.

        self.remove = function(task) {
            self.tasks.remove(task);
        };

        // Converts the component into a JS object.
        // Also used for tracking the component changes.
        // Since Task's `json` is accessed, all changes to
        // tasks also propagate here.

        self.json = ko.computed(function() {
            var component = {
                name: self.name(),
                description: self.description(),
                tasks: []
            };
            for (var i = 0; i < self.tasks().length; i++) {
                component.tasks.push(self.tasks()[i].json());
            }
            return component;
        });

        // Creates editing form for the component and displays
        // it using the `dialog()` function. See the template `component-form`
        // which is included in the Bootstrap's modal dialog.

        self.edit = function() {
            var form = {

                // The form contains two editable fields: `name`
                // and `description`. The `name` field must be filled.

                name: ko.observable(self.name()),
                description: ko.observable(self.description()),

                // The observable `nameError` is used for tracking whether
                // the `name` input is valid (filled). The observable
                // `error` is used for displaying the error message.

                nameError: ko.observable(false),
                error: ko.observable(),

                // The `title` is used by the dialog. Does
                // not need to be observable since it does not change.

                title: 'Edit component',

                // The observable `template` sets the template of the form
                // used in the dialog. Does not need to observable.

                template: 'component-form',

                // When the `save` function is called the `name`
                // input is checked and the error is shown when
                // necessary. The `save` function is called when
                // the user clicks the "Save changes" button.

                save: function() {
                    if (empty(form.name())) {
                        form.error('Component name must be entered.');
                        form.nameError(true);
                    } else {
                        disposeDialog();
                        self.name(form.name());
                        self.description(form.description());
                    }
                },

                // When the `cancel` function is called, the
                // dialog is just removed using the function
                // `disposeDialog()`. The `cancel` is called when
                // the user click the "Cancel" button.

                cancel: function() {
                    disposeDialog();
                }
            };
            dialog(form);
        };
    };

    // Represents one project. A project consists of
    // `name`, `description` and a list of `components`.

    var Project = function(data) {
        var self = this;

        // The `oid` property does not change and thus
        // do not have to be observable.

        self.oid = data.oid;

        self.name = ko.observable(data.name);
        self.description = ko.observable(data.description);
        self.components = ko.observableArray();

        // The observable property `selected` is used
        // for tracking the currently selected project
        // in the projects page.

        self.selected = ko.observable(false);

        self.create = function() {
            var form = {

                // This form is analoguos to the form
                // in `Component`. This form is for creating
                // a new component.

                name: ko.observable(),
                nameError: ko.observable(false),
                description: ko.observable(),
                error: ko.observable(),
                title: 'Create a new component',
                template: 'component-form',
                save: function() {
                    if (empty(form.name())) {
                        form.error('The component name must be entered.');
                        form.nameError(true);
                    } else {
                        disposeDialog();
                        self.components.push(new Component({
                            name: form.name(),
                            description: form.description(),
                            tasks: []
                        }));
                        self.store();
                    }
                },
                cancel: function() {
                    disposeDialog();
                }
            };
            dialog(form);
        };

        // Creates the edit form. The form is analoguos to all
        // previous forms.

        self.edit = function() {
            var form = {
                name: ko.observable(self.name()),
                nameError: ko.observable(false),
                description: ko.observable(self.description()),
                error: ko.observable(),
                title: 'Edit project',
                template: 'project-form',
                save: function() {
                    if (empty(form.name())) {
                        form.error('Project name must be entered.');
                        form.nameError(true);
                    } else {
                        disposeDialog();
                        self.name(form.name());
                        self.description(form.description());
                    }
                },
                cancel: function() {
                    disposeDialog();
                }
            };
            dialog(form);
        };

        // Removes the component from this project.
        // Before removing the confirmation dialog is shown.
        // It works similarly than the previous forms.

        self.remove = function(component) {
            var form = {
                title: 'Removing the component',
                message: 'Remove the component ' + component.name() + '?',

                // The `yes` function is called when the
                // user clicks the "Yes" button.

                yes: function() {
                    disposeConfirm();
                    self.components.remove(component);
                },

                // The `no` function is called when the
                // user clicks the "No" button.

                no: function() {
                    disposeConfirm();
                }
            };
            confirm(form);
        };

        // Loads the project components from the local storage.
        // The observable array `components` is set at once because
        // it is much more efficient than looping over components and
        // calling `push()` for each of them on the array since each
        // `push()` call would trigger array update.

        self.load = function() {
            self.components(wrap(load('components-' + self.oid, []), Component));
        };

        // Saves the project components into the local storage.

        self.store = function() {
            console.log('Storing project ' + self.name());
            localStorage.setItem('components-' + self.oid, ko.toJSON(self.components));
        };

        // Converts the components list into JS object.
        // Components list is stored separatedly from the projects list.

        self.json = ko.computed(function() {
            var components = [];
            for (var i = 0; i < self.components().length; i++) {
                components.push(self.components()[i].json());
            }
            return components;
        });

        // Whenever the list of components changes we
        // store it in the local storage. This is done
        // by explicitly subscribing to the `json` computed
        // observable.

        self.json.subscribe(function() {
            console.log('Components list changed');
            self.store();
        });

        // Calculates the minimum hours for this project.
        // This is the sum of the components totalMin values.

        self.totalMin = ko.computed(function() {
            var total = 0;
            for (var i = 0; i < self.components().length; i++) {
                total += self.components()[i].totalMin();
            }
            return total;
        });

        // Calculates the maximum hours for this project.
        // This is the sum of the components totalMax values.

        self.totalMax = ko.computed(function() {
            var total = 0;
            for (var i = 0; i < self.components().length; i++) {
                total += self.components()[i].totalMax();
            }
            return total;
        });
    };

    // Represents the app. Keeps track of the currently
    // shown page and project.

    var App = function() {
        var self = this;

        // Observable `page` is used for tracking the
        // current page. By default it is `'page-index'`.
        // The observable is used by the KnockoutJS's `template`
        // binding.

        self.page = ko.observable('page-index');

        // The currently selected project.

        self.project = ko.observable();

        // List of projects. Populated from the
        // local storage.

        self.projects = ko.observableArray(wrap(load('project-list', []), Project));

        self.create = function() {

            // Form for creating the new project. The
            // form is analoguos to the previous forms.

            var form = {
                name: ko.observable(),
                nameError: ko.observable(false),
                description: ko.observable(),
                error: ko.observable(),
                title: 'Create a new project',
                template: 'project-form',
                save: function() {
                    if (empty(form.name())) {
                        form.error('Project name must be entered.');
                        form.nameError(true);
                    } else {
                        disposeDialog();

                        // When the project is added, an unique id
                        // is generated by `ObjectId`.

                        self.projects.push(new Project({
                            oid: new ObjectId().toString(),
                            name: form.name(),
                            description: form.description()
                        }));
                    }
                },
                cancel: function() {
                    disposeDialog();
                }
            };
            dialog(form);
        };

        // Selects the project for view.

        self.view = function(project) {
            if (self.project()) {
                self.project().selected(false);
            }

            // Loads project components.

            project.load();
            self.project(project);
            project.selected(true);
        };

        // Selects project by its id. Used
        // by our "router" (see below).

        self.viewById = function(oid) {
            self.page('page-projects');
            for (var i = 0; i < self.projects().length; i++) {
                if (self.projects()[i].oid === oid) {
                    self.view(self.projects()[i]);
                    break;
                }
            }
        };

        // Unselects the project and resets
        // the current page to "projects list".

        self.home = function() {
            self.project(null);
            self.page('page-projects');
        };

        // Returns whether the index page is selected.

        self.index = ko.computed(function() {
            return self.page() === 'page-index';
        });

        // Selects the index page.

        self.front = function() {
            self.project(null);
            self.page('page-index');
        };

        // Removes the given project. At first
        // it displays the confirmation dialog.
        // The dialog is displayed in a similar
        // way as the forms above.

        self.remove = function(project) {
            var form = {
                title: 'Removing the project',
                message: 'Remove the project ' + project.name() + '?',

                // The `yes`function is called when the
                // "Yes" button is clicked.

                yes: function() {
                    disposeConfirm();

                    // Removes the project from the observable
                    // array. Remove functionality is provided
                    // by KnockoutJS.

                    self.projects.remove(project);
                    self.project(null);
                },
                no: function() {
                    disposeConfirm();
                }
            };
            confirm(form);
        };

        // Converts the projects list into plain
        // JavaScript object for storage.

        self.json = ko.computed(function() {
            var projects = [];
            for (var i = 0; i < self.projects().length; i++) {
                projects.push({
                    oid: self.projects()[i].oid,
                    name: self.projects()[i].name(),
                    description: self.projects()[i].description()
                });
            }
            return projects;
        });

        // Subscribing to the `json` computable to
        // automatically store the project list when it changes.

        self.json.subscribe(function(value) {
            console.log('Storing project list');
            localStorage.setItem('project-list', JSON.stringify(value));
        });
    };

    // Some helper functions.

    // Checks that the given string is empty. Used
    // for validation.

    function empty(string) {
        return !string || string === '';
    }

    // Removes the currently displayed dialog.
    // Also removes KnockoutJS bindings from it.

    function disposeDialog() {
        var dialog = $('#dialog');
        dialog.modal('hide');
        ko.cleanNode(dialog.get(0));
    }

    // Displays the dialog. The form template
    // is chosen by the `model` property `template`.

    function dialog(model) {
        var dom = $('#dialog');
        ko.applyBindings(model, dom.get(0));
        dom.modal('show');
    }

    // Removes the currently displayed confirmation
    // dialog. Also removes KnockoutJS bindings from it.

    function disposeConfirm() {
        var dialog = $('#confirm');
        dialog.modal('hide');
        ko.cleanNode(dialog.get(0));
    }

    // Displays the confirmation dialog. The dialog
    // title, message and click handlers are taken
    // from the `model` object.

    function confirm(model) {
        var dialog = $('#confirm');
        ko.applyBindings(model, dialog.get(0));
        dialog.modal('show');
    }

    // Helper function to load item from
    // the local storage. When the item is not
    // found `def` is returned.

    function load(name, def) {
        var item = localStorage.getItem(name);
        return item ? JSON.parse(item) : def;
    }

    // Helper function to wrap items of the `collection`
    // as objects. The `constructor` must accept
    // array element as argument.

    function wrap(collection, constructor) {
        return collection.map(function(item) {
            return new constructor(item);
        });
    }

    // Creates the App instance and binds it
    // to the corresponding page element.

    var app = new App();
    ko.applyBindings(app, $('#app').get(0));

    // Very simple URL router. Accepts
    // URL fragments like `#!/path`.

    var router = function() {
        var hash = location.hash;
        if (hash === '') {
            app.front();
        }
        if (hash.match(/^#!\/home/)) {
            app.home();
        }
        var project = hash.match(/^#!\/project\/([A-Za-z0-9]+)/);
        if (project) {
            app.viewById(project[1]);
        }
    };

    // Makes router working for links changing
    // the current location's URL fragment. The router
    // is also bound to `load` event to route the initial URL.

    window.addEventListener('hashchange', router, false);
    window.addEventListener('load', router, false);
})();
