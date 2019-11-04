const OktaJwtVerifier = require("@okta/jwt-verifier");
const AuthPolicy = require("./authPolicy");
const middy = require("middy");
const { ssm } = require("middy/middlewares");

const { STAGE: stage } = process.env;

let oktaJwtVerifier = {};

const setOktaVerificationParams = context => {
  // check for empty verifier obj to allow for default cliet side caching
  if (Object.keys(oktaJwtVerifier).length == 0) {
  const { ISSUER: issuer, CLIENT_ID: clientId } = context;
  oktaJwtVerifier = new OktaJwtVerifier({
    issuer: issuer,
    clientId: clientId
    // assertClaims: {
    //   "scp.includes": ["your custom claims"]
    // }
  });
};

const verify = (event, context, cb) => {
  setOktaVerificationParams(context);
  const { AUDIENCE: audience } = context;
  let arr = event.authorizationToken.split(" ");
  let accessToken = arr[1];
  let expectedAud = audience;

  oktaJwtVerifier
    .verifyAccessToken(accessToken, expectedAud)
    .then(jwt => {
      console.log(jwt.claims);
      let claims = jwt.claims;
      let apiOptions = {};
      const arnParts = event.methodArn.split(":");
      const apiGatewayArnPart = arnParts[5].split("/");
      const awsAccountId = arnParts[4];
      apiOptions.region = arnParts[3];
      apiOptions.restApiId = apiGatewayArnPart[0];
      apiOptions.stage = apiGatewayArnPart[1];
      const method = apiGatewayArnPart[2];
      let resource = "/";

      if (apiGatewayArnPart[3]) {
        resource += apiGatewayArnPart[3];
      }

      let policy = new AuthPolicy(claims.sub, awsAccountId, apiOptions);
      policy.allowMethod(AuthPolicy.HttpVerb.GET, "/example/read");
      console.log(JSON.stringify(policy.build()));
      return cb(null, policy.build());
    })
    .catch(err => {
      console.log(err);
      return cb("Unauthorized");
    });
};

module.exports.verify = middy(verify).use(
  ssm({
    cache: true,
    cacheExpiryInMillis: 5 * 60 * 1000,
    setToContext: true,
    names: {
      ISSUER: `/example/${stage}/okta/issuer`,
      CLIENT_ID: `/example/${stage}/okta/clientid`,
      AUDIENCE: `/example/${stage}/okta/audience`
    }
  })
);
