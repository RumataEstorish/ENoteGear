/*global Evernote, $, Packet*/
/*jshint unused: true*/
/*jslint laxbreak: true*/

Evernote.prototype.setNotes = function(notes) {
	if (!Array.isArray(notes)) {
		return this.db.notes.bulkPut([ notes ]);
	}
	return this.db.notes.bulkPut(notes);
};

Evernote.prototype.getNotes = function() {
	var d = $.Deferred();
	this.db.notes.where('deleted').equals(0).toArray(function(arr) {
		d.resolve(arr);
	});
	return d.promise();
};

Evernote.prototype.getContent = function(guid) {
	var self = this, d = $.Deferred();

	if (!guid) {
		return;
	}

	this.getNoteByGuid(guid).then(function(note) {
		if (note.content && note.content !== '') {
			d.resolve(note);
		} else {
			var packet = new Packet(Packet.TYPE.NOTE, Packet.OPERATION.CONTENT, self.usn);
			packet.guid = guid;

			self.sap.onReceive = function(channelId, data) {
				var res = JSON.parse(data);
				switch (parseInt(res.operation)) {
				case Packet.OPERATION.CONTENT:
					note.content = res.note.content;
					self.setNotes(note).then(function() {
						d.resolve(note);
					})['catch'](function(err) {
						alert(err);
					});
					break;
				case Packet.OPERATION.ERROR:
					// noinspection JSUnresolvedVariable
					d.reject(res.errorMessage);
					break;
				}
			};
			self.sap.sendData(Evernote.CHANNELS.FULL_SYNC_CHANNEL_ID, packet.toJson());
		}
	});

	return d.promise();
};

Evernote.prototype.isNoteDeletedByGuid = function(guid) {
	var d = $.Deferred();

	this.getNoteByGuid(guid).then(function(note) {
		d.resolve(note.deleted && note.deleted !== 0);
	});

	return d.promise();
};

Evernote.prototype.getNoteByGuid = function(guid) {
	var d = $.Deferred();

	this.db.notes.where('guid').equals(guid).first(function(note) {
		d.resolve(note);
	});
	return d.promise();
};

Evernote.prototype.restoreNoteByGuid = function(guid) {
	var self = this;
	return this.db.notes.where('guid').equals(guid).first(function(note) {
		note.active = true;
		note.deleted = 0;
		return self.updateNote(note);
	});
};

Evernote.prototype.removeNotesByGuids = function(guids) {
	return this.db.notes.where('guid').anyOf(guids)['delete']();
};

Evernote.prototype.deleteNoteByGuid = function(guid) {
	var self = this, d = $.Deferred(), note = null;

	this.sap.onReceive = function() {
		note.isSync = true;
		self.setNotes(note);
	};

	var packet = new Packet(Packet.TYPE.NOTE, Packet.OPERATION.DELETE, self.usn);
	packet.guid = guid;
	this.getNoteByGuid(guid).then(function(n) {
		note = n;
		note.deleted = 1;
		note.isSync = false;
		self.setNotes(note).then(function() {
			self.sap.sendData(Evernote.CHANNELS.FULL_SYNC_CHANNEL_ID, packet.toJson()).then(function() {
				d.resolve();
			});
		});
	});

	return d.promise();
};

Evernote.prototype.getNotesByNotebookGuid = function(guid) {
	var d = $.Deferred();

	this.db.notes.filter(function(note) {
		return note.notebookGuid === guid && note.deleted === 0;
	}).toArray(function(notes) {
		d.resolve(notes);
	});
	return d.promise();
};

Evernote.prototype.getSharedNotes = function(){
	var d = $.Deferred();
	
	this.db.notes.where('deleted').equals(0).toArray(function(arr) {
		d.resolve(arr.filter(function(note){
			// noinspection JSUnresolvedVariable
			return note.attributes && note.attributes.shareDate && note.attributes.shareDate > 0;
		}));
	});
		
	return d.promise();
};

Evernote.prototype.getTrashNotes = function() {
	var d = $.Deferred();

	this.db.notes.where('deleted').notEqual(0).toArray(function(notes) {
		d.resolve(notes);
	});
	return d.promise();

};

Evernote.prototype.updateNote = function(note) {

	note.updated = Math.floor(new Date().getTime());
	note.isSync = false;

	var d = $.Deferred(), self = this, packet = new Packet(Packet.TYPE.NOTE, Packet.OPERATION.UPDATE, this.usn);
	packet.guid = note.guid;
	packet.note = note;

	this.sap.onReceive = function() {
		note.isSync = true;
		self.setNotes(note);
	};
	this.setNotes(note).then(function() {
		self.sap.sendData(Evernote.CHANNELS.FULL_SYNC_CHANNEL_ID, packet.toJson());
		d.resolve();
	});
	return d.promise();
};

Evernote.htmlToNoteContent = function(content) {
	var res = content;

	res = res.replace(/<\!--\?xml version="1\.0" encoding="UTF-8"\?-->/g, '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">');
	res = res.replace(/<br[^>]*>/g, '<br></br>');
	// res = res.replace(/<en-media [^>]*/g, '$1' + "/");
	res = res.replace(/<\/en-media>/g, '');

	res = res.replace(/<input type="checkbox"\/?>/g, '<en-todo checked="false"\/>');
	res = res.replace(/<input type="checkbox" checked="unchecked"\/?>/g, '<en-todo checked="false"\/>');
	res = res.replace(/<input type="checkbox" checked\/?>/g, '<en-todo checked="false"\/>');
	res = res.replace(/<input type="checkbox" checked="checked"\/?>/g, '<en-todo checked="true"\/>');
	return res;
};

Evernote.noteContentToHtml = function(content) {
	var res = content;

	if (!res) {
		return res;
	}
	res = res.replace(/<en-todo ?\/?[checked="false"]* ?\/?>/g, '<input type="checkbox"/>');
	res = res.replace(/<en-todo ?\/?[checked="true"]* ?\/?>/g, '<input type="checkbox" checked="checked"/>');

	res = res.replace(/<\/ ?en-todo>/g, '');

	try {
		var el = $(res).find('en-crypt');
		if (el.length) {
			res = res.replace(el.parent().html(), '');
		}
	} catch (ignored) {

	}

	return res;
};

Evernote.stringToNoteContent = function(content) {
	var res, split = content.split("\n");

	res = '<?xml version="1.0" encoding="UTF-8"?>\n' + '<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">\n' + '<en-note>';

	for (var i = 0; i < split.length; i++) {
		if (split[i] !== "") {
			split[i] = "<div>" + split[i] + "</div>";
		} else {
			split[i] = "<div><br /></div>";
		}
		res = res + split[i];
	}

	res = res.replace(/<input type="checkbox">/g, "<en-todo/>");
	res = res.replace(/<input type="checkbox" checked="checked">/g, '<en-todo checked="true"/>');

	res = res + '\n</en-note>';

	return res;
};

Evernote.getTodosCount = function(note) {
	if (!note) {
		return 0;
	}

	return {
		unchecked : (note.content.match(/<en-todo\/>/g) || []).length + (note.content.match(/<en-todo checked="false"\/>/g) || []).length,
		checked : (note.content.match(/<en-todo checked="true"\/>/g) || []).length
	};
};

Evernote.prototype.changeNoteTags = function(note, tagGuids) {
	note.tagGuids = tagGuids;
	return this.updateNote(note);
};

Evernote.prototype.changeNoteContent = function(note, content) {
	note.content = content;
	return this.updateNote(note);
};

Evernote.prototype.renameNote = function(note, title) {
	if (!note || !title || title === '') {
		throw 'Note or title not set';
	}
	note.title = title;
	return this.updateNote(note);
};

Evernote.prototype.moveNote = function(note, notebookGuid) {
	var d = $.Deferred();
	if (!note || note.notebookGuid === notebookGuid) {
		d.resolve();
		return d.promise();
	}

	note.notebookGuid = notebookGuid;
	this.updateNote(note).then(function(){
		d.resolve();
	});
	return d.promise();
};

Evernote.prototype.createNote = function(title, content, notebookGuid, tagGuids) {
	var self = this, d = $.Deferred();

	if (!title) {
		d.reject('Empty title');
	}
	var packet = new Packet(Packet.TYPE.NOTE, Packet.OPERATION.CREATE, self.usn);
	packet.note = {
		title: title,
		content: content,
		notebookGuid: notebookGuid,
		tagGuids: tagGuids
	};

	this.sap.onReceive = function(channelId, data) {
		var res = JSON.parse(data);
		self.setNotes(res.note).then(function(){
			d.resolve(res.note);
		});
	};

	this.sap.sendData(Evernote.CHANNELS.FULL_SYNC_CHANNEL_ID, packet.toJson());
	return d.promise();
};

Evernote.prototype.getNotesCountByTags = function(tags) {
	var d = $.Deferred();

	var result = [], item = null;
	this.getNotes().then(function(notes) {
		tags.forEach(function(tag) {
			item = {
				tag : tag,
				count : 0
			};
			notes.forEach(function(note) {
				if (note.tagGuids && note.tagGuids.indexOf(tag.guid) !== -1) {
					item.count++;
				}
			});
			result.push(item);
		});
		d.resolve(result);
	});

	return d.promise();
};

Evernote.prototype.getNotesByTagGuid = function(guid) {

	var res = [], d = $.Deferred();

	if (!guid) {
		d.reject('Guid not set');
	}

	this.db.notes.each(function(note) {
		// noinspection JSUnresolvedVariable
		if (note.tagGuids && note.tagGuids.indexOf(guid) !== -1) {
			res.push(note);
		}
	}).then(function() {
		d.resolve(res);
	});

	return d.promise();
};

Evernote.prototype.getNotesCountByNotebooks = function(notebooks) {
	var res = [], d = $.Deferred();

	this.db.notes.toArray(function(notes) {
		var count = 0;
		notebooks.forEach(function(notebook) {
			count = 0;
			notes.forEach(function(note) {
				if (note.notebookGuid === notebook.guid && note.deleted === 0) {
					count++;
				}
			});
			res.push({
				notebook : notebook,
				count : count
			});
		});
	}).then(function() {
		d.resolve(res);
	});

	return d.promise();
};

Evernote.prototype.deleteNotesByGuids = function(guids){
	if (!guids){
		var d = $.Deferred();
		d.resolve();
		return d.promise();
	}
	return this.db.notes.where('guid').anyOf(guids)['delete']();	
};