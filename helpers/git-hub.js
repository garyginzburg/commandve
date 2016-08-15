"use strict";

/**
 * Supports login, account creations
 */


var httpModule = require('./https-helper'),
		urlParser  = require("url"),
		httpHelper = require('../helpers/https-helper.js'),
		querystring = require('querystring'),
		users = require('../helpers/users.js'),
		constants = require('constants');


exports.importGists = function(user, group){
  var options = getGitHubConnectionMap(user);
  console.log("get git hib gists", options);
  var callbackSuccess = function(snippets){
    console.log("gist import success");
  };
  var callbackError = function(err){
    console.log("gist import err",err);
  };

  httpModule.httpGet(options,
    function(text){
      var gists = JSON.parse(text);
      console.log('import gists', user.username, gists);
      createSnippetsFromGists(user, group, gists, callbackSuccess,callbackError);
    },
    function(err){
      console.log('Failed to import gists', err);
    });
};

/// UPDATE GISTS ////////////
//expects resolved user in snippet
exports.updateGist = function(snippet, callbackSuccess,callbackError, isNew){
  console.log("create gist", isNew);
    var user = snippet.user;
    var data = createGitHubUpdateData(snippet);
    var options = exports.getUpdateGitHubMap(user, data, snippet, isNew);
    var onGistSuccess = function(){
      callbackSuccess(data);
    };
    httpModule.httpPost(options,data,onGistSuccess,callbackError);
};

exports.getGitHubProfile = function(urlEncodedToken, callbackSuccess, callbackError){
  var dataPart = urlEncodedToken.split('&');
  var token = dataPart[0];//.replace('access_token=','');
  var options = {
    host: 'api.github.com',
    path: '/user?'+token,
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': 'CmdV'
    }

  };
  var cleanToken = token.replace('access_token=','');
  httpHelper.httpGet(options,
    function(text){
      var profile = JSON.parse(text);
      profile.token = cleanToken;
      users.findOrCreateUser(profile, callbackSuccess,callbackError);
    },
    function(err){
      callbackError(err);
    }
  )
};

exports.resolveGitHubProfileEmail = function(user, callbackSuccess, callbackError){

  var options = {
    host: 'api.github.com',
    path: '/user/emails?access_token='+user.token,
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': 'CmdV'
    }

  };

  httpHelper.httpGet(options,
    function(text){
      var profile = JSON.parse(text)[0];
      console.log('resolve github email', profile);
      user.email = profile.email;
      callbackSuccess(user);
      user.save();
    },
    function(err){
      callbackError(err);
    }
  )
};

exports.getUpdateGitHubMap = function(user, data, snippet,isNew){
  var operation = !isNew?'PATCH':"POST";
  var idPath =  isNew? '': '/'+snippet.githubId;
  var url = '/gists'+idPath+'?access_token='+user.token;
  console.log("Gist update from ",url);
  var options = {
          host: 'api.github.com',
          path: url,
          method: operation,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Content-Length': data.length,
            'User-Agent': 'CmdV'
          }

        };
  return options;
};

//Private

var createGitHubUpdateData = function(snippet){
  if(snippet.content == null){
    snippet.content = "";
  }
  var fileName = snippet.githubFileName? snippet.githubFileName: snippet.unique_handle;
  fileName = fileName.replace(/\s/g, '_');

  var escapedContent = snippet.content.replace(/\n/g, "\\n")
                                      .replace(/\\'/g, "\\'")
                                      .replace(/"/g, '\\"')
                                      .replace(/&/g, "\\&")
                                      .replace(/\r/g, "\\r")
                                      .replace(/\t/g, "\\t");

  var data = '{'+
  '"description": "'+snippet.unique_handle+'",'+
  '"files": {'+
      '"'+fileName+'": {'+
        '"filename": "'+fileName+'",'+
        '"content": "'+escapedContent+'"'+
      '}'+
    '}'+
  '}';

  //data = querystring.stringify(data);
  return data;
};

var createSnippetsFromGists = function(user, group, gists, callbackSuccess,callbackError){
  if (gists == null){
    return null;
  }
  var jobTotal = gists.length;
  var jobCount = 1;
  var jobFinished = function(){
    jobCount+=1;
    if(jobCount === jobTotal){
      callbackSuccess();
    }
  };

  gists.forEach(function(singleGist){
    var callbackSuccess = function(snippet){
      console.log("Create snippet from gist", snippet);
      SnippetModel.create(snippet, function(err,snippet){
        if(!err){
          jobFinished();
        }else{
          callbackError(err);
        }
      });
    };
    var snippet = convertGistToSnippet(user, group,singleGist, callbackSuccess,callbackError);


  });

};

var convertSnippetToGist = function(snippet){
  var fileName = snippet.githubFileName? snippet.githubFileName:"snippet.txt";
  var gist = {
    "description": snippet.unique_handle,
    "public": false,
    "files": {
      fileName: {
        "content": snippet.content
      }
    }
  };
  return gist;
};

var convertGistToSnippet = function(user, group, gist,callbackSuccess,callbackError){
  getGistFirstFileContent(user,group, gist,callbackSuccess,callbackError);
};

var getGistFirstFileContent = function(user, group, gist,callbackSuccess,callbackError){
  var files = gist.files;
  var firstFile = null;
  var firstFileName = null;
  for(var file in files) {
    if(files.hasOwnProperty(file)) {
      firstFile = files[file];
      firstFileName = file;
      break;
    }
  }
  if (firstFile){
    console.log("gist first file", firstFile);
    var options = getGitHubConnectionForRawMap(user, firstFile.raw_url);

    httpModule.httpGet(options,
      function(text){
        console.log('gist text for file', firstFileName, text);
        var snippet = {
          unique_handle: gist.description,
          githubId: gist.id,
          content: text,
          githubFileName: firstFileName,
          group: group._id,
          user: user._id
        };
        snippet.tags = [];
        snippet.tags.push("Javascript");
        callbackSuccess(snippet);
      },
      callbackError);

  }else{
    callbackSuccess(null);
  }

};


var getGitHubConnectionForRawMap = function(user, url){

  var parsedUrl = urlParser.parse(url);

  var options = {
    host: parsedUrl.host,
    path: parsedUrl.pathname,
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': 'CmdV'
    }
  };
  return options;
};


var getGitHubConnectionMap = function(user, url){

  if(!url){
    url = '/users/'+user.username+'/gists?access_token='+user.token
  }else{
    url+='?access_token='+user.token
  }

  var options = {
    host: 'api.github.com',
    path: url,
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': 'CmdV'
    }
  };
  return options;
};