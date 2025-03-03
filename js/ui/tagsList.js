/*global $, Utils, tau, LANG_JSON_DATA, createScroller*/
/* jshint unused: false */
/* jslint laxbreak: true */

/**
 * Работа со списком меток
 */
function TagsList(evernote, windowStack) {
	this.selectedtagsguid = [];

	Object.defineProperties(this, {
		'windowStack' : {
			get: function(){
				return windowStack;
			}
		},
		'evernote' : {
			get: function(){
				return evernote;
			}
		}
	});
}

TagsList.isCheck = false;

TagsList.prototype.open = function() {
	var list = $("#tagsList"), letter = null, self = this;

	TagsList.isCheck = false;

	this.evernote.getTags().then(function(tags) {
		tags.sort(Utils.dynamicSort('name'));
		if (!tags || tags.length === 0) {
			return;
		}
		
		tags.forEach(function(tag) {
			if (tag.name[0].toUpperCase() !== letter) {
				letter = tag.name[0].toUpperCase();
				list.append('<li class="ui-listview-divider">' + letter + '</li>');
			}
			list.append('<li class="li-has-multiline" onclick="openTag(id)" id="' + tag.guid + '"><a href="#">' + tag.name + '<span class="ui-li-sub-text li-text-sub"></span></a></li>');
		});

		self.evernote.getNotesCountByTags(tags).then(function(res) {
			res.forEach(function(r) {
				$('#' + r.tag.guid + " span").html(LANG_JSON_DATA.NOTES + ": " + r.count);
			});
		});

		Utils.createIndexScrollBar("tagsPage", "tagsIndexBar", "tagsList");
		createScroller({
			target : document.getElementById('tagsPage')
		});
		$("#tagsAcceptBtn").hide();
		$("#tagsMenuBtn").show();
		
		$('#tagsPage').one('pagebeforehide', function(){
			list.empty();
		});

		tau.changePage("#tagsPage");
	});

};

TagsList.prototype.openSelect = function(selectTagsGuid) {
	TagsList.isCheck = true;
	

	var d = $.Deferred(), self = this, letter = null, list = $("#tagsList"), tagsAccept = function() {
		var checked = $("#tagsList :checked");
		self.selectedtagsguid = [];

		for (var i = 0; i < checked.length; i++) {
			self.selectedtagsguid.push(checked.eq(i).prop("id"));
		}

		d.resolve(self.selectedtagsguid);
		self.windowStack.back();
	};
	
	

	this.evernote.getTags().then(function(tags) {
		if (!tags || tags.length === 0) {
			d.reject(LANG_JSON_DATA.NO_TAGS);
			return d.promise();
		}

		tags.sort(Utils.dynamicSort('name'));
		
		tags.forEach(function(tag) {
			if (tag.name[0].toUpperCase() !== letter) {
				letter = tag.name[0].toUpperCase();
				list.append('<li class="ui-listview-divider">' + letter + '</li>');
			}

			list.append('<li class="li-has-checkbox"><label>' + tag.name + '<input id="' + tag.guid + '" type="checkbox"/></label></li>');
		});

		if (selectTagsGuid) {
			selectTagsGuid.forEach(function(tag) {
				$("#" + tag).prop("checked", "checked");
			});
		}

		Utils.createIndexScrollBar("tagsPage", "tagsIndexBar", "tagsList");
		$("#tagsMenuBtn").hide();
		var tagAcceptBtn = $('#tagsAcceptBtn');
		tagAcceptBtn.one("click", tagsAccept);
		tagAcceptBtn.show();


		$('#tagsPage').one('pagebeforehide', function(){
			list.empty();
		});
		tau.changePage("#tagsPage");
	});

	return d.promise();
};