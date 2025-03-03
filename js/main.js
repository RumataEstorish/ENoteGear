/*jshint unused: false*/
/*jslint laxbreak: true*/
/*global WindowStack, SAP, addScrollerIgnorePage, ViewMenu, ScrollBack, KeyboardModes, VIEW, VirtualList, NotesView, NoteMenu, TagsList, tizen, $, Evernote, tau, Utils, LANG_JSON_DATA, ContextMenu, Input,  NOTES_SORTING, ActionMenu, Settings, ToastMessage, Log, createScroller, Input, ContextMenu*/

var settings = null;
var toastMessage = null;
var progressBarWidget = null;

var tagsList = null;
var noteMenu = null;
var menuPopup = null;
var notesView = new NotesView();
var model = null;
var activenoteguid = null;
var activenotebookguid = null;
var sap = null;
var evernote = null;
var selectednotebookguid = null;
var selectedTagGuids = null;
var windowStack = null;

function showLoad(message) {
    $('#smallProcessingDescription').html(message);
    if (Utils.getActivePage() !== 'smallProcessingPage') {
        tau.changePage('#smallProcessingPage');
    }
}

function showMenu() {

    var activePage = Utils.getActivePage();

    menuPopup.setMenuItemVisibility('notebooksViewMenu', !(activePage === 'notebooksPage' || activePage === 'notespage'));
    menuPopup.setMenuItemVisibility('notesViewMenu', activePage !== 'notesListPage');
    menuPopup.setMenuItemVisibility('tagsViewMenu', activePage !== 'tagsPage');
    menuPopup.setMenuItemVisibility('userViewMenu', activePage !== 'userPage');

    menuPopup.show();
}

function selectNotebookConfirm(guid) {
    evernote.getNotebookByGuid(guid).then(function (notebook) {
        selectednotebookguid = guid;
        $('#notebookMenu span').html(notebook.name);
        if (activenoteguid) {
            evernote.getNoteByGuid(activenoteguid).then(function (note) {
                evernote.moveNote(note, guid).then(function () {
                    windowStack.back();
                });
            });
        } else {
            windowStack.back();
        }
    });

}

function selectNotebook() {
    var list = $('#selectNotebookPage ul');
    list.empty();

    evernote.calcNotebooksStacks().then(function (stacks) {
        if (!stacks || stacks.length === 0) {
            list.append('<li>' + LANG_JSON_DATA.NO_NOTEBOOKS + '</li>');
            return;
        }
        stacks.forEach(function (stack) {
            if (stack.name && stack.name !== '') {
                list.append('<li class="ui-listview-divider">' + stack.name + '</li>');
            }
            stack.notebooks.forEach(function (notebook) {
                var it = $('<li class="li-has-radio"><label>' + notebook.name + '<input type="radio" name="selectNotebook" id="popup' + notebook.guid + '"/></label></li>');
                it.one('click', function () {
                    selectNotebookConfirm(notebook.guid);
                });
                list.append(it);
            });
        });
        if (activenoteguid) {
            evernote.getNoteByGuid(activenoteguid).then(function (note) {
                $('#popup' + note.notebookGuid).prop('checked', 'checked');
            });
        } else {
            $('#popup' + evernote.defaultNotebook.guid).prop('checked', 'checked');
        }

        createScroller({
            target: document.getElementById('selectNotebookPage')
        });
        tau.changePage("#selectNotebookPage");
    });
}

function pickTagsClick() {
    windowStack.add(VIEW.CHANGE_NOTE_TAGS);
}

function fillNotebooks() {
    var notebooksList = $('#notebooksPage ul');

    Log.debug('fillNotebooks');
    notebooksList.empty();

    evernote.calcNotebooksStacks().then(function (stacks) {
        var item = null;
        stacks.forEach(function (stack) {
            if (stack.name && stack.name !== '') {
                notebooksList.append('<li class="ui-listview-divider">' + stack.name + '</li>');
            }
            stack.notebooks.forEach(function (notebook) {
                item = $('<li class="li-has-multiline" id="' + notebook.guid + '"><a href="#">' + notebook.name + '<span class="ui-li-sub-text li-text-sub"></span></a></li>');
                item.one('click', function () {
                    windowStack.add(VIEW.NOTEBOOK_NOTES, function () {
                        openNotebook(notebook.guid);
                    });
                });
                notebooksList.append(item);
            });
        });

        notebooksList.append('<li class="ui-listview-divider">' + LANG_JSON_DATA.OTHER + '</li>');
        item = $('<li class="li-has-multiline" id="' + Evernote.SHARED_GUID + '"><a href="#">' + LANG_JSON_DATA.SHARED + '<span class="ui-li-sub-text li-text-sub"></span></a></li>');
        item.one('click', function () {
            windowStack.add(VIEW.NOTEBOOK_NOTES, function () {
                openNotebook(Evernote.SHARED_GUID);
            });
        });
        notebooksList.append(item);

        item = $('<li class="li-has-multiline" id="' + Evernote.TRASH_GUID + '"><a href="#">' + LANG_JSON_DATA.TRASH + '<span class="ui-li-sub-text li-text-sub"></span></a></li>');
        item.one('click', function () {
            windowStack.add(VIEW.NOTEBOOK_NOTES, function () {
                openNotebook(Evernote.TRASH_GUID);
            });
        });
        notebooksList.append(item);
        return evernote.getNotebooks();
    }).then(function (notebooks) {
        tau.changePage('#notebooksPage');
        return evernote.getNotesCountByNotebooks(notebooks);
    }).then(function (res) {
        res.forEach(function (r) {
            $('#' + r.notebook.guid + ' span').html(LANG_JSON_DATA.NOTES + ": " + r.count);
        });
        return evernote.getTrashNotes();
    }).then(function (notes) {
        $('#' + Evernote.TRASH_GUID + ' span').html(LANG_JSON_DATA.NOTES + ": " + notes.length);
        return evernote.getSharedNotes();
    }).then(function (notes) {
        $('#' + Evernote.SHARED_GUID + ' span').html(LANG_JSON_DATA.NOTES + ": " + notes.length);
        createScroller({
            target: document.getElementById("notebooksPage")
        });
    });
}

/**
 * Note menu click, edit content
 */
function noteMenuClick() {
    try {
        evernote.getNoteByGuid(activenoteguid).then(function (note) {
            evernote.getNotebookByGuid(note.notebookGuid).then(function (notebook) {
                $("#notebookMenu span").html(notebook.name);
                evernote.tagGuidsToList(note.tagGuids).then(function (list) {
                    $("#tagsSpan").html(list);
                });

                $("#noteTitle").html(note.title);
                $("#noteContentLi").hide();
                windowStack.add(VIEW.EDIT_NOTE);
            });
        });
    } catch (e) {
        Log.e(e);
    }
}

function editTitleClick() {
    var input = new Input(model), getText = function (txt) {
        input.open(txt, LANG_JSON_DATA.ENTER_TITLE, KeyboardModes.SINGLE_LINE, function (txt) {
            if (txt) {
                $('#noteTitle').html(txt);
            }
            windowStack.refresh();
        }, function () {
            windowStack.refresh();
        }, processKeyboardError);
    };

    if (activenoteguid) {
        evernote.getNoteByGuid(activenoteguid).then(function (note) {
            getText(note.title);
        });
    } else {
        getText('');
    }
}

function createTagClick() {
    var input = new Input(model);

    input.open('', LANG_JSON_DATA.ENTER_TITLE, KeyboardModes.SINGLE_LINE, function (txt) {
        if (txt) {
            txt = txt.trim();
            evernote.createTag(txt).then(function () {
                windowStack.add(VIEW.TAGS);
            });
        }
    }, function () {
        windowStack.refresh();
    }, processKeyboardError);
}

function createClick() {
    menuPopup.close(function () {
        switch (Utils.getActivePage()) {
            case 'tagsPage':
                createTagClick();
                break;
            default:
                createNoteClick();
                break;
        }
    });
}

/**
 * Create new note, edit content and info
 */
function createNoteClick() {

    try {
        activenoteguid = null;
        if (!activenotebookguid) {
            selectednotebookguid = evernote.defaultNotebook.guid;
            $("#notebookMenu span").html(evernote.defaultNotebook.name);
        } else {
            selectednotebookguid = activenotebookguid;
            evernote.getNotebookByGuid(activenotebookguid).then(function (notebook) {
                $("#notebookMenu span").html(notebook.name);
            });

        }
        $("#noteTitle").html("");
        $("#noteContent").html("");
        $("#noteContentLi").show();
        $("#noteInfoPage").one("pageshow", function () {
            editTitleClick();
        });
        $('#tagsSpan').html('');
        windowStack.add(VIEW.EDIT_NOTE);

    } catch (e) {
        alert(e);
        console.log(e);
    }
}

function editContentClick() {
    var input = new Input(model), getText = function (txt) {
    };
    input.open($('#noteContent').text(), LANG_JSON_DATA.ENTER_CONTENT, KeyboardModes.NORMAL, function (txt) {
        if (txt) {
            $('#noteContent').html(txt);
        }
        windowStack.refresh();
    }, function () {
        windowStack.refresh();
    }, processKeyboardError);

    if (activenoteguid) {
        evernote.getNotebookByGuid(activenoteguid).then(function (note) {
            getText(note.content);
        });
    } else {
        getText('');
    }
}

function createNoteConfirm() {
    var noteTitle = $("#noteTitle").html().trim();

    if (noteTitle === '') {
        toastMessage.show(LANG_JSON_DATA.TITLE_CAN_T_BE_EMPTY);
        return;
    }

    if (!activenoteguid) {
        windowStack.add(VIEW.SMALL_PROCESSING, function () {
            showLoad(LANG_JSON_DATA.SYNCHRONIZATION);
        });
        evernote.createNote(noteTitle, Evernote.stringToNoteContent($("#noteContent").html()), selectednotebookguid, selectedTagGuids).then(function () {
            windowStack.back();
        });
    } else {
        evernote.getNoteByGuid(activenoteguid).then(function (note) {
            note.title = noteTitle;
            note.tagGuids = selectedTagGuids;
            if (selectednotebookguid) {
                note.notebookGuid = selectednotebookguid;
            }
            evernote.updateNote(note).then(function () {
                windowStack.back();
            });
        });
    }
}

function menuClick() {
    windowStack.add(VIEW.SETTINGS_MENU);
}

function sortNotes(notes) {
    switch (settings.notesSorting) {
        case NOTES_SORTING.MODIFIED_NEW_OLD:
            notes.sort(Utils.dynamicSort("-updated"));
            break;
        case NOTES_SORTING.MODIFIED_OLD_NEW:
            notes.sort(Utils.dynamicSort("updated"));
            break;
        case NOTES_SORTING.TITLE_A_Z:
            notes.sort(Utils.dynamicSort("title"));
            break;
        case NOTES_SORTING.TITLE_Z_A:
            notes.sort(Utils.dynamicSort("-title"));
            break;
    }
    return notes;
}

function openNotesFullList() {
    evernote.getNotes().then(function (notes) {
        openNotesList(notes);
    });
}

function openNotesList(notes) {
    if (!notes || notes.length === 0) {
        // windowStack.add(VIEW.NOTEBOOK_NOTES);
        return;
    }
    notes = sortNotes(notes);

    var l = $('#notesListPage ul');
    l.empty();
    notes.forEach(function (note) {
        var updateDate = "", tags = "", item = $('<li></li>');

        if (notesView.showNotesUpdateDate === true) {
            updateDate = '<span class="ui-li-sub-text li-text-sub">' + new Date(note.updated).toLocaleDateString() + '</span>';
        }
        evernote.tagGuidsToList(note.tagGuids).then(function (list) {
            if (notesView.showNotesTags === true) {
                tags = '<span class="ui-li-sub-text li-text-sub">' + list + '</span>';
            }
            if (updateDate === '' && tags === '') {
                $(item).html(note.title);
            } else {
                $(item).addClass("li-has-multiline");
                $(item).html(note.title + updateDate + tags);
            }
        }, function () {
            if (updateDate === '') {
                $(item).html(note.title);
            } else {
                $(item).addClass("li-has-multiline");
                $(item).html(note.title + updateDate);
            }
        });

        $(item).prop("id", note.guid);

        new ContextMenu(item, function (sender) {
            openNote(sender.prop('id'));
        }, function (sender) {
            activenoteguid = sender.prop('id');
            evernote.getNoteByGuid(activenoteguid).then(function (note) {
                $("#actionPopupHeader").html(note.title);
                return evernote.isNoteDeletedByGuid(activenoteguid);
            }).then(function (res) {
                noteMenu.show(res);
            });
        });
        l.append(item);
    });

    tau.changePage('#notesListPage');
 
}

function openTag(guid) {
    windowStack.add(VIEW.NOTEBOOK_NOTES, function () {
        evernote.getTagByGuid(guid).then(function (tag) {
            $("#notesTagPage h2").html(tag.name);
            return evernote.getNotesByTagGuid(guid);
        }).then(function (notes) {
            openNotesList(notes);
        });
    });
}

/**
 * Open notebook
 */
function openNotebook(guid) {
    Log.debug('opennotebook');

    if (guid === Evernote.TRASH_GUID || !guid) {
        evernote.getTrashNotes().then(function (notes) {
            activenotebookguid = null;
            $("#notesNotebookPage h2").html(LANG_JSON_DATA.TRASH);
            openNotesList(notes);
        });
    } else if (guid === Evernote.SHARED_GUID) {
        evernote.getSharedNotes().then(function (notes) {
            activenotebookguid = null;
            $("#notesNotebookPage h2").html(LANG_JSON_DATA.SHARED);
            openNotesList(notes);
        });
    } else {
        activenotebookguid = guid;
        evernote.getNotebookByGuid(guid).then(function (notebook) {
            $("#notesNotebookPage h2").html(notebook.name);
            evernote.getNotesByNotebookGuid(guid).then(function (notes) {
                openNotesList(notes);
            });
        });
    }
}

function showNoteContent(note) {
    localStorage.setItem('note', JSON.stringify(note));
    $('#notePreview').prop('src', 'note.html');
    if (notesView.blackNote === true) {
        $('#notepageContent').css('background', 'black');
    } else {
        $('#notepageContent').css('background', 'white');
    }
    windowStack.add(VIEW.NOTE_CONTENT);

}

/**
 * Open note
 */
function openNote(guid) {
    evernote.getNoteByGuid(guid).then(function (note) {
        try {
            activenoteguid = guid;
            $("#notepage h2").html(note.title);

            windowStack.add(VIEW.SMALL_PROCESSING, function () {
                showLoad(LANG_JSON_DATA.WAIT_CONTENT + '...');
            });
            evernote.getContent(guid).then(function (note) {
                showNoteContent(note);
            })['catch'](function (err) {
                alert(err);

                windowStack.back();
            });
        } catch (e) {
            alert(e);
            console.log(e);
        }
    });
}

function processKeyboardError(e) {
    if (e === "Please, install TypeGear from store. It's free.") {
        alert(LANG_JSON_DATA.NO_TYPEGEAR);
    } else {
        alert(e);
    }
}

function renameNoteClick() {
    var input = new Input(model);
    evernote.getNoteByGuid(activenoteguid).then(function (note) {
        input.open(note.title, LANG_JSON_DATA.ENTER_TITLE, KeyboardModes.SINGLE_LINE, function (txt) {
            if (!txt) {
                return;
            }
            evernote.renameNote(note, txt).then(function () {
                windowStack.back();
            });

        }, function () {
            //windowStack.add(VIEW.EDIT_NOTE);
        }, processKeyboardError);
    });
}

/**
 * Note context menu - delete
 */
function deleteNoteClick() {
    evernote.getNoteByGuid(activenoteguid).then(function (note) {
        if (!confirm(LANG_JSON_DATA.DELETE + " " + note.title + " ?")) {
            windowStack.back();
            return;
        }
        evernote.deleteNoteByGuid(activenoteguid).then(function () {
            windowStack.back();
        });
    });
}

/**
 * Note context menu - restore
 */
function restoreNoteClick() {
    evernote.getNoteByGuid(activenoteguid).then(function (note) {
        if (!confirm(LANG_JSON_DATA.RESTORE + " " + note.title + " ?")) {
            return;
        }
        evernote.restoreNoteByGuid(activenoteguid).then(function () {
            windowStack.back();
        });
    });
}

/**
 * Note context menu - tag edit
 */
function changeNoteTagsClick() {
    windowStack.add(VIEW.CHANGE_NOTE_TAGS);
}

/**
 * Note context menu - move to notebook
 */
function moveNoteClick() {
    windowStack.add(VIEW.SELECT_NOTEBOOK);
}

function sync(full) {

    var success = function (res) {
        if (res === SAP.AUTH_NEEDED) {
            alert(LANG_JSON_DATA.CONNECT_TO_EVERNOTE);
            return;
        }
        windowStack.back();
        navigator.vibrate([250, 250, 250]);
    }, error = function (res) {
        alert(res);
    }, progress = function (progress) {
        if (progress === SAP.AUTH_NEEDED) {
            alert(LANG_JSON_DATA.CONNECT_TO_EVERNOTE);
            return;
        }
        if (windowStack.activeWindow !== VIEW.CIRCLE_PROGRESS) {
            windowStack.add(VIEW.CIRCLE_PROGRESS);
        }
        progressBarWidget.value(progress);
        $('#result').html(progress + '%');
    };

    windowStack.add(VIEW.SMALL_PROCESSING, function () {
        showLoad(LANG_JSON_DATA.SYNCHRONIZATION + '...');
    });

    if (sap.isConnected === false && !tau.support.shape.circle) {
        windowStack.add(VIEW.SMALL_PROCESSING, function () {
            showLoad(LANG_JSON_DATA.WAITING_CONNECTION + '...');
        });

        sap.connect().then(function () {
            sync(full);
        }, function (err) {
            switch (err) {
                case SAP.ERRORS.DEVICE_NOT_CONNECTED:
                    alert(LANG_JSON_DATA.DEVICE_NOT_CONNECTED);
                    break;
                case SAP.ERRORS.PEER_NOT_FOUND:
                    alert(LANG_JSON_DATA.INSTALL_HOST_APP);
                    break;
                case SAP.ERRORS.INVALID_PEER_AGENT:
                    alert(LANG_JSON_DATA.INVALID_PEERAGENT);
                    break;
                default:
                    alert(err);
                    break;
            }
            sync(full);
        });
        return;
    }

    if (full) {
        evernote.fullSync().then(success, error, progress);
    } else {
        evernote.sync().then(success, error, progress);
    }
}

/**
 * Sync only last chnages
 */
function syncClick() {
    sync();
}

function openUserClick() {
    evernote.getUser().then(function (user) {
        $("#userPage h2").html(user.username);
        // noinspection JSUnresolvedVariable
        if (user.email) {
            $("#userEmail").parent().show();
            $("#userEmail span").html(user.email);
        } else {
            $("#userEmail").parent().hide();
        }
        if (user.attributes) {
            $("#evernoteUserEmail").parent().show();
            // noinspection JSUnresolvedVariable
            $("#evernoteUserEmail span").html(user.attributes.incomingEmailAddress);
        } else {
            $("#evernoteUserEmail").parent().hide();
        }

        // noinspection JSUnresolvedVariable
        if (user.accounting) {
            $("#userDataUsage").parent().show();
            $("#userNextDataPeriod").parent().show();
            // noinspection JSUnresolvedVariable
            $("#userDataUsage span").html(Utils.bytesToSize(user.accounting.uploadLimitNextMonth - user.accounting.uploadLimit) + "/" + Utils.bytesToSize(user.accounting.uploadLimitNextMonth));
            // noinspection JSUnresolvedVariable
            $("#userNextDataPeriod span").html(new Date(user.accounting.uploadLimitEnd).toDisplayDate());
        } else {
            $("#userDataUsage").parent().hide();
            $("#userNextDataPeriod").parent().hide();
        }
        tau.changePage('#userPage');
    });

}

function translateUi() {
    $('#mainMenu h2').html(LANG_JSON_DATA.SETTINGS);
    $("#settingsDiv").html(LANG_JSON_DATA.SETTINGS);
    $("#notesViewDiv").html(LANG_JSON_DATA.NOTES_LIST);
    $("#syncOnStart").prepend(LANG_JSON_DATA.SYNC);

    $("#notesSortingDiv").html(LANG_JSON_DATA.NOTES_SORTING);
    $("#sortOldNewModified").prepend(LANG_JSON_DATA.NOTES_UPDATED_DATE);
    $("#sortOldNewModified span").html(LANG_JSON_DATA.OLD_NEW);
    $("#sortNewOldModified").prepend(LANG_JSON_DATA.NOTES_UPDATED_DATE);
    $("#sortNewOldModified span").html(LANG_JSON_DATA.NEW_OLD);
    $("#sortAZTitle").prepend(LANG_JSON_DATA.TITLE);
    $("#sortAZTitle span").html(LANG_JSON_DATA.A_Z);
    $("#sortZATitle").prepend(LANG_JSON_DATA.TITLE);
    $("#sortZATitle span").html(LANG_JSON_DATA.Z_A);

    $("#syncOnStart span").html(LANG_JSON_DATA.AT_LAUNCH);

    var showUpdatedLabel = $('#showUpdated label');
    showUpdatedLabel.html(LANG_JSON_DATA.NOTES_UPDATED_DATE + showUpdatedLabel.html());

    var showTagsLabel = $('#showTags label');
    showTagsLabel.html(LANG_JSON_DATA.NOTES_TAGS + showTagsLabel.html());
    $("#noteInfoPage h2").html(LANG_JSON_DATA.NOTE);
    $("#notebookMenu").prepend(LANG_JSON_DATA.NOTEBOOK);
    $("#titleMenu").prepend(LANG_JSON_DATA.TITLE);
    $("#tagsMenu").prepend(LANG_JSON_DATA.TAGS);
    $("#contentMenu").prepend(LANG_JSON_DATA.CONTENT);
    $("#noteInfoPage footer button").eq(0).html(LANG_JSON_DATA.OK);
    $("#notebooksPage h2").html(LANG_JSON_DATA.NOTEBOOKS);
    $("#tagsPage h2").html(LANG_JSON_DATA.TAGS);
    $("#notesListPage h2").html(LANG_JSON_DATA.NOTES);

    $("#userListViewMenu").html(LANG_JSON_DATA.USER);

    $("#actionPopupCancelBtn").html(LANG_JSON_DATA.CANCEL);
    $("#notePopupHeader").html(LANG_JSON_DATA.SELECT_NOTEBOOK);
    $("#userName").prepend(LANG_JSON_DATA.USER_NAME);
    $("#userEmail").prepend(LANG_JSON_DATA.USER_EMAIL);
    $("#evernoteUserEmail").prepend(LANG_JSON_DATA.USER_EVERNOTE_EMAIL);
    $("#userDataUsage").prepend(LANG_JSON_DATA.USER_DATA_USAGE);
    $("#userNextDataPeriod").prepend(LANG_JSON_DATA.USER_DATA_USAGE_PERIOD);

    $('#blackNote label').prepend(LANG_JSON_DATA.BLACK);
    $('#blackNote span').html(LANG_JSON_DATA.NOTE);
    $('#noteFontSize').prepend(LANG_JSON_DATA.NOTE_FONT);

    $('#fontSizeSmall label').prepend(LANG_JSON_DATA.SMALL);
    $('#fontSizeMedium label').prepend(LANG_JSON_DATA.MEDIUM);
    $('#fontSizeLarge label').prepend(LANG_JSON_DATA.LARGE);

    $('#fontSizePage h2').html(LANG_JSON_DATA.NOTE_FONT);

    $('#fullSync a').prepend(LANG_JSON_DATA.CLEAR_DATA);
    $('#fullSync a span').prepend(LANG_JSON_DATA.CLEAR_DATA_DESCRIPTION);
}

function initNoteMenu() {
    noteMenu = new NoteMenu("noteMenuPage", "noteMenu", [{
        name: 'infoNoteMenu',
        title: LANG_JSON_DATA.EDIT,
        image: 'images/edit.png',
        onclick: noteMenuClick
    }, {
        name: 'renameNoteMenu',
        title: LANG_JSON_DATA.RENAME,
        image: 'images/rename_1.png',
        onclick: renameNoteClick
    }, {
        name: 'tagsNoteMenu',
        title: LANG_JSON_DATA.TAGS,
        image: 'images/tag.png',
        onclick: changeNoteTagsClick
    }, {
        name: 'moveNoteMenu',
        title: LANG_JSON_DATA.MOVE,
        image: 'images/move.png',
        onclick: moveNoteClick
    }, {
        name: 'deleteNoteMenu',
        title: LANG_JSON_DATA.DELETE,
        image: 'images/delete.png',
        onclick: deleteNoteClick
    }, {
        name: 'restoreNoteMenu',
        title: LANG_JSON_DATA.RESTORE,
        image: 'images/restore.png',
        onclick: restoreNoteClick
    }]);
}

function initMenuPopup() {
    menuPopup = new ActionMenu('menuPage', 'menuPopup', [
        {
            name: 'createNoteMenu',
            title: LANG_JSON_DATA.CREATE_NOTE,
            image: 'images/add.png',
            onclick: createClick
        },

        {
            name: 'notesViewMenu',
            title: LANG_JSON_DATA.NOTES,
            image: 'images/note.png',
            onclick: function () {
                windowStack.add(VIEW.NOTES_LIST);
            }
        }, {
            name: 'notebooksViewMenu',
            title: LANG_JSON_DATA.NOTEBOOKS,
            image: 'images/notebook.png',
            onclick: function () {
                windowStack.add(VIEW.NOTEBOOKS_LIST);
            }
        }, {
            name: 'tagsViewMenu',
            title: LANG_JSON_DATA.TAGS,
            image: 'images/tag.png',
            onclick: function () {
                windowStack.add(VIEW.TAGS);
            }
        }, /*{
            name: 'userViewMenu',
            title: LANG_JSON_DATA.USER,
            image: 'images/user.png',
            onclick: function () {
                windowStack.add(VIEW.SMALL_PROCESSING, function () {
                    showLoad(LANG_JSON_DATA.USER_LOADING);
                });
                windowStack.add(VIEW.USER);
            }
        },*/
        {
            name: 'syncMenu',
            title: LANG_JSON_DATA.SYNC,
            image: 'images/sync.png',
            onclick: syncClick
        },
        {
            name: 'settingsMenu',
            title: LANG_JSON_DATA.SETTINGS,
            image: 'images/settings.png',
            onclick: menuClick
        }]);

}

function initWindowStack() {
    windowStack = new WindowStack([
        {
            id: VIEW.NOTEBOOKS_LIST,
            showFun: fillNotebooks
        }, {
            id: VIEW.NOTES_LIST,
            showFun: openNotesFullList
        }, {
            id: VIEW.NOTEBOOK_NOTES
        }, {
            id: VIEW.NOTES_TAG,
            showFun: function () {
                openTag(activenoteguid);
            }
        }, {
            id: VIEW.EDIT_NOTE,
            showFun: function () {
                tau.changePage('#noteInfoPage');
            }
        }, {
            id: VIEW.USER,
            showFun: openUserClick
        }, {
            id: VIEW.SETTINGS_MENU,
            showFun: function () {
                tau.changePage("#mainMenu");
            }
        }, {
            id: VIEW.SMALL_PROCESSING
        }, {
            id: VIEW.CIRCLE_PROGRESS,
            showFun: function () {
                tau.changePage('#pageCircleProgressBar');
            }
        }, {
            id: VIEW.SELECT_NOTEBOOK,
            showFun: selectNotebook
        }, {
            id: VIEW.TAGS,
            showFun: function () {
                tagsList = new TagsList(evernote, windowStack);
                tagsList.open();
            }
        }, {
            id: VIEW.NOTE_CONTENT,
            showFun: function () {
                tau.changePage("#notepage");
            }
        }, {
            id: VIEW.CHANGE_NOTE_TAGS,
            showFun: function () {
                var tagsList = new TagsList(evernote, windowStack), note = null, tagsSelected = function (tags) {
                    selectedTagGuids = tags;
                    evernote.tagGuidsToList(tags).then(function (list) {
                        $('#tagsSpan').html(list);
                    });
                    if (note) {
                        evernote.changeNoteTags(note, tags);
                    }
                };

                if (activenoteguid) {
                    evernote.getNoteByGuid(activenoteguid).then(function (n) {
                        note = n;
                        tagsList.openSelect(note.tagGuids).then(tagsSelected, function(reason){
                            toastMessage.show(reason);
                        });
                    });
                } else {
                    tagsList.openSelect(null).then(tagsSelected, function(reason){
                        toastMessage.show(reason);
                    });
                }
            }
        }], [VIEW.CIRCLE_PROGRESS, VIEW.SMALL_PROCESSING]);
}

$(window).on("load", function () {

    var notePage = $('#notepage');
    var pageCircleProgressBar = $('#pageCircleProgressBar');

    addScrollerIgnorePage('notepage');

    settings = new Settings(notesView);
    toastMessage = new ToastMessage('#popupToast', '#popupToastContent');
    Log.DEBUG = false;

    translateUi();

    initWindowStack();
    initNoteMenu();
    initMenuPopup();

    if (!tau.support.shape.circle) {
        $('#noteMenuButtonCircle').remove();
    }

    if (tau.support.shape.circle) {
        if (notesView.blackNote === true) {
            $('#noteMenuButtonCircle').hide();
            $('#noteMenuButtonSquare').show();
        } else {
            $('#noteMenuButtonCircle').show();
            $('#noteMenuButtonSquare').hide();
        }
    }
    var progressBar = document.getElementById('circleprogress');
    pageCircleProgressBar.on('pagebeforeshow', function () {
        progressBarWidget = new tau.widget.CircleProgressBar(progressBar, {
            size: tau.support.shape.circle ? 'full' : 'large'
        });
    });

    pageCircleProgressBar.on('pagehide', function () {
        if (progressBarWidget) {
            try {
                progressBarWidget.destroy();
            } catch (ignored) {
            } finally {
                progressBarWidget = null;
            }
        }
    });

    try {
        // noinspection JSCheckFunctionSignatures
        tizen.systeminfo.getPropertyValue("BUILD", function (res) {
            model = res.model;
        }, function (e) {
            alert(e);
        });

        sap = new SAP("ENoteGearProvider", null);

        sap.connect().then(function () {
            evernote.getNotebooksCount().then(function (count) {
                if (!count || count === 0 || settings.syncOnStart === true) {
                    syncClick();
                }
            });
        });

        evernote = new Evernote(sap);
        windowStack.addSilent(VIEW.NOTEBOOKS_LIST);

        syncClick();

        new ScrollBack('#notebooksPage');
        new ScrollBack('#notesListPage');

        $("#notebooksPage").on("pageshow", function () {
            activenotebookguid = null;
        });

        $('#notebookMenu').parent().on('click', function () {
            windowStack.add(VIEW.SELECT_NOTEBOOK);
        });

        $('#fullSync').on('click', function () {
            sync(true);
        });

        notePage.on('pagebeforeshow', function () {
            if (tau.support.shape.circle) {
                var div = notePage.children().first(), note = notePage;

                div.removeClass('ui-scroller');
                div.removeAttr('tizen-circular-scrollbar');
                div.css('height', '100%');
                note.removeClass('ui-scroll-on');
            }
            // note.css('display', 'block');
            /*
             * setTimeout(function() { bl = note.css('display');
             * note.css('display', 'block'); }, 10);
             */
        });
        notePage.on('pagebeforehide', function () {
            if (tau.support.shape.circle) {
                var div = notePage.children().first();
                div.addClass('ui-scroller');
                notePage.addClass('ui-scroll-on');
            }
            // $('#notepage').css('display', bl);
        });

        // add eventListener for tizenhwkey
        document.addEventListener('tizenhwkey', function (e) {
            // noinspection JSUnresolvedVariable
            if (e.keyName === "back") {
                if (menuPopup.isOpened === true) {
                    menuPopup.close();
                    return;
                }
                if (noteMenu.isOpened === true) {
                    noteMenu.close();
                    return;
                }
                if (Input.isInputPage() === true) {
                    return;
                }

                switch (Utils.getActivePage()) {
                    case "tagsPage":
                        windowStack.back();
                        break;
                    case 'notesNotebookPage':
                        windowStack.back();
                        break;
                    case 'notesListPage':
                        windowStack.back();
                        break;
                    case 'notesTagPage':
                        windowStack.add(VIEW.TAGS);
                        break;
                    case "selectNotebookPage":
                        windowStack.back();
                        break;
                    case "userPage":
                        windowStack.back();
                        break;
                    case 'fontSizePage':
                        tau.changePage('#mainMenu');
                        break;
                    case "notepage":
                        var note = JSON.parse(localStorage.getItem("note"));
                        if (note && confirm(LANG_JSON_DATA.NOTE_UPDATE_CONFIRM)) {
                            evernote.updateNote(note).then(function () {
                                windowStack.back();
                            });
                        } else {
                            windowStack.back();
                        }
                        break;
                    case "mainMenu":
                        if (notesView.blackNote === true && tau.support.shape.circle) {
                            $('#noteMenuButtonCircle').hide();
                            $('#noteMenuButtonSquare').show();
                        }
                        if (!notesView.blackNote && tau.support.shape.circle) {
                            $('#noteMenuButtonCircle').show();
                            $('#noteMenuButtonSquare').hide();
                        }
                        windowStack.back();
                        break;
                    case 'noteInfoPage':
                        windowStack.back();
                        break;
                    default:
                        tizen.application.getCurrentApplication().exit();
                        break;
                }
            }
        });
    } catch (e) {
        Log.e(e);
    }
});
