# Securing API Gateway with Okta, Serverless Framework and SSM

Accompanying blog post:
https://unbounded.io/securing-api-gateway-with-okta-serverless-framework-and-ssm-9e679af614e2

## Create the SSM params

The `issuer` and `audience` params can be found in the Okta domain's authorization server settings. The `clientid` can be found in the Okta application's general settings.

```shell
aws ssm put-parameter --name "/example/dev/okta/issuer" --value "<your okta issuer uri>" --type "SecureString" --key-id <your kms key id> --region us-west-2

aws ssm put-parameter --name "/example/dev/okta/audience" --value "<your okta audience>" --type "SecureString" --key-id <your kms key id> --region us-west-2

aws ssm put-parameter --name "/example/dev/okta/clientid" --value "<your okta app client id>" --type "SecureString" --key-id <your kms key id> --region us-west-2

aws ssm put-parameter --name "/example/dev/kms/keyid" --value "<your kms key id>" --type "SecureString" --key-id <your kms key id> --region us-west-2
```

_Requires an existing KMS key to use SecureString._

Note: If the following error occurs when creating the SSM params:

```shell
Error parsing parameter '--value': Unable to retrieve https://<your issuer uri>
```

This can be resolved by adding the following line to your `~/.aws/config` file:

```shell
cli_follow_urlparam = false
```

The `/example/dev/okta/*` SSM parameters are fetched in the Lambda using [Middy](https://github.com/middyjs/middy). _See `exampleAuth.js` to view the implementation._

The `/example/dev/kms/keyid` SSM parameter is fetched and decrypted on the fly using [Serverless Framework built in support for SSM](https://serverless.com/framework/docs/providers/aws/guide/variables#reference-variables-using-the-ssm-parameter-store).

## Deploy the application into an AWS account

From the root of the project:

```shell
sls deploy --stage dev
```

_Expects Serverless Framework v1.49 or higher._

## Testing the application

Making a `GET` request to the API Gateway URI at `/dev/example/read` with a valid Okta Bearer token (JWT) will return:

```json
{
  "message": "Welcome! You are in!"
}
```

and w/o an Okta Bearer token will return

```json
{
  "message": "Unauthorized"
}
```
