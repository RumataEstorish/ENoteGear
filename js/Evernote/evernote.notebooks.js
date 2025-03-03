/*global Evernote, Utils, $*/

Evernote.prototype.deleteNotebookByGuid = function(guid) {
	return this.db.notebooks.where('guid').equals(guid)['delete']();
};

Evernote.prototype.getNotebooksCount = function() {
	var d = $.Deferred();
	this.db.notebooks.count(function(count) {
		d.resolve(count);
	});
	return d.promise();
};

Evernote.prototype.setNotebooks = function(notebooks) {
	notebooks.forEach(function(notebook) {
		if (!notebook.stack) {
			notebook.stack = '';
		}
	});
	if (!Array.isArray(notebooks)) {
		return this.db.notebooks.bulkPut([notebooks]);
	}
	return this.db.notebooks.bulkPut(notebooks);
};

Evernote.prototype.getNotebooks = function() {
	var d = $.Deferred();

	this.db.notebooks.toArray(function(notebooks) {
		d.resolve(notebooks.sort(Utils.dynamicSort('name')));
	});
	return d.promise();
};

Evernote.prototype.calcNotebooksStacks = function() {
	var stack = [ {
		name : "",
		notebooks : []
	} ], self = this, d = $.Deferred();

	// Add notepad to stack. If no stack, new one is created
	function appendToStack(notebook) {
		for (var i = 0; i < stack.length; i++) {
			if ((!notebook.stack && stack[i].name === '') || stack[i].name === notebook.stack) {
				stack[i].notebooks.push(notebook);
				return;
			}
		}

		stack.push({
			name : notebook.stack,
			notebooks : [ notebook ]
		});
	}

	this.db.notebooks.each(function(notebook) {
		// noinspection JSUnresolvedVariable
		if (notebook.defaultNotebook === true) {
			self.defaultNotebook = notebook;
		}
		appendToStack(notebook);
	}).then(function() {
		stack.sort(Utils.dynamicSort('name'));
		stack.forEach(function(stack){
			stack.notebooks.sort(Utils.dynamicSort('name'));
		});
		d.resolve(stack);
	});
	
	return d.promise();
};

/**
 * Get notbook by guid
 * 
 * @param guid - guid to find
 * @returns found notebook. If notebook is not found return null
 */
Evernote.prototype.getNotebookByGuid = function(guid) {
	var d = $.Deferred();

	this.db.notebooks.where('guid').equals(guid).first(function(notebook){
		d.resolve(notebook);
	});
	
	return d.promise();
};

Evernote.prototype.deleteNotebooksByGuids = function(guids) {
	if (!guids){
		var d = $.Deferred();
		d.resolve();
		return d.promise();
	}
	return this.db.notebooks.where('guid').anyOf(guids)['delete']();
};
