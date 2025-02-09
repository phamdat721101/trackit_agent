exports.chains = async (req, res, next) => {
    try {
        const chains = {
            "chain_id":"dgt_1",
            "name":"movement",
            "symbol":"dgt_ass_1",
            "decimal":2411,
            "price":24111998,
            "owner":"pqd_dgt_adr"
        }
        res.json({chains});
    } catch (error) {
        console.log("Error to get user profile: ", error)
        next(error);
    }
};