/*jslint unused: false*/

Packet.VERSION = 1;

function Packet(type, operation, usn) {

	var guid = null, tag = null, note = null, notebook = null;

	Object.defineProperties(this, {
		'version' : {
			get : function(){
				return Packet.VERSION;
			}
		},
		'usn' : {
			get : function() {
				return usn;
			},
			set : function(val) {
				usn = val;
			}
		},
		'type' : {
			get : function() {
				return type;
			}
		},
		'operation' : {
			get : function() {
				return operation;
			}
		},
		'guid' : {
			get : function() {
				return guid;
			},
			set : function(val) {
				guid = val;
			}
		},
		'note' : {
			get : function(){
				return note;
			},
			set : function(val){
				note = val;
			}
		},
		'notebook' : {
			get : function(){
				return notebook;
			},
			set : function(val){
				notebook = val;
			}
		},
		'tag' : {
			get : function(){
				return tag;
			},
			set : function(val){
				tag = val;
			}
		}
	});
}

Packet.TYPE = {
	SYNC : 0,
	NO_DATA : 1,
	NOTE : 2,
	NOTEBOOK : 3,
	TAG : 4,
	ERROR : 5,
	COUNT : 6,
	USER : 7
};

Packet.OPERATION = {
	CREATE : 0,
	UPDATE : 1,
	DELETE : 2,
	CONTENT : 3
};

/*Packet.CONTENT_TYPE = {
	NOTE : 0,
	NOTEBOOK : 1,
	TAG : 2,
	EXPUNGED_NOTE : 3,
	EXPUNGED_NOTEBOOK : 4,
	EXPUNGED_TAG : 5,
	OTHER : 6,
	ALL : 7,
	EXPECTED_DATA : 8
};*/

Packet.prototype.toJson = function() {
	return JSON.stringify({
		type : this.type,
		operation : this.operation,
		usn : this.usn,
		note : this.note,
		tag : this.tag,
		notebook : this.notebook,
		guid : this.guid,
		version : this.version
	});
};