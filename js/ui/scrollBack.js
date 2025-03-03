/*global $*/

/**
 * Rename position of scroll when changing tau pages
 * @param pageName name with # or not
 */
function ScrollBack(pageName){
	var pName = pageName[0] === '#' ? pageName : '#' + pageName, page = $(pName), scrollTop = 0;
	
	page.on('pagebeforehide.scrollback', function(){
		scrollTop = page.find('.ui-scroller').scrollTop();
	});
	page.on('pageshow.scrollback', function(){
		page.find('.ui-scroller').scrollTop(scrollTop);
	});
	
	Object.defineProperty(this, 'pageName', {
		get : function(){
			return pName;
		}
	});
	
}

ScrollBack.prototype.destroy = function(){
	$(this.pageName).off('pageshow.scrollback');
	$(this.pageName).off('pagebeforehide.scrollback');
};