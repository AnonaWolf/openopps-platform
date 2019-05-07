const log = require('log')('app:auth:login');
const db = require('../../db');
const dao = require('./dao')(db);
const _ = require('lodash');
const Profile = require('./profile');

async function userFound (user, tokenset, done) {
  if (user.disabled) {
    done({ message: 'Not authorized' });
  } else {
    var data = {
      id: user.id,
      hiringPath: tokenset.claims['usaj:hiringPath'],
      governmentUri: tokenset.claims['usaj:governmentURI'],
    };
    if (tokenset.claims['usaj:hiringPath'] == 'student') {
      data.isAdmin = false;
      data.isAgencyAdmin = false;
      data.isCommunityAdmin = false;
    }
    data.username = tokenset.claims.email;
    data.linkedId = user.linkedId || tokenset.claims.sub; // set linked id if not already set
    data.lastLogin = new Date();
    await dao.User.update(data);
    user.tokenset = _.pick(tokenset, ['access_token', 'id_token', 'refresh_token', 'expires_at']);
    done(null, user);
  }
}

module.exports = {};

module.exports.removeDuplicateFederalURI = (tokenset) => {
  dao.User.query(dao.query.updateUser, tokenset.claims.sub, tokenset.claims['usaj:governmentURI']);
}

module.exports.processFederalEmployeeLogin = (tokenset, done) => {
  dao.User.findOne('linked_id = ? or (linked_id = \'\' and username = ?)', tokenset.claims.sub, tokenset.claims.email).then(user => {
    userFound(user, tokenset, done);
  }).catch(async () => {
    dao.User.findOne('linked_id = \'\' and username = ?', tokenset.claims['usaj:governmentURI']).then(user => {
      userFound(user, tokenset, done);
    }).catch(async () => {
      var account = await dao.AccountStaging.findOne('linked_id = ?', tokenset.claims.sub).catch(() => {
        return {
          linkedId: tokenset.claims.sub,
          governmentUri: tokenset.claims['usaj:governmentURI'],
        };
      });
      done(null, _.extend(account, {
        type: 'staging',
        tokenset: _.pick(tokenset, ['access_token', 'id_token', 'refresh_token', 'expires_at']),
      }));
    });
  });
}

module.exports.processStudentLogin = (tokenset, done) => {
  //done({ message: 'Not implemented', data: { documentId: tokenset.claims.sub }});
  dao.User.findOne('linked_id = ? or (linked_id = \'\' and username = ?)', tokenset.claims.sub, tokenset.claims.email).then(user => {
    userFound(user, tokenset, done);
  }).catch(async () => {
    // create new account
    await Profile.get(tokenset).then(async (profile) => {
      var user = {
        name: _.filter([profile.GivenName, profile.MiddleName, profile.LastName], _.identity).join(' '),
        givenName: profile.GivenName,
        middleName: profile.MiddleName,
        lastName: profile.LastName,
        linkedId: tokenset.claims.sub,
        username: profile.URI,
        hiringPath: 'student',
        createdAt: new Date(),
        updatedAt: new Date(),
        disabled: false,
        isAdmin: false,
      };
      await dao.User.insert(user).then(user => {
        done(null, _.extend(user, {
          tokenset: _.pick(tokenset, ['access_token', 'id_token', 'refresh_token', 'expires_at']),
        }));
      });
    });
  });
}

module.exports.processIncompleteProfile = (tokenset, done) => {
  //done({ message: 'Not authorized', data: { documentId: tokenset.claims.sub } });
  // TODO: Pull user profile and send back cleaned up object
  Profile.get(tokenset).then(profile => {
    done({ message: 'Incomplete profile', data: {
      isGuest: (profile.GivenName || tokenset.claims.name).toLowerCase() == 'guest',
      givenName: profile.GivenName || tokenset.claims.name,
      lastName: profile.LastName,
      hiringPath: tokenset.claims['usaj:hiringPath'],
      governmentUri: profile.Profile.governmentUri,
      verified: profile.Profile.GovernmentURIVerificationDate,
      agencyName: profile.Profile.OrganizationName,
    }});
  }).catch(done);

}