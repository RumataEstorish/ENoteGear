/*global ActionMenu*/

function NoteMenu(page, menuName, menuItems) {
	ActionMenu.call(this, page, menuName, menuItems);
}

NoteMenu.prototype = Object.create(ActionMenu.prototype);
NoteMenu.prototype.constructor = NoteMenu;

NoteMenu.prototype.show = function(noteDeleted) {	
	if (noteDeleted === true){
		this.showMenuItem('restoreNoteMenu');
		this.hideMenuItem('deleteNoteMenu');
	}
	else{
		this.hideMenuItem('restoreNoteMenu');
		this.showMenuItem('deleteNoteMenu');
	}

	ActionMenu.prototype.show.call(this);
};
