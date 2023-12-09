module.exports = {
    finalist: (credentialSubject) => ({
        id: 1702107229,
        circuitId: "credentialAtomicQuerySigV2",
        query: {
            allowedIssuers: ["*"],
            type: "EVENT",
            context:
                "https://ipfs.io/ipfs/QmXbsnpiSdMpiXyXtLR3YHkY2nRbtRARgPVHaFs8WBLzvK",
            credentialSubject,
        },
    }),
    // See more off-chain examples
    // https://0xpolygonid.github.io/tutorials/verifier/verification-library/zk-query-language/#equals-operator-1
};
