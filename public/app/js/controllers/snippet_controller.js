'use strict';

angular.module('cmndvninja').controller('SnippetController',
  ['$scope', '$location', '$route','Snippet', 'Shared','$timeout',
  function($scope, $location, $route, Snippet, Shared, $timeout){

    $scope.groups = Shared.groups;
    $scope.snippets = [];
    $scope.currentSnippet = {};

    $scope.newSnippet = function () {
      $scope.currentSnippet = {
        group: groupId,
        theme: 'eclipse',
        groupId: groupId,
        isNew: true,
        tags: ["Javascript"],
        unique_handle: "My Snippet Name",
        id: undefined,
        content: ""
      };
      $scope.snippets.unshift($scope.currentSnippet);
    };

    $scope.selectSnippet = function (id) {
      console.log($scope.snippets);
      $scope.currentSnippet = findById($scope.snippets, id);
      return $scope.currentSnippet;
    };

    $scope.selectIfNewSnippet = function (snippet){
      if (! snippet._id) {
        $scope.currentSnippet = snippet;
      }
    }

    function initialize () {
      if (Shared.currentSearchedSnippetId) {
        $scope.selectSnippet(Shared.currentSearchedSnippetId);
      }
      else{
        if ($scope.currentSnippet){
          console.log('currentSnippet is defined')
        }else {
          $scope.newSnippet();
        }
      }
      if ($scope.currentSnippet.theme){
        $scope.theme = $scope.currentSnippet.theme;
      }
      if ($scope.currentSnippet.tags[0]){
        $scope.mode = $scope.currentSnippet.tags[0]
      }
    }

    var getGroupId = function(){
      var url = $location.absUrl();
      var beg = url.indexOf("groups") + "groups/".length;
      var end = url.indexOf("/snippet");
      return url.slice(beg, end);
    };

    var groupId = getGroupId();

    getSnippets();

    function getSnippets() { Snippet.query({groupId: groupId}).$promise.then(
      function(snippets){
        $scope.snippets = snippets;
        $scope.currentSnippet = $scope.snippets[0];
        markSnippetsAsSaved(snippets);
        initialize();
        $scope.initializeAceState();
        }
      );
      return $scope.snippets;
    }

    $scope.flagSnippet = function(){
      $scope.currentSnippet.saved = false;
    };

    function markOneSnippetAsSaved(snippet) {
      snippet.saved = true;
      snippet.new = false;
    }

    function typeOf(value) {
      var s = typeof value;
      if (s === 'object') {
          if (value) {
              if (value instanceof Array) {
                  s = 'array';
              }
          } else {
              s = 'null';
          }
      }
      return s;
    }

    function markSnippetsAsSaved(snippets) {
      if (typeOf(snippets) === "array") {
        for (var i = 0; i < snippets.length; i++) {
          markOneSnippetAsSaved(snippets[i]);
        }
      } else {
          throw 'in markSnippetsAsSaved, snippets is not an array';
      }
      return snippets;
    }

    $scope.saveAllSnippets = function (){
      for (var i = 0; i < $scope.snippets.length; i++) {
        if ($scope.snippets[i].saved === false) {
          createOrEditSnippet($scope.snippets[i]);
        }
      }
      console.log($scope.snippets)
    };

    function createOrEditSnippet (snippet) {
      snippet.user = Shared.userId;
      if (snippet.isNew) {
        createSnippet(snippet);
      } else {
        editSnippet(snippet);
      }
    }

    $scope.stageDelete = function (snippet) {
      $scope.snippetToDelete = snippet;
    };

    $scope.deleteSnippet = function () {
      var map = {groupId: $scope.snippetToDelete.group,
                id: $scope.snippetToDelete._id};
      Snippet.remove(map);

      $scope.snippets.splice($scope.snippets.getIndexBy("_id", $scope.snippetToDelete._id), 1);

      loadNextSnippet();
    };

    function loadNextSnippet(){
      if ($scope.snippets.length > 0) {
        console.log('snippets is more than one:', $scope.snippets[0])
        $scope.currentSnippet = $scope.snippets[0];
      }else {
        $scope.newSnippet();
        $scope.initializeAceState();
      }
    }

    function createSnippet (snippet) {
      snippet.groupId = groupId;
      Snippet.post(snippet);
    }

    function editSnippet (snippet) {
      snippet.groupId = groupId;
      snippet.group = groupId;
      Snippet.update(snippet);
    }

    Array.prototype.getIndexBy = function (name, value) {
    for (var i = 0; i < this.length; i++) {
        if (this[i][name] == value) {
            return i;
        }
      }
    };

    function findById(source, id) {
      for (var i = 0; i < source.length; i++) {
        if (source[i]._id === id) {
        return source[i];
        }
      }
      throw "throwing error from findById in SnippetController: couldn't find object with id: " + id;
    }

    $scope.hover = function (snippet){
      snippet.showToolbar = ! snippet.showToolbar;
    };

    $scope.formatMinifiedViewContent = function (str) {
      if (str){
        return str.length > 175 ? str.substr(0, 175) + '...' : str;
      }
    };

    $scope.formatMinifiedViewTitle = function (str) {
      if (str){
        return str.length > 30 ? str.substr(0, 30) + '...' : str;
      }
    };

    $scope.showGroup = function(id){
      $location.path('groups/'+id + '/snippets');
      Shared.currentGroupId = id;
    };

  // snippet controller and ace controller are too interlinked
  // to be two separate controllers... TODO make ACE a service //

    var editor = ace.edit("editor");

    $scope.themes = ['eclipse', 'clouds', 'solarized_dark', 'solarized_light', 'dawn', 'dreamweaver', 'github' ];
    $scope.modes = ['Javascript', 'Ruby', 'XML', 'Python', 'HTML'];


    $scope.selectTheme = function(theme) {
      $scope.theme = theme;
      if ($scope.currentSnippet) {
      $scope.currentSnippet.theme = theme;
      }
      editor.setTheme("ace/theme/" + theme);
    };

    $scope.initializeAceState = function() {
      if ($scope.currentSnippet){
        if ($scope.currentSnippet.theme) {
          $scope.theme = $scope.currentSnippet.theme;
        }else {
        $scope.theme = $scope.themes[0];
        }
        if ($scope.currentSnippet.tags) {
          $scope.mode = $scope.currentSnippet.tags[0];
        }else {
          $scope.mode = $scope.modes[0];
        }
      }else {
        $scope.theme = $scope.themes[0];
        $scope.mode = $scope.modes[0];
      }
      editor.setTheme("ace/theme/" + $scope.theme);
      editor.getSession().setMode("ace/mode/" + $scope.mode.toLowerCase());
    }

    $scope.initializeAceState();


    // $scope.selectTheme($scope.theme);

    $scope.aceOption = {
      mode: $scope.mode.toLowerCase(),
      onLoad: function (_ace) {
        $scope.modeChanged = function (mode) {
          $scope.mode = mode;
          $scope.currentSnippet.tags[0] = mode;
          _ace.getSession().setMode("ace/mode/" + $scope.mode.toLowerCase());
        };

      }
    };

    $scope.formatFileName = function(str){
      function toTitleCase(str) {
        return str.replace(/\w\S*/g, function(txt){
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
          }
        );
      }
      function subUnderScoresForSpaces(str) {
        return str.replace(/_/g, " ");
      }

      return toTitleCase(subUnderScoresForSpaces(str));
    };

    var session = editor.getSession();
    session.setUseWrapMode(true);
    session.setWrapLimitRange(80,80);

}]);
