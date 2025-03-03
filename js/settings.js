/*global $, NOTES_SORTING, createScroller, LANG_JSON_DATA, NotesView, tau*/
/*jshint unused: false*/
/*jslint laxbreak: true*/

Settings.SYNC_ON_START_PREF = 'syncOnStart';
Settings.NOTES_SORTING = 'NOTES_SORTING';

function Settings(notesView) {

    var self = this;
    var mainMenu = $('#mainMenu');

    Object.defineProperties(this, {
        'syncOnStart': {
            get: function () {
                return localStorage.getItem(Settings.SYNC_ON_START_PREF) !== 'false';
            },
            set: function (val) {
                localStorage.setItem(Settings.SYNC_ON_START_PREF, val);
            }
        },
        'notesSorting': {
            get: function () {
                var notesSorting = localStorage.getItem(Settings.NOTES_SORTING);
                if (!notesSorting) {
                    return NOTES_SORTING.MODIFIED_NEW_OLD;
                }
                return parseInt(notesSorting, 0);
            },
            set: function (val) {
                localStorage.setItem(Settings.NOTES_SORTING, val);
            }
        }
    });

	mainMenu.on('pagebeforeshow', function () {

		var noteFontSizeSpan = $('#noteFontSize span');

        $("#syncOnStartLi input").prop('checked', self.syncOnStart);
        $("#showUpdated input").prop('checked', notesView.showNotesUpdateDate);
        $("#showTags input").prop('checked', notesView.showNotesTags);
        $('#blackNote input').prop('checked', notesView.blackNote);

        switch (notesView.noteFontSize) {
            case NotesView.NOTE_FONT_SIZE_SMALL:
				noteFontSizeSpan.html(LANG_JSON_DATA.SMALL);
                $('#fontSizeSmall input').prop('checked', true);
                break;
            case NotesView.NOTE_FONT_SIZE_MEDIUM:
				noteFontSizeSpan.html(LANG_JSON_DATA.MEDIUM);
                $('#fontSizeMedium input').prop('checked', true);
                break;
            case NotesView.NOTE_FONT_SIZE_LARGE:
				noteFontSizeSpan.html(LANG_JSON_DATA.LARGE);
                $('#fontSizeLarge input').prop('checked', true);
                break;
        }

        switch (self.notesSorting) {
            case NOTES_SORTING.MODIFIED_NEW_OLD:
                $("#sortNewOldModified input").prop('checked', true);
                break;
            case NOTES_SORTING.MODIFIED_OLD_NEW:
                $("#sortOldNewModified input").prop('checked', true);
                break;
            case NOTES_SORTING.TITLE_A_Z:
                $("#sortAZTitle").prop('checked', true);
                break;
            case NOTES_SORTING.TITLE_Z_A:
                $("#sortZATitle").prop('checked', true);
                break;
        }
    });

    $('#noteFontSize').parent().on('click', function () {
        tau.changePage('#fontSizePage');
    });

    $('#fontSizeSmall').on('click', function () {
        notesView.noteFontSize = NotesView.NOTE_FONT_SIZE_SMALL;
        tau.changePage('#mainMenu');
    });

    $('#fontSizeMedium').on('click', function () {
        notesView.noteFontSize = NotesView.NOTE_FONT_SIZE_MEDIUM;
        tau.changePage('#mainMenu');
    });

    $('#fontSizeLarge').on('click', function () {
        notesView.noteFontSize = NotesView.NOTE_FONT_SIZE_LARGE;
        tau.changePage('#mainMenu');
    });

	mainMenu.on('pageshow', function () {
        createScroller({target: document.getElementById('mainMenu')});
    });

    $('#syncOnStartLi').on('click', function () {
        self.syncOnStart = $(this).find('input').prop('checked');
    });
    $('#showUpdated').on('click', function () {
        notesView.showNotesUpdateDate = $(this).find('input').prop('checked');
    });
    $('#showTags').on('click', function () {
        notesView.showNotesTags = $(this).find('input').prop('checked');
    });
    $('#blackNote').on('click', function () {
        notesView.blackNote = $(this).find('input').prop('checked');
    });

    $('#sortNewOldModified').on('click', function () {
        self.notesSorting = NOTES_SORTING.MODIFIED_NEW_OLD;
    });
    $('#sortOldNewModified').on('click', function () {
        self.notesSorting = NOTES_SORTING.MODIFIED_OLD_NEW;
    });
    $('#sortAZTitle').on('click', function () {
        self.notesSorting = NOTES_SORTING.TITLE_A_Z;
    });
    $('#sortZATitle').on('click', function () {
        self.notesSorting = NOTES_SORTING.TITLE_Z_A;
    });

    $("#createNoteLaunch").parent().prop('enabled', !this.syncOnStart);

    $('#syncOnStart').on('click', function () {
        $('#createNoteLaunch').parent().prop('enable', $('#syncOnStart').prop('checked'));
    });

}