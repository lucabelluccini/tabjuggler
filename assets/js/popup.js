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
		
		// Global BackgroundPage variable for accessing functions
		var backgroundPage = chrome.extension.getBackgroundPage();
		
		var tmpResult = [];
		
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

	function resetResult() {
		delete tmpResult;
		$(".result").remove();
		$(".resultcontrol").remove();
	}	
		
	// Detaches matched tabs
	function detachMatchedTabs() {
		backgroundPage.detachMatchedTabs(tmpResult);
		resetResult();
	}
	
	// Detaches unmatched tabs
	function detachUnmatchedTabs() {
		var inThisWindowOnly = $('#inThisWindowOnly').attr('checked');
		backgroundPage.detachUnmatchedTabs(tmpResult, inThisWindowOnly);
		resetResult();
	}
	
	// Close matched tabs
	function closeMatchedTabs() {
		backgroundPage.closeMatchedTabs(tmpResult);
		resetResult();
	}
	
	// Close unmatched tabs
	function closeUnmatchedTabs() {
		var inThisWindowOnly =  $('#inThisWindowOnly').attr('checked');
		backgroundPage.closeUnmatchedTabs(tmpResult, inThisWindowOnly);
		resetResult();
	}		