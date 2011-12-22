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

	// Vertical Offset between windows
	var TOPOFFSETPX = 48;

	// Extracts the Hostname from a String
	// TODO: Support chrome:// and chrome-extension:// URI Schemas
	// TODO: Try to obtain 2nd level domain instead of Hostname
	String.prototype.getHostname = function() {
		// ^(((?:f|ht)tp)(?:s)?|(chrome))\://([^/]+)
		var re = new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im');
		if(this.match(re) != null)
			return this.match(re)[1].toString();
		else
			return "";
	}
	
	// It collects all Tabs and it moves them into a single Window
	function allTabsToOneWindow() {
		// Destination Window is the current one
		chrome.windows.getCurrent(getAllWindows);
		function getAllWindows(currentWindow) {
			currentWindowId = currentWindow.id;
			// Get all open Windows (it's cold here!)
			chrome.windows.getAll({populate:true}, iterateThroughWindows);
			function iterateThroughWindows(openWindows) {
				// For each open Window
				for(idx in openWindows) {
					// If it is not the Destination Window
					if(openWindows[idx].id == currentWindowId)
						continue;
					// Move to the current window
					var idList = [];
					for(ididx in openWindows[idx].tabs) {
						idList.push(openWindows[idx].tabs[ididx].id);
					}
					// Move the list of tabs to the current window
					chrome.tabs.move(idList, {windowId:currentWindowId,index:0}, function(tabs) {
						delete idList;
					});
				}
			}
		}
	}
	
	// It opens a Window for each group of Tabs having the same Hostname
	function oneWindowForEachHostName() {
		chrome.windows.getAll({populate:true}, iterateThroughWindows);
		function iterateThroughWindows(openWindows) {
			var tabGroups = new Object();
			// For each open Window
			for(idx in openWindows) {
				// For each tab in this Window
				for(tidx in openWindows[idx].tabs) {
					tab = openWindows[idx].tabs[tidx];
					hostname = tab.url.getHostname();
					if(hostname == null)
						continue;
					if(hostname == "")
						hostname = "others";
					// Collect tab groups in an associative array of tab arrays
					if(tabGroups[hostname] == undefined)
						tabGroups[hostname] = [];
					tabGroups[hostname].push(tab.id);
				}
			}
			var topOffsetPx = 0;
			// For each group of tabs
			for(hnidx in tabGroups) {
				// Create a window using the first tab in the tab groups
				chrome.windows.create({top:topOffsetPx, tabId:tabGroups[hnidx][0]}, moveTabsToNewWindow);
				function moveTabsToNewWindow(newWindow) {
					// Move the remaining ones to new window
					for(aidx in tabGroups) {
						// Lookup the tab groups to find the missing tabs of the group
						if(tabGroups[aidx][0] == newWindow.tabs[0].id) {
							chrome.tabs.move(tabGroups[aidx], {windowId:newWindow.id, index:0}, function(tabs) {
								delete tabGroups[aidx];
							});
							break;
						}
					}
				}
				topOffsetPx += TOPOFFSETPX;
			}
		}
	}
	
	// It opens a Window for each Tab
	function oneWindowForEachTab() {
		// Get current Window
		chrome.windows.getCurrent(getAllTabs);
		function getAllTabs(currentWindow) {
			chrome.tabs.getAllInWindow(currentWindow.id, iterateThroughTabs);
			function iterateThroughTabs(tabs) {
				var topOffsetPx = 0;
				for(idxt in tabs) {
					// Create a new Window for each tab and assign directly to it
					chrome.windows.create({top:topOffsetPx, tabId:tabs[idxt].id}, function(newWindow) {
						delete tabs[idxt];
					});
					topOffsetPx += TOPOFFSETPX;
				}
			}
		}
	}

	// Comparators for sorting
	function strcmp(str1, str2) {
		return ( ( str1 == str2 ) ? 0 : ( ( str1 > str2 ) ? 1 : -1 ) );
	}
	function byTitle(a, b) {
		return strcmp(a.title.toLowerCase(), b.title.toLowerCase());
	}
	function byHostname(a, b) {
		return strcmp(a.url.getHostname().toLowerCase(), b.url.getHostname().toLowerCase());
	}
	function byUrl(a, b) {
		return strcmp(a.url.toLowerCase(), b.url.toLowerCase());
	}
	
	// It sorts tabs using parameter as key
	function sortAllTabsInWindowBy(key) {
		// Get current Window
		chrome.windows.getCurrent(function (currentWindow) {
			tabs = currentWindow.tabs;
			if (key == 'hostname')
				tabs = tabs.sort(byHostname);
			if (key == 'title')
				tabs = tabs.sort(byTitle);
			if (key == 'url')
				tabs = tabs.sort(byUrl);
			var i = 0;
			for(idxt in tabs) {
				chrome.tabs.move(tabs[idxt].id, {index:i++});
			}
			delete tabs;
		});
	}
	
	// TODO: Sort tabs in all windows
	
	// Detaches matched tabs
	function detachMatchedTabs(tabIds) {
		chrome.windows.create({tabId:tabIds[0]}, function(newWindow) {
			chrome.tabs.move(tabIds, {windowId:newWindow.id, index:0});
		});
	}
	
	// Detaches matched tabs
	function detachUnmatchedTabs(tabIds, thisWindowOnly) {
		if(thisWindowOnly) {
			chrome.windows.getCurrent(function(currWindow) {
				iterateThroughTabsDetach(currWindow.tabs);
			});
		} else {
			chrome.windows.getAll({populate:true}, function(openWindows) {
				for(idx in openWindows) {
					iterateThroughTabsDetach(openWindows[idx].tabs);
				}
			});
		}

		function iterateThroughTabsDetach(tabsInWindow) {
			// Check this tab id againts result tab ids
			for(idxt in tabsInWindow){
				for(var idxr = 0; idxr < tabIds.length; ){
					if(tabIds[idxr] == tabsInWindow[idxt].id){
						tabIds.splice(idxr,1);
						tabsInWindow.splice(idxt,1);
						continue;
					}
					++idxr;
				}
			}
			// For each tab in Window (result tabs excluded)
			var tabsToDetach = [];
			for(idxt in tabsInWindow) {
				tabsToDetach.push(tabsInWindow[idxt].id);
			}
			chrome.windows.create(tabsToDetach[0], function(newWindow) {
				chrome.tabs.move(tabsToDetach, {windowId:newWindow.id, index:0});
				delete tabsToDetach;
			});
		}
	}
	
	function closeMatchedTabs(tabIds) {
		chrome.tabs.remove(tabIds);
	}
	
	function closeUnmatchedTabs(tabIds, thisWindowOnly) {
		if(thisWindowOnly) {
			chrome.windows.getCurrent( function(currWindow) {
				iterateThroughTabsClose(currWindow.tabs);
			});
		} else {
			chrome.windows.getAll({populate:true}, function(openWindows) {
				// For each open Window
				for(idx in openWindows) {
					iterateThroughTabsClose(openWindows[idx].tabs);
				}
			});
		}
		function iterateThroughTabsClose(tabsInWindow) {
			// Check this tab id againts result tab ids
			for(idxt in tabsInWindow){
				for(var idxr = 0; idxr < tabIds.length; ){
					if(tabIds[idxr] == tabsInWindow[idxt].id){
						tabIds.splice(idxr,1);
						tabsInWindow.splice(idxt,1);
						continue;
					}
					++idxr;
				}
			}
			// For each tab in Window (result tabs excluded)
			var tabsToClose = [];
			for(idxt in tabsInWindow) {
				tabsToClose.push(tabsInWindow[idxt].id);
			}
			chrome.tabs.remove(tabsToClose);
			delete tabsToClose;
		}
	}