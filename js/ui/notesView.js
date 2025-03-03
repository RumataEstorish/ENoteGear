/*global Utils*/
/*jshint unused: false*/
/*jslint laxbreak: true*/

NotesView.NOTE_FONT_SIZE_PREF = 'NOTE_FONT_SIZE';
NotesView.NOTE_FONT_SIZE_SMALL = 'NOTE_FONT_SMALL';
NotesView.NOTE_FONT_SIZE_MEDIUM = 'NOTE_FONT_MEDIUM';
NotesView.NOTE_FONT_SIZE_LARGE = 'NOTE_FONT_LARGE';

/**
 * Notes view settings
 */
function NotesView() {
	var showTags = Utils.stringToBoolean(localStorage.getItem("showNotesTags"), false), 
	showUpdates = Utils.stringToBoolean(localStorage.getItem("showNotesUpdateDate"), true), 
	blackNote = Utils.stringToBoolean(localStorage.getItem('blackNote'), true);


	Object.defineProperty(this, 'blackNote', {
		get : function(){
			return blackNote;
		},
		set : function(val){
			blackNote = val;
			localStorage.setItem('blackNote', val);
		}
	});
	

	Object.defineProperty(this, 'showNotesTags', {
		get : function(){
			return showTags;
		},
		set : function(val){
			showTags = Utils.stringToBoolean(val, false);
			localStorage.setItem('showNotesTags', val);
		}
	});
	
	Object.defineProperty(this, 'showNotesUpdateDate', {
		get : function(){
			return showUpdates;
		},
		set : function(val){
			showUpdates = Utils.stringToBoolean(val, true);
			localStorage.setItem('showNotesUpdateDate', val);
		}
	});
	
	Object.defineProperty(this, 'noteFontSize', {
		get: function(){
			var noteFontSize = localStorage.getItem(NotesView.NOTE_FONT_SIZE_PREF);
			if (!noteFontSize){
				return NotesView.NOTE_FONT_SIZE_MEDIUM;
			}
			return noteFontSize;
		},
		set: function(val){
			localStorage.setItem(NotesView.NOTE_FONT_SIZE_PREF, val);
		}
	});
}