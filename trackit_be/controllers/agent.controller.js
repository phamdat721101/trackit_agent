const axios = require('axios');
const { SuiClient } = require('@mysten/sui.js/client');

exports.chat = async(req, res, next) =>{
    const YOUR_API_KEY = process.env.ATOMA_API_KEY;
    const MODEL_NAME = process.env.MODEL_NAME;
    const content = req.body.content;

    axios.post('https://api.atoma.network/v1/chat/completions', {
        stream: false,
        model: MODEL_NAME,
        messages: [{
            role: 'assistant',
            content: content
        }],
        max_tokens: 124
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${YOUR_API_KEY}`
        }
    })
    .then(response => {
        console.log(response.data);
        res.json(response.data.choices[0].message.content)
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

exports.token_predict = async(req, res, next) =>{
    const YOUR_API_KEY = process.env.ATOMA_API_KEY;
    const MODEL_NAME = process.env.MODEL_NAME;
    let name = req.body.name;
    let symbol = req.body.symbol;

    // Fetch token data from Sui RPC
    const suiRpcUrl = 'https://fullnode.testnet.sui.io:443'; // Example Sui RPC URL
    const tokenData = await axios.post(suiRpcUrl, {
        jsonrpc: "2.0",
        id: 1,
        method: "sui_getObject",
        params: [`0xf22da9a24ad027cccb5f2d496cbe91de953d363513db08a3a734d361c7c17503::${name}::${symbol}`]
    });

    // Fetch market data from Sui DEX
    const suiDexUrl = 'https://api.sui.dex/api/v1/market/data'; // Example Sui DEX URL
    const marketData = await axios.get(`${suiDexUrl}?symbol=${symbol}`);

    // Prepare data for Atoma Network analysis
    const analysisData = {
        tokenData: tokenData.data,
        marketData: marketData.data
    };

    // Send data to Atoma Network for analysis and prediction
    const atomaResponse = await axios.post('https://api.atoma.network/v1/analyze', {
        stream: false,
        model: MODEL_NAME,
        data: analysisData
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${YOUR_API_KEY}`
        }
    });

    // Respond with the analysis and prediction
    res.json(atomaResponse.data);
}

// Additional function to interact with Suipump contract (e.g., deploy or call functions)
exports.interactWithSuipump = async (req, res, next) => {
    const { suipumpContractAddress, functionName, args } = req.body; // Function name and arguments for the contract

    try {
        // Use Sui SDK to call a function on the Suipump contract
        const transaction = await suiClient.executeMoveCall({
            packageObjectId: suipumpContractAddress,
            module: 'suipump', // Module name of the contract
            function: functionName, // Function to call
            typeArguments: [], // Type arguments (if any)
            arguments: args, // Arguments for the function
            gasBudget: 10000 // Set gas budget
        });

        // Respond with the transaction result
        res.json({ transaction });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to interact with Suipump contract' });
    }
};