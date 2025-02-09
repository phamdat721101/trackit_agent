const axios = require('axios');
const { json } = require('express');

exports.token_info = async(req, res, next) =>{
    let resp = await axios.get('https://aptos.hatchy.fun/token/get-token-list?page=1&perPage=9');    
    res.json(resp.data.paginatedResult.results)
}

exports.token_tx = async(req, res, next) =>{
    // let token = '0xe8272500f90ca42e49a95111619b0d1e9cf6983d80b05836cc18cde237f4531c::ZAD::ZAD'
    let token = req.query.token
    let resp = await axios.get(`https://aptos.hatchy.fun/transaction/query-txn/${token}`)
    res.json(resp.data.data)
}

exports.list_token = async(req, res, next) =>{
    let limit = req.query.limit;
    let offset = req.query.offset;
    let type = Number(req.query.type)
    let chain = req.query.chain;
    if(chain == "sui"){
        let resp = await axios.get(`https://api.turbos.finance/fun/pools?search=&sort=created_at&completed=false&page=${offset}&pageSize=${limit}&direction=desc`);    
        let tokens = resp.data.data;
        res.json(tokens)
        return
    }
    /*
        1: new
        2: trending
        3: completed
    */
    
    let resp = await axios.get(`https://aptos.hatchy.fun/token/get-token-list?page=${offset}&perPage=${limit}`);    
    let tokens = resp.data.paginatedResult.results;
    switch (type) {
        case 1:
            console.log("Token new")
            tokens = tokens.map((token) =>{
                if(Number(token.holderPercentage) <= 10){
                    return token
                }
            })
            res.json(tokens)
            break;
        case 2:
            console.log("Token trending")
            tokens = tokens.map((token) =>{
                if(10 <= Number(token.holderPercentage) <= 20){
                    return token
                }
            })
            res.json(tokens)
            break;
        case 3:
            console.log("Token completed")
            tokens = tokens.map((token) =>{
                if(Number(token.holderPercentage) >= 20){
                    return token
                }
            })
            res.json(tokens)
            break;
        default:
            res.json(tokens)
            break;
    }
}

exports.swap_route = async(req, res, next) =>{
    let srcAddr = "0x1::aptos_coin::AptosCoin"
    let dstAddr = "0x275f508689de8756169d1ee02d889c777de1cebda3a7bbcce63ba8a27c563c6f::tokens::USDC"
    let amount = 100; // Consider making this dynamic based on user input if needed
    let api_key = process.env.API_KEY;

    // Log the parameters being sent
    console.log("Request Parameters:", { srcAddr, dstAddr, amount });

    try {
        const response = await axios({
            method: "GET",
            url: "https://testnet.mosaic.ag/porto/v1/quote",
            params: {
                srcAsset: srcAddr,
                dstAsset: dstAddr,
                amount,
                // sender: user.accountAddress.toString(), // Uncomment if needed
                // slippage: 100, // Uncomment if needed
            },
            headers: {
                "X-API-KEY": api_key,
            },
        });

        console.log("PQD Data: ", response.data);
        res.json(response.data.data);
    } catch (error) {
        // Check if the error response exists
        if (error.response) {
            // Log the error details
            console.error("Error Response:", error.response.data);
            console.error("Error Status:", error.response.status);
            console.error("Error Headers:", error.response.headers);

            // Send a structured error response to the client
            res.status(error.response.status).json({
                message: 'Error occurred while processing the request',
                details: error.response.data,
            });
        } else {
            // Handle other types of errors (e.g., network errors)
            console.error("Error Message:", error.message);
            res.status(500).json({
                message: 'An unexpected error occurred',
                details: error.message,
            });
        }
    }
}