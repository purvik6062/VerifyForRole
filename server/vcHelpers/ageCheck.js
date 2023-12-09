module.exports = {
    ageCheck: (credentialSubject) => ({
        id: 1,
        circuitId: "credentialAtomicQuerySigV2",
        query: {
            allowedIssuers: ["*"],
            type: "ageCheck",
            context:
                "https://ipfs.io/ipfs/bafybeigitinawzt7k4h5ql32priduoderxm3ilborxgcir3kljx36uweii",
            credentialSubject,
        },
    }),
    // See more off-chain examples
    // https://0xpolygonid.github.io/tutorials/verifier/verification-library/zk-query-language/#equals-operator-1
};
