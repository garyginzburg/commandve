angular.module('cmndvninja').factory('User', ['$resource', function($resource){
  return $resource('/api/users/:id', {id: '@_id'},
  {
    query: {method:'GET', isArray:true},
    getOne: {method:'GET', isArray:false},
    post: {method:'POST'},
    update: {method:'PUT' },
    remove: {method:'DELETE'}
  });
}]);


angular.module('cmndvninja').factory('Shared', [function($resource){
    return {
       getIndexBy : function (array, name, value) {
                      for (var i = 0; i < array.length; i++) {
                        if (array[i][name] == value) {
                          return i;
                        }
                      }
                    }
    };
}]);

angular.module('cmndvninja').factory('Snippet', ['$resource', function($resource){
  return $resource('/api/groups/:groupId/snippets/:id', {id: '@_id', groupId: '@groupId'}, {
    query: {method:'GET', isArray:true},
    getOne: {method:'GET', isArray:false},
    post: {method:'POST'},
    update: {method:'PUT' },
    remove: {method:'DELETE'}
  });
}]);

angular.module('cmndvninja').factory('Group', ['$resource', 'Shared', function($resource){
  Group = $resource('/api/users/:userId/groups/:id', {id: '@_id', userId: '@userId'}, {
    query: {method:'GET', isArray:true},
    getOne: {method:'GET', isArray:false},
    post: {method:'POST'},
    update: {method:'PUT'},
    remove: {method:'DELETE'}
  });

  return Group;
}]);

angular.module('cmndvninja').factory('SearchItem', ['$resource', function($resource){
  SearchItem = $resource('/api/search/users/:id', {id: '@_id'}, {
    query: {method:'GET', isArray:true},
    getOne: {method:'GET', isArray:false},
    post: {method:'POST'},
    update: {method:'PUT' },
    remove: {method:'DELETE'}
  });

  return SearchItem;
}]);

angular.module('cmndvninja').factory('userSnippets', ['$resource', function($resource){
  return $resource('/api/users/:id/snippets', {id: '@_id'}, {
    query: {method:'GET', isArray:true}
  });
}]);

angular.module('cmndvninja').factory('Auth', ['$resource', function($resource){
  return $resource('/auth/current', {},  {
    login: {method:'GET'}
  });
}]);

