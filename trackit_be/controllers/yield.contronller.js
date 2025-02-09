const axios = require('axios');
const { json } = require('express');

exports.yield_info = async(req, res, next) =>{
    let chain = req.query.chain;
    let token = req.query.token;
    let resp = [
        {
            "id": 1,
            "attributes": {
                "title": "Bifrost Stable Pool",
                "description_en": "Designed for LSD",
                "description_zh": "Designed for LSD",
                "link": "/swap",
                "apy": null,
                "category": "swap",
                "vToken": "vDOT",
                "createdAt": "2023-11-12T14:52:59.344Z",
                "updatedAt": "2023-11-13T01:37:48.138Z",
                "publishedAt": "2023-11-12T14:53:02.434Z",
                "apy_var": null,
                "logo": {
                    "data": {
                        "id": 240,
                        "attributes": {
                            "name": "image 1.png",
                            "alternativeText": null,
                            "caption": null,
                            "width": 129,
                            "height": 129,
                            "formats": null,
                            "hash": "image_1_193ebe5cb8",
                            "ext": ".png",
                            "mime": "image/png",
                            "size": 2.86,
                            "url": "https://cdn.bifrost.finance/cms/image_1_193ebe5cb8.png",
                            "previewUrl": null,
                            "provider": "provider-upload-qiniu-cloud",
                            "provider_metadata": null,
                            "createdAt": "2023-11-13T01:37:38.770Z",
                            "updatedAt": "2023-11-13T01:37:38.770Z"
                        }
                    }
                }
            }
        }
    ]

    if(token == "kaia"){
        resp = [
            {
                "token":"kaia",
                "apr":"7.36",
                "unit":"%",
                "protocol":"wormwhole"
            },
            {
                "token":"kaia",
                "apr":"5.23",
                "unit":"%",
                "protocol":"lst protocol"
            },
            {
                "token":"kaia",
                "apr":"0.02",
                "unit":"%",
                "protocol":"krwo"
            },
            {
                "token":"kaia",
                "apr":"1.17",
                "unit":"%",
                "protocol":"stargate"
            }            
        ]
    }
    res.json(resp)
}
