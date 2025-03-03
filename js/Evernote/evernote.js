/*global Dexie, SAP, Packet, $*/
/*jslint laxbreak: true*/

/**
 * listener = { onprogress, onsyncstop, onnotauthorized, onerror,
 * onnochanges,onnotecontent,onnoteupdated, onnotedeleted, onnotecreated,
 * onuser, ontagcreated, ontagupdated }
 */
function Evernote(sap) {
	try {
		var defaultNotebook = null, user = null, db = new Dexie('ENoteGear');

		db.version(1).stores({
			notes : 'guid, notebookGuid, tagGuids, tempGuid, deleted',
			notebooks : 'guid, stack',
			tags : 'guid, tempGuid'
		});

		db.open()['catch'](function(error) {
			alert(error);
		});

		Object.defineProperty(this, 'db', {
			get : function() {
				return db;
			}
		});

		Object.defineProperty(this, 'sap', {
			get : function() {
				return sap;
			}
		});

		Object.defineProperty(this, 'usn', {
			get : function() {
				var res = localStorage.getItem("usn");
				if (res) {
					return parseInt(res, 0);
				}
				return 0;
			},
			set : function(val) {
				localStorage.setItem("usn", val);
			}
		});

		/**
		 * User
		 */
		Object.defineProperty(this, 'user', {
			get : function() {
				return user;
			},
			set : function(val) {
				user = val;
			}
		});

		/**
		 * Default Notebook
		 */
		Object.defineProperty(this, 'defaultNotebook', {
			get : function() {
				return defaultNotebook;
			},
			set : function(val) {
				defaultNotebook = val;
			}
		});

	} catch (e) {
		alert(e);
		console.log(e);
	}
}

/**
 * Full sync evernote. Delete all data and pull again
 */
Evernote.prototype.fullSync = function() {
	var self = this;
	return this.clear().then(function() {
		return self.sync(0);
	});
};

/**
 * Sync evernote.
 *
 * @param usn if undefined, Evernote.usn will be used
 */
Evernote.prototype.sync = function(usn) {

	var self = this, tempNotebooks = [], tempNotes = [], tempTags = [], d = $.Deferred(), res = null, totalCount = 0, received = 0, notify = function() {
		received++;
		var p = parseInt(received * 100 / totalCount, 0);
		d.notify(p);
		if (received === totalCount) {
			self.setNotes(tempNotes).then(function() {
				self.setNotebooks(tempNotebooks).then(function() {
					self.setTags(tempTags).then(function() {
						d.resolve(received);
					});
				});
			});
		}
	};

	this.getNotebooksCount().then(function(count) {
		self.sap.connectOnDeviceNotConnected = count === 0;
	});

	this.sap.onReceive = function(channelId, data) {

		switch (data) {
		case Evernote.NO_DATA:
			d.resolve();
			return;
		case SAP.AUTH_NEEDED:
			d.notify(SAP.AUTH_NEEDED);
			self.sap.connectOnDeviceNotConnected = true;
			self.sap.sendData(Evernote.CHANNELS.FULL_SYNC_CHANNEL_ID, new Packet(Packet.TYPE.SYNC, Packet.OPERATION.CREATE, usn ? usn : self.usn).toJson());
			return;
		default:
			res = JSON.parse(data);
			break;
		}

		res.type = parseInt(res.type, 0);
		res.operation = parseInt(res.operation, 0);

		self.usn = res.usn;

		switch (res.type) {
		case Packet.TYPE.ERROR:
			// noinspection JSUnresolvedVariable
			d.reject(res.error_message);
			break;
		case Packet.TYPE.NO_DATA:
			d.resolve();
			break;
		case Packet.TYPE.COUNT:
			// noinspection JSUnresolvedVariable
			if (res.notesCount) {
				totalCount += res.notesCount;
			}
			// noinspection JSUnresolvedVariable
			if (res.notebooksCount) {
				totalCount += res.notebooksCount;
			}
			// noinspection JSUnresolvedVariable
			if (res.tagsCount) {
				totalCount += res.tagsCount;
			}
			break;
		case Packet.TYPE.SYNC:
			// noinspection JSUnresolvedVariable
			self.deleteNotebooksByGuids(res.expungedNotebooks).then(function() {
				// noinspection JSUnresolvedVariable
				return self.deleteNotesByGuids(res.expungedNotes);
			}).then(function() {
				// noinspection JSUnresolvedVariable
				self.deleteTagsByGuids(res.expungedTags);
			});
			break;
		case Packet.TYPE.NOTE:
			tempNotes.push(res.note);
			notify();
			break;
		case Packet.TYPE.NOTEBOOK:
			tempNotebooks.push(res.notebook);
			notify();
			break;
		case Packet.TYPE.TAG:
			tempTags.push(res.tag);
			notify();
			break;
		}
	};

	this.sap.sendData(Evernote.CHANNELS.FULL_SYNC_CHANNEL_ID, new Packet(Packet.TYPE.SYNC, Packet.OPERATION.CREATE, usn ? usn : this.usn).toJson()).fail(function(err) {
		if (err === SAP.ERRORS.DEVICE_NOT_CONNECTED) {
			setTimeout(function() {
				d.resolve();
			}, 1000);
		}
	});
	return d.promise();
};

Evernote.prototype.getUser = function() {
	var self = this, d = $.Deferred();

	this.sap.onReceive = function(channelId, data) {
		self.user = JSON.parse(data).user;
		d.resolve(self.user);
	};

	this.sap.sendData(Evernote.CHANNELS.FULL_SYNC_CHANNEL_ID, new Packet(Packet.TYPE.USER).toJson());
	return d.promise();
};

/**
 * Full data clear
 */
Evernote.prototype.clear = function() {
	var self = this, d = $.Deferred();

	this.usn = 0;
	this.db.notebooks.clear().then(function() {
		return self.db.notes.clear();
	}).then(function() {
		return self.db.tags.clear();
	}).then(function() {
		d.resolve();
	});

	return d.promise();
};