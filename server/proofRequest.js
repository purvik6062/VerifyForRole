// const { KYCAgeCredential } = require("./vcHelpers/KYCAgeCredential");

// // design your own customised authentication requirement here using Query Language
// // https://0xpolygonid.github.io/tutorials/verifier/verification-library/zk-query-language/

// const humanReadableAuthReason = "Must be born before this year";

// const credentialSubject = {
//   birthday: {
//     // users must be born before this year
//     // birthday is less than Jan 1, 2023
//     $lt: 20230101,
//   },
// };

// const proofRequest = KYCAgeCredential(credentialSubject);

// module.exports = {
//   humanReadableAuthReason,
//   proofRequest,
// };


// const { ageCheck } = require("./vcHelpers/ageCheck");

// // design your own customised authentication requirement here using Query Language
// // https://0xpolygonid.github.io/tutorials/verifier/verification-library/zk-query-language/

// const humanReadableAuthReason = "Must be born before this year";

// const credentialSubject = {
//   birthdate: {
//     $eq: 20020106,
//   },
// };

// const proofRequest = ageCheck(credentialSubject);

// module.exports = {
//   humanReadableAuthReason,
//   proofRequest,
// };

const { finalist } = require("./vcHelpers/finalist");

const humanReadableAuthReason = "Must be a finalist";

const credentialSubject = {
  finalist: {
    $eq: true,
  },
  // dateOfEvent: {
  //   $eq: 20231209,
  // },
};

const proofRequest = finalist(credentialSubject);

module.exports = {
  humanReadableAuthReason,
  proofRequest,
};