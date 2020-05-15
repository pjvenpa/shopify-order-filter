require('isomorphic-fetch');
const dotenv = require('dotenv');
const Koa = require('koa');
const next = require('next');
const { default: createShopifyAuth } = require('@shopify/koa-shopify-auth');
const { verifyRequest } = require('@shopify/koa-shopify-auth');
const session = require('koa-session');

const Router = require('koa-router');
const router = new Router();
const koaBody = require('koa-body');

dotenv.config();

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const { SHOPIFY_API_SECRET_KEY, SHOPIFY_API_KEY } = process.env;

app.prepare().then(() => {
  const server = new Koa();
  server.use(session({ secure: true, sameSite: 'none' }, server));
  server.keys = [SHOPIFY_API_SECRET_KEY];
  server.use(
    createShopifyAuth({
      apiKey: SHOPIFY_API_KEY,
      secret: SHOPIFY_API_SECRET_KEY,
      scopes: ['read_orders' ],
      accessMode: 'offline',
      afterAuth(ctx) {
        const { shop, accessToken } = ctx.session;
        ctx.cookies.set('shopOrigin', shop, {
          httpOnly: false,
          secure: false,
          sameSite: 'none',
        });

        ctx.cookies.set('accessToken', accessToken );

        ctx.redirect('/');
      },
    }),
  );

  

  router.post('/api/:endpoint', koaBody(), async (ctx) => {
    try {
      var params = ctx.request.body || {method: "GET"};
      console.log( JSON.stringify(ctx.request.body) );
      const method = params.method;
      const param  = params.param || {};
      const qstr = params.queryStr;
      var request = {
        method: method, 
        headers: {
          "X-Shopify-Access-Token": ctx.cookies.get('accessToken'),
          'Content-Type': 'application/json'
        }
      };
      if( method != "GET" ){
          request.body = JSON.stringify( param );
      }

      console.log( request );

      const results = await fetch("https://" + ctx.cookies.get('shopOrigin') + "/admin/api/2020-01/" + ctx.params.endpoint + ".json" + qstr,request)
      .then(response => response.json())
      .then(json => {
        return json;
      });
      ctx.body = {
        status: 'success',
        data: results
      };
    } catch (err) {
      console.log(err)
    }
});


  server.use(verifyRequest());

  server.use(router.routes());

  server.use(async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
    return
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
  
});
