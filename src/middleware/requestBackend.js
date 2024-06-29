'use strict'
const fetch = require('node-fetch');

const fetchData = async ctx => {
    var val = JSON.parse(ctx.orchestrations[0].response.body);

    const response = await fetch(`http://main-backend:3000/${val.endpoint}`,
        {
            method: val.method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(val)
        })
    const responseValue = await response.json();
    ctx.body = responseValue;
}
exports.backendRequestMiddleware = () => async (ctx, next)=>{
    await fetchData(ctx);
    console.log(ctx.body)
    await next()
}