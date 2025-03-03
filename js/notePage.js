/*global $, Evernote, Utils, NotesView, Log*/
/*jshint unused: false*/
/*jslint laxbreak: true*/

var note = null;
var notesView = new NotesView();

var SMALL_FONT = '1.25rem';
var MEDIUM_FONT = '1.65rem';
var LARGE_FONT = '2rem';

function checkBoxClick(sender) {
	var id = 0;
	// noinspection RegExpDuplicateCharacterInClass
	note.content = note.content.replace(/<en-todo[ checked="true"| checked="false"]*/g, function(match) {
		if (id++ === parseInt(sender.id, 0)) {
			return '<en-todo checked="' + sender.checked + '"';
		}
		return match;
	});

	localStorage.setItem("note", JSON.stringify(note));
}

function noteScroll(e) {
	var content = $('#main').parent();

	if (e.detail.direction === 'CW') {
		content.scrollTop(content.scrollTop() + 50);
	} else if (e.detail.direction === 'CCW') {
		content.scrollTop(content.scrollTop() - 50);
	}
}

function recursiveEach(el) {
	el.children().each(function() {

		var e = $(this);
		e.css('color', '');
		e.css('font-size', '');

		if (e.is('input')) {
			if (notesView.blackNote !== 'true') {
				e.removeClass('black');
				e.addClass('white');
			} else {
				e.removeClass('white');
				e.addClass('black');
			}
		}
		recursiveEach(e);
	});
}

window.onload = function() {

	var noteContent = $('#noteContent');

	try{
		note = JSON.parse(localStorage.getItem('note'));
		localStorage.removeItem('note');
	}
	catch(e){
		Log.e(e);
	}

	switch (notesView.noteFontSize) {
	case NotesView.NOTE_FONT_SIZE_SMALL:
		noteContent.css('font-size', SMALL_FONT);
		break;
	case NotesView.NOTE_FONT_SIZE_MEDIUM:
		noteContent.css('font-size', MEDIUM_FONT);
		break;
	case NotesView.NOTE_FONT_SIZE_LARGE:
		noteContent.css('font-size', LARGE_FONT);
		break;
	}

	if (notesView.blackNote === true) {
		noteContent.css('background', 'black');
		noteContent.css('color', 'white');
		$('#main').css('background-color', 'black');
	} else {
		noteContent.css('background', 'white');
		noteContent.css('color', 'black');
		$('#main').css('background', 'white');
	}

	// noinspection JSCheckFunctionSignatures
	$(document).on('rotarydetent', noteScroll);

	if (note) {
		try {
			var id = 0, content = $(Evernote.noteContentToHtml(note.content).replace(/<input type="checkbox"/g, function() {
				return '<input type="checkbox" class="black" onclick="checkBoxClick(this)" id="' + id++ + '"';
			}));
			recursiveEach(content);
			$("#main div").html(content);
		} catch (e) {
			Log.e(e);
		}
	}
};
