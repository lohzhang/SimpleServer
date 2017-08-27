var crypto = require('crypto');
const mySecret = ''; // Place your secret here. This secret has to match the secret with Alexa skill.

module.exports = 
{
  isAuthenticated: function(req) {
    const encoding = "base64";
    const algorithm = "sha256";
    const clientAuth = req.headers.authorization;
    const clientTimeStamp = req.headers.date;
    if (!clientTimeStamp || !clientAuth) {
      return false;
    }
    const generatedAuth = crypto.createHmac(algorithm, mySecret).update(clientTimeStamp).digest(encoding);
    return clientAuth === generatedAuth;
  }
}
