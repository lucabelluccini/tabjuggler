/*
TabJuggler: Chrome/Chromium Extension. Manage your Tabs!
Copyright (C) 2010  Luca Belluccini

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
*/

// Sets the internal status of TabJuggler Extension
	// TODO: To be turned in TabJuggler.status
	var status = "idle";
	// TODO: To be turned in TabJuggler.currentTabs
	var currentTabs = new Array();
	// TODO: To be turned in TabJuggler.classifiedTabs
	var classifiedTabs = new Object();
	/* DEPRECATED ?
	chrome.extension.onRequest.addListener(
		function(request, sender, sendResponse) {
			if(request.msg == "currentTabs") {
				status = request.msg;
				currentTabs = request.data;
			}
			if(request.msg == "classifiedTabs") {
				status = request.msg;
				classifiedTabs = request.data;
			}
			sendResponse();
		}
	);
	*/
	
	// New call
	function message(msg, data) {
		if(msg == "currentTabs") {
			status = msg;
			currentTabs = data;
		}
		if(msg == "classifiedTabs") {
			status = msg;
			classifiedTabs = data;
		}
	}
	
	chrome.windows.onCreated.addListener(
		function(wnd) {
			if(status == "idle")
				return;
			if(status == "currentTabs") {
				var empty = true;
				var movedTabId;
				for(tidx in currentTabs) {
					empty = false;
					movedTabId = currentTabs.pop().id;
					// Move that tab to the newest Window
					chrome.tabs.move(movedTabId,{windowId:wnd.id, index:0});
					break;
				}
				if(empty) {
					status = "idle";
					currentTabs = null;
				}
			}
			if(status == "classifiedTabs") {
				// Extract a group of Tabs
				var empty = true;
				for(gidx in classifiedTabs) {
					empty = false;
					var tabGroup = classifiedTabs[gidx];
					// For each tab in the group
					for(tidx in tabGroup) {
						// Move Tab of this group into the new Window
						chrome.tabs.move(tabGroup[tidx],{windowId:wnd.id,index:0});
					}
					delete classifiedTabs[gidx];
					break;
				}
				if(empty) {
					status = "idle";
					classifiedTabs = null;
				}
			}
		}
	);