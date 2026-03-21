"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[8997],{54428:function(e,r,t){t.d(r,{Z:function(){return u}});var n=t(2265);let o=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),a=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,r,t)=>t?t.toUpperCase():r.toLowerCase()),s=e=>{let r=a(e);return r.charAt(0).toUpperCase()+r.slice(1)},i=function(){for(var e=arguments.length,r=Array(e),t=0;t<e;t++)r[t]=arguments[t];return r.filter((e,r,t)=>!!e&&""!==e.trim()&&t.indexOf(e)===r).join(" ").trim()},c=e=>{for(let r in e)if(r.startsWith("aria-")||"role"===r||"title"===r)return!0};var l={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};let d=(0,n.forwardRef)((e,r)=>{let{color:t="currentColor",size:o=24,strokeWidth:a=2,absoluteStrokeWidth:s,className:d="",children:u,iconNode:h,...f}=e;return(0,n.createElement)("svg",{ref:r,...l,width:o,height:o,stroke:t,strokeWidth:s?24*Number(a)/Number(o):a,className:i("lucide",d),...!u&&!c(f)&&{"aria-hidden":"true"},...f},[...h.map(e=>{let[r,t]=e;return(0,n.createElement)(r,t)}),...Array.isArray(u)?u:[u]])}),u=(e,r)=>{let t=(0,n.forwardRef)((t,a)=>{let{className:c,...l}=t;return(0,n.createElement)(d,{ref:a,iconNode:r,className:i("lucide-".concat(o(s(e))),"lucide-".concat(e),c),...l})});return t.displayName=s(e),t}},42196:function(e,r,t){t.d(r,{Z:function(){return n}});let n=(0,t(54428).Z)("check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]])},64796:function(e,r,t){t.d(r,{Z:function(){return n}});let n=(0,t(54428).Z)("copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])},45402:function(e,r,t){var n=t(2265);let o=n.forwardRef(function(e,r){let{title:t,titleId:o,...a}=e;return n.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":o},a),t?n.createElement("title",{id:o},t):null,n.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"}))});r.Z=o},47842:function(e,r,t){var n=t(2265);let o=n.forwardRef(function(e,r){let{title:t,titleId:o,...a}=e;return n.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":o},a),t?n.createElement("title",{id:o},t):null,n.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"}))});r.Z=o},64297:function(e,r,t){var n=t(2265);let o=n.forwardRef(function(e,r){let{title:t,titleId:o,...a}=e;return n.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":o},a),t?n.createElement("title",{id:o},t):null,n.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"}))});r.Z=o},49605:function(e,r,t){t.d(r,{A:function(){return d}});var n=t(57437),o=t(42196),a=t(64796),s=t(2265),i=t(72361),c=t(7718),l=t(4357);let d=({address:e,showCopyIcon:r,url:t,className:i})=>{let[d,p]=(0,s.useState)(!1);function x(r){r.stopPropagation(),navigator.clipboard.writeText(e).then(()=>p(!0)).catch(console.error)}return(0,s.useEffect)(()=>{if(d){let e=setTimeout(()=>p(!1),3e3);return()=>clearTimeout(e)}},[d]),(0,n.jsxs)(u,t?{children:[(0,n.jsx)(f,{title:e,className:i,href:`${t}/address/${e}`,target:"_blank",children:(0,c.v)(e)}),r&&(0,n.jsx)(l.S,{onClick:x,size:"sm",style:{gap:"0.375rem"},children:(0,n.jsxs)(n.Fragment,d?{children:["Copied",(0,n.jsx)(o.Z,{size:16})]}:{children:["Copy",(0,n.jsx)(a.Z,{size:16})]})})]}:{children:[(0,n.jsx)(h,{title:e,className:i,children:(0,c.v)(e)}),r&&(0,n.jsx)(l.S,{onClick:x,size:"sm",style:{gap:"0.375rem",fontSize:"14px"},children:(0,n.jsxs)(n.Fragment,d?{children:["Copied",(0,n.jsx)(o.Z,{size:14})]}:{children:["Copy",(0,n.jsx)(a.Z,{size:14})]})})]})},u=i.zo.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
`,h=i.zo.span`
  font-size: 14px;
  font-weight: 500;
  color: var(--privy-color-foreground);
`,f=i.zo.a`
  font-size: 14px;
  color: var(--privy-color-foreground);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`},88997:function(e,r,t){t.r(r),t.d(r,{LinkConflictScreen:function(){return Z},LinkConflictScreenView:function(){return L},default:function(){return Z}});var n=t(57437),o=t(47842),a=t(64297),s=t(2265),i=t(4357),c=t(72361),l=t(3382),d=t(49605),u=t(71554),h=t(47685),f=t(76736),p=t(95349),x=t(45402);let m=s.forwardRef(function(e,r){let{title:t,titleId:n,...o}=e;return s.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:r,"aria-labelledby":n},o),t?s.createElement("title",{id:n},t):null,s.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6"}))});t(97048),t(1470),t(29155);let g=c.zo.span`
  && {
    width: 82px;
    height: 82px;
    border-width: 4px;
    border-style: solid;
    border-color: ${e=>e.color??"var(--privy-color-accent)"};
    border-bottom-color: transparent;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1.2s linear infinite;
    transition: border-color 800ms;
    border-bottom-color: ${e=>e.color??"var(--privy-color-accent)"};
  }
`;function v(e){return(0,n.jsxs)("svg",{xmlns:"http://www.w3.org/2000/svg",width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round",...e,children:[(0,n.jsx)("circle",{cx:"12",cy:"12",r:"10"}),(0,n.jsx)("line",{x1:"12",x2:"12",y1:"8",y2:"12"}),(0,n.jsx)("line",{x1:"12",x2:"12.01",y1:"16",y2:"16"})]})}let w=({onTransfer:e,isTransferring:r,transferSuccess:t})=>(0,n.jsx)(i.P,{...t?{success:!0,children:"Success!"}:{warn:!0,loading:r,onClick:e,children:"Transfer and delete account"}}),y=c.zo.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding-bottom: 16px;
`,j=c.zo.div`
  display: flex;
  flex-direction: column;
  && p {
    font-size: 14px;
  }
  width: 100%;
  gap: 16px;
`,k=c.zo.div`
  display: flex;
  cursor: pointer;
  align-items: center;
  width: 100%;
  border: 1px solid var(--privy-color-foreground-4) !important;
  border-radius: var(--privy-border-radius-md);
  padding: 8px 10px;
  font-size: 14px;
  font-weight: 500;
  gap: 8px;
`,b=(0,c.zo)(x.Z)`
  position: relative;
  width: ${({$iconSize:e})=>`${e}px`};
  height: ${({$iconSize:e})=>`${e}px`};
  color: var(--privy-color-foreground-3);
  margin-left: auto;
`,C=(0,c.zo)(m)`
  position: relative;
  width: 15px;
  height: 15px;
  color: var(--privy-color-foreground-3);
  margin-left: auto;
`,T=c.zo.ol`
  display: flex;
  flex-direction: column;
  font-size: 14px;
  width: 100%;
  text-align: left;
`,A=c.zo.li`
  font-size: 14px;
  list-style-type: auto;
  list-style-position: outside;
  margin-left: 1rem;
  margin-bottom: 0.5rem; /* Adjust the margin as needed */

  &:last-child {
    margin-bottom: 0; /* Remove margin from the last item */
  }
`,z=c.zo.div`
  position: relative;
  width: 60px;
  height: 60px;
  margin: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
`,S=()=>(0,n.jsx)(z,{children:(0,n.jsx)(b,{$iconSize:60})}),E=({address:e,onClose:r,onRetry:t,onTransfer:o,isTransferring:s,transferSuccess:c})=>{let{defaultChain:l}=(0,p.u)(),u=l.blockExplorers?.default.url??"https://etherscan.io";return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(i.M,{onClose:r,backFn:t}),(0,n.jsxs)(y,{children:[(0,n.jsx)(S,{}),(0,n.jsxs)(j,{children:[(0,n.jsx)("h3",{children:"Check account assets before transferring"}),(0,n.jsx)("p",{children:"Before transferring, ensure there are no assets in the other account. Assets in that account will not transfer automatically and may be lost."}),(0,n.jsxs)(T,{children:[(0,n.jsx)("p",{children:" To check your balance, you can:"}),(0,n.jsx)(A,{children:"Log out and log back into the other account, or "}),(0,n.jsxs)(A,{children:["Copy your wallet address and use a"," ",(0,n.jsx)("u",{children:(0,n.jsx)("a",{target:"_blank",href:u,children:"block explorer"})})," ","to see if the account holds any assets."]})]}),(0,n.jsxs)(k,{onClick:()=>navigator.clipboard.writeText(e).catch(console.error),children:[(0,n.jsx)(a.Z,{color:"var(--privy-color-foreground-1)",strokeWidth:2,height:"28px",width:"28px"}),(0,n.jsx)(d.A,{address:e,showCopyIcon:!1}),(0,n.jsx)(C,{})]}),(0,n.jsx)(w,{onTransfer:o,isTransferring:s,transferSuccess:c})]})]}),(0,n.jsx)(i.B,{})]})},Z={component:()=>{let{initiateAccountTransfer:e,closePrivyModal:r}=(0,u.u)(),{data:t,navigate:o,lastScreen:a,setModalData:i}=(0,h.a)(),[c,l]=(0,s.useState)(void 0),[d,f]=(0,s.useState)(!1),[p,x]=(0,s.useState)(!1),m=async()=>{try{if(!t?.accountTransfer?.nonce||!t?.accountTransfer?.account)throw Error("missing account transfer inputs");x(!0),await e({nonce:t?.accountTransfer?.nonce,account:t?.accountTransfer?.account,accountType:t?.accountTransfer?.linkMethod,externalWalletMetadata:t?.accountTransfer?.externalWalletMetadata,telegramWebAppData:t?.accountTransfer?.telegramWebAppData,telegramAuthResult:t?.accountTransfer?.telegramAuthResult,farcasterEmbeddedAddress:t?.accountTransfer?.farcasterEmbeddedAddress,oAuthUserInfo:t?.accountTransfer?.oAuthUserInfo}),f(!0),x(!1),setTimeout(r,1e3)}catch(e){i({errorModalData:{error:e,previousScreen:a||"LinkConflictScreen"}}),o("ErrorScreen",!0)}};return c?(0,n.jsx)(E,{address:c,onClose:r,onRetry:()=>l(void 0),onTransfer:m,isTransferring:p,transferSuccess:d}):(0,n.jsx)(L,{onClose:r,onInfo:()=>l(t?.accountTransfer?.embeddedWalletAddress),onContinue:()=>l(t?.accountTransfer?.embeddedWalletAddress),onTransfer:m,isTransferring:p,transferSuccess:d,data:t})}},L=({onClose:e,onContinue:r,onInfo:t,onTransfer:a,transferSuccess:s,isTransferring:c,data:d})=>{if(!d?.accountTransfer?.linkMethod||!d?.accountTransfer?.displayName)return;let u={method:d?.accountTransfer?.linkMethod,handle:d?.accountTransfer?.displayName,disclosedAccount:d?.accountTransfer?.embeddedWalletAddress?{type:"wallet",handle:d?.accountTransfer?.embeddedWalletAddress}:void 0};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(i.M,{closeable:!0}),(0,n.jsxs)(y,{children:[(0,n.jsx)(l.e,{children:(0,n.jsxs)("div",{children:[(0,n.jsx)(g,{color:"var(--privy-color-error)"}),(0,n.jsx)(o.Z,{height:38,width:38,stroke:"var(--privy-color-error)"})]})}),(0,n.jsxs)(j,{children:[(0,n.jsxs)("h3",{children:[function(e){switch(e){case"sms":return"Phone number";case"email":return"Email address";case"siwe":return"Wallet address";case"siws":return"Solana wallet address";case"linkedin":return"LinkedIn profile";case"google":case"apple":case"discord":case"github":case"instagram":case"spotify":case"tiktok":case"line":case"twitch":case"twitter":case"telegram":case"farcaster":return`${(0,f.e)(e.replace("_oauth",""))} profile`;default:return e.startsWith("privy:")?"Cross-app account":e}}(u.method)," is associated with another account"]}),(0,n.jsxs)("p",{children:["Do you want to transfer",(0,n.jsx)("b",{children:u.handle?` ${u.handle}`:""})," to this account instead? This will delete your other account."]}),(0,n.jsx)(W,{onClick:t,disclosedAccount:u.disclosedAccount})]}),(0,n.jsxs)(j,{style:{gap:12,marginTop:12},children:[d?.accountTransfer?.embeddedWalletAddress?(0,n.jsx)(i.P,{onClick:r,children:"Continue"}):(0,n.jsx)(w,{onTransfer:a,transferSuccess:s,isTransferring:c}),(0,n.jsx)(i.S,{onClick:e,children:"No thanks"})]})]}),(0,n.jsx)(i.B,{})]})};function W({disclosedAccount:e,onClick:r}){return e?(0,n.jsxs)(k,{onClick:r,children:[(0,n.jsx)(a.Z,{color:"var(--privy-color-foreground-1)",strokeWidth:2,height:"28px",width:"28px"}),(0,n.jsx)(d.A,{address:e.handle,showCopyIcon:!1}),(0,n.jsx)(v,{width:15,height:15,color:"var(--privy-color-foreground-3)",style:{marginLeft:"auto"}})]}):null}},3382:function(e,r,t){t.d(r,{e:function(){return o}});var n=t(72361);let o=n.zo.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 82px;

  > div {
    position: relative;
  }

  > div > span {
    position: absolute;
    left: -41px;
    top: -41px;
  }

  > div > :last-child {
    position: absolute;
    left: -19px;
    top: -19px;
  }
`},76736:function(e,r,t){t.d(r,{e:function(){return n}});function n(e){return e.charAt(0).toUpperCase()+e.slice(1)}}}]);