'use strict';

angular.module('cmndvninja'). controller('SnippetController',
  ['$scope', '$location', '$route','Snippet', 'Shared',
  function($scope, $location, $route, Snippet, Shared){

    $('#simple-dialog').modal()
    $.material.ripples()

    var getGroupId = function(){
      var url = $location.absUrl();
      var beg = url.indexOf("groups") + "groups/".length;
      var end = url.indexOf("/snippet")
      return url.slice(beg, end)
    };

    var groupId = getGroupId();

    function getSnippets() { Snippet.query({groupId: groupId}).$promise.then(
      function(snippets){
        $scope.snippets = snippets;
        $scope.currentSnippet = $scope.snippets[0];
        markSnippetsAsSaved(snippets);
        }
      )
      return $scope.snippets
    };

    function waitForChanges(snippet) {
      $scope.$watch(snippet, function(){
        console.log("snippet with id", snippet._id, "was changed")
      })
    }

    $scope.flagSnippet = function(){
      $scope.currentSnippet.saved = false;
      console.log($scope.currentSnippet)
      console.log($scope.snippets)
    }

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
          throw 'in markSnippetsAsSaved, snippets is not an array'
      }
      return snippets
    };

    getSnippets();

    $scope.snippetIsNew = false;

    $scope.newSnippet = function () {
      // $scope.snippetIsNew = true;
      $scope.currentSnippet = {
        group: groupId,
        groupId: groupId,
        isNew: true,
        tags: ["Languages"],
        unique_handle: "My Snippet Name",
        id: undefined,
        content: ""
      }
      $scope.snippets.unshift($scope.currentSnippet);
    };

    $scope.saveAllSnippets = function (){
      for (var i = 0; i < $scope.snippets.length; i++) {
        if ($scope.snippets[i].saved === false) {
          console.log('snippet=', $scope.snippets[i])
          createOrEditSnippet($scope.snippets[i]);
        }
      }
    }

    function createOrEditSnippet (snippet) {
      snippet.user = "54fb6fd500f914a0a09e54b2";
      if (snippet.isNew) {
        createSnippet(snippet);
      } else {
        editSnippet(snippet);
      }
    };

    $scope.stageDelete = function (snippet) {
      $scope.snippetToDelete = snippet;
      console.log('fired')
    }
    $scope.deleteSnippet = function () {
      console.log($scope.snippetToDelete)
      Snippet.remove($scope.snippetToDelete);
    }

    function createSnippet (snippet) {
      console.log('creating snippet:', snippet);
      snippet.groupId = groupId;
      Snippet.post(snippet);
    };

    function editSnippet (snippet) {
      console.log('editing snippet:', snippet);
      snippet.groupId = groupId;
      snippet.group = groupId;
      Snippet.update(snippet);
    };


    function findById(source, id) {
      for (var i = 0; i < source.length; i++) {
        if (source[i]._id === id) {
        return source[i];
        };
      };
      throw "throwing error from findById in SnippetController: couldn't find object with id: " + id;
    ;}

    $scope.selectSnippet = function (id) {
      $scope.currentSnippet = findById($scope.snippets, id);
      $scope.snippetIsNew = false;
      return $scope.currentSnippet;
    }

    $scope.selectLanguage = function (language) {
      $scope.currentSnippet.tags[0] = language;
      $scope.displayedLanguage = language;
    }

    $scope.hover = function (snippet){
      snippet.showToolbar = ! snippet.showToolbar;
    }

    $scope.formatMinifiedViewContent = function (str) {
      return str.length > 175 ? str.substr(0, 175) + '...' : str;
    }

    $scope.formatMinifiedViewTitle = function (str) {
      return str.length > 30 ? str.substr(0, 30) + '...' : str;
    }






}]);
