const http = require("http");
const { ethers } = require("ethers");

// List of 60 tokens
const tokens = [
    "LINK", "SHIB", "UNI", "PEPE", "ONDO", "AAVE", "MNT", "POL", "RENDER", "ARB",
    "FET", "ENA", "IMX", "INJ", "LDO", "GRT", "WLD", "QNT", "NEXO", "SAND",
    "ENS", "CRV", "BTT", "MKR", "AXS", "BEAM", "MANA", "RSR", "APE", "W",
    "CHZ", "EIGEN", "COMP", "AMP", "PENDLE", "PRIME", "GNO", "SNX", "AXL", "ETHDYDX",
    "SUPER", "1INCH", "SAFE", "LPT", "ZRO", "BLUR", "TURBO", "HOT", "ZRX", "BAT",
    "GLM", "TRAC", "SKL", "IOTX", "ANKR", "ENJ", "MEME", "MASK", "METIS", "NEIRO"
];

// Function to fetch prices and return an array of ethers.BigNumber values
function getTokenPrices(callback) {
    const url = `http://localhost:5000/api/crypto-prices?symbols=${encodeURIComponent(tokens.join(","))}`;

    http.get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
            data += chunk;
        });

        res.on("end", () => {
            try {
                const jsonResponse = JSON.parse(data);
                
                let tokenPrices = tokens.map(token => {
                    if (jsonResponse.data && jsonResponse.data[token]) {
                        let price = jsonResponse.data[token].quote.ETH.price;
                        let priceBigNumber = ethers.BigNumber.from(Math.floor(price * 1e18).toString()); 
                        return `ethers.BigNumber.from("${priceBigNumber}")`;
                    } else {
                        return `ethers.BigNumber.from("0")`; // Return 0 if price is not available
                    }
                });

                callback(null, tokenPrices);
            } catch (error) {
                callback("Error parsing response", null);
            }
        });

    }).on("error", (error) => {
        callback(`Request error: ${error.message}`, null);
    });
}

// Example usage
getTokenPrices((err, tokenPrices) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Token Prices in ethers.BigNumber format:\n", `[ ${tokenPrices.join(",\n  ")} ]`);
    }
});
