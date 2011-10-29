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

		// TODO: to settings
		var TOPOFFSETPX = 48;
		
		var tmpResult = [];
		
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
		// TODO: To be turned in TabJuggler.allTabsToOneWindow()
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
						// For each tab in this Window
						for(tidx in openWindows[idx].tabs) {
							// Move to the current window
							chrome.tabs.move(openWindows[idx].tabs[tidx].id,{windowId:currentWindowId,index:0});
						}
					}
				}
			}
		}
		
		// It opens a Window for each group of Tabs having the same Hostname
		// TODO: To be turned in TabJuggler.oneWindowForEachHostName()
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
						if(tabGroups[hostname] == undefined)
							tabGroups[hostname] = new Array();
						tabGroups[hostname].push(tab.id);
					}
				}
				//chrome.extension.sendRequest({msg:"classifiedTabs", data:tabGroups});
				chrome.extension.getBackgroundPage().message("classifiedTabs",tabGroups);
				var autoclose = chrome.extension.getURL("autoclose.html");
				var topOffsetPx = 0;
				for(hnidx in tabGroups) {
					chrome.windows.create({top:topOffsetPx,url:chrome.extension.getURL("autoclose.html")});
					topOffsetPx += TOPOFFSETPX;
				}
				tabGroups = null;
				autoclose = null;
			}
		}
		
		// It opens a Window for each Tab
		// TODO: To be turned in TabJuggler.oneWindowForEachTab()
		function oneWindowForEachTab() {
			// Get current Window
			chrome.windows.getCurrent(getAllTabs);
			function getAllTabs(currentWindow) {
				chrome.tabs.getAllInWindow(currentWindow.id, iterateThroughTabs);
				function iterateThroughTabs(tabs) {
					//chrome.extension.sendRequest({msg:"currentTabs", data:tabs});
					chrome.extension.getBackgroundPage().message("currentTabs",tabs);
					var autoclose = chrome.extension.getURL("autoclose.html");
					var topOffsetPx = 0;
					for(idxt in tabs) {
						// Create a new Window for each one
						chrome.windows.create({top:topOffsetPx,url:chrome.extension.getURL("autoclose.html")});
						topOffsetPx += TOPOFFSETPX;
					}
					tabs = null;
					autoclose = null;
				}
			}
		}
		
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
		// TODO: To be turned in TabJuggler.oneWindowForEachTab()
		function sortAllTabsInWindowBy(key) {
			// Get current Window
			chrome.windows.getCurrent(getAllTabs);
			function getAllTabs(currentWindow) {
				chrome.tabs.getAllInWindow(currentWindow.id, iterateThroughTabs);
				function iterateThroughTabs(tabs) {
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
					tabs = null;
				}
			}
		}

		function refreshTabFilterResult() {
			function iterateThroughWindows(openWindows) {
				// For each open Window
				for(idx in openWindows) {
					chrome.tabs.getAllInWindow(openWindows[idx].id, collectTabs);
					function collectTabs(tabsInWindow){
						var pattern;
						if(searchText == ""){
							return;
						}
						if(caseSensitive){
							pattern = new RegExp(searchText);
						} else {
							pattern = new RegExp(searchText,"i");
						}
						for(idxt in tabsInWindow) {
							var url = tabsInWindow[idxt].url;
							var title = tabsInWindow[idxt].title;
							if(title.match(pattern) != null || url.match(pattern) != null) {
								tmpResult.push(tabsInWindow[idxt].id);
								$('#tabFilterInput').after('<div onclick="bringTabToFront(' + tabsInWindow[idxt].id + ')" class="toolstrip-button result"><img alt="favicon" src="' + tabsInWindow[idxt].favIconUrl + '"><span>' + tabsInWindow[idxt].title + '</span></div>');
								if(tmpResult.length == 1){
									$('.result').last().after('<div class="separator-empty resultcontrol"></div><div style="display:inline" onclick="closeMatchedTabs()" class="toolstrip-button resultcontrol">Close Matched</div><div style="display:inline" onclick="closeUnmatchedTabs()" class="toolstrip-button resultcontrol">Close Unmatched</div><div style="display:inline" onclick="detachMatchedTabs()" class="toolstrip-button resultcontrol">Detach Matched</div><div style="display:inline" onclick="detachUnmatchedTabs()" class="toolstrip-button resultcontrol">Detach Unmatched</div>');
								}
							}
						}
					}
				}
			}
			var searchText = $('#tabSearch').val();
			var caseSensitive =  $('#caseSensitive').attr('checked');
			var inThisWindowOnly =  $('#inThisWindowOnly').attr('checked');
			$(".result").remove();
			$(".resultcontrol").remove();
			tmpResult = [];
			if(inThisWindowOnly){
				chrome.windows.getCurrent(function(currWindow) {
					var windowArray = [];
					windowArray.push(currWindow);
					iterateThroughWindows(windowArray);
				});
			} else {
				chrome.windows.getAll({populate:true}, iterateThroughWindows);
			}
		}
		
		function bringTabToFront(tabIndex) {
			chrome.tabs.update(tabIndex, {
				selected: true
			});
		}
		
		function detachMatchedTabs() {
			chrome.windows.create(null, function(newWindow) {
				while(aTabId = tmpResult.pop()){
					chrome.tabs.move(aTabId, {windowId:newWindow.id,index:0});
				}
				$(".result").remove();
				$(".resultcontrol").remove();
			});

		}
		
		function detachUnmatchedTabs() {
			function iterateThroughTabsDetach(tabsInWindow) {
				// Check this tab id againts result tab ids
				for(idxt in tabsInWindow) {
					for(var idxr = 0; idxr < tmpResult.length; ) {
						if(tmpResult[idxr] == tabsInWindow[idxt].id) {
							tmpResult.splice(idxr,1);
							tabsInWindow.splice(idxt,1);
							continue;
						}
						++idxr;
					}
				}
				// For each tab in Window (result tabs excluded)
				for(idxt in tabsInWindow) {
					chrome.tabs.move(tabsInWindow[idxt].id, {windowId:newWindowId,index:0});
				}
			}
			
			var inThisWindowOnly =  $('#inThisWindowOnly').attr('checked');
			if(inThisWindowOnly) {
				chrome.windows.getCurrent(function(currWindow) {
					chrome.windows.create(null, function(newWindow) {
						var newWindowId = newWindow.id;
						chrome.tabs.getAllInWindow(currWindow.id, iterateThroughTabsDetach);
					});
				});
			} else {
				chrome.windows.create(null, function(newWindow) {
					var newWindowId = newWindow.id;
					chrome.windows.getAll({populate:true}, function(openWindows) {
						// For each open Window
						for(idx in openWindows) {
							if(openWindows[idx].id != newWindowId) {
								chrome.tabs.getAllInWindow(openWindows[idx].id, iterateThroughTabsDetach);
							}
						}
					});
				});
			}
		}
		
		function closeMatchedTabs() {
			while(aTabId = tmpResult.pop()){
				chrome.tabs.remove(aTabId);
			}
			$(".result").remove();
			$(".resultcontrol").remove();
		}
		
		function closeUnmatchedTabs() {
			function iterateThroughTabsClose(tabsInWindow) {
				// Check this tab id againts result tab ids
				for(idxt in tabsInWindow){
					for(var idxr = 0; idxr < tmpResult.length; ){
						if(tmpResult[idxr] == tabsInWindow[idxt].id){
							tmpResult.splice(idxr,1);
							tabsInWindow.splice(idxt,1);
							continue;
						}
						++idxr;
					}
				}
				// For each tab in Window (result tabs excluded)
				for(idxt in tabsInWindow) {
					chrome.tabs.remove(tabsInWindow[idxt].id);
				}
			}
			
			var inThisWindowOnly =  $('#inThisWindowOnly').attr('checked');
			if(inThisWindowOnly) {
				chrome.windows.getCurrent(function(currWindow) {
					chrome.tabs.getAllInWindow(currWindow.id, iterateThroughTabsClose);
				});
			} else {
				chrome.windows.getAll({populate:true}, function(openWindows) {
					// For each open Window
					for(idx in openWindows) {
						chrome.tabs.getAllInWindow(openWindows[idx].id, iterateThroughTabsClose);
					}
				});
			}
		}
		
		