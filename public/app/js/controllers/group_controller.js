'use strict';

/**
 * Group controller which
 * displays user folders and adds support to the main 'cut and paste' functionality
 * in order to create a snippet
 */

angular.module('cmndvninja').controller('GroupController',
  ['$scope', '$location','$document', 'Group', 'Shared','Snippet','$timeout',
  function($scope, $location,$document, Group, Shared, Snippet, $timeout){

  $.material.init();

  $scope.groupData = {};
  $scope.$parent.userGroups = {};
  $scope.snippetCount = 0;
  $scope.snippetPastedText = "";
  $scope.showAlert = false;
  $scope.image_url = "";


  $scope.deleteGroup = function($event, group) {
    group.userId = Shared.userId;
    group.user = Shared.userId;
    group.id = group._id;
    if(Shared.loggingEnabled) console.log('the group you tried to delete is:', group);
    Group.remove(group);
    removeGroupFromDom(group);
    if($event)$event.stopPropagation()
  };

  /* This overrides the default picture setting on the server side.
  It's necessary because otherwise pictures don't show up until the page
  reloads */

  var insertDefaultPicture = function(obj) {
    if (!obj.image_url) {
      obj.image_url = 'app/img/default-code-image.png';
    }
  };

  $scope.shareGroup = function (group) {
    if(Shared.loggingEnabled) console.log('this group should be shared:', group)
  };

		$scope.showGroup = function(id){
			if(Shared.loggingEnabled) console.log($scope.groupData);
			Shared.groups = $scope.groupData.groups;
			Shared.currentGroupId = id;
			$location.path('groups/'+id + '/snippets');
		};

		$scope.firePasteSnippet = function($event){
			if(Shared.loggingEnabled) console.log("fire paste event");
			$event.stopPropagation();

		};

		$scope.pasteSnippet = function($event){
			var newSnippet = {};
			newSnippet.user = $scope.$parent.user._id;
			newSnippet.content = $scope.snippetPastedText;
			newSnippet.groupId =$scope.groupId;
			newSnippet.group = $scope.groupId;
			newSnippet.unique_handle = "Just added using CMD+V (" + (new Date()).toDateString()+")"; //might make this configurable
			if(Shared.loggingEnabled) console.log("new group snippets",newSnippet);

			Snippet.post(newSnippet).$promise.then(function(group){
				//animate
				//change count
				$("#alert-success-"+newSnippet.groupId).removeClass('hide');
				$scope.groupData.groups.forEach (
					function(item){
						if (item._id === newSnippet.groupId){
							item.content_count+=1;

							$timeout(function(){ $("#alert-success-"+newSnippet.groupId).addClass('hide');}, 3000);
						}
					}
				);
			});

			if($event)$event.stopPropagation();

		};

		$scope.createGroup = function () {
			var image_url = $('#image_url_box').val(),
				description = $('#description_box').val(),
				name = $('#name_box').val(),
				group = {
					name: name,
					description: description,
					image_url: image_url,
					userId: Shared.userId,
					user: Shared.userId
				};

			if(Shared.loggingEnabled) console.log('creating group:', group);
			/*TODO: push the returned JSON
			 object back into $scope.groupRouter
			 instead of getting them all
			 back again */
			Group.post(group).$promise.then(function(){
				getGroups();}
			);
		};

		//Private

		var removeGroupFromDom = function(group) {
			var groups = $scope.groupData.groups;
			groups.splice(Shared.getIndexBy(groups,"_id", group._id), 1);
		};


		var getGroups = function(){
			if($scope.$parent.user){
				Group.query({userId:$scope.$parent.user._id}).$promise.then(function(groups){
					$scope.groupData.groups = groups;
					$scope.$parent.userGroups = groups;
					setTimeout(positionGroups,200);
					identifyDefaultGroups();
					groups.forEach(function(item){item.snippetCount = item.snippetCount || 0});
				});
			}
		};

		var positionGroups = function(){

			if (!$("#newGroupButton")) {
				return;
			}

			//TODO move constants to top
			var STANDARD_SIZE = 230,
					MARGIN_BETWEEN = 8,
					MARGIN_TOP = 8,
					OFFSET_TOP = 24,
					vw = $( window ).width(),
					topOffset = $("#newGroupButton").offset().top + $("#newGroupButton").outerHeight() + OFFSET_TOP,
					previousRowHeights = [],
					currentRowHeights = [],
					topPosition = topOffset,
					leftMargin = $("#newGroupButton").offset().left,
					leftOffset = 0,
					elementsPerRow = Math.floor((vw - leftMargin)/(STANDARD_SIZE)),
					column = 0;


			$(".group-panel").each(function(index){

				if(column === elementsPerRow){
					//next row
					previousRowHeights = currentRowHeights;
					currentRowHeights = [];
					leftOffset = leftMargin;
					column = 0;
				}

				leftOffset = STANDARD_SIZE*column+MARGIN_BETWEEN + leftMargin;

				if(previousRowHeights[column]){
					topPosition = previousRowHeights[column] + MARGIN_TOP;
				}

				currentRowHeights.push($(this).height() + topPosition);

				$(this).offset({top: topPosition , left: leftOffset});
				column++;

			});
		};

		//TODO set the property on the server side
		var identifyDefaultGroups  = function (){

			var createApplyFunction = function (flag) {
					return function () {
						groups[i].defaultGroup = flag;
					}
			};

			var applyThisIsNotDefaultGroup = createApplyFunction(false),
				applyThisIsDefautGroup = createApplyFunction(true),
				groups = $scope.groupData.groups,
				groupDefaultBehaviourMap = {
						'external': applyThisIsNotDefaultGroup,
						'sublime' : applyThisIsDefautGroup,
						'github-gist' : applyThisIsDefautGroup,
						'Found On The Web' : applyThisIsDefautGroup
					},
				applyBehaviorFunc;

			for (var i = 0; i < groups.length; i++){
				applyBehaviorFunc = groupDefaultBehaviourMap[groups[i].name] ? groupDefaultBehaviourMap[groups[i].name] : groupDefaultBehaviourMap[groups[i].group_type]
				//set the appropriate flag
				if (applyBehaviorFunc)  {
					applyBehaviorFunc(groups[i])
				}
			}

			if(Shared.loggingEnabled) console.log($scope.groupData.groups);
		};

		//Listen to paste events and invoke create a new snippet
		document.addEventListener("paste", function(e) {
					if(Shared.loggingEnabled) console.log("Paste event", e);
					var text = e.clipboardData.getData("text/plain");
					if(Shared.loggingEnabled) console.log("Paste event", text);
					$scope.snippetPastedText = text;
					var activeGroup = $('.activegroup');
					$scope.groupId = activeGroup.data("id");
					$scope.pasteSnippet();
			});

		//reposition group folders
		$( window ).resize(function() {
			positionGroups();
		});

		//pull the groups from the server
		getGroups();


}]);
