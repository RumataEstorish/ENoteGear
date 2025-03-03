/*global*/

/**
 * @param windowsProcessors - {
 *            id, showFun }
 * @param stackIgnore -
 *            ids of load pages we should skip on back
 */
function WindowStack(windowsProcessors, stackIgnore) {
	var stack = [];

	Object.defineProperties(this, {
		'processors': {
			get: function(){
				return windowsProcessors;
			}
		},
		'stack' : {
			get : function() {
				return stack;
			}
		},
		'stackIgnore' : {
			get : function() {
				return stackIgnore;
			}
		},
		'activeWindow' : {
			get : function() {
				if (stack.length > 0) {
					return stack[stack.length - 1].id;
				}
				return null;
			}
		}
	});
}

WindowStack.prototype.getDefaultShowFun = function(id) {
	var proc = null;
	for (var i = 0; i < this.processors.length; i++) {
		proc = this.processors[i];
		if (proc.id === id) {
			return proc.showFun;
		}
	}
};

WindowStack.prototype.refresh = function() {
	if (this.stack.length === 0) {
		return;
	}
	if (this.stack[this.stack.length - 1].showFun){
		this.stack[this.stack.length - 1].showFun();
	}
};

/**
 * Add initial page and don't call showFun
 */
WindowStack.prototype.addSilent = function(id, showFun){
	this.stack.push({id : id, showFun : (showFun ? showFun : this.getDefaultShowFun(id))});
};

WindowStack.prototype.add = function(id, showFun) {

	this.stack.push({id : id, showFun : (showFun ? showFun : this.getDefaultShowFun(id))});

	if (this.stack[this.stack.length - 1].showFun){
		this.stack[this.stack.length - 1].showFun();
	}
};

WindowStack.prototype.back = function() {

//	Log.debug('Stack before: ' + this.stack.toString());

	
	//Skip ignore
	for (var i = this.stack.length - 1; i>=0; i--){
		if (this.stackIgnore.indexOf(this.stack[i].id) !== -1){
			this.stack.splice(i,1);
		}
	}
	
	if (this.stack.length > 1){
		this.stack.pop();
		
	}

	if (this.stack[this.stack.length - 1].showFun){
		this.stack[this.stack.length - 1].showFun();
	}
		

//	Log.debug('Current id: ' + id);
//	Log.debug('Stack after: ' + this.stack.toString());
	
};