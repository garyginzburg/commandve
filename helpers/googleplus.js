var google = require('googleapis'),
    constants = require('./constants'),
    plus = google.plus('v1'),
    redirectURL = constants.PROD_GOOGLE_REDIRECT_URI,
    url = null,
    oauth2Client = null,
    OAuth2 = google.auth.OAuth2;



// generate a url that asks permissions for Google+ and Google Calendar scopes
var scopes = [
  'https://www.googleapis.com/auth/plus.me',
  'https://www.googleapis.com/auth/userinfo.email'
  //,'https://www.googleapis.com/auth/calendar'
];

exports.setRedirectURL = function(config){
  redirectURL = config.googleRedirectURL;
  oauth2Client = new OAuth2(config.googleClientId, config.googleClientSecret, redirectURL);
  url = oauth2Client.generateAuthUrl({
    access_type: 'online', // 'online' (default) or 'offline' (gets refresh_token)
    scope: scopes // If you only need one scope you can pass it as string
  });
  console.log("set google redirect", url);
  return url;
};

exports.setTokens = function(tokens){
  oauth2Client.setCredentials(tokens);
};

exports.getTokens = function(code,successCallback, errorCallback){
  oauth2Client.getToken(code, function(err, tokens) {
    // Now tokens contains an access_token and an optional refresh_token. Save them.
    if(!err) {
      oauth2Client.setCredentials(tokens);
      successCallback(tokens);
    }else{
      errorCallback(err);
    }
  });
};

exports.getUser = function(tokens,successCallback, errorCallback){
  plus.people.get({ userId: 'me', auth: oauth2Client }, function(err, response) {
    // handle err and response
    if(!err) {
      successCallback(tokens,response);
    }else{
      errorCallback(err);
    }
  });
}

