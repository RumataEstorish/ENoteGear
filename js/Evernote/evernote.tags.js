/*global Evernote, Utils, Packet, $*/

Evernote.prototype.deleteTagByGuid = function(guid) {
	return this.db.tags.where('guid').equals(guid)['delete']();
};

Evernote.prototype.deleteTagsByGuids = function(guids) {
	if (!guids) {
		var d = $.Deferred();
		d.resolve();
		return d.promise();
	}
	return this.db.tags.where('guid').anyOf(guids)['delete']();
};

Evernote.prototype.getTags = function() {
	var d = $.Deferred();

	this.db.tags.toArray(function(tags) {
		d.resolve(tags);
	});

	return d.promise();
};

Evernote.prototype.setTags = function(tags) {
	if (!Array.isArray(tags)) {
		return this.db.tags.bulkPut([ tags ]);
	}
	return this.db.tags.bulkPut(tags);
};

Evernote.prototype.tagGuidsToList = function(guids) {
	var d = $.Deferred();

	if (!guids) {
		d.reject();
		return d.promise();
	}

	this.db.tags.where('guid').anyOf(guids).toArray(function(arr) {
		d.resolve(arr.map(function(a) {
			return a.name;
		}).join('; '));
	});
	return d.promise();
};

/**
 * Find tags by GUID
 * 
 * @param guid - tag guid           
 * @returns if found returns tag. Return null if tag not found
 */
Evernote.prototype.getTagByGuid = function(guid) {
	var d = $.Deferred();

	this.db.tags.where('guid').equals(guid).first(function(tag) {
		d.resolve(tag);
	});
	return d.promise();
};

Evernote.prototype.createTag = function(title) {
	var self = this, tag = {
		name : title,
		tempGuid : Utils.generateUUID()
	}, d = $.Deferred();

	if (!title) {
		d.reject("Empty title");
	}

	tag.guid = tag.tempGuid;

	var packet = new Packet(Packet.TYPE.TAG, Packet.OPERATION.CREATE, self.usn);
	packet.tag = tag;
	this.sap.onReceive = function(channelId, data) {
		var res = JSON.parse(data);
		self.setTags(res.tag).then(function() {
			d.resolve(res.tag);
		});
	};
	this.sap.sendData(Evernote.CHANNELS.FULL_SYNC_CHANNEL_ID, packet.toJson());

	return d.promise();
};