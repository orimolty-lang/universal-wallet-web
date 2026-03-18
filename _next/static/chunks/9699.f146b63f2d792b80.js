"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[9699],{54428:function(e,n,t){t.d(n,{Z:function(){return u}});var r=t(2265);let a=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),i=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,n,t)=>t?t.toUpperCase():n.toLowerCase()),s=e=>{let n=i(e);return n.charAt(0).toUpperCase()+n.slice(1)},o=function(){for(var e=arguments.length,n=Array(e),t=0;t<e;t++)n[t]=arguments[t];return n.filter((e,n,t)=>!!e&&""!==e.trim()&&t.indexOf(e)===n).join(" ").trim()},l=e=>{for(let n in e)if(n.startsWith("aria-")||"role"===n||"title"===n)return!0};var d={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};let c=(0,r.forwardRef)((e,n)=>{let{color:t="currentColor",size:a=24,strokeWidth:i=2,absoluteStrokeWidth:s,className:c="",children:u,iconNode:f,...p}=e;return(0,r.createElement)("svg",{ref:n,...d,width:a,height:a,stroke:t,strokeWidth:s?24*Number(i)/Number(a):i,className:o("lucide",c),...!u&&!l(p)&&{"aria-hidden":"true"},...p},[...f.map(e=>{let[n,t]=e;return(0,r.createElement)(n,t)}),...Array.isArray(u)?u:[u]])}),u=(e,n)=>{let t=(0,r.forwardRef)((t,i)=>{let{className:l,...d}=t;return(0,r.createElement)(c,{ref:i,iconNode:n,className:o("lucide-".concat(a(s(e))),"lucide-".concat(e),l),...d})});return t.displayName=s(e),t}},42196:function(e,n,t){t.d(n,{Z:function(){return r}});let r=(0,t(54428).Z)("check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]])},8198:function(e,n,t){t.r(n),t.d(n,{AwaitingSolToEvmBridgingScreen:function(){return I},default:function(){return I}});var r=t(57437),a=t(1442),i=t(2265),s=t(12629),o=t(6989),l=t(60683),d=t(15383),c=t(97757),u=t(43943),f=t(20278),p=t(72172),h=t(71554),g=t(50640),m=t(4696),v=t(80625),w=t(89297),b=t(1342),y=t(959),x=t(58314),C=t(41917);t(29155),t(97048),t(87336);let I={component:function(){let e=(0,p.u)(),{closePrivyModal:n,createAnalyticsEvent:t,connectors:I}=(0,h.u)(),{navigate:S,setModalData:N,data:T}=(0,m.a)(),A=(0,p.u)(),E=(0,i.useRef)(!1),$=(0,b.u)(),[j,F]=(0,i.useState)(!1),[U,z]=(0,i.useState)(!1),[k,B]=(0,i.useState)(null),[R,W]=(0,i.useState)(),[L,_]=(0,i.useState)();if(!T?.funding||"ethereum"!==T.funding.chainType)throw Error("Invalid funding data");let{amount:D,connectedWallet:M,chain:O,solanaChain:H,isUSDC:P}=T.funding,Z=T.funding.address,q=T.funding.erc20Address,G=T.funding.isUSDC?"USDC":O.nativeCurrency.symbol,Q=(0,i.useMemo)(()=>"solana"===M?.type?M.provider:function({connectors:e,connectedWalletAddress:n}){let t=e.find(e=>"solana"===e.chainType&&e.wallets.some(e=>e.address===n)),r=t?.wallet.accounts.find(e=>e.address===n);if(!t||!r)throw new h.a("Unable to find source wallet connector");return new o.O({wallet:t.wallet,account:r})}({connectors:I,connectedWalletAddress:M?.address||""}),[M,I]),V=(0,i.useMemo)(()=>{let n=$(y.S);if(!n)throw new h.a("Unable to load solana plugin");let t=e.solanaRpcs["solana:mainnet"];if(!t)throw new h.a("Unable to load mainnet RPC");return n.getSolanaRpcClient({rpc:t.rpc,rpcSubscriptions:t.rpcSubscriptions,chain:"solana:mainnet",blockExplorerUrl:t.blockExplorerUrl??"https://explorer.solana.com"})},[]),Y=(0,g.z)((0,x.H)(Q?.standardWallet.name||"unknown")),J=Y?.name||"wallet";return(0,i.useEffect)(()=>{(async function(){if(!Q||!O||E.current)return;let e=$(y.S);if(!e)return void B(new h.a("Unable to solana plugin"));E.current=!0,O?.testnet&&console.warn("Solana testnets are not supported for bridging");let n=P?1e6*parseFloat(D):(0,s.f)(D),t=await (0,w.g)({isTestnet:!!O.testnet,input:(0,w.t)({appId:A.id,amount:n.toString(),user:Q.address,recipient:Z,destinationChainId:O.id,originChainId:w.b,originCurrency:P?w.d:w.a,destinationCurrency:P?q:void 0})}).catch(console.error);if(!t)return void B(new h.a(`Unable to fetch quotes for bridging. Wallet ${(0,x.I)(Q.address)} does not have enough funds.`,void 0,h.b.INSUFFICIENT_BALANCE));let r=await e.createTransactionFromRelayQuote({quote:t,source:Q.address,solanaClient:V});if(r)try{F(!0);let n=await e.simulateTransaction({solanaClient:V,tx:r});if(n.hasError)return n.hasFunds?(console.error("Transaction failed:",n.error),void B(new h.a("Something went wrong",void 0,h.b.TRANSACTION_FAILURE))):void B(new h.a(`Wallet ${(0,x.I)(Q?.address)} does not have enough funds. ${t.details.currencyIn.amountFormatted} ${G} are needed to complete the transaction.`,void 0,h.b.INSUFFICIENT_BALANCE));let{signature:a}=await Q.signAndSendTransaction({chain:"solana:mainnet",transaction:r}),i=e.getAddressFromBuffer(a);W(i),_("pending")}catch(e){if(console.error(e),/user rejected the request/gi.test(e.message||""))return void B(new h.a("Transaction was rejected by the user",void 0,h.b.TRANSACTION_FAILURE));B(new h.a("Something went wrong",void 0,h.b.TRANSACTION_FAILURE))}else B(new h.a(`Unable to select bridge option from quotes. Wallet ${(0,x.I)(Q.address)} does not have enough funds.`,void 0,h.b.INSUFFICIENT_BALANCE))})().catch(console.error)},[]),(0,w.u)({transactionHash:R,isTestnet:!1,bridgingStatus:L,setBridgingStatus:_,onSuccess({transactionHash:e}){F(!1),z(!0),t({eventName:v.O,payload:{provider:"external",status:"success",txHash:e,address:Q.address,chainType:"solana",clusterName:H,token:"SOL",destinationAddress:Z,destinationChainId:O.id,destinationChainType:"ethereum",destinationValue:D,destinationToken:P?"USDC":"ETH"}})},onFailure({error:e}){F(!1),B(e)}}),(0,i.useEffect)(()=>{if(!U)return;let e=setTimeout(n,p.t);return()=>clearTimeout(e)},[U]),(0,i.useEffect)(()=>{k&&(N({funding:T?.funding,solanaFundingData:T?.solanaFundingData,sendTransaction:T?.sendTransaction,errorModalData:{error:k,previousScreen:"TransferFromWalletScreen"}}),S("ErrorScreen",!1))},[k]),U?(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(u.t,{}),(0,r.jsx)(l.b,{}),(0,r.jsxs)(l.c,{children:[(0,r.jsx)(a.Z,{color:"var(--privy-color-success)",width:"64px",height:"64px"}),(0,r.jsx)(c.C,{title:"Success!",description:`You’ve successfully added ${D} ${G} to your ${A.name} wallet. It may take a minute before the funds are available to use.`})]}),(0,r.jsx)(l.R,{}),(0,r.jsx)(d.B,{})]}):j&&Q?(0,r.jsx)(C.T,{walletClientType:(0,x.H)(Q?.standardWallet.name||"unknown"),displayName:J,addressToFund:Z,isBridging:j,isErc20Flow:!1,chainId:O.id,chainName:O.name,totalPriceInUsd:void 0,totalPriceInNativeCurrency:void 0,gasPriceInUsd:void 0,gasPriceInNativeCurrency:void 0}):(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(u.t,{}),(0,r.jsx)(f.N,{}),(0,r.jsx)("div",{style:{marginTop:"1rem"}}),(0,r.jsx)(d.B,{})]})}}},20278:function(e,n,t){t.d(n,{N:function(){return i}});var r=t(57437),a=t(72361);let i=({size:e,centerIcon:n})=>(0,r.jsx)(s,{$size:e,children:(0,r.jsxs)(o,{children:[(0,r.jsx)(d,{}),(0,r.jsx)(c,{}),n?(0,r.jsx)(l,{children:n}):null]})}),s=a.zo.div`
  --spinner-size: ${e=>e.$size?e.$size:"96px"};

  display: inline-flex;
  justify-content: center;
  align-items: center;

  @media all and (display-mode: standalone) {
    margin-bottom: 30px;
  }
`,o=a.zo.div`
  position: relative;
  height: var(--spinner-size);
  width: var(--spinner-size);

  opacity: 1;
  animation: fadein 200ms ease;
`,l=a.zo.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  svg,
  img {
    width: calc(var(--spinner-size) * 0.4);
    height: calc(var(--spinner-size) * 0.4);
    border-radius: var(--privy-border-radius-full);
  }
`,d=a.zo.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: var(--spinner-size);
  height: var(--spinner-size);

  && {
    border: 4px solid var(--privy-color-border-default);
    border-radius: 50%;
  }
`,c=a.zo.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: var(--spinner-size);
  height: var(--spinner-size);
  animation: spin 1200ms linear infinite;

  && {
    border: 4px solid;
    border-color: var(--privy-color-icon-subtle) transparent transparent transparent;
    border-radius: 50%;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`},12629:function(e,n,t){t.d(n,{f:function(){return i}});var r=t(98173),a=t(57303);function i(e,n="wei"){return(0,a.v)(e,r.ez[n])}},57303:function(e,n,t){t.d(n,{v:function(){return i}});var r=t(81544);class a extends r.G{constructor({value:e}){super(`Number \`${e}\` is not a valid decimal number.`,{name:"InvalidDecimalNumberError"})}}function i(e,n){if(!/^(-?)([0-9]*)\.?([0-9]*)$/.test(e))throw new a({value:e});let[t,r="0"]=e.split("."),i=t.startsWith("-");if(i&&(t=t.slice(1)),r=r.replace(/(0+)$/,""),0===n)1===Math.round(Number(`.${r}`))&&(t=`${BigInt(t)+1n}`),r="";else if(r.length>n){let[e,a,i]=[r.slice(0,n-1),r.slice(n-1,n),r.slice(n)],s=Math.round(Number(`${a}.${i}`));(r=s>9?`${BigInt(e)+BigInt(1)}0`.padStart(e.length+1,"0"):`${e}${s}`).length>n&&(r=r.slice(1),t=`${BigInt(t)+1n}`),r=r.slice(0,n)}else r=r.padEnd(n,"0");return BigInt(`${i?"-":""}${t}${r}`)}}}]);