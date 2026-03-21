"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[3962],{1442:function(e,n,t){var i=t(2265);let a=i.forwardRef(function(e,n){let{title:t,titleId:a,...r}=e;return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:n,"aria-labelledby":a},r),t?i.createElement("title",{id:a},t):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"}))});n.Z=a},64297:function(e,n,t){var i=t(2265);let a=i.forwardRef(function(e,n){let{title:t,titleId:a,...r}=e;return i.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:n,"aria-labelledby":a},r),t?i.createElement("title",{id:a},t):null,i.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"}))});n.Z=a},49227:function(e,n,t){t.d(n,{Q:function(){return a}});var i=t(63159);function a(e){let n=e.filter(e=>!i.e.has(e.id));return i.B.concat(n)}},3848:function(e,n,t){t.d(n,{Cr:function(){return o},LH:function(){return s},R1:function(){return r}});var i=t(71282),a=t(39502);function r(e){return e?`${e.slice(0,5)}…${e.slice(-4)}`:""}function o({wei:e,precision:n=3}){return parseFloat((0,i.d)(e)).toFixed(n).replace(/0+$/,"").replace(/\.$/,"")}function s({amount:e,decimals:n}){return(0,a.b)(BigInt(e),n)}},93962:function(e,n,t){t.r(n),t.d(n,{FundSolWalletWithExternalSolanaWallet:function(){return eR},default:function(){return eR}});var i,a,r,o,s=t(57437),c=t(1442),l=t(2265),d=t(3848),u=t(4357),f=t(60683),g=t(97757),p=t(12403),h=t(19333),m=t(20278),v=t(60729),w=t(8557),y=t(95349),b=t(71554),A=t(47685),S=t(99876),x=t(46793),T=t(91538),E=t(74714),C=t(6989),j=t(2360),P=t(25013),I=t(1470),F=t(21664);let O=()=>{let{walletProxy:e,client:n}=(0,b.u)();return(0,l.useMemo)(()=>({signWithUserSigner:async({message:t,targetAppId:i})=>{if(!e)throw Error("Wallet proxy not initialized");let a=await n.getAccessToken();if(!a)throw Error("User must be authenticated");let{signature:r}=await e.signWithUserSigner({accessToken:a,message:t,targetAppId:i});return{signature:r}}}),[e,n])};var U=t(42037),W=t(7718);let k=["solana:mainnet","solana:devnet","solana:testnet"];function N(e,n){if(!Object.prototype.hasOwnProperty.call(e,n))throw TypeError("attempted to use private field on non-instance");return e}var M=0,D="__private_"+M+++"__implementation";function L(e,n){if(!Object.prototype.hasOwnProperty.call(e,n))throw TypeError("attempted to use private field on non-instance");return e}var _=0;function z(e){return"__private_"+_+++"_"+e}var B=z("_address"),R=z("_publicKey"),V=z("_chains"),H=z("_features"),$=z("_label"),Q=z("_icon");class Z{get address(){return L(this,B)[B]}get publicKey(){return L(this,R)[R].slice()}get chains(){return L(this,V)[V].slice()}get features(){return L(this,H)[H].slice()}get label(){return L(this,$)[$]}get icon(){return L(this,Q)[Q]}constructor({address:e,publicKey:n,label:t,icon:i}){Object.defineProperty(this,B,{writable:!0,value:void 0}),Object.defineProperty(this,R,{writable:!0,value:void 0}),Object.defineProperty(this,V,{writable:!0,value:void 0}),Object.defineProperty(this,H,{writable:!0,value:void 0}),Object.defineProperty(this,$,{writable:!0,value:void 0}),Object.defineProperty(this,Q,{writable:!0,value:void 0}),L(this,B)[B]=e,L(this,R)[R]=n,L(this,V)[V]=k,L(this,$)[$]=t,L(this,Q)[Q]=i,L(this,H)[H]=["solana:signAndSendTransaction","solana:signTransaction","solana:signMessage"],new.target===Z&&Object.freeze(this)}}function J(e,n){if(!Object.prototype.hasOwnProperty.call(e,n))throw TypeError("attempted to use private field on non-instance");return e}var G=0;function Y(e){return"__private_"+G+++"_"+e}var K=Y("_listeners"),q=Y("_version"),X=Y("_name"),ee=Y("_icon"),en=Y("_injection"),et=Y("_isPrivyWallet"),ei=Y("_accounts"),ea=Y("_on"),er=Y("_emit"),eo=Y("_off"),es=Y("_connected"),ec=Y("_connect"),el=Y("_disconnect"),ed=Y("_signMessage"),eu=Y("_signAndSendTransaction"),ef=Y("_signTransaction");function eg(e,...n){J(this,K)[K][e]?.forEach(e=>e.apply(null,n))}function ep(e,n){J(this,K)[K][e]=J(this,K)[K][e]?.filter(e=>n!==e)}function eh(){let{isHeadlessSigning:e,walletProxy:n,initializeWalletProxy:t,recoverEmbeddedWallet:i,openModal:a,privy:r,client:o}=(0,b.u)(),{user:s}=(0,j.u)(),{setModalData:c}=(0,A.a)(),{signWithUserSigner:l}=O();return{signMessage:({message:d,address:u,options:f})=>new Promise(async(g,p)=>{let h=(0,A.j)(s,u);if("privy"!==h?.walletClientType)return void p(new b.a("Wallet is not a Privy wallet",void 0,b.b.EMBEDDED_WALLET_NOT_FOUND));let{entropyId:m,entropyIdVerifier:v}=(0,P.g)(s,h),w=(0,A.b)(h),y=(0,U.b)(d).toString("base64");if(y.length<1)return void p(new b.a("Message must be a non-empty string",void 0,b.b.INVALID_MESSAGE));let S=async()=>{let e;if(!s)throw Error("User must be authenticated before signing with a Privy wallet");let a=await o.getAccessToken();if(!a)throw Error("User must be authenticated to use their embedded wallet.");let c=n??await t(15e3);if(!c)throw Error("Failed to initialize embedded wallet proxy.");if(!await i({address:h.address}))throw Error("Unable to connect to wallet");if(w){let n=await (0,E.f)(r,l,{chain_type:"solana",method:"signMessage",params:{message:y,encoding:"base64"},wallet_id:h.id});if(!n.data||!("signature"in n.data))throw Error("Failed to sign message");e=n.data.signature}else{let{response:n}=await c.rpc({accessToken:a,entropyId:m,entropyIdVerifier:v,chainType:"solana",hdWalletIndex:h.walletIndex??0,requesterAppId:f?.uiOptions?.requesterAppId,request:{method:"signMessage",params:{message:y}}});e=n.data.signature}return e};if(e({showWalletUIs:f?.uiOptions?.showWalletUIs}))try{let e=await S(),n=new Uint8Array((0,U.b)(e,"base64"));g({signature:n})}catch(e){p(e)}else c({signMessage:{method:"solana_signMessage",data:y,confirmAndSign:S,onSuccess:e=>{g({signature:new Uint8Array((0,U.b)(e,"base64"))})},onFailure:e=>{p(e)},uiOptions:f?.uiOptions??{}},connectWallet:{recoveryMethod:h.recoveryMethod,connectingWalletAddress:h.address,entropyId:m,entropyIdVerifier:v,isUnifiedWallet:w,onCompleteNavigateTo:"SignRequestScreen",onFailure:e=>{p(new b.a("Failed to connect to wallet",e,b.b.UNKNOWN_CONNECT_WALLET_ERROR))}}}),a("EmbeddedWalletConnectingScreen")})}}function em(){let{isHeadlessSigning:e,openModal:n}=(0,b.u)(),{setModalData:t}=(0,A.a)(),{signMessage:i}=eh(),{user:a}=(0,j.u)();return{signTransaction:async({transaction:r,options:o,chain:s="solana:mainnet",address:c})=>{async function l(e){let n,t,{signature:a}=await i({message:(0,U.a)(e),address:c,options:{...o,uiOptions:{...o?.uiOptions,showWalletUIs:!1}}});return{signedTransaction:(n=structuredClone((0,x.x7)().decode(e)),(t=(0,T.Lk)(c))in n.signatures&&(n.signatures[t]=a),new Uint8Array((0,x.Kt)().encode(n)))}}return e({showWalletUIs:o?.uiOptions?.showWalletUIs})?l(r):new Promise(async(e,i)=>{let d=(0,A.j)(a,c);if("privy"!==d?.walletClientType)return void i(new b.a("Wallet is not a Privy wallet",void 0,b.b.EMBEDDED_WALLET_NOT_FOUND));let{entropyId:u,entropyIdVerifier:f}=(0,P.g)(a,d),g=(0,A.b)(d);function p(e){return n=>{i(n instanceof b.a?n:new b.a("Failed to connect to wallet",n,e))}}let h={account:d,transaction:r,chain:s,signOnly:!0,uiOptions:o?.uiOptions||{},onConfirm:l,onSuccess:e,onFailure:p(b.b.TRANSACTION_FAILURE)};t({connectWallet:{recoveryMethod:d.recoveryMethod,connectingWalletAddress:d.address,entropyId:u,entropyIdVerifier:f,isUnifiedWallet:g,onCompleteNavigateTo:"StandardSignAndSendTransactionScreen",onFailure:p(b.b.UNKNOWN_CONNECT_WALLET_ERROR)},standardSignAndSendTransaction:h}),n("EmbeddedWalletConnectingScreen")})}}}let ev=new class extends I.Z{setImplementation(e){N(this,D)[D]=e}async signMessage(e){return N(this,D)[D].signMessage(e)}async signAndSendTransaction(e){return N(this,D)[D].signAndSendTransaction(e)}async signTransaction(e){return N(this,D)[D].signTransaction(e)}constructor(e){super(),Object.defineProperty(this,D,{writable:!0,value:void 0}),N(this,D)[D]=e}}({signTransaction:(0,b.l)("signTransaction was not injected"),signAndSendTransaction:(0,b.l)("signAndSendTransaction was not injected"),signMessage:(0,b.l)("signMessage was not injected")}),ew=new class{get version(){return J(this,q)[q]}get name(){return J(this,X)[X]}get icon(){return J(this,ee)[ee]}get chains(){return k.slice()}get features(){return{"standard:connect":{version:"1.0.0",connect:J(this,ec)[ec]},"standard:disconnect":{version:"1.0.0",disconnect:J(this,el)[el]},"standard:events":{version:"1.0.0",on:J(this,ea)[ea]},"solana:signAndSendTransaction":{version:"1.0.0",supportedTransactionVersions:["legacy",0],signAndSendTransaction:J(this,eu)[eu]},"solana:signTransaction":{version:"1.0.0",supportedTransactionVersions:["legacy",0],signTransaction:J(this,ef)[ef]},"solana:signMessage":{version:"1.0.0",signMessage:J(this,ed)[ed]},"privy:":{privy:{signMessage:J(this,en)[en].signMessage,signTransaction:J(this,en)[en].signTransaction,signAndSendTransaction:J(this,en)[en].signAndSendTransaction}}}}get accounts(){return J(this,ei)[ei].slice()}get isPrivyWallet(){return J(this,et)[et]}constructor({name:e,icon:n,version:t,injection:i,wallets:a}){Object.defineProperty(this,er,{value:eg}),Object.defineProperty(this,eo,{value:ep}),Object.defineProperty(this,K,{writable:!0,value:void 0}),Object.defineProperty(this,q,{writable:!0,value:void 0}),Object.defineProperty(this,X,{writable:!0,value:void 0}),Object.defineProperty(this,ee,{writable:!0,value:void 0}),Object.defineProperty(this,en,{writable:!0,value:void 0}),Object.defineProperty(this,et,{writable:!0,value:void 0}),Object.defineProperty(this,ei,{writable:!0,value:void 0}),Object.defineProperty(this,ea,{writable:!0,value:void 0}),Object.defineProperty(this,es,{writable:!0,value:void 0}),Object.defineProperty(this,ec,{writable:!0,value:void 0}),Object.defineProperty(this,el,{writable:!0,value:void 0}),Object.defineProperty(this,ed,{writable:!0,value:void 0}),Object.defineProperty(this,eu,{writable:!0,value:void 0}),Object.defineProperty(this,ef,{writable:!0,value:void 0}),J(this,K)[K]={},J(this,ea)[ea]=(e,n)=>(J(this,K)[K][e]?.push(n)||(J(this,K)[K][e]=[n]),()=>J(this,eo)[eo](e,n)),J(this,es)[es]=e=>{null!=e&&(J(this,ei)[ei]=e.map(({address:e})=>new Z({address:e,publicKey:F.Jq.decode(e)}))),J(this,er)[er]("change",{accounts:this.accounts})},J(this,ec)[ec]=async()=>(J(this,er)[er]("change",{accounts:this.accounts}),{accounts:this.accounts}),J(this,el)[el]=async()=>{J(this,er)[er]("change",{accounts:this.accounts})},J(this,ed)[ed]=async(...e)=>{let n=[];for(let{account:t,...i}of e){let{signature:e}=await J(this,en)[en].signMessage({...i,address:t.address});n.push({signedMessage:i.message,signature:e})}return n},J(this,eu)[eu]=async(...e)=>{let n=[];for(let t of e){let{signature:e}=await J(this,en)[en].signAndSendTransaction({...t,transaction:t.transaction,address:t.account.address,chain:t.chain||"solana:mainnet",options:t.options});n.push({signature:e})}return n},J(this,ef)[ef]=async(...e)=>{let n=[];for(let{transaction:t,account:i,options:a,chain:r}of e){let{signedTransaction:e}=await J(this,en)[en].signTransaction({transaction:t,address:i.address,chain:r||"solana:mainnet",options:a});n.push({signedTransaction:e})}return n},J(this,X)[X]=e,J(this,ee)[ee]=n,J(this,q)[q]=t,J(this,en)[en]=i,J(this,ei)[ei]=[],J(this,et)[et]=!0,i.on("accountChanged",J(this,es)[es],this),J(this,es)[es](a)}}({name:"Privy",version:"1.0.0",icon:"data:image/png;base64,AAABAAEAFBQAAAAAIABlAQAAFgAAAIlQTkcNChoKAAAADUlIRFIAAAAUAAAAFAgGAAAAjYkdDQAAAAlwSFlzAAAOwwAADsMBx2+oZAAAAQVJREFUeJxiYMANZIC4E4ivAPFPIP4FxDeAuB+IlfDowwBMQFwJxF+B+D8O/AOI66Bq8QJGIF6ExyB0vAqImfEZmEeCYTDcgMswPiB+T4aB34FYApuBsWQYBsP52AycToGBK7EZuJECAw9jM3AVBQbuwWZgIwUGTsZmoDkFBnpiMxAEjpJh2FV8iVsbiD+TYBgoDVrgMgwGnID4HRGGgTKBGyHDYEAaiBdCSxh0g/5AU4Q8sYYhAzEgjoGmABBOgFo2eACowFABYn0oVgViAVINkQTiZUD8DIj/ATF6GILEXgLxCiCWIsZAbiAuBeKtQHwHiEHJ6C8UfwHie0C8E4jLoWpRAAAAAP//rcbhsQAAAAZJREFUAwBYFs3VKJ0cuQAAAABJRU5ErkJggg==",wallets:[],injection:ev});var ey=t(16873),eb=t(80625),eA=t(38416),eS=t(82162),ex=t(2601),eT=t(28067),eE=t(91723),eC=((i=eC||{})[i.Uninitialized=0]="Uninitialized",i[i.Initialized=1]="Initialized",i),ej=((a=ej||{})[a.Legacy=0]="Legacy",a[a.Current=1]="Current",a),eP=((r=eP||{})[r.Nonce=0]="Nonce",r),eI=((o=eI||{})[o.CreateAccount=0]="CreateAccount",o[o.Assign=1]="Assign",o[o.TransferSol=2]="TransferSol",o[o.CreateAccountWithSeed=3]="CreateAccountWithSeed",o[o.AdvanceNonceAccount=4]="AdvanceNonceAccount",o[o.WithdrawNonceAccount=5]="WithdrawNonceAccount",o[o.InitializeNonceAccount=6]="InitializeNonceAccount",o[o.AuthorizeNonceAccount=7]="AuthorizeNonceAccount",o[o.Allocate=8]="Allocate",o[o.AllocateWithSeed=9]="AllocateWithSeed",o[o.AssignWithSeed=10]="AssignWithSeed",o[o.TransferSolWithSeed=11]="TransferSolWithSeed",o[o.UpgradeNonceAccount=12]="UpgradeNonceAccount",o);function eF(e){return!!e&&"object"==typeof e&&"address"in e&&(0,eS.he)(e)}var eO=t(93182),eU=t(54079),eW=t(97110),ek=t(36672),eN=t(78528),eM=t(57104);function eD({rows:e}){return(0,s.jsx)(w.a,{children:e.filter(e=>!!e).map((e,n)=>null!=e.value||e.isLoading?(0,s.jsxs)(w.R,{children:[(0,s.jsx)(v.L,{children:e.label}),(0,s.jsx)(v.V,{$isLoading:e.isLoading,children:e.value})]},n):null)})}function eL(e){return BigInt(Math.floor(1e9*parseFloat(e)))}function e_(e){return+ez.format(parseFloat(e.toString())/1e9)}t(97048),t(29155);let ez=Intl.NumberFormat(void 0,{maximumFractionDigits:8});async function eB({tx:e,solanaClient:n,amount:t,asset:i,tokenPrice:a}){if(!e)return null;if("SOL"===i&&a){let i=eL(t),r=(0,ek.g)(i,a),o=await (0,U.f)({solanaClient:n,tx:e});return{amountInUsd:r,feeInUsd:a?(0,ek.g)(o,a):void 0,totalInUsd:(0,ek.g)(i+o,a)}}if("USDC"===i&&a){let i;let r="$"+t,o=await (0,U.f)({solanaClient:n,tx:e}),s=(i=parseFloat(o.toString())/ek.L*a)<.01?0:i;return{amountInUsd:r,feeInUsd:(0,ek.g)(o,a),totalInUsd:"$"+(parseFloat(t)+s).toFixed(2)}}if("SOL"===i){let i=eL(t),a=await (0,U.f)({solanaClient:n,tx:e});return{amountInSol:t+" SOL",feeInSol:e_(a)+" SOL",totalInSol:e_(i+a)+" SOL"}}return{amountInUsdc:t+" USDC",feeInSol:e_(await (0,U.f)({solanaClient:n,tx:e}))+" SOL"}}let eR={component:function(){let e=(0,y.u)(),{closePrivyModal:n,createAnalyticsEvent:t}=(0,b.u)(),{data:i,setModalData:a,navigate:r}=(0,A.a)(),{wallets:o}=function(){let{ready:e,wallets:n}=function(){let{client:e}=(0,b.u)(),{ready:n,wallet:t}=function(){let{ready:e}=(0,P.u)(),{user:n}=(0,j.u)(),{signMessage:t}=eh(),{signTransaction:i}=em(),{signAndSendTransaction:a}=function(){let e=(0,y.u)(),{isHeadlessSigning:n,openModal:t,privy:i}=(0,b.u)(),{setModalData:a}=(0,A.a)(),{signTransaction:r}=em(),o=(0,U.u)(),{user:s}=(0,j.u)(),{signWithUserSigner:c}=O();return{signAndSendTransaction:async({transaction:l,address:d,chain:u="solana:mainnet",options:f})=>{let g=(0,A.j)(s,d);if("privy"!==g?.walletClientType)throw new b.a("Wallet is not a Privy wallet",void 0,b.b.EMBEDDED_WALLET_NOT_FOUND);let p=(0,A.b)(g);async function h(e){if(f?.sponsor)return await (async e=>{if(!p)throw new b.a("Sponsoring transactions is only supported for wallets on the TEE stack",b.b.INVALID_DATA);let n=await (0,E.f)(i,c,{chain_type:"solana",method:"signAndSendTransaction",sponsor:!0,params:{transaction:(0,U.b)(e).toString("base64"),encoding:"base64"},caip2:`solana:${(await o(u).rpc.getGenesisHash().send()).substring(0,32)}`,wallet_id:g.id});if(n.data&&"hash"in n.data)return{signature:F.Jq.decode(n.data.hash)};throw Error("Failed to sign and send transaction")})(e);let{signedTransaction:n}=await r({transaction:e,address:d,chain:u,options:{...f,uiOptions:{...f?.uiOptions,showWalletUIs:!1}}}),{signature:t}=await o(u).sendAndConfirmTransaction(n);return{signature:t}}return n({showWalletUIs:f?.uiOptions?.showWalletUIs})?h(l):new Promise(async(n,i)=>{let r,o,{entropyId:c,entropyIdVerifier:m}=(0,P.g)(s,g);function v(e){return n=>{i(n instanceof b.a?n:new b.a("Failed to connect to wallet",n,e))}}let w={account:g,transaction:l,chain:u,signOnly:!1,uiOptions:f?.uiOptions||{},onConfirm:h,onSuccess:n,onFailure:v(b.b.TRANSACTION_FAILURE),isSponsored:!!f?.sponsor},y={recoveryMethod:g.recoveryMethod,connectingWalletAddress:g.address,entropyId:c,entropyIdVerifier:m,isUnifiedWallet:p,onCompleteNavigateTo:"StandardSignAndSendTransactionScreen",onFailure:v(b.b.UNKNOWN_CONNECT_WALLET_ERROR)};e.fundingConfig&&(r=(0,W.x)({address:d,appConfig:e,methodScreen:"FundingMethodSelectionScreen",fundWalletConfig:{...f,asset:"native-currency",chain:u},externalSolanaFundingScreen:"FundSolWalletWithExternalSolanaWallet"}),o={amount:e.fundingConfig.defaultRecommendedAmount,asset:"SOL",chain:u,destinationAddress:d,afterSuccessScreen:"StandardSignAndSendTransactionScreen",sourceWalletData:void 0}),a({connectWallet:y,standardSignAndSendTransaction:w,funding:r,solanaFundingData:o}),t("EmbeddedWalletConnectingScreen")})}}}(),r=(0,l.useMemo)(()=>{let e=[...(0,A.n)(n).sort((e,n)=>(e.walletIndex??0)-(n.walletIndex??0))],t=(0,A.f)(n);return t.length?[...e,...t]:e},[n]),o=(0,l.useMemo)(()=>({signMessage:async({message:e,address:n,options:i})=>await t({message:e,address:n,options:i}),signTransaction:async({transaction:e,address:n,chain:t,options:a})=>await i({transaction:e,address:n,chain:t,options:a}),async signAndSendTransaction({transaction:e,address:n,chain:t,options:i}){let{signature:r}=await a({transaction:e,address:n,chain:t,options:i});return{signature:r}}}),[t,i,a]);return(0,l.useEffect)(()=>{ev?.setImplementation(o)},[o]),(0,l.useEffect)(()=>{var n;!e||(n=ew.accounts).length===r.length&&n.every((e,n)=>e.address===r[n]?.address)||ev?.emit("accountChanged",r)},[e,r]),{ready:e,wallet:ew}}(),[i,a]=(0,l.useState)([]),[r,o]=(0,l.useState)([]);return(0,l.useEffect)(()=>{let e=[t,...i.filter(e=>"solana"===e.chainType&&!!e.wallet.features).map(e=>e.wallet)];o(e);let n=i.flatMap(n=>{let t=()=>o([...e]);return n.on("walletsUpdated",t),{connector:n,off:t}}),a=e.map(n=>n.features["standard:events"]?.on("change",()=>{o([...e])}));return()=>{a.forEach(e=>e?.()),n.forEach(({connector:e,off:n})=>e.off("walletsUpdated",n))}},[i]),(0,l.useEffect)(()=>{a(e.connectors?.walletConnectors.filter(e=>"solana"===e.chainType)??[]);let n=()=>{a(e.connectors?.walletConnectors.filter(e=>"solana"===e.chainType)??[])};return e.connectors?.on("connectorInitialized",n),()=>{e.connectors?.off("connectorInitialized",n)}},[n,e.connectors]),{ready:n,wallets:r}}();return{ready:e,wallets:(0,l.useMemo)(()=>n.flatMap(e=>e.accounts.map(n=>new C.O({wallet:e,account:n}))),[n])}}(),[v,w]=(0,l.useState)("preparing"),[T,I]=(0,l.useState)(),[k,N]=(0,l.useState)(),[M,D]=(0,l.useState)();if(!i?.solanaFundingData)throw Error("Funding config is missing");if(!i.solanaFundingData.sourceWalletData)throw Error("Funding config is missing source wallet data");let{amount:L,asset:_,chain:z,sourceWalletData:B,destinationAddress:R,afterSuccessScreen:V}=i.solanaFundingData,H=o.find(e=>e.address===B.address&&(0,W.H)(B.walletClientType)===(0,W.H)(e.standardWallet.name)),$=(0,U.u)()(z),{tokenPrice:Q,isTokenPriceLoading:Z}=(0,ey.u)("solana");return(0,l.useEffect)(()=>{if("preparing"!==v||Z||!H)return;let e="SOL"===_?eL(L):BigInt(Math.floor(1e6*parseFloat(L)));N({amount:("SOL"===_&&Q?(0,ek.g)(e,Q):L)??L}),("SOL"===_?async function({solanaClient:e,source:n,destination:t,amountInLamports:i}){let{value:a}=await e.rpc.getLatestBlockhash().send(),r={address:n},o=(0,eO.z)((0,eU.fy)({version:0}),e=>(0,eS.Qg)(r,e),e=>(0,eU.bV)(a,e),e=>(0,eU.d3)(function(e,n){let t={source:{value:e.source??null,isWritable:!0},destination:{value:e.destination??null,isWritable:!0}},i={...e},a=e=>{if(!e.value)return;let n=e.isWritable?eA.g4.WRITABLE:eA.g4.READONLY;return Object.freeze({address:function(e){if(!e)throw Error("Expected a Address.");return"object"==typeof e&&"address"in e?e.address:Array.isArray(e)?e[0]:e}(e.value),role:eF(e.value)?(0,eA.$k)(n):n,...eF(e.value)?{signer:e.value}:{}})};return Object.freeze({accounts:[a(t.source),a(t.destination)],data:(0,ex.Nz)((0,eT.Q5)([["discriminator",(0,eE.Nf)()],["amount",(0,eE.bP)()]]),e=>({...e,discriminator:2})).encode(i),programAddress:(void 0)??"11111111111111111111111111111111"})}({amount:i,source:r,destination:t}),e),e=>(0,x.qy)(e));return new Uint8Array((0,x.Kt)().encode(o))}({solanaClient:$,source:H.address,destination:R,amountInLamports:e}):async function({solanaClient:e,source:n,destination:t,amountInBaseUnits:i}){let a=(0,eN.g)(e.chain),{value:r}=await e.rpc.getLatestBlockhash().send(),o={address:n},[s]=await (0,eW.BQD)({mint:a,owner:n,tokenProgram:ek.T}),[c]=await (0,eW.BQD)({mint:a,owner:t,tokenProgram:ek.T}),[l,d]=await Promise.all([e.rpc.getAccountInfo(s,{commitment:"confirmed",encoding:"jsonParsed"}).send().catch(()=>null),e.rpc.getAccountInfo(c,{commitment:"confirmed",encoding:"jsonParsed"}).send().catch(()=>null)]);if(!l?.value)throw Error(`Source token account does not exist for address: ${n}`);let u=(0,eW.mo_)({payer:o,ata:c,owner:t,mint:a}),f=(0,eO.z)((0,eU.fy)({version:0}),e=>(0,eS.Qg)(o,e),e=>(0,eU.bV)(r,e),e=>d?.value?e:(0,eU.d3)(u,e),e=>(0,eU.d3)((0,eW.y3x)({source:s,destination:c,authority:o,amount:i}),e),e=>(0,x.qy)(e));return new Uint8Array((0,x.Kt)().encode(f))}({solanaClient:$,source:H.address,destination:R,amountInBaseUnits:e})).then(I).catch(e=>{w("error"),D(e)})},[v,L,_,z,H,R,Z,Q]),(0,l.useEffect)(()=>{"preparing"===v&&T&&eB({tx:T,solanaClient:$,amount:L,asset:_,tokenPrice:Q}).then(e=>{w("loaded"),N({amount:e?.amountInUsd??e?.amountInUsdc??e?.amountInSol??L,fee:e?.feeInUsd??e?.feeInSol,total:e?.totalInUsd??e?.totalInSol})}).catch(e=>{w("error"),D(e)})},[T,L,_,v,Q]),(0,l.useEffect)(()=>{"error"===v&&M&&(a({errorModalData:{error:M,previousScreen:"FundSolWalletWithExternalSolanaWallet"},solanaFundingData:i.solanaFundingData}),r("ErrorScreen",!1))},[v,r]),(0,l.useEffect)(()=>{if("success"!==v)return;let e=setTimeout(V?()=>r(V):n,y.t);return()=>clearTimeout(e)},[v]),(0,s.jsxs)(s.Fragment,"success"===v?{children:[(0,s.jsx)(p.t,{}),(0,s.jsx)(f.b,{}),(0,s.jsxs)(f.c,{children:[(0,s.jsx)(c.Z,{color:"var(--privy-color-success)",width:"64px",height:"64px"}),(0,s.jsx)(g.C,{title:"Success!",description:`You’ve successfully added ${L} ${_} to your ${e.name} wallet. It may take a minute before the funds are available to use.`})]}),(0,s.jsx)(f.R,{}),(0,s.jsx)(u.B,{})]}:"preparing"===v||"loaded"===v||"sending"===v?{children:[(0,s.jsx)(p.t,{}),(0,s.jsx)(f.e,{style:{marginTop:"16px"},children:(0,s.jsx)(h.I,{icon:H?.standardWallet.icon,name:H?.standardWallet.name})}),(0,s.jsx)(g.C,{style:{marginTop:"8px",marginBottom:"12px"},title:"sending"===v&&H?`Confirming with ${H.standardWallet.name}`:"Confirm transaction"}),(0,s.jsx)(eD,{rows:[{label:"Source",value:(0,d.R1)(B.address)},{label:"Destination",value:(0,d.R1)(R)},{label:"Network",value:(0,eM.g)(z)},{label:"Amount",value:k?.amount,isLoading:"preparing"===v},{label:"Estimated fee",value:k?.fee,isLoading:"preparing"===v},{label:"Total",value:k?.total,isLoading:"preparing"===v}]}),(0,s.jsx)(u.P,{style:{marginTop:"1rem"},loading:"preparing"===v||"sending"===v,onClick:function(){"loaded"===v&&T&&H&&(w("sending"),(async function({transaction:e,chain:n,sourceWallet:t,solanaClient:i}){var a;let{hasFunds:r}=await (0,U.s)({solanaClient:i,tx:e});if(!r)throw new b.a(`Wallet ${(0,d.R1)(t.address)} does not have enough funds.`,void 0,b.b.INSUFFICIENT_BALANCE);let o=(a=(await t.signAndSendTransaction({transaction:e,chain:n}).catch(e=>{throw new b.a("Transaction was rejected by the user",e,b.b.TRANSACTION_FAILURE)})).signature,(0,S._V)().decode(a));return await (0,U.w)({rpcSubscriptions:i.rpcSubscriptions,signature:o,timeout:2e4}),o})({solanaClient:$,transaction:T,chain:z,sourceWallet:H}).then(e=>{w("success"),t({eventName:eb.O,payload:{provider:"external",status:"success",txHash:e,address:H.address,value:L,chainType:"solana",clusterName:z,token:_,destinationAddress:R,destinationValue:L,destinationChainType:"solana",destinationClusterName:z,destinationToken:_}})}).catch(e=>{w("error"),D(e)}))},children:"Confirm"}),(0,s.jsx)(u.B,{})]}:{children:[(0,s.jsx)(p.t,{}),(0,s.jsx)(m.N,{}),(0,s.jsx)("div",{style:{marginTop:"1rem"}}),(0,s.jsx)(u.B,{})]})}}},12403:function(e,n,t){t.d(n,{t:function(){return o}});var i=t(57437),a=t(47685),r=t(4357);function o({title:e}){let{currentScreen:n,navigateBack:t,navigate:o,data:s,setModalData:c}=(0,a.a)();return(0,i.jsx)(r.M,{title:e,backFn:"ManualTransferScreen"===n?t:n===s?.funding?.methodScreen?s.funding.comingFromSendTransactionScreen?()=>o("SendTransactionScreen"):void 0:s?.funding?.methodScreen?()=>{let e=s.funding;e.usingDefaultFundingMethod&&(e.usingDefaultFundingMethod=!1),c({funding:e,solanaFundingData:s?.solanaFundingData}),o(e.methodScreen)}:void 0})}},19333:function(e,n,t){t.d(n,{I:function(){return r}});var i=t(57437),a=t(64297);let r=({icon:e,name:n})=>"string"==typeof e?(0,i.jsx)("img",{alt:`${n||"wallet"} logo`,src:e,style:{height:24,width:24,borderRadius:4}}):void 0===e?(0,i.jsx)(a.Z,{style:{height:24,width:24}}):e?(0,i.jsx)(e,{style:{height:24,width:24}}):null},60683:function(e,n,t){t.d(n,{B:function(){return a},C:function(){return s},F:function(){return l},H:function(){return o},R:function(){return g},S:function(){return u},a:function(){return d},b:function(){return f},c:function(){return c},d:function(){return p},e:function(){return r}});var i=t(72361);let a=i.zo.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  margin-top: auto;
  gap: 16px;
  flex-grow: 100;
`,r=i.zo.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  width: 100%;
`,o=i.zo.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`,s=(0,i.zo)(r)`
  padding: 20px 0;
`,c=(0,i.zo)(r)`
  gap: 16px;
`,l=i.zo.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`,d=i.zo.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;i.zo.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`;let u=i.zo.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  text-align: left;
  gap: 8px;
  padding: 16px;
  margin-top: 16px;
  margin-bottom: 16px;
  width: 100%;
  background: var(--privy-color-background-2);
  border-radius: var(--privy-border-radius-md);
  && h4 {
    color: var(--privy-color-foreground-3);
    font-size: 14px;
    text-decoration: underline;
    font-weight: medium;
  }
  && p {
    color: var(--privy-color-foreground-3);
    font-size: 14px;
  }
`,f=i.zo.div`
  height: 16px;
`,g=i.zo.div`
  height: 12px;
`;i.zo.div`
  position: relative;
`;let p=i.zo.div`
  height: ${e=>e.height??"12"}px;
`;i.zo.div`
  background-color: var(--privy-color-accent);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  border-color: white;
  border-width: 2px !important;
`},29872:function(e,n,t){t.d(n,{L:function(){return r}});var i=t(72361);let a=(0,i.F4)`
  from, to {
    background: var(--privy-color-foreground-4);
    color: var(--privy-color-foreground-4);
  }

  50% {
    background: var(--privy-color-foreground-accent);
    color: var(--privy-color-foreground-accent);
  }
`,r=(0,i.iv)`
  ${e=>e.$isLoading?(0,i.iv)`
          width: 35%;
          animation: ${a} 2s linear infinite;
          border-radius: var(--privy-border-radius-sm);
        `:""}
`},8557:function(e,n,t){t.d(n,{R:function(){return r},a:function(){return a}});var i=t(72361);let a=i.zo.span`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
`,r=i.zo.span`
  display: flex;
  width: 100%;
  justify-content: space-between;
  gap: 0.5rem;
`},97757:function(e,n,t){t.d(n,{C:function(){return o},S:function(){return r}});var i=t(57437),a=t(72361);let r=({title:e,description:n,children:t,...a})=>(0,i.jsx)(s,{...a,children:(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)("h3",{children:e}),"string"==typeof n?(0,i.jsx)("p",{children:n}):n,t]})});(0,a.zo)(r)`
  margin-bottom: 24px;
`;let o=({title:e,description:n,icon:t,children:a,...r})=>(0,i.jsxs)(c,{...r,children:[t||null,(0,i.jsx)("h3",{children:e}),n&&"string"==typeof n?(0,i.jsx)("p",{children:n}):n,a]}),s=a.zo.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  text-align: left;
  gap: 8px;
  width: 100%;
  margin-bottom: 24px;

  && h3 {
    font-size: 17px;
    color: var(--privy-color-foreground);
  }

  /* Sugar assuming children are paragraphs. Otherwise, handling styling on your own */
  && p {
    color: var(--privy-color-foreground-2);
    font-size: 14px;
  }
`,c=(0,a.zo)(s)`
  align-items: center;
  text-align: center;
  gap: 16px;

  h3 {
    margin-bottom: 24px;
  }
`},60729:function(e,n,t){t.d(n,{L:function(){return r},V:function(){return s},a:function(){return o}});var i=t(72361),a=t(29872);let r=i.zo.span`
  color: var(--privy-color-foreground-3);
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.375rem; /* 157.143% */
`,o=(0,i.zo)(r)`
  color: var(--privy-color-accent);
`,s=i.zo.span`
  color: var(--privy-color-foreground);
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.375rem; /* 157.143% */
  word-break: break-all;
  text-align: right;

  ${a.L}
`},80625:function(e,n,t){t.d(n,{O:function(){return i}});let i="sdk_fiat_on_ramp_completed_with_status"},57104:function(e,n,t){t.d(n,{g:function(){return i}});function i(e){switch(e){case"solana:mainnet":return"Solana";case"solana:devnet":return"Devnet";case"solana:testnet":return"Testnet"}}},36672:function(e,n,t){t.d(n,{A:function(){return s},D:function(){return d},J:function(){return l},L:function(){return i},R:function(){return c},S:function(){return a},T:function(){return r},a:function(){return o},g:function(){return u}});let i=1e9,a="11111111111111111111111111111111",r="TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",o="TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",s="ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",c=["CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C","CPMDWBwJDtYax9qW7AyRuVC19Cc4L4Vcy4n2BHAbHkCW"],l=["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"],d={"solana:mainnet":{EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v:{symbol:"USDC",decimals:6,address:"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"},Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB:{symbol:"USDT",decimals:6,address:"Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"},So11111111111111111111111111111111111111112:{symbol:"SOL",decimals:9,address:"So11111111111111111111111111111111111111112"}},"solana:devnet":{"4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU":{symbol:"USDC",decimals:6,address:"4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"},EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS:{symbol:"USDT",decimals:6,address:"EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS"},So11111111111111111111111111111111111111112:{symbol:"SOL",decimals:9,address:"So11111111111111111111111111111111111111112"}},"solana:testnet":{}};function u(e,n){let t=parseFloat(e.toString())/i,a=f.format(n*t);return"$0.00"===a?"<$0.01":a}let f=new Intl.NumberFormat(void 0,{style:"currency",currency:"USD",maximumFractionDigits:2})},78528:function(e,n,t){t.d(n,{g:function(){return a}});var i=t(36672);function a(e){let[n]=Object.entries(i.D[e]).find(([e,n])=>"USDC"===n.symbol)??[];return n}},20278:function(e,n,t){t.d(n,{N:function(){return r}});var i=t(57437),a=t(72361);let r=({size:e,centerIcon:n})=>(0,i.jsx)(o,{$size:e,children:(0,i.jsxs)(s,{children:[(0,i.jsx)(l,{}),(0,i.jsx)(d,{}),n?(0,i.jsx)(c,{children:n}):null]})}),o=a.zo.div`
  --spinner-size: ${e=>e.$size?e.$size:"96px"};

  display: inline-flex;
  justify-content: center;
  align-items: center;

  @media all and (display-mode: standalone) {
    margin-bottom: 30px;
  }
`,s=a.zo.div`
  position: relative;
  height: var(--spinner-size);
  width: var(--spinner-size);

  opacity: 1;
  animation: fadein 200ms ease;
`,c=a.zo.div`
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
`,l=a.zo.div`
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
`,d=a.zo.div`
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
`},48723:function(e,n,t){t.d(n,{u:function(){return r}});var i=t(2265),a=t(71554);let r=({enabled:e=!0}={})=>{let{showFiatPrices:n,getUsdPriceForSol:t}=(0,a.u)(),[r,o]=(0,i.useState)(!0),[s,c]=(0,i.useState)(void 0),[l,d]=(0,i.useState)(void 0);return(0,i.useEffect)(()=>{(async()=>{if(n&&e)try{o(!0);let e=await t();e?d(e):c(Error("Unable to fetch SOL price"))}catch(e){c(e)}finally{o(!1)}else o(!1)})()},[]),{solPrice:l,isSolPriceLoading:r,solPriceError:s}}},16873:function(e,n,t){t.d(n,{u:function(){return c}});var i=t(2265),a=t(49227),r=t(95349),o=t(71554),s=t(48723);function c(e){let{tokenPrice:n,isTokenPriceLoading:t,tokenPriceError:c}=(e=>{let{showFiatPrices:n,getUsdTokenPrice:t,chains:s}=(0,o.u)(),[c,l]=(0,i.useState)(!0),[d,u]=(0,i.useState)(void 0),[f,g]=(0,i.useState)(void 0);return(0,i.useEffect)(()=>{e||=r.s;let i=(0,a.Q)(s).find(n=>n.id===Number(e));(async()=>{if(n){if(!i)return l(!1),void u(Error(`Unable to fetch token price on chain id ${e}`));try{l(!0);let e=await t(i);e?g(e):u(Error(`Unable to fetch token price on chain id ${i.id}`))}catch(e){u(e)}finally{l(!1)}}else l(!1)})()},[e]),{tokenPrice:f,isTokenPriceLoading:c,tokenPriceError:d}})("solana"===e?-1:e),{solPrice:l,isSolPriceLoading:d,solPriceError:u}=(0,s.u)({enabled:"solana"===e});return"solana"===e?{tokenPrice:l,isTokenPriceLoading:d,tokenPriceError:u}:{tokenPrice:n,isTokenPriceLoading:t,tokenPriceError:c}}},42037:function(e,n,t){t.d(n,{a:function(){return l},b:function(){return f},f:function(){return d},s:function(){return u},u:function(){return p},w:function(){return g}});var i=t(46793),a=t(99876),r=t(2265),o=t(95349),s=t(71554),c=t(82957).Buffer;function l(e){return new Uint8Array((0,i.x7)().decode(e).messageBytes)}async function d({solanaClient:e,tx:n}){let t=(0,a.TJ)().decode(l(n)),{value:i}=await e.rpc.getFeeForMessage(t).send();return i??0n}async function u({solanaClient:e,tx:n,replaceRecentBlockhash:t}){let{value:i}=await e.rpc.simulateTransaction((0,a.TJ)().decode(n),{commitment:"confirmed",encoding:"base64",sigVerify:!1,replaceRecentBlockhash:t}).send();if("BlockhashNotFound"===i.err&&t)throw Error("Simulation failed: Blockhash not found");return"BlockhashNotFound"===i.err?await u({solanaClient:e,tx:n,replaceRecentBlockhash:!0}):{logs:i.logs??[],error:i.err,hasError:!!i.err,hasFunds:i.logs?.every(e=>!/insufficient funds/gi.test(e)&&!/insufficient lamports/gi.test(e))??!0}}let f=(...e)=>{if(void 0===c)throw new s.a("Buffer is not defined.",void 0,s.b.BUFFER_NOT_DEFINED);return c.from(...e)};async function g({rpcSubscriptions:e,signature:n,timeout:t}){let i=new AbortController,a=await e.signatureNotifications(n,{commitment:"confirmed"}).subscribe({abortSignal:i.signal}),r=await Promise.race([new Promise(e=>{setTimeout(()=>{i.abort(),e(Error("Transaction confirmation timed out"))},t)}),new Promise(async e=>{for await(let n of a){if(i.abort(),n.value.err)return e(Error("Transaction confirmation failed"));e(void 0)}})]);if(r instanceof Error)throw r}function p(){let e=(0,o.u)(),n=(0,r.useMemo)(()=>Object.fromEntries(["solana:mainnet","solana:devnet","solana:testnet"].map(n=>[n,e.solanaRpcs[n]?function({rpc:e,rpcSubscriptions:n,chain:t,blockExplorerUrl:i}){let r=function({rpc:e,rpcSubscriptions:n}){return async t=>new Promise(async(i,r)=>{try{let r=await e.sendTransaction(f(t).toString("base64"),{preflightCommitment:"confirmed",encoding:"base64"}).send();await g({rpcSubscriptions:n,signature:r,timeout:1e4}),i({signature:new Uint8Array((0,a.Un)().encode(r))})}catch(e){r(e)}})}({rpc:e,rpcSubscriptions:n});return{rpc:e,rpcSubscriptions:n,chain:t,blockExplorerUrl:i,sendAndConfirmTransaction:r}}({chain:n,rpc:e.solanaRpcs[n].rpc,rpcSubscriptions:e.solanaRpcs[n].rpcSubscriptions,blockExplorerUrl:e.solanaRpcs[n].blockExplorerUrl??`https://explorer.solana.com?cluster=${n.replace("solana:","")}`}):null])),[e.solanaRpcs]);return(0,r.useCallback)(e=>{if(!n[e])throw Error(`No RPC configuration found for chain ${e}`);return n[e]},[n])}}}]);