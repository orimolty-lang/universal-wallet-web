"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[4325],{4325:function(e,t,o){o.r(t),o.d(t,{W3mAllWalletsView:function(){return tg},W3mConnectingWcBasicView:function(){return eI},W3mDownloadsView:function(){return tv}});var i=o(31133),r=o(19848),n=o(70859),l=o(85613),a=o(45297),s=o(7988),c=o(9362);o(9790);var d=o(32801),h=o(88400),p=o(21028),u=o(14140),b=o(98124),w=o(2723);o(33888);var g=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let m=class extends i.oi{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=p.ConnectorController.state.connectors,this.count=a.ApiController.state.count,this.filteredCount=a.ApiController.state.filteredWallets.length,this.isFetchingRecommendedWallets=a.ApiController.state.isFetchingRecommendedWallets,this.unsubscribe.push(p.ConnectorController.subscribeKey("connectors",e=>this.connectors=e),a.ApiController.subscribeKey("count",e=>this.count=e),a.ApiController.subscribeKey("filteredWallets",e=>this.filteredCount=e.length),a.ApiController.subscribeKey("isFetchingRecommendedWallets",e=>this.isFetchingRecommendedWallets=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){let e=this.connectors.find(e=>"walletConnect"===e.id),{allWallets:t}=l.OptionsController.state;if(!e||"HIDE"===t||"ONLY_MOBILE"===t&&!n.j.isMobile())return null;let o=a.ApiController.state.featured.length,r=this.count+o,s=this.filteredCount>0?this.filteredCount:r<10?r:10*Math.floor(r/10),c=`${s}`;this.filteredCount>0?c=`${this.filteredCount}`:s<r&&(c=`${s}+`);let p=u.ConnectionController.hasAnyConnection(h.b.CONNECTOR_ID.WALLET_CONNECT);return(0,i.dy)`
      <wui-list-wallet
        name="Search Wallet"
        walletIcon="search"
        showAllWallets
        @click=${this.onAllWallets.bind(this)}
        tagLabel=${c}
        tagVariant="info"
        data-testid="all-wallets"
        tabIdx=${(0,d.o)(this.tabIdx)}
        .loading=${this.isFetchingRecommendedWallets}
        ?disabled=${p}
        size="sm"
      ></wui-list-wallet>
    `}onAllWallets(){b.X.sendEvent({type:"track",event:"CLICK_ALL_WALLETS"}),w.RouterController.push("AllWallets",{redirectView:w.RouterController.state.data?.redirectView})}};g([(0,r.Cb)()],m.prototype,"tabIdx",void 0),g([(0,r.SB)()],m.prototype,"connectors",void 0),g([(0,r.SB)()],m.prototype,"count",void 0),g([(0,r.SB)()],m.prototype,"filteredCount",void 0),g([(0,r.SB)()],m.prototype,"isFetchingRecommendedWallets",void 0),m=g([(0,c.Mo)("w3m-all-wallets-widget")],m);var f=o(71731),y=o(9335),v=o(76215),C=o(60109),$=(0,c.iv)`
  :host {
    margin-top: ${({spacing:e})=>e["1"]};
  }
  wui-separator {
    margin: ${({spacing:e})=>e["3"]} calc(${({spacing:e})=>e["3"]} * -1)
      ${({spacing:e})=>e["2"]} calc(${({spacing:e})=>e["3"]} * -1);
    width: calc(100% + ${({spacing:e})=>e["3"]} * 2);
  }
`,x=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let k=class extends i.oi{constructor(){super(),this.unsubscribe=[],this.connectors=p.ConnectorController.state.connectors,this.recommended=a.ApiController.state.recommended,this.featured=a.ApiController.state.featured,this.explorerWallets=a.ApiController.state.explorerWallets,this.connections=u.ConnectionController.state.connections,this.connectorImages=f.W.state.connectorImages,this.loadingTelegram=!1,this.unsubscribe.push(p.ConnectorController.subscribeKey("connectors",e=>this.connectors=e),u.ConnectionController.subscribeKey("connections",e=>this.connections=e),f.W.subscribeKey("connectorImages",e=>this.connectorImages=e),a.ApiController.subscribeKey("recommended",e=>this.recommended=e),a.ApiController.subscribeKey("featured",e=>this.featured=e),a.ApiController.subscribeKey("explorerFilteredWallets",e=>{this.explorerWallets=e?.length?e:a.ApiController.state.explorerWallets}),a.ApiController.subscribeKey("explorerWallets",e=>{this.explorerWallets?.length||(this.explorerWallets=e)})),n.j.isTelegram()&&n.j.isIos()&&(this.loadingTelegram=!u.ConnectionController.state.wcUri,this.unsubscribe.push(u.ConnectionController.subscribeKey("wcUri",e=>this.loadingTelegram=!e)))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return(0,i.dy)`
      <wui-flex flexDirection="column" gap="2"> ${this.connectorListTemplate()} </wui-flex>
    `}mapConnectorsToExplorerWallets(e,t){return e.map(e=>{if("MULTI_CHAIN"===e.type&&e.connectors){let o=e.connectors.map(e=>e.id),i=e.connectors.map(e=>e.name),r=e.connectors.map(e=>e.info?.rdns),n=t?.find(e=>o.includes(e.id)||i.includes(e.name)||e.rdns&&(r.includes(e.rdns)||o.includes(e.rdns)));return e.explorerWallet=n??e.explorerWallet,e}let o=t?.find(t=>t.id===e.id||t.rdns===e.info?.rdns||t.name===e.name);return e.explorerWallet=o??e.explorerWallet,e})}processConnectorsByType(e,t=!0){let o=C.C.sortConnectorsByExplorerWallet([...e]);return t?o.filter(C.C.showConnector):o}connectorListTemplate(){let e=this.mapConnectorsToExplorerWallets(this.connectors,this.explorerWallets??[]),t=C.C.getConnectorsByType(e,this.recommended,this.featured),o=this.processConnectorsByType(t.announced.filter(e=>"walletConnect"!==e.id)),i=this.processConnectorsByType(t.injected),r=this.processConnectorsByType(t.multiChain.filter(e=>"WalletConnect"!==e.name),!1),l=t.custom,a=t.recent,s=this.processConnectorsByType(t.external.filter(e=>e.id!==h.b.CONNECTOR_ID.COINBASE_SDK)),c=t.recommended,d=t.featured,p=C.C.getConnectorTypeOrder({custom:l,recent:a,announced:o,injected:i,multiChain:r,recommended:c,featured:d,external:s}),u=this.connectors.find(e=>"walletConnect"===e.id),b=n.j.isMobile(),w=[];for(let e of p)switch(e){case"walletConnect":!b&&u&&w.push({kind:"connector",subtype:"walletConnect",connector:u});break;case"recent":C.C.getFilteredRecentWallets().forEach(e=>w.push({kind:"wallet",subtype:"recent",wallet:e}));break;case"injected":r.forEach(e=>w.push({kind:"connector",subtype:"multiChain",connector:e})),o.forEach(e=>w.push({kind:"connector",subtype:"announced",connector:e})),i.forEach(e=>w.push({kind:"connector",subtype:"injected",connector:e}));break;case"featured":d.forEach(e=>w.push({kind:"wallet",subtype:"featured",wallet:e}));break;case"custom":C.C.getFilteredCustomWallets(l??[]).forEach(e=>w.push({kind:"wallet",subtype:"custom",wallet:e}));break;case"external":s.forEach(e=>w.push({kind:"connector",subtype:"external",connector:e}));break;case"recommended":C.C.getCappedRecommendedWallets(c).forEach(e=>w.push({kind:"wallet",subtype:"recommended",wallet:e}));break;default:console.warn(`Unknown connector type: ${e}`)}return w.map((e,t)=>"connector"===e.kind?this.renderConnector(e,t):this.renderWallet(e,t))}renderConnector(e,t){let o,r;let n=e.connector,l=y.f.getConnectorImage(n)||this.connectorImages[n?.imageId??""],a=(this.connections.get(n.chain)??[]).some(e=>v.g.isLowerCaseMatch(e.connectorId,n.id));"multiChain"===e.subtype?(o="multichain",r="info"):"walletConnect"===e.subtype?(o="qr code",r="accent"):"injected"===e.subtype||"announced"===e.subtype?(o=a?"connected":"installed",r=a?"info":"success"):(o=void 0,r=void 0);let s=u.ConnectionController.hasAnyConnection(h.b.CONNECTOR_ID.WALLET_CONNECT),c=("walletConnect"===e.subtype||"external"===e.subtype)&&s;return(0,i.dy)`
      <w3m-list-wallet
        displayIndex=${t}
        imageSrc=${(0,d.o)(l)}
        .installed=${!0}
        name=${n.name??"Unknown"}
        .tagVariant=${r}
        tagLabel=${(0,d.o)(o)}
        data-testid=${`wallet-selector-${n.id.toLowerCase()}`}
        size="sm"
        @click=${()=>this.onClickConnector(e)}
        tabIdx=${(0,d.o)(this.tabIdx)}
        ?disabled=${c}
        rdnsId=${(0,d.o)(n.explorerWallet?.rdns||void 0)}
        walletRank=${(0,d.o)(n.explorerWallet?.order)}
      >
      </w3m-list-wallet>
    `}onClickConnector(e){let t=w.RouterController.state.data?.redirectView;if("walletConnect"===e.subtype){p.ConnectorController.setActiveConnector(e.connector),n.j.isMobile()?w.RouterController.push("AllWallets"):w.RouterController.push("ConnectingWalletConnect",{redirectView:t});return}if("multiChain"===e.subtype){p.ConnectorController.setActiveConnector(e.connector),w.RouterController.push("ConnectingMultiChain",{redirectView:t});return}if("injected"===e.subtype){p.ConnectorController.setActiveConnector(e.connector),w.RouterController.push("ConnectingExternal",{connector:e.connector,redirectView:t,wallet:e.connector.explorerWallet});return}if("announced"===e.subtype){if("walletConnect"===e.connector.id){n.j.isMobile()?w.RouterController.push("AllWallets"):w.RouterController.push("ConnectingWalletConnect",{redirectView:t});return}w.RouterController.push("ConnectingExternal",{connector:e.connector,redirectView:t,wallet:e.connector.explorerWallet});return}w.RouterController.push("ConnectingExternal",{connector:e.connector,redirectView:t})}renderWallet(e,t){let o=e.wallet,r=y.f.getWalletImage(o),n=u.ConnectionController.hasAnyConnection(h.b.CONNECTOR_ID.WALLET_CONNECT),l=this.loadingTelegram,a="recent"===e.subtype?"recent":void 0,s="recent"===e.subtype?"info":void 0;return(0,i.dy)`
      <w3m-list-wallet
        displayIndex=${t}
        imageSrc=${(0,d.o)(r)}
        name=${o.name??"Unknown"}
        @click=${()=>this.onClickWallet(e)}
        size="sm"
        data-testid=${`wallet-selector-${o.id}`}
        tabIdx=${(0,d.o)(this.tabIdx)}
        ?loading=${l}
        ?disabled=${n}
        rdnsId=${(0,d.o)(o.rdns||void 0)}
        walletRank=${(0,d.o)(o.order)}
        tagLabel=${(0,d.o)(a)}
        .tagVariant=${s}
      >
      </w3m-list-wallet>
    `}onClickWallet(e){let t=w.RouterController.state.data?.redirectView;if("featured"===e.subtype){p.ConnectorController.selectWalletConnector(e.wallet);return}if("recent"===e.subtype){if(this.loadingTelegram)return;p.ConnectorController.selectWalletConnector(e.wallet);return}if("custom"===e.subtype){if(this.loadingTelegram)return;w.RouterController.push("ConnectingWalletConnect",{wallet:e.wallet,redirectView:t});return}if(this.loadingTelegram)return;let o=p.ConnectorController.getConnector({id:e.wallet.id,rdns:e.wallet.rdns});o?w.RouterController.push("ConnectingExternal",{connector:o,redirectView:t}):w.RouterController.push("ConnectingWalletConnect",{wallet:e.wallet,redirectView:t})}};k.styles=$,x([(0,r.Cb)({type:Number})],k.prototype,"tabIdx",void 0),x([(0,r.SB)()],k.prototype,"connectors",void 0),x([(0,r.SB)()],k.prototype,"recommended",void 0),x([(0,r.SB)()],k.prototype,"featured",void 0),x([(0,r.SB)()],k.prototype,"explorerWallets",void 0),x([(0,r.SB)()],k.prototype,"connections",void 0),x([(0,r.SB)()],k.prototype,"connectorImages",void 0),x([(0,r.SB)()],k.prototype,"loadingTelegram",void 0),k=x([(0,c.Mo)("w3m-connector-list")],k);var R=o(50268),S=o(32008),E=o(51618),T=o(82849),j=o(47365),O=o(11419),P=o(62999),I=o(77813);o(3255),o(99363);var W=o(35536),A=(0,W.iv)`
  :host {
    flex: 1;
    height: 100%;
  }

  button {
    width: 100%;
    height: 100%;
    display: inline-flex;
    align-items: center;
    padding: ${({spacing:e})=>e[1]} ${({spacing:e})=>e[2]};
    column-gap: ${({spacing:e})=>e[1]};
    color: ${({tokens:e})=>e.theme.textSecondary};
    border-radius: ${({borderRadius:e})=>e[20]};
    background-color: transparent;
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color;
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  button[data-active='true'] {
    color: ${({tokens:e})=>e.theme.textPrimary};
    background-color: ${({tokens:e})=>e.theme.foregroundTertiary};
  }

  button:hover:enabled:not([data-active='true']),
  button:active:enabled:not([data-active='true']) {
    wui-text,
    wui-icon {
      color: ${({tokens:e})=>e.theme.textPrimary};
    }
  }
`,B=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let L={lg:"lg-regular",md:"md-regular",sm:"sm-regular"},z={lg:"md",md:"sm",sm:"sm"},_=class extends i.oi{constructor(){super(...arguments),this.icon="mobile",this.size="md",this.label="",this.active=!1}render(){return(0,i.dy)`
      <button data-active=${this.active}>
        ${this.icon?(0,i.dy)`<wui-icon size=${z[this.size]} name=${this.icon}></wui-icon>`:""}
        <wui-text variant=${L[this.size]}> ${this.label} </wui-text>
      </button>
    `}};_.styles=[P.ET,P.ZM,A],B([(0,r.Cb)()],_.prototype,"icon",void 0),B([(0,r.Cb)()],_.prototype,"size",void 0),B([(0,r.Cb)()],_.prototype,"label",void 0),B([(0,r.Cb)({type:Boolean})],_.prototype,"active",void 0),_=B([(0,I.M)("wui-tab-item")],_);var D=(0,W.iv)`
  :host {
    display: inline-flex;
    align-items: center;
    background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    border-radius: ${({borderRadius:e})=>e[32]};
    padding: ${({spacing:e})=>e["01"]};
    box-sizing: border-box;
  }

  :host([data-size='sm']) {
    height: 26px;
  }

  :host([data-size='md']) {
    height: 36px;
  }
`,M=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let N=class extends i.oi{constructor(){super(...arguments),this.tabs=[],this.onTabChange=()=>null,this.size="md",this.activeTab=0}render(){return this.dataset.size=this.size,this.tabs.map((e,t)=>{let o=t===this.activeTab;return(0,i.dy)`
        <wui-tab-item
          @click=${()=>this.onTabClick(t)}
          icon=${e.icon}
          size=${this.size}
          label=${e.label}
          ?active=${o}
          data-active=${o}
          data-testid="tab-${e.label?.toLowerCase()}"
        ></wui-tab-item>
      `})}onTabClick(e){this.activeTab=e,this.onTabChange(e)}};N.styles=[P.ET,P.ZM,D],M([(0,r.Cb)({type:Array})],N.prototype,"tabs",void 0),M([(0,r.Cb)()],N.prototype,"onTabChange",void 0),M([(0,r.Cb)()],N.prototype,"size",void 0),M([(0,r.SB)()],N.prototype,"activeTab",void 0),N=M([(0,I.M)("wui-tabs")],N);var U=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let q=class extends i.oi{constructor(){super(...arguments),this.platformTabs=[],this.unsubscribe=[],this.platforms=[],this.onSelectPlatfrom=void 0}disconnectCallback(){this.unsubscribe.forEach(e=>e())}render(){let e=this.generateTabs();return(0,i.dy)`
      <wui-flex justifyContent="center" .padding=${["0","0","4","0"]}>
        <wui-tabs .tabs=${e} .onTabChange=${this.onTabChange.bind(this)}></wui-tabs>
      </wui-flex>
    `}generateTabs(){let e=this.platforms.map(e=>"browser"===e?{label:"Browser",icon:"extension",platform:"browser"}:"mobile"===e?{label:"Mobile",icon:"mobile",platform:"mobile"}:"qrcode"===e?{label:"Mobile",icon:"mobile",platform:"qrcode"}:"web"===e?{label:"Webapp",icon:"browser",platform:"web"}:"desktop"===e?{label:"Desktop",icon:"desktop",platform:"desktop"}:{label:"Browser",icon:"extension",platform:"unsupported"});return this.platformTabs=e.map(({platform:e})=>e),e}onTabChange(e){let t=this.platformTabs[e];t&&this.onSelectPlatfrom?.(t)}};U([(0,r.Cb)({type:Array})],q.prototype,"platforms",void 0),U([(0,r.Cb)()],q.prototype,"onSelectPlatfrom",void 0),q=U([(0,c.Mo)("w3m-connecting-header")],q);var F=o(94201);o(5551);var H=(0,W.iv)`
  :host {
    width: var(--local-width);
  }

  button {
    width: var(--local-width);
    white-space: nowrap;
    column-gap: ${({spacing:e})=>e[2]};
    transition:
      scale ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-1"]},
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      border-radius ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-1"]};
    will-change: scale, background-color, border-radius;
    cursor: pointer;
  }

  /* -- Sizes --------------------------------------------------- */
  button[data-size='sm'] {
    border-radius: ${({borderRadius:e})=>e[2]};
    padding: 0 ${({spacing:e})=>e[2]};
    height: 28px;
  }

  button[data-size='md'] {
    border-radius: ${({borderRadius:e})=>e[3]};
    padding: 0 ${({spacing:e})=>e[4]};
    height: 38px;
  }

  button[data-size='lg'] {
    border-radius: ${({borderRadius:e})=>e[4]};
    padding: 0 ${({spacing:e})=>e[5]};
    height: 48px;
  }

  /* -- Variants --------------------------------------------------------- */
  button[data-variant='accent-primary'] {
    background-color: ${({tokens:e})=>e.core.backgroundAccentPrimary};
    color: ${({tokens:e})=>e.theme.textInvert};
  }

  button[data-variant='accent-secondary'] {
    background-color: ${({tokens:e})=>e.core.foregroundAccent010};
    color: ${({tokens:e})=>e.core.textAccentPrimary};
  }

  button[data-variant='neutral-primary'] {
    background-color: ${({tokens:e})=>e.theme.backgroundInvert};
    color: ${({tokens:e})=>e.theme.textInvert};
  }

  button[data-variant='neutral-secondary'] {
    background-color: transparent;
    border: 1px solid ${({tokens:e})=>e.theme.borderSecondary};
    color: ${({tokens:e})=>e.theme.textPrimary};
  }

  button[data-variant='neutral-tertiary'] {
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    color: ${({tokens:e})=>e.theme.textPrimary};
  }

  button[data-variant='error-primary'] {
    background-color: ${({tokens:e})=>e.core.textError};
    color: ${({tokens:e})=>e.theme.textInvert};
  }

  button[data-variant='error-secondary'] {
    background-color: ${({tokens:e})=>e.core.backgroundError};
    color: ${({tokens:e})=>e.core.textError};
  }

  button[data-variant='shade'] {
    background: var(--wui-color-gray-glass-002);
    color: var(--wui-color-fg-200);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  /* -- Focus states --------------------------------------------------- */
  button[data-size='sm']:focus-visible:enabled {
    border-radius: 28px;
  }

  button[data-size='md']:focus-visible:enabled {
    border-radius: 38px;
  }

  button[data-size='lg']:focus-visible:enabled {
    border-radius: 48px;
  }
  button[data-variant='shade']:focus-visible:enabled {
    background: var(--wui-color-gray-glass-005);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-gray-glass-010),
      0 0 0 4px var(--wui-color-gray-glass-002);
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  @media (hover: hover) {
    button[data-size='sm']:hover:enabled {
      border-radius: 28px;
    }

    button[data-size='md']:hover:enabled {
      border-radius: 38px;
    }

    button[data-size='lg']:hover:enabled {
      border-radius: 48px;
    }

    button[data-variant='shade']:hover:enabled {
      background: var(--wui-color-gray-glass-002);
    }

    button[data-variant='shade']:active:enabled {
      background: var(--wui-color-gray-glass-005);
    }
  }

  button[data-size='sm']:active:enabled {
    border-radius: 28px;
  }

  button[data-size='md']:active:enabled {
    border-radius: 38px;
  }

  button[data-size='lg']:active:enabled {
    border-radius: 48px;
  }

  /* -- Disabled states --------------------------------------------------- */
  button:disabled {
    opacity: 0.3;
  }
`,V=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let K={lg:"lg-regular-mono",md:"md-regular-mono",sm:"sm-regular-mono"},X={lg:"md",md:"md",sm:"sm"},G=class extends i.oi{constructor(){super(...arguments),this.size="lg",this.disabled=!1,this.fullWidth=!1,this.loading=!1,this.variant="accent-primary"}render(){this.style.cssText=`
    --local-width: ${this.fullWidth?"100%":"auto"};
     `;let e=this.textVariant??K[this.size];return(0,i.dy)`
      <button data-variant=${this.variant} data-size=${this.size} ?disabled=${this.disabled}>
        ${this.loadingTemplate()}
        <slot name="iconLeft"></slot>
        <wui-text variant=${e} color="inherit">
          <slot></slot>
        </wui-text>
        <slot name="iconRight"></slot>
      </button>
    `}loadingTemplate(){if(this.loading){let e=X[this.size],t="neutral-primary"===this.variant||"accent-primary"===this.variant?"invert":"primary";return(0,i.dy)`<wui-loading-spinner color=${t} size=${e}></wui-loading-spinner>`}return null}};G.styles=[P.ET,P.ZM,H],V([(0,r.Cb)()],G.prototype,"size",void 0),V([(0,r.Cb)({type:Boolean})],G.prototype,"disabled",void 0),V([(0,r.Cb)({type:Boolean})],G.prototype,"fullWidth",void 0),V([(0,r.Cb)({type:Boolean})],G.prototype,"loading",void 0),V([(0,r.Cb)()],G.prototype,"variant",void 0),V([(0,r.Cb)()],G.prototype,"textVariant",void 0),G=V([(0,I.M)("wui-button")],G),o(42479),o(93461),o(57196);var Q=(0,W.iv)`
  :host {
    display: block;
    width: 100px;
    height: 100px;
  }

  svg {
    width: 100px;
    height: 100px;
  }

  rect {
    fill: none;
    stroke: ${e=>e.colors.accent100};
    stroke-width: 3px;
    stroke-linecap: round;
    animation: dash 1s linear infinite;
  }

  @keyframes dash {
    to {
      stroke-dashoffset: 0px;
    }
  }
`,Y=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let Z=class extends i.oi{constructor(){super(...arguments),this.radius=36}render(){return this.svgLoaderTemplate()}svgLoaderTemplate(){let e=this.radius>50?50:this.radius,t=36-e;return(0,i.dy)`
      <svg viewBox="0 0 110 110" width="110" height="110">
        <rect
          x="2"
          y="2"
          width="106"
          height="106"
          rx=${e}
          stroke-dasharray="${116+t} ${245+t}"
          stroke-dashoffset=${360+1.75*t}
        />
      </svg>
    `}};Z.styles=[P.ET,Q],Y([(0,r.Cb)({type:Number})],Z.prototype,"radius",void 0),Z=Y([(0,I.M)("wui-loading-thumbnail")],Z),o(43078),o(49072),o(5321);var J=(0,W.iv)`
  wui-flex {
    width: 100%;
    height: 52px;
    box-sizing: border-box;
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: ${({borderRadius:e})=>e[5]};
    padding-left: ${({spacing:e})=>e[3]};
    padding-right: ${({spacing:e})=>e[3]};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({spacing:e})=>e[6]};
  }

  wui-text {
    color: ${({tokens:e})=>e.theme.textSecondary};
  }

  wui-icon {
    width: 12px;
    height: 12px;
  }
`,ee=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let et=class extends i.oi{constructor(){super(...arguments),this.disabled=!1,this.label="",this.buttonLabel=""}render(){return(0,i.dy)`
      <wui-flex justifyContent="space-between" alignItems="center">
        <wui-text variant="lg-regular" color="inherit">${this.label}</wui-text>
        <wui-button variant="accent-secondary" size="sm">
          ${this.buttonLabel}
          <wui-icon name="chevronRight" color="inherit" size="inherit" slot="iconRight"></wui-icon>
        </wui-button>
      </wui-flex>
    `}};et.styles=[P.ET,P.ZM,J],ee([(0,r.Cb)({type:Boolean})],et.prototype,"disabled",void 0),ee([(0,r.Cb)()],et.prototype,"label",void 0),ee([(0,r.Cb)()],et.prototype,"buttonLabel",void 0),et=ee([(0,I.M)("wui-cta-button")],et);var eo=(0,c.iv)`
  :host {
    display: block;
    padding: 0 ${({spacing:e})=>e["5"]} ${({spacing:e})=>e["5"]};
  }
`,ei=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let er=class extends i.oi{constructor(){super(...arguments),this.wallet=void 0}render(){if(!this.wallet)return this.style.display="none",null;let{name:e,app_store:t,play_store:o,chrome_store:r,homepage:l}=this.wallet,a=n.j.isMobile(),s=n.j.isIos(),d=n.j.isAndroid(),h=[t,o,l,r].filter(Boolean).length>1,p=c.Hg.getTruncateString({string:e,charsStart:12,charsEnd:0,truncate:"end"});return h&&!a?(0,i.dy)`
        <wui-cta-button
          label=${`Don't have ${p}?`}
          buttonLabel="Get"
          @click=${()=>w.RouterController.push("Downloads",{wallet:this.wallet})}
        ></wui-cta-button>
      `:!h&&l?(0,i.dy)`
        <wui-cta-button
          label=${`Don't have ${p}?`}
          buttonLabel="Get"
          @click=${this.onHomePage.bind(this)}
        ></wui-cta-button>
      `:t&&s?(0,i.dy)`
        <wui-cta-button
          label=${`Don't have ${p}?`}
          buttonLabel="Get"
          @click=${this.onAppStore.bind(this)}
        ></wui-cta-button>
      `:o&&d?(0,i.dy)`
        <wui-cta-button
          label=${`Don't have ${p}?`}
          buttonLabel="Get"
          @click=${this.onPlayStore.bind(this)}
        ></wui-cta-button>
      `:(this.style.display="none",null)}onAppStore(){this.wallet?.app_store&&n.j.openHref(this.wallet.app_store,"_blank")}onPlayStore(){this.wallet?.play_store&&n.j.openHref(this.wallet.play_store,"_blank")}onHomePage(){this.wallet?.homepage&&n.j.openHref(this.wallet.homepage,"_blank")}};er.styles=[eo],ei([(0,r.Cb)({type:Object})],er.prototype,"wallet",void 0),er=ei([(0,c.Mo)("w3m-mobile-download-links")],er);var en=(0,c.iv)`
  @keyframes shake {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(3px);
    }
    50% {
      transform: translateX(-3px);
    }
    75% {
      transform: translateX(3px);
    }
    100% {
      transform: translateX(0);
    }
  }

  wui-flex:first-child:not(:only-child) {
    position: relative;
  }

  wui-wallet-image {
    width: 56px;
    height: 56px;
  }

  wui-loading-thumbnail {
    position: absolute;
  }

  wui-icon-box {
    position: absolute;
    right: calc(${({spacing:e})=>e["1"]} * -1);
    bottom: calc(${({spacing:e})=>e["1"]} * -1);
    opacity: 0;
    transform: scale(0.5);
    transition-property: opacity, transform;
    transition-duration: ${({durations:e})=>e.lg};
    transition-timing-function: ${({easings:e})=>e["ease-out-power-2"]};
    will-change: opacity, transform;
  }

  wui-text[align='center'] {
    width: 100%;
    padding: 0px ${({spacing:e})=>e["4"]};
  }

  [data-error='true'] wui-icon-box {
    opacity: 1;
    transform: scale(1);
  }

  [data-error='true'] > wui-flex:first-child {
    animation: shake 250ms ${({easings:e})=>e["ease-out-power-2"]} both;
  }

  [data-retry='false'] wui-link {
    display: none;
  }

  [data-retry='true'] wui-link {
    display: block;
    opacity: 1;
  }

  w3m-mobile-download-links {
    padding: 0px;
    width: 100%;
  }
`,el=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};class ea extends i.oi{constructor(){super(),this.wallet=w.RouterController.state.data?.wallet,this.connector=w.RouterController.state.data?.connector,this.timeout=void 0,this.secondaryBtnIcon="refresh",this.onConnect=void 0,this.onRender=void 0,this.onAutoConnect=void 0,this.isWalletConnect=!0,this.unsubscribe=[],this.imageSrc=y.f.getConnectorImage(this.connector)??y.f.getWalletImage(this.wallet),this.name=this.wallet?.name??this.connector?.name??"Wallet",this.isRetrying=!1,this.uri=u.ConnectionController.state.wcUri,this.error=u.ConnectionController.state.wcError,this.ready=!1,this.showRetry=!1,this.label=void 0,this.secondaryBtnLabel="Try again",this.secondaryLabel="Accept connection request in the wallet",this.isLoading=!1,this.isMobile=!1,this.onRetry=void 0,this.unsubscribe.push(u.ConnectionController.subscribeKey("wcUri",e=>{this.uri=e,this.isRetrying&&this.onRetry&&(this.isRetrying=!1,this.onConnect?.())}),u.ConnectionController.subscribeKey("wcError",e=>this.error=e)),(n.j.isTelegram()||n.j.isSafari())&&n.j.isIos()&&u.ConnectionController.state.wcUri&&this.onConnect?.()}firstUpdated(){this.onAutoConnect?.(),this.showRetry=!this.onAutoConnect}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),u.ConnectionController.setWcError(!1),clearTimeout(this.timeout)}render(){this.onRender?.(),this.onShowRetry();let e=this.error?"Connection can be declined if a previous request is still active":this.secondaryLabel,t="";return this.label?t=this.label:(t=`Continue in ${this.name}`,this.error&&(t="Connection declined")),(0,i.dy)`
      <wui-flex
        data-error=${(0,d.o)(this.error)}
        data-retry=${this.showRetry}
        flexDirection="column"
        alignItems="center"
        .padding=${["10","5","5","5"]}
        gap="6"
      >
        <wui-flex gap="2" justifyContent="center" alignItems="center">
          <wui-wallet-image size="lg" imageSrc=${(0,d.o)(this.imageSrc)}></wui-wallet-image>

          ${this.error?null:this.loaderTemplate()}

          <wui-icon-box
            color="error"
            icon="close"
            size="sm"
            border
            borderColor="wui-color-bg-125"
          ></wui-icon-box>
        </wui-flex>

        <wui-flex flexDirection="column" alignItems="center" gap="6"> <wui-flex
          flexDirection="column"
          alignItems="center"
          gap="2"
          .padding=${["2","0","0","0"]}
        >
          <wui-text align="center" variant="lg-medium" color=${this.error?"error":"primary"}>
            ${t}
          </wui-text>
          <wui-text align="center" variant="lg-regular" color="secondary">${e}</wui-text>
        </wui-flex>

        ${this.secondaryBtnLabel?(0,i.dy)`
                <wui-button
                  variant="neutral-secondary"
                  size="md"
                  ?disabled=${this.isRetrying||this.isLoading}
                  @click=${this.onTryAgain.bind(this)}
                  data-testid="w3m-connecting-widget-secondary-button"
                >
                  <wui-icon
                    color="inherit"
                    slot="iconLeft"
                    name=${this.secondaryBtnIcon}
                  ></wui-icon>
                  ${this.secondaryBtnLabel}
                </wui-button>
              `:null}
      </wui-flex>

      ${this.isWalletConnect?(0,i.dy)`
              <wui-flex .padding=${["0","5","5","5"]} justifyContent="center">
                <wui-link
                  @click=${this.onCopyUri}
                  variant="secondary"
                  icon="copy"
                  data-testid="wui-link-copy"
                >
                  Copy link
                </wui-link>
              </wui-flex>
            `:null}

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links></wui-flex>
      </wui-flex>
    `}onShowRetry(){if(this.error&&!this.showRetry){this.showRetry=!0;let e=this.shadowRoot?.querySelector("wui-button");e?.animate([{opacity:0},{opacity:1}],{fill:"forwards",easing:"ease"})}}onTryAgain(){u.ConnectionController.setWcError(!1),this.onRetry?(this.isRetrying=!0,this.onRetry?.()):this.onConnect?.()}loaderTemplate(){let e=F.ThemeController.state.themeVariables["--w3m-border-radius-master"],t=e?parseInt(e.replace("px",""),10):4;return(0,i.dy)`<wui-loading-thumbnail radius=${9*t}></wui-loading-thumbnail>`}onCopyUri(){try{this.uri&&(n.j.copyToClopboard(this.uri),E.SnackController.showSuccess("Link copied"))}catch{E.SnackController.showError("Failed to copy")}}}ea.styles=en,el([(0,r.SB)()],ea.prototype,"isRetrying",void 0),el([(0,r.SB)()],ea.prototype,"uri",void 0),el([(0,r.SB)()],ea.prototype,"error",void 0),el([(0,r.SB)()],ea.prototype,"ready",void 0),el([(0,r.SB)()],ea.prototype,"showRetry",void 0),el([(0,r.SB)()],ea.prototype,"label",void 0),el([(0,r.SB)()],ea.prototype,"secondaryBtnLabel",void 0),el([(0,r.SB)()],ea.prototype,"secondaryLabel",void 0),el([(0,r.SB)()],ea.prototype,"isLoading",void 0),el([(0,r.Cb)({type:Boolean})],ea.prototype,"isMobile",void 0),el([(0,r.Cb)()],ea.prototype,"onRetry",void 0);let es=class extends ea{constructor(){if(super(),!this.wallet)throw Error("w3m-connecting-wc-browser: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onAutoConnect=this.onConnectProxy.bind(this),b.X.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser",displayIndex:this.wallet?.display_index,walletRank:this.wallet.order,view:w.RouterController.state.view}})}async onConnectProxy(){try{this.error=!1;let{connectors:e}=p.ConnectorController.state,t=e.find(e=>"ANNOUNCED"===e.type&&e.info?.rdns===this.wallet?.rdns||"INJECTED"===e.type||e.name===this.wallet?.name);if(t)await u.ConnectionController.connectExternal(t,t.chain);else throw Error("w3m-connecting-wc-browser: No connector found");T.I.close(),b.X.sendEvent({type:"track",event:"CONNECT_SUCCESS",properties:{method:"browser",name:this.wallet?.name||"Unknown",view:w.RouterController.state.view,walletRank:this.wallet?.order}})}catch(e){e instanceof j.g&&e.originalName===R.jD.PROVIDER_RPC_ERROR_NAME.USER_REJECTED_REQUEST?b.X.sendEvent({type:"track",event:"USER_REJECTED",properties:{message:e.message}}):b.X.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:e?.message??"Unknown"}}),this.error=!0}}};es=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l}([(0,c.Mo)("w3m-connecting-wc-browser")],es);let ec=class extends ea{constructor(){if(super(),!this.wallet)throw Error("w3m-connecting-wc-desktop: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onRender=this.onRenderProxy.bind(this),b.X.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"desktop",displayIndex:this.wallet?.display_index,walletRank:this.wallet.order,view:w.RouterController.state.view}})}onRenderProxy(){!this.ready&&this.uri&&(this.ready=!0,this.onConnect?.())}onConnectProxy(){if(this.wallet?.desktop_link&&this.uri)try{this.error=!1;let{desktop_link:e,name:t}=this.wallet,{redirect:o,href:i}=n.j.formatNativeUrl(e,this.uri);u.ConnectionController.setWcLinking({name:t,href:i}),u.ConnectionController.setRecentWallet(this.wallet),n.j.openHref(o,"_blank")}catch{this.error=!0}}};ec=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l}([(0,c.Mo)("w3m-connecting-wc-desktop")],ec);var ed=o(40118),eh=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let ep=class extends ea{constructor(){if(super(),this.btnLabelTimeout=void 0,this.redirectDeeplink=void 0,this.redirectUniversalLink=void 0,this.target=void 0,this.preferUniversalLinks=l.OptionsController.state.experimental_preferUniversalLinks,this.isLoading=!0,this.onConnect=()=>{if(this.wallet?.mobile_link&&this.uri)try{this.error=!1;let{mobile_link:e,link_mode:t,name:o}=this.wallet,{redirect:i,redirectUniversalLink:r,href:l}=n.j.formatNativeUrl(e,this.uri,t);this.redirectDeeplink=i,this.redirectUniversalLink=r,this.target=n.j.isIframe()?"_top":"_self",u.ConnectionController.setWcLinking({name:o,href:l}),u.ConnectionController.setRecentWallet(this.wallet),this.preferUniversalLinks&&this.redirectUniversalLink?n.j.openHref(this.redirectUniversalLink,this.target):n.j.openHref(this.redirectDeeplink,this.target)}catch(e){b.X.sendEvent({type:"track",event:"CONNECT_PROXY_ERROR",properties:{message:e instanceof Error?e.message:"Error parsing the deeplink",uri:this.uri,mobile_link:this.wallet.mobile_link,name:this.wallet.name}}),this.error=!0}},!this.wallet)throw Error("w3m-connecting-wc-mobile: No wallet provided");this.secondaryBtnLabel="Open",this.secondaryLabel=ed.bq.CONNECT_LABELS.MOBILE,this.secondaryBtnIcon="externalLink",this.onHandleURI(),this.unsubscribe.push(u.ConnectionController.subscribeKey("wcUri",()=>{this.onHandleURI()})),b.X.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"mobile",displayIndex:this.wallet?.display_index,walletRank:this.wallet.order,view:w.RouterController.state.view}})}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this.btnLabelTimeout)}onHandleURI(){this.isLoading=!this.uri,!this.ready&&this.uri&&(this.ready=!0,this.onConnect?.())}onTryAgain(){u.ConnectionController.setWcError(!1),this.onConnect?.()}};eh([(0,r.SB)()],ep.prototype,"redirectDeeplink",void 0),eh([(0,r.SB)()],ep.prototype,"redirectUniversalLink",void 0),eh([(0,r.SB)()],ep.prototype,"target",void 0),eh([(0,r.SB)()],ep.prototype,"preferUniversalLinks",void 0),eh([(0,r.SB)()],ep.prototype,"isLoading",void 0),ep=eh([(0,c.Mo)("w3m-connecting-wc-mobile")],ep),o(41338);var eu=o(67421);function eb(e,t,o){return e!==t&&(e-t<0?t-e:e-t)<=o+.1}let ew={generate({uri:e,size:t,logoSize:o,padding:r=8,dotColor:n="var(--apkt-colors-black)"}){let l=[],a=function(e,t){let o=Array.prototype.slice.call(eu.create(e,{errorCorrectionLevel:"Q"}).modules.data,0),i=Math.sqrt(o.length);return o.reduce((e,t,o)=>(o%i==0?e.push([t]):e[e.length-1].push(t))&&e,[])}(e,0),s=(t-2*r)/a.length,c=[{x:0,y:0},{x:1,y:0},{x:0,y:1}];c.forEach(({x:e,y:t})=>{let o=(a.length-7)*s*e+r,d=(a.length-7)*s*t+r;for(let e=0;e<c.length;e+=1){let t=s*(7-2*e);l.push((0,i.YP)`
            <rect
              fill=${2===e?"var(--apkt-colors-black)":"var(--apkt-colors-white)"}
              width=${0===e?t-10:t}
              rx= ${0===e?(t-10)*.45:.45*t}
              ry= ${0===e?(t-10)*.45:.45*t}
              stroke=${n}
              stroke-width=${0===e?10:0}
              height=${0===e?t-10:t}
              x= ${0===e?d+s*e+5:d+s*e}
              y= ${0===e?o+s*e+5:o+s*e}
            />
          `)}});let d=Math.floor((o+25)/s),h=a.length/2-d/2,p=a.length/2+d/2-1,u=[];a.forEach((e,t)=>{e.forEach((e,o)=>{!a[t][o]||t<7&&o<7||t>a.length-8&&o<7||t<7&&o>a.length-8||t>h&&t<p&&o>h&&o<p||u.push([t*s+s/2+r,o*s+s/2+r])})});let b={};return u.forEach(([e,t])=>{b[e]?b[e]?.push(t):b[e]=[t]}),Object.entries(b).map(([e,t])=>{let o=t.filter(e=>t.every(t=>!eb(e,t,s)));return[Number(e),o]}).forEach(([e,t])=>{t.forEach(t=>{l.push((0,i.YP)`<circle cx=${e} cy=${t} fill=${n} r=${s/2.5} />`)})}),Object.entries(b).filter(([e,t])=>t.length>1).map(([e,t])=>{let o=t.filter(e=>t.some(t=>eb(e,t,s)));return[Number(e),o]}).map(([e,t])=>{t.sort((e,t)=>e<t?-1:1);let o=[];for(let e of t){let t=o.find(t=>t.some(t=>eb(e,t,s)));t?t.push(e):o.push([e])}return[e,o.map(e=>[e[0],e[e.length-1]])]}).forEach(([e,t])=>{t.forEach(([t,o])=>{l.push((0,i.YP)`
              <line
                x1=${e}
                x2=${e}
                y1=${t}
                y2=${o}
                stroke=${n}
                stroke-width=${s/1.25}
                stroke-linecap="round"
              />
            `)})}),l}};var eg=(0,W.iv)`
  :host {
    position: relative;
    user-select: none;
    display: block;
    overflow: hidden;
    aspect-ratio: 1 / 1;
    width: 100%;
    height: 100%;
    background-color: ${({colors:e})=>e.white};
    border: 1px solid ${({tokens:e})=>e.theme.borderPrimary};
  }

  :host {
    border-radius: ${({borderRadius:e})=>e[4]};
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :host([data-clear='true']) > wui-icon {
    display: none;
  }

  svg:first-child,
  wui-image,
  wui-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateY(-50%) translateX(-50%);
    background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
    box-shadow: inset 0 0 0 4px ${({tokens:e})=>e.theme.backgroundPrimary};
    border-radius: ${({borderRadius:e})=>e[6]};
  }

  wui-image {
    width: 25%;
    height: 25%;
    border-radius: ${({borderRadius:e})=>e[2]};
  }

  wui-icon {
    width: 100%;
    height: 100%;
    color: #3396ff !important;
    transform: translateY(-50%) translateX(-50%) scale(0.25);
  }

  wui-icon > svg {
    width: inherit;
    height: inherit;
  }
`,em=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let ef=class extends i.oi{constructor(){super(...arguments),this.uri="",this.size=0,this.theme="dark",this.imageSrc=void 0,this.alt=void 0,this.arenaClear=void 0,this.farcaster=void 0}render(){return this.dataset.theme=this.theme,this.dataset.clear=String(this.arenaClear),this.style.cssText=`--local-size: ${this.size}px`,(0,i.dy)`<wui-flex
      alignItems="center"
      justifyContent="center"
      class="wui-qr-code"
      direction="column"
      gap="4"
      width="100%"
      style="height: 100%"
    >
      ${this.templateVisual()} ${this.templateSvg()}
    </wui-flex>`}templateSvg(){return(0,i.YP)`
      <svg height=${this.size} width=${this.size}>
        ${ew.generate({uri:this.uri,size:this.size,logoSize:this.arenaClear?0:this.size/4})}
      </svg>
    `}templateVisual(){return this.imageSrc?(0,i.dy)`<wui-image src=${this.imageSrc} alt=${this.alt??"logo"}></wui-image>`:this.farcaster?(0,i.dy)`<wui-icon
        class="farcaster"
        size="inherit"
        color="inherit"
        name="farcaster"
      ></wui-icon>`:(0,i.dy)`<wui-icon size="inherit" color="inherit" name="walletConnect"></wui-icon>`}};ef.styles=[P.ET,eg],em([(0,r.Cb)()],ef.prototype,"uri",void 0),em([(0,r.Cb)({type:Number})],ef.prototype,"size",void 0),em([(0,r.Cb)()],ef.prototype,"theme",void 0),em([(0,r.Cb)()],ef.prototype,"imageSrc",void 0),em([(0,r.Cb)()],ef.prototype,"alt",void 0),em([(0,r.Cb)({type:Boolean})],ef.prototype,"arenaClear",void 0),em([(0,r.Cb)({type:Boolean})],ef.prototype,"farcaster",void 0),ef=em([(0,I.M)("wui-qr-code")],ef);var ey=(0,W.iv)`
  :host {
    display: block;
    background: linear-gradient(
      90deg,
      ${({tokens:e})=>e.theme.foregroundSecondary} 0%,
      ${({tokens:e})=>e.theme.foregroundTertiary} 50%,
      ${({tokens:e})=>e.theme.foregroundSecondary} 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1s ease-in-out infinite;
    border-radius: ${({borderRadius:e})=>e[2]};
  }

  :host([data-rounded='true']) {
    border-radius: ${({borderRadius:e})=>e[16]};
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`,ev=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let eC=class extends i.oi{constructor(){super(...arguments),this.width="",this.height="",this.variant="default",this.rounded=!1}render(){return this.style.cssText=`
      width: ${this.width};
      height: ${this.height};
    `,this.dataset.rounded=this.rounded?"true":"false",(0,i.dy)`<slot></slot>`}};eC.styles=[ey],ev([(0,r.Cb)()],eC.prototype,"width",void 0),ev([(0,r.Cb)()],eC.prototype,"height",void 0),ev([(0,r.Cb)()],eC.prototype,"variant",void 0),ev([(0,r.Cb)({type:Boolean})],eC.prototype,"rounded",void 0),eC=ev([(0,I.M)("wui-shimmer")],eC),o(86534);var e$=(0,c.iv)`
  wui-shimmer {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: ${({borderRadius:e})=>e[4]};
  }

  wui-qr-code {
    opacity: 0;
    animation-duration: ${({durations:e})=>e.xl};
    animation-timing-function: ${({easings:e})=>e["ease-out-power-2"]};
    animation-name: fade-in;
    animation-fill-mode: forwards;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`,ex=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let ek=class extends ea{constructor(){super(),this.basic=!1,this.forceUpdate=()=>{this.requestUpdate()},window.addEventListener("resize",this.forceUpdate)}firstUpdated(){this.basic||b.X.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet?.name??"WalletConnect",platform:"qrcode",displayIndex:this.wallet?.display_index,walletRank:this.wallet?.order,view:w.RouterController.state.view}})}disconnectedCallback(){super.disconnectedCallback(),this.unsubscribe?.forEach(e=>e()),window.removeEventListener("resize",this.forceUpdate)}render(){return this.onRenderProxy(),(0,i.dy)`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["0","5","5","5"]}
        gap="5"
      >
        <wui-shimmer width="100%"> ${this.qrCodeTemplate()} </wui-shimmer>
        <wui-text variant="lg-medium" color="primary"> Scan this QR Code with your phone </wui-text>
        ${this.copyTemplate()}
      </wui-flex>
      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}onRenderProxy(){!this.ready&&this.uri&&(this.timeout=setTimeout(()=>{this.ready=!0},200))}qrCodeTemplate(){if(!this.uri||!this.ready)return null;let e=this.getBoundingClientRect().width-40,t=this.wallet?this.wallet.name:void 0;u.ConnectionController.setWcLinking(void 0),u.ConnectionController.setRecentWallet(this.wallet);let o=this.uri;if(this.wallet?.mobile_link){let{redirect:e}=n.j.formatNativeUrl(this.wallet?.mobile_link,this.uri,null);o=e}return(0,i.dy)` <wui-qr-code
      size=${e}
      theme=${F.ThemeController.state.themeMode}
      uri=${o}
      imageSrc=${(0,d.o)(y.f.getWalletImage(this.wallet))}
      color=${(0,d.o)(F.ThemeController.state.themeVariables["--w3m-qr-color"])}
      alt=${(0,d.o)(t)}
      data-testid="wui-qr-code"
    ></wui-qr-code>`}copyTemplate(){let e=!this.uri||!this.ready;return(0,i.dy)`<wui-button
      .disabled=${e}
      @click=${this.onCopyUri}
      variant="neutral-secondary"
      size="sm"
      data-testid="copy-wc2-uri"
    >
      Copy link
      <wui-icon size="sm" color="inherit" name="copy" slot="iconRight"></wui-icon>
    </wui-button>`}};ek.styles=e$,ex([(0,r.Cb)({type:Boolean})],ek.prototype,"basic",void 0),ek=ex([(0,c.Mo)("w3m-connecting-wc-qrcode")],ek);let eR=class extends i.oi{constructor(){if(super(),this.wallet=w.RouterController.state.data?.wallet,!this.wallet)throw Error("w3m-connecting-wc-unsupported: No wallet provided");b.X.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser",displayIndex:this.wallet?.display_index,walletRank:this.wallet?.order,view:w.RouterController.state.view}})}render(){return(0,i.dy)`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["10","5","5","5"]}
        gap="5"
      >
        <wui-wallet-image
          size="lg"
          imageSrc=${(0,d.o)(y.f.getWalletImage(this.wallet))}
        ></wui-wallet-image>

        <wui-text variant="md-regular" color="primary">Not Detected</wui-text>
      </wui-flex>

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}};eR=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l}([(0,c.Mo)("w3m-connecting-wc-unsupported")],eR);var eS=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let eE=class extends ea{constructor(){if(super(),this.isLoading=!0,!this.wallet)throw Error("w3m-connecting-wc-web: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.secondaryBtnLabel="Open",this.secondaryLabel=ed.bq.CONNECT_LABELS.MOBILE,this.secondaryBtnIcon="externalLink",this.updateLoadingState(),this.unsubscribe.push(u.ConnectionController.subscribeKey("wcUri",()=>{this.updateLoadingState()})),b.X.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"web",displayIndex:this.wallet?.display_index,walletRank:this.wallet?.order,view:w.RouterController.state.view}})}updateLoadingState(){this.isLoading=!this.uri}onConnectProxy(){if(this.wallet?.webapp_link&&this.uri)try{this.error=!1;let{webapp_link:e,name:t}=this.wallet,{redirect:o,href:i}=n.j.formatUniversalUrl(e,this.uri);u.ConnectionController.setWcLinking({name:t,href:i}),u.ConnectionController.setRecentWallet(this.wallet),n.j.openHref(o,"_blank")}catch{this.error=!0}}};eS([(0,r.SB)()],eE.prototype,"isLoading",void 0),eE=eS([(0,c.Mo)("w3m-connecting-wc-web")],eE);var eT=(0,c.iv)`
  :host([data-mobile-fullscreen='true']) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  :host([data-mobile-fullscreen='true']) wui-ux-by-reown {
    margin-top: auto;
  }
`,ej=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let eO=class extends i.oi{constructor(){super(),this.wallet=w.RouterController.state.data?.wallet,this.unsubscribe=[],this.platform=void 0,this.platforms=[],this.isSiwxEnabled=!!l.OptionsController.state.siwx,this.remoteFeatures=l.OptionsController.state.remoteFeatures,this.displayBranding=!0,this.basic=!1,this.determinePlatforms(),this.initializeConnection(),this.unsubscribe.push(l.OptionsController.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return l.OptionsController.state.enableMobileFullScreen&&this.setAttribute("data-mobile-fullscreen","true"),(0,i.dy)`
      ${this.headerTemplate()}
      <div class="platform-container">${this.platformTemplate()}</div>
      ${this.reownBrandingTemplate()}
    `}reownBrandingTemplate(){return this.remoteFeatures?.reownBranding&&this.displayBranding?(0,i.dy)`<wui-ux-by-reown></wui-ux-by-reown>`:null}async initializeConnection(e=!1){if("browser"!==this.platform&&(!l.OptionsController.state.manualWCControl||e))try{let{wcPairingExpiry:t,status:o}=u.ConnectionController.state,{redirectView:i}=w.RouterController.state.data??{};if(e||l.OptionsController.state.enableEmbedded||n.j.isPairingExpired(t)||"connecting"===o){let e=u.ConnectionController.getConnections(S.R.state.activeChain),t=this.remoteFeatures?.multiWallet,o=e.length>0;await u.ConnectionController.connectWalletConnect({cache:"never"}),this.isSiwxEnabled||(o&&t?(w.RouterController.replace("ProfileWallets"),E.SnackController.showSuccess("New Wallet Added")):i?w.RouterController.replace(i):T.I.close())}}catch(e){if(e instanceof Error&&e.message.includes("An error occurred when attempting to switch chain")&&!l.OptionsController.state.enableNetworkSwitch&&S.R.state.activeChain){S.R.setActiveCaipNetwork(O.f.getUnsupportedNetwork(`${S.R.state.activeChain}:${S.R.state.activeCaipNetwork?.id}`)),S.R.showUnsupportedChainUI();return}e instanceof j.g&&e.originalName===R.jD.PROVIDER_RPC_ERROR_NAME.USER_REJECTED_REQUEST?b.X.sendEvent({type:"track",event:"USER_REJECTED",properties:{message:e.message}}):b.X.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:e?.message??"Unknown"}}),u.ConnectionController.setWcError(!0),E.SnackController.showError(e.message??"Connection error"),u.ConnectionController.resetWcConnection(),w.RouterController.goBack()}}determinePlatforms(){if(!this.wallet){this.platforms.push("qrcode"),this.platform="qrcode";return}if(this.platform)return;let{mobile_link:e,desktop_link:t,webapp_link:o,injected:i,rdns:r}=this.wallet,a=i?.map(({injected_id:e})=>e).filter(Boolean),s=[...r?[r]:a??[]],c=!l.OptionsController.state.isUniversalProvider&&s.length,d=u.ConnectionController.checkInstalled(s),h=c&&d,p=t&&!n.j.isMobile();h&&!S.R.state.noAdapters&&this.platforms.push("browser"),e&&this.platforms.push(n.j.isMobile()?"mobile":"qrcode"),o&&this.platforms.push("web"),p&&this.platforms.push("desktop"),h||!c||S.R.state.noAdapters||this.platforms.push("unsupported"),this.platform=this.platforms[0]}platformTemplate(){switch(this.platform){case"browser":return(0,i.dy)`<w3m-connecting-wc-browser></w3m-connecting-wc-browser>`;case"web":return(0,i.dy)`<w3m-connecting-wc-web></w3m-connecting-wc-web>`;case"desktop":return(0,i.dy)`
          <w3m-connecting-wc-desktop .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-desktop>
        `;case"mobile":return(0,i.dy)`
          <w3m-connecting-wc-mobile isMobile .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-mobile>
        `;case"qrcode":return(0,i.dy)`<w3m-connecting-wc-qrcode ?basic=${this.basic}></w3m-connecting-wc-qrcode>`;default:return(0,i.dy)`<w3m-connecting-wc-unsupported></w3m-connecting-wc-unsupported>`}}headerTemplate(){return this.platforms.length>1?(0,i.dy)`
      <w3m-connecting-header
        .platforms=${this.platforms}
        .onSelectPlatfrom=${this.onSelectPlatform.bind(this)}
      >
      </w3m-connecting-header>
    `:null}async onSelectPlatform(e){let t=this.shadowRoot?.querySelector("div");t&&(await t.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.platform=e,t.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}};eO.styles=eT,ej([(0,r.SB)()],eO.prototype,"platform",void 0),ej([(0,r.SB)()],eO.prototype,"platforms",void 0),ej([(0,r.SB)()],eO.prototype,"isSiwxEnabled",void 0),ej([(0,r.SB)()],eO.prototype,"remoteFeatures",void 0),ej([(0,r.Cb)({type:Boolean})],eO.prototype,"displayBranding",void 0),ej([(0,r.Cb)({type:Boolean})],eO.prototype,"basic",void 0),eO=ej([(0,c.Mo)("w3m-connecting-wc-view")],eO);var eP=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let eI=class extends i.oi{constructor(){super(),this.unsubscribe=[],this.isMobile=n.j.isMobile(),this.remoteFeatures=l.OptionsController.state.remoteFeatures,this.unsubscribe.push(l.OptionsController.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){if(this.isMobile){let{featured:e,recommended:t}=a.ApiController.state,{customWallets:o}=l.OptionsController.state,r=s.M.getRecentWallets(),n=e.length||t.length||o?.length||r.length;return(0,i.dy)`<wui-flex flexDirection="column" gap="2" .margin=${["1","3","3","3"]}>
        ${n?(0,i.dy)`<w3m-connector-list></w3m-connector-list>`:null}
        <w3m-all-wallets-widget></w3m-all-wallets-widget>
      </wui-flex>`}return(0,i.dy)`<wui-flex flexDirection="column" .padding=${["0","0","4","0"]}>
        <w3m-connecting-wc-view ?basic=${!0} .displayBranding=${!1}></w3m-connecting-wc-view>
        <wui-flex flexDirection="column" .padding=${["0","3","0","3"]}>
          <w3m-all-wallets-widget></w3m-all-wallets-widget>
        </wui-flex>
      </wui-flex>
      ${this.reownBrandingTemplate()} `}reownBrandingTemplate(){return this.remoteFeatures?.reownBranding?(0,i.dy)` <wui-flex flexDirection="column" .padding=${["1","0","1","0"]}>
      <wui-ux-by-reown></wui-ux-by-reown>
    </wui-flex>`:null}};eP([(0,r.SB)()],eI.prototype,"isMobile",void 0),eP([(0,r.SB)()],eI.prototype,"remoteFeatures",void 0),eI=eP([(0,c.Mo)("w3m-connecting-wc-basic-view")],eI);var eW=o(81997);let{I:eA}=eW._$LH,eB=e=>void 0===e.strings;var eL=o(42216);let ez=(e,t)=>{let o=e._$AN;if(void 0===o)return!1;for(let e of o)e._$AO?.(t,!1),ez(e,t);return!0},e_=e=>{let t,o;do{if(void 0===(t=e._$AM))break;(o=t._$AN).delete(e),e=t}while(0===o?.size)},eD=e=>{for(let t;t=e._$AM;e=t){let o=t._$AN;if(void 0===o)t._$AN=o=new Set;else if(o.has(e))break;o.add(e),eU(t)}};function eM(e){void 0!==this._$AN?(e_(this),this._$AM=e,eD(this)):this._$AM=e}function eN(e,t=!1,o=0){let i=this._$AH,r=this._$AN;if(void 0!==r&&0!==r.size){if(t){if(Array.isArray(i))for(let e=o;e<i.length;e++)ez(i[e],!1),e_(i[e]);else null!=i&&(ez(i,!1),e_(i))}else ez(this,e)}}let eU=e=>{e.type==eL.pX.CHILD&&(e._$AP??=eN,e._$AQ??=eM)};class eq extends eL.Xe{constructor(){super(...arguments),this._$AN=void 0}_$AT(e,t,o){super._$AT(e,t,o),eD(this),this.isConnected=e._$AU}_$AO(e,t=!0){e!==this.isConnected&&(this.isConnected=e,e?this.reconnected?.():this.disconnected?.()),t&&(ez(this,e),e_(this))}setValue(e){if(eB(this._$Ct))this._$Ct._$AI(e,this);else{let t=[...this._$Ct._$AH];t[this._$Ci]=e,this._$Ct._$AI(t,this,0)}}disconnected(){}reconnected(){}}let eF=()=>new eH;class eH{}let eV=new WeakMap,eK=(0,eL.XM)(class extends eq{render(e){return eW.Ld}update(e,[t]){let o=t!==this.G;return o&&void 0!==this.G&&this.rt(void 0),(o||this.lt!==this.ct)&&(this.G=t,this.ht=e.options?.host,this.rt(this.ct=e.element)),eW.Ld}rt(e){if(this.isConnected||(e=void 0),"function"==typeof this.G){let t=this.ht??globalThis,o=eV.get(t);void 0===o&&(o=new WeakMap,eV.set(t,o)),void 0!==o.get(this.G)&&this.G.call(this.ht,void 0),o.set(this.G,e),void 0!==e&&this.G.call(this.ht,e)}else this.G.value=e}get lt(){return"function"==typeof this.G?eV.get(this.ht??globalThis)?.get(this.G):this.G?.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}});var eX=(0,W.iv)`
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  label {
    position: relative;
    display: inline-block;
    user-select: none;
    transition:
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      color ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      border ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      box-shadow ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      width ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      height ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      transform ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      opacity ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color, color, border, box-shadow, width, height, transform, opacity;
  }

  input {
    width: 0;
    height: 0;
    opacity: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${({colors:e})=>e.neutrals300};
    border-radius: ${({borderRadius:e})=>e.round};
    border: 1px solid transparent;
    will-change: border;
    transition:
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      color ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      border ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      box-shadow ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      width ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      height ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      transform ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      opacity ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color, color, border, box-shadow, width, height, transform, opacity;
  }

  span:before {
    content: '';
    position: absolute;
    background-color: ${({colors:e})=>e.white};
    border-radius: 50%;
  }

  /* -- Sizes --------------------------------------------------------- */
  label[data-size='lg'] {
    width: 48px;
    height: 32px;
  }

  label[data-size='md'] {
    width: 40px;
    height: 28px;
  }

  label[data-size='sm'] {
    width: 32px;
    height: 22px;
  }

  label[data-size='lg'] > span:before {
    height: 24px;
    width: 24px;
    left: 4px;
    top: 3px;
  }

  label[data-size='md'] > span:before {
    height: 20px;
    width: 20px;
    left: 4px;
    top: 3px;
  }

  label[data-size='sm'] > span:before {
    height: 16px;
    width: 16px;
    left: 3px;
    top: 2px;
  }

  /* -- Focus states --------------------------------------------------- */
  input:focus-visible:not(:checked) + span,
  input:focus:not(:checked) + span {
    border: 1px solid ${({tokens:e})=>e.core.iconAccentPrimary};
    background-color: ${({tokens:e})=>e.theme.textTertiary};
    box-shadow: 0px 0px 0px 4px rgba(9, 136, 240, 0.2);
  }

  input:focus-visible:checked + span,
  input:focus:checked + span {
    border: 1px solid ${({tokens:e})=>e.core.iconAccentPrimary};
    box-shadow: 0px 0px 0px 4px rgba(9, 136, 240, 0.2);
  }

  /* -- Checked states --------------------------------------------------- */
  input:checked + span {
    background-color: ${({tokens:e})=>e.core.iconAccentPrimary};
  }

  label[data-size='lg'] > input:checked + span:before {
    transform: translateX(calc(100% - 9px));
  }

  label[data-size='md'] > input:checked + span:before {
    transform: translateX(calc(100% - 9px));
  }

  label[data-size='sm'] > input:checked + span:before {
    transform: translateX(calc(100% - 7px));
  }

  /* -- Hover states ------------------------------------------------------- */
  label:hover > input:not(:checked):not(:disabled) + span {
    background-color: ${({colors:e})=>e.neutrals400};
  }

  label:hover > input:checked:not(:disabled) + span {
    background-color: ${({colors:e})=>e.accent080};
  }

  /* -- Disabled state --------------------------------------------------- */
  label:has(input:disabled) {
    pointer-events: none;
    user-select: none;
  }

  input:not(:checked):disabled + span {
    background-color: ${({colors:e})=>e.neutrals700};
  }

  input:checked:disabled + span {
    background-color: ${({colors:e})=>e.neutrals700};
  }

  input:not(:checked):disabled + span::before {
    background-color: ${({colors:e})=>e.neutrals400};
  }

  input:checked:disabled + span::before {
    background-color: ${({tokens:e})=>e.theme.textTertiary};
  }
`,eG=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let eQ=class extends i.oi{constructor(){super(...arguments),this.inputElementRef=eF(),this.checked=!1,this.disabled=!1,this.size="md"}render(){return(0,i.dy)`
      <label data-size=${this.size}>
        <input
          ${eK(this.inputElementRef)}
          type="checkbox"
          ?checked=${this.checked}
          ?disabled=${this.disabled}
          @change=${this.dispatchChangeEvent.bind(this)}
        />
        <span></span>
      </label>
    `}dispatchChangeEvent(){this.dispatchEvent(new CustomEvent("switchChange",{detail:this.inputElementRef.value?.checked,bubbles:!0,composed:!0}))}};eQ.styles=[P.ET,P.ZM,eX],eG([(0,r.Cb)({type:Boolean})],eQ.prototype,"checked",void 0),eG([(0,r.Cb)({type:Boolean})],eQ.prototype,"disabled",void 0),eG([(0,r.Cb)()],eQ.prototype,"size",void 0),eQ=eG([(0,I.M)("wui-toggle")],eQ);var eY=(0,W.iv)`
  :host {
    height: auto;
  }

  :host > wui-flex {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    column-gap: ${({spacing:e})=>e["2"]};
    padding: ${({spacing:e})=>e["2"]} ${({spacing:e})=>e["3"]};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: ${({borderRadius:e})=>e["4"]};
    box-shadow: inset 0 0 0 1px ${({tokens:e})=>e.theme.foregroundPrimary};
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color;
    cursor: pointer;
  }

  wui-switch {
    pointer-events: none;
  }
`,eZ=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let eJ=class extends i.oi{constructor(){super(...arguments),this.checked=!1}render(){return(0,i.dy)`
      <wui-flex>
        <wui-icon size="xl" name="walletConnectBrown"></wui-icon>
        <wui-toggle
          ?checked=${this.checked}
          size="sm"
          @switchChange=${this.handleToggleChange.bind(this)}
        ></wui-toggle>
      </wui-flex>
    `}handleToggleChange(e){e.stopPropagation(),this.checked=e.detail,this.dispatchSwitchEvent()}dispatchSwitchEvent(){this.dispatchEvent(new CustomEvent("certifiedSwitchChange",{detail:this.checked,bubbles:!0,composed:!0}))}};eJ.styles=[P.ET,P.ZM,eY],eZ([(0,r.Cb)({type:Boolean})],eJ.prototype,"checked",void 0),eJ=eZ([(0,I.M)("wui-certified-switch")],eJ);var e0=(0,W.iv)`
  :host {
    position: relative;
    width: 100%;
    display: inline-flex;
    flex-direction: column;
    gap: ${({spacing:e})=>e[3]};
    color: ${({tokens:e})=>e.theme.textPrimary};
    caret-color: ${({tokens:e})=>e.core.textAccentPrimary};
  }

  .wui-input-text-container {
    position: relative;
    display: flex;
  }

  input {
    width: 100%;
    border-radius: ${({borderRadius:e})=>e[4]};
    color: inherit;
    background: transparent;
    border: 1px solid ${({tokens:e})=>e.theme.borderPrimary};
    caret-color: ${({tokens:e})=>e.core.textAccentPrimary};
    padding: ${({spacing:e})=>e[3]} ${({spacing:e})=>e[3]}
      ${({spacing:e})=>e[3]} ${({spacing:e})=>e[10]};
    font-size: ${({textSize:e})=>e.large};
    line-height: ${({typography:e})=>e["lg-regular"].lineHeight};
    letter-spacing: ${({typography:e})=>e["lg-regular"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.regular};
  }

  input[data-size='lg'] {
    padding: ${({spacing:e})=>e[4]} ${({spacing:e})=>e[3]}
      ${({spacing:e})=>e[4]} ${({spacing:e})=>e[10]};
  }

  @media (hover: hover) and (pointer: fine) {
    input:hover:enabled {
      border: 1px solid ${({tokens:e})=>e.theme.borderSecondary};
    }
  }

  input:disabled {
    cursor: unset;
    border: 1px solid ${({tokens:e})=>e.theme.borderPrimary};
  }

  input::placeholder {
    color: ${({tokens:e})=>e.theme.textSecondary};
  }

  input:focus:enabled {
    border: 1px solid ${({tokens:e})=>e.theme.borderSecondary};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    -webkit-box-shadow: 0px 0px 0px 4px ${({tokens:e})=>e.core.foregroundAccent040};
    -moz-box-shadow: 0px 0px 0px 4px ${({tokens:e})=>e.core.foregroundAccent040};
    box-shadow: 0px 0px 0px 4px ${({tokens:e})=>e.core.foregroundAccent040};
  }

  div.wui-input-text-container:has(input:disabled) {
    opacity: 0.5;
  }

  wui-icon.wui-input-text-left-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    left: ${({spacing:e})=>e[4]};
    color: ${({tokens:e})=>e.theme.iconDefault};
  }

  button.wui-input-text-submit-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: ${({spacing:e})=>e[3]};
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    border-radius: ${({borderRadius:e})=>e[2]};
    color: ${({tokens:e})=>e.core.textAccentPrimary};
  }

  button.wui-input-text-submit-button:disabled {
    opacity: 1;
  }

  button.wui-input-text-submit-button.loading wui-icon {
    animation: spin 1s linear infinite;
  }

  button.wui-input-text-submit-button:hover {
    background: ${({tokens:e})=>e.core.foregroundAccent010};
  }

  input:has(+ .wui-input-text-submit-button) {
    padding-right: ${({spacing:e})=>e[12]};
  }

  input[type='number'] {
    -moz-appearance: textfield;
  }

  input[type='search']::-webkit-search-decoration,
  input[type='search']::-webkit-search-cancel-button,
  input[type='search']::-webkit-search-results-button,
  input[type='search']::-webkit-search-results-decoration {
    -webkit-appearance: none;
  }

  /* -- Keyframes --------------------------------------------------- */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`,e3=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let e1=class extends i.oi{constructor(){super(...arguments),this.inputElementRef=eF(),this.disabled=!1,this.loading=!1,this.placeholder="",this.type="text",this.value="",this.size="md"}render(){return(0,i.dy)` <div class="wui-input-text-container">
        ${this.templateLeftIcon()}
        <input
          data-size=${this.size}
          ${eK(this.inputElementRef)}
          data-testid="wui-input-text"
          type=${this.type}
          enterkeyhint=${(0,d.o)(this.enterKeyHint)}
          ?disabled=${this.disabled}
          placeholder=${this.placeholder}
          @input=${this.dispatchInputChangeEvent.bind(this)}
          @keydown=${this.onKeyDown}
          .value=${this.value||""}
        />
        ${this.templateSubmitButton()}
        <slot class="wui-input-text-slot"></slot>
      </div>
      ${this.templateError()} ${this.templateWarning()}`}templateLeftIcon(){return this.icon?(0,i.dy)`<wui-icon
        class="wui-input-text-left-icon"
        size="md"
        data-size=${this.size}
        color="inherit"
        name=${this.icon}
      ></wui-icon>`:null}templateSubmitButton(){return this.onSubmit?(0,i.dy)`<button
        class="wui-input-text-submit-button ${this.loading?"loading":""}"
        @click=${this.onSubmit?.bind(this)}
        ?disabled=${this.disabled||this.loading}
      >
        ${this.loading?(0,i.dy)`<wui-icon name="spinner" size="md"></wui-icon>`:(0,i.dy)`<wui-icon name="chevronRight" size="md"></wui-icon>`}
      </button>`:null}templateError(){return this.errorText?(0,i.dy)`<wui-text variant="sm-regular" color="error">${this.errorText}</wui-text>`:null}templateWarning(){return this.warningText?(0,i.dy)`<wui-text variant="sm-regular" color="warning">${this.warningText}</wui-text>`:null}dispatchInputChangeEvent(){this.dispatchEvent(new CustomEvent("inputChange",{detail:this.inputElementRef.value?.value,bubbles:!0,composed:!0}))}};e1.styles=[P.ET,P.ZM,e0],e3([(0,r.Cb)()],e1.prototype,"icon",void 0),e3([(0,r.Cb)({type:Boolean})],e1.prototype,"disabled",void 0),e3([(0,r.Cb)({type:Boolean})],e1.prototype,"loading",void 0),e3([(0,r.Cb)()],e1.prototype,"placeholder",void 0),e3([(0,r.Cb)()],e1.prototype,"type",void 0),e3([(0,r.Cb)()],e1.prototype,"value",void 0),e3([(0,r.Cb)()],e1.prototype,"errorText",void 0),e3([(0,r.Cb)()],e1.prototype,"warningText",void 0),e3([(0,r.Cb)()],e1.prototype,"onSubmit",void 0),e3([(0,r.Cb)()],e1.prototype,"size",void 0),e3([(0,r.Cb)({attribute:!1})],e1.prototype,"onKeyDown",void 0),e1=e3([(0,I.M)("wui-input-text")],e1);var e2=(0,W.iv)`
  :host {
    position: relative;
    display: inline-block;
    width: 100%;
  }

  wui-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: ${({spacing:e})=>e[3]};
    color: ${({tokens:e})=>e.theme.iconDefault};
    cursor: pointer;
    padding: ${({spacing:e})=>e[2]};
    background-color: transparent;
    border-radius: ${({borderRadius:e})=>e[4]};
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-2"]};
  }

  @media (hover: hover) {
    wui-icon:hover {
      background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    }
  }
`,e5=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let e4=class extends i.oi{constructor(){super(...arguments),this.inputComponentRef=eF(),this.inputValue=""}render(){return(0,i.dy)`
      <wui-input-text
        ${eK(this.inputComponentRef)}
        placeholder="Search wallet"
        icon="search"
        type="search"
        enterKeyHint="search"
        size="sm"
        @inputChange=${this.onInputChange}
      >
        ${this.inputValue?(0,i.dy)`<wui-icon
              @click=${this.clearValue}
              color="inherit"
              size="sm"
              name="close"
            ></wui-icon>`:null}
      </wui-input-text>
    `}onInputChange(e){this.inputValue=e.detail||""}clearValue(){let e=this.inputComponentRef.value,t=e?.inputElementRef.value;t&&(t.value="",this.inputValue="",t.focus(),t.dispatchEvent(new Event("input")))}};e4.styles=[P.ET,e2],e5([(0,r.Cb)()],e4.prototype,"inputValue",void 0),e4=e5([(0,I.M)("wui-search-bar")],e4);let e8=(0,i.YP)`<svg  viewBox="0 0 48 54" fill="none">
  <path
    d="M43.4605 10.7248L28.0485 1.61089C25.5438 0.129705 22.4562 0.129705 19.9515 1.61088L4.53951 10.7248C2.03626 12.2051 0.5 14.9365 0.5 17.886V36.1139C0.5 39.0635 2.03626 41.7949 4.53951 43.2752L19.9515 52.3891C22.4562 53.8703 25.5438 53.8703 28.0485 52.3891L43.4605 43.2752C45.9637 41.7949 47.5 39.0635 47.5 36.114V17.8861C47.5 14.9365 45.9637 12.2051 43.4605 10.7248Z"
  />
</svg>`;var e6=(0,W.iv)`
  :host {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 104px;
    width: 104px;
    row-gap: ${({spacing:e})=>e[2]};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: ${({borderRadius:e})=>e[5]};
    position: relative;
  }

  wui-shimmer[data-type='network'] {
    border: none;
    -webkit-clip-path: var(--apkt-path-network);
    clip-path: var(--apkt-path-network);
  }

  svg {
    position: absolute;
    width: 48px;
    height: 54px;
    z-index: 1;
  }

  svg > path {
    stroke: ${({tokens:e})=>e.theme.foregroundSecondary};
    stroke-width: 1px;
  }

  @media (max-width: 350px) {
    :host {
      width: 100%;
    }
  }
`,e9=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let e7=class extends i.oi{constructor(){super(...arguments),this.type="wallet"}render(){return(0,i.dy)`
      ${this.shimmerTemplate()}
      <wui-shimmer width="80px" height="20px"></wui-shimmer>
    `}shimmerTemplate(){return"network"===this.type?(0,i.dy)` <wui-shimmer data-type=${this.type} width="48px" height="54px"></wui-shimmer>
        ${e8}`:(0,i.dy)`<wui-shimmer width="56px" height="56px"></wui-shimmer>`}};e7.styles=[P.ET,P.ZM,e6],e9([(0,r.Cb)()],e7.prototype,"type",void 0),e7=e9([(0,I.M)("wui-card-select-loader")],e7);var te=o(62598),tt=(0,i.iv)`
  :host {
    display: grid;
    width: inherit;
    height: inherit;
  }
`,to=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let ti=class extends i.oi{render(){return this.style.cssText=`
      grid-template-rows: ${this.gridTemplateRows};
      grid-template-columns: ${this.gridTemplateColumns};
      justify-items: ${this.justifyItems};
      align-items: ${this.alignItems};
      justify-content: ${this.justifyContent};
      align-content: ${this.alignContent};
      column-gap: ${this.columnGap&&`var(--apkt-spacing-${this.columnGap})`};
      row-gap: ${this.rowGap&&`var(--apkt-spacing-${this.rowGap})`};
      gap: ${this.gap&&`var(--apkt-spacing-${this.gap})`};
      padding-top: ${this.padding&&te.H.getSpacingStyles(this.padding,0)};
      padding-right: ${this.padding&&te.H.getSpacingStyles(this.padding,1)};
      padding-bottom: ${this.padding&&te.H.getSpacingStyles(this.padding,2)};
      padding-left: ${this.padding&&te.H.getSpacingStyles(this.padding,3)};
      margin-top: ${this.margin&&te.H.getSpacingStyles(this.margin,0)};
      margin-right: ${this.margin&&te.H.getSpacingStyles(this.margin,1)};
      margin-bottom: ${this.margin&&te.H.getSpacingStyles(this.margin,2)};
      margin-left: ${this.margin&&te.H.getSpacingStyles(this.margin,3)};
    `,(0,i.dy)`<slot></slot>`}};ti.styles=[P.ET,tt],to([(0,r.Cb)()],ti.prototype,"gridTemplateRows",void 0),to([(0,r.Cb)()],ti.prototype,"gridTemplateColumns",void 0),to([(0,r.Cb)()],ti.prototype,"justifyItems",void 0),to([(0,r.Cb)()],ti.prototype,"alignItems",void 0),to([(0,r.Cb)()],ti.prototype,"justifyContent",void 0),to([(0,r.Cb)()],ti.prototype,"alignContent",void 0),to([(0,r.Cb)()],ti.prototype,"columnGap",void 0),to([(0,r.Cb)()],ti.prototype,"rowGap",void 0),to([(0,r.Cb)()],ti.prototype,"gap",void 0),to([(0,r.Cb)()],ti.prototype,"padding",void 0),to([(0,r.Cb)()],ti.prototype,"margin",void 0),ti=to([(0,I.M)("wui-grid")],ti);var tr=o(72018),tn=(0,c.iv)`
  button {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    width: 104px;
    row-gap: ${({spacing:e})=>e["2"]};
    padding: ${({spacing:e})=>e["3"]} ${({spacing:e})=>e["0"]};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: clamp(0px, ${({borderRadius:e})=>e["4"]}, 20px);
    transition:
      color ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-1"]},
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-1"]},
      border-radius ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-1"]};
    will-change: background-color, color, border-radius;
    outline: none;
    border: none;
  }

  button > wui-flex > wui-text {
    color: ${({tokens:e})=>e.theme.textPrimary};
    max-width: 86px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    justify-content: center;
  }

  button > wui-flex > wui-text.certified {
    max-width: 66px;
  }

  @media (hover: hover) and (pointer: fine) {
    button:hover:enabled {
      background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    }
  }

  button:disabled > wui-flex > wui-text {
    color: ${({tokens:e})=>e.core.glass010};
  }

  [data-selected='true'] {
    background-color: ${({colors:e})=>e.accent020};
  }

  @media (hover: hover) and (pointer: fine) {
    [data-selected='true']:hover:enabled {
      background-color: ${({colors:e})=>e.accent010};
    }
  }

  [data-selected='true']:active:enabled {
    background-color: ${({colors:e})=>e.accent010};
  }

  @media (max-width: 350px) {
    button {
      width: 100%;
    }
  }
`,tl=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let ta=class extends i.oi{constructor(){super(),this.observer=new IntersectionObserver(()=>void 0),this.visible=!1,this.imageSrc=void 0,this.imageLoading=!1,this.isImpressed=!1,this.explorerId="",this.walletQuery="",this.certified=!1,this.displayIndex=0,this.wallet=void 0,this.observer=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting?(this.visible=!0,this.fetchImageSrc(),this.sendImpressionEvent()):this.visible=!1})},{threshold:.01})}firstUpdated(){this.observer.observe(this)}disconnectedCallback(){this.observer.disconnect()}render(){let e=this.wallet?.badge_type==="certified";return(0,i.dy)`
      <button>
        ${this.imageTemplate()}
        <wui-flex flexDirection="row" alignItems="center" justifyContent="center" gap="1">
          <wui-text
            variant="md-regular"
            color="inherit"
            class=${(0,d.o)(e?"certified":void 0)}
            >${this.wallet?.name}</wui-text
          >
          ${e?(0,i.dy)`<wui-icon size="sm" name="walletConnectBrown"></wui-icon>`:null}
        </wui-flex>
      </button>
    `}imageTemplate(){return(this.visible||this.imageSrc)&&!this.imageLoading?(0,i.dy)`
      <wui-wallet-image
        size="lg"
        imageSrc=${(0,d.o)(this.imageSrc)}
        name=${(0,d.o)(this.wallet?.name)}
        .installed=${this.wallet?.installed??!1}
        badgeSize="sm"
      >
      </wui-wallet-image>
    `:this.shimmerTemplate()}shimmerTemplate(){return(0,i.dy)`<wui-shimmer width="56px" height="56px"></wui-shimmer>`}async fetchImageSrc(){this.wallet&&(this.imageSrc=y.f.getWalletImage(this.wallet),this.imageSrc||(this.imageLoading=!0,this.imageSrc=await y.f.fetchWalletImage(this.wallet.image_id),this.imageLoading=!1))}sendImpressionEvent(){this.wallet&&!this.isImpressed&&(this.isImpressed=!0,b.X.sendWalletImpressionEvent({name:this.wallet.name,walletRank:this.wallet.order,explorerId:this.explorerId,view:w.RouterController.state.view,query:this.walletQuery,certified:this.certified,displayIndex:this.displayIndex}))}};ta.styles=tn,tl([(0,r.SB)()],ta.prototype,"visible",void 0),tl([(0,r.SB)()],ta.prototype,"imageSrc",void 0),tl([(0,r.SB)()],ta.prototype,"imageLoading",void 0),tl([(0,r.SB)()],ta.prototype,"isImpressed",void 0),tl([(0,r.Cb)()],ta.prototype,"explorerId",void 0),tl([(0,r.Cb)()],ta.prototype,"walletQuery",void 0),tl([(0,r.Cb)()],ta.prototype,"certified",void 0),tl([(0,r.Cb)()],ta.prototype,"displayIndex",void 0),tl([(0,r.Cb)({type:Object})],ta.prototype,"wallet",void 0),ta=tl([(0,c.Mo)("w3m-all-wallets-list-item")],ta);var ts=(0,c.iv)`
  wui-grid {
    max-height: clamp(360px, 400px, 80vh);
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  :host([data-mobile-fullscreen='true']) wui-grid {
    max-height: none;
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  w3m-all-wallets-list-item {
    opacity: 0;
    animation-duration: ${({durations:e})=>e.xl};
    animation-timing-function: ${({easings:e})=>e["ease-inout-power-2"]};
    animation-name: fade-in;
    animation-fill-mode: forwards;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  wui-loading-spinner {
    padding-top: ${({spacing:e})=>e["4"]};
    padding-bottom: ${({spacing:e})=>e["4"]};
    justify-content: center;
    grid-column: 1 / span 4;
  }
`,tc=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let td="local-paginator",th=class extends i.oi{constructor(){super(),this.unsubscribe=[],this.paginationObserver=void 0,this.loading=!a.ApiController.state.wallets.length,this.wallets=a.ApiController.state.wallets,this.recommended=a.ApiController.state.recommended,this.featured=a.ApiController.state.featured,this.filteredWallets=a.ApiController.state.filteredWallets,this.mobileFullScreen=l.OptionsController.state.enableMobileFullScreen,this.unsubscribe.push(a.ApiController.subscribeKey("wallets",e=>this.wallets=e),a.ApiController.subscribeKey("recommended",e=>this.recommended=e),a.ApiController.subscribeKey("featured",e=>this.featured=e),a.ApiController.subscribeKey("filteredWallets",e=>this.filteredWallets=e))}firstUpdated(){this.initialFetch(),this.createPaginationObserver()}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),this.paginationObserver?.disconnect()}render(){return this.mobileFullScreen&&this.setAttribute("data-mobile-fullscreen","true"),(0,i.dy)`
      <wui-grid
        data-scroll=${!this.loading}
        .padding=${["0","3","3","3"]}
        gap="2"
        justifyContent="space-between"
      >
        ${this.loading?this.shimmerTemplate(16):this.walletsTemplate()}
        ${this.paginationLoaderTemplate()}
      </wui-grid>
    `}async initialFetch(){this.loading=!0;let e=this.shadowRoot?.querySelector("wui-grid");e&&(await a.ApiController.fetchWalletsByPage({page:1}),await e.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.loading=!1,e.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}shimmerTemplate(e,t){return[...Array(e)].map(()=>(0,i.dy)`
        <wui-card-select-loader type="wallet" id=${(0,d.o)(t)}></wui-card-select-loader>
      `)}getWallets(){let e=[...this.featured,...this.recommended];this.filteredWallets?.length>0?e.push(...this.filteredWallets):e.push(...this.wallets);let t=n.j.uniqueBy(e,"id"),o=tr.J.markWalletsAsInstalled(t);return tr.J.markWalletsWithDisplayIndex(o)}walletsTemplate(){return this.getWallets().map((e,t)=>(0,i.dy)`
        <w3m-all-wallets-list-item
          data-testid="wallet-search-item-${e.id}"
          @click=${()=>this.onConnectWallet(e)}
          .wallet=${e}
          explorerId=${e.id}
          certified=${"certified"===this.badge}
          displayIndex=${t}
        ></w3m-all-wallets-list-item>
      `)}paginationLoaderTemplate(){let{wallets:e,recommended:t,featured:o,count:i,mobileFilteredOutWalletsLength:r}=a.ApiController.state,n=window.innerWidth<352?3:4,l=e.length+t.length,s=Math.ceil(l/n)*n-l+n;return(s-=e.length?o.length%n:0,0===i&&o.length>0)?null:0===i||[...o,...e,...t].length<i-(r??0)?this.shimmerTemplate(s,td):null}createPaginationObserver(){let e=this.shadowRoot?.querySelector(`#${td}`);e&&(this.paginationObserver=new IntersectionObserver(([e])=>{if(e?.isIntersecting&&!this.loading){let{page:e,count:t,wallets:o}=a.ApiController.state;o.length<t&&a.ApiController.fetchWalletsByPage({page:e+1})}}),this.paginationObserver.observe(e))}onConnectWallet(e){p.ConnectorController.selectWalletConnector(e)}};th.styles=ts,tc([(0,r.SB)()],th.prototype,"loading",void 0),tc([(0,r.SB)()],th.prototype,"wallets",void 0),tc([(0,r.SB)()],th.prototype,"recommended",void 0),tc([(0,r.SB)()],th.prototype,"featured",void 0),tc([(0,r.SB)()],th.prototype,"filteredWallets",void 0),tc([(0,r.SB)()],th.prototype,"badge",void 0),tc([(0,r.SB)()],th.prototype,"mobileFullScreen",void 0),th=tc([(0,c.Mo)("w3m-all-wallets-list")],th);var tp=(0,i.iv)`
  wui-grid,
  wui-loading-spinner,
  wui-flex {
    height: 360px;
  }

  wui-grid {
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  :host([data-mobile-fullscreen='true']) wui-grid {
    max-height: none;
    height: auto;
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-loading-spinner {
    justify-content: center;
    align-items: center;
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`,tu=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let tb=class extends i.oi{constructor(){super(...arguments),this.prevQuery="",this.prevBadge=void 0,this.loading=!0,this.mobileFullScreen=l.OptionsController.state.enableMobileFullScreen,this.query=""}render(){return this.mobileFullScreen&&this.setAttribute("data-mobile-fullscreen","true"),this.onSearch(),this.loading?(0,i.dy)`<wui-loading-spinner color="accent-primary"></wui-loading-spinner>`:this.walletsTemplate()}async onSearch(){(this.query.trim()!==this.prevQuery.trim()||this.badge!==this.prevBadge)&&(this.prevQuery=this.query,this.prevBadge=this.badge,this.loading=!0,await a.ApiController.searchWallet({search:this.query,badge:this.badge}),this.loading=!1)}walletsTemplate(){let{search:e}=a.ApiController.state,t=tr.J.markWalletsAsInstalled(e);return e.length?(0,i.dy)`
      <wui-grid
        data-testid="wallet-list"
        .padding=${["0","3","3","3"]}
        rowGap="4"
        columngap="2"
        justifyContent="space-between"
      >
        ${t.map((e,t)=>(0,i.dy)`
            <w3m-all-wallets-list-item
              @click=${()=>this.onConnectWallet(e)}
              .wallet=${e}
              data-testid="wallet-search-item-${e.id}"
              explorerId=${e.id}
              certified=${"certified"===this.badge}
              walletQuery=${this.query}
              displayIndex=${t}
            ></w3m-all-wallets-list-item>
          `)}
      </wui-grid>
    `:(0,i.dy)`
        <wui-flex
          data-testid="no-wallet-found"
          justifyContent="center"
          alignItems="center"
          gap="3"
          flexDirection="column"
        >
          <wui-icon-box size="lg" color="default" icon="wallet"></wui-icon-box>
          <wui-text data-testid="no-wallet-found-text" color="secondary" variant="md-medium">
            No Wallet found
          </wui-text>
        </wui-flex>
      `}onConnectWallet(e){p.ConnectorController.selectWalletConnector(e)}};tb.styles=tp,tu([(0,r.SB)()],tb.prototype,"loading",void 0),tu([(0,r.SB)()],tb.prototype,"mobileFullScreen",void 0),tu([(0,r.Cb)()],tb.prototype,"query",void 0),tu([(0,r.Cb)()],tb.prototype,"badge",void 0),tb=tu([(0,c.Mo)("w3m-all-wallets-search")],tb);var tw=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let tg=class extends i.oi{constructor(){super(...arguments),this.search="",this.badge=void 0,this.onDebouncedSearch=n.j.debounce(e=>{this.search=e})}render(){let e=this.search.length>=2;return(0,i.dy)`
      <wui-flex .padding=${["1","3","3","3"]} gap="2" alignItems="center">
        <wui-search-bar @inputChange=${this.onInputChange.bind(this)}></wui-search-bar>
        <wui-certified-switch
          ?checked=${"certified"===this.badge}
          @certifiedSwitchChange=${this.onCertifiedSwitchChange.bind(this)}
          data-testid="wui-certified-switch"
        ></wui-certified-switch>
        ${this.qrButtonTemplate()}
      </wui-flex>
      ${e||this.badge?(0,i.dy)`<w3m-all-wallets-search
            query=${this.search}
            .badge=${this.badge}
          ></w3m-all-wallets-search>`:(0,i.dy)`<w3m-all-wallets-list .badge=${this.badge}></w3m-all-wallets-list>`}
    `}onInputChange(e){this.onDebouncedSearch(e.detail)}onCertifiedSwitchChange(e){e.detail?(this.badge="certified",E.SnackController.showSvg("Only WalletConnect certified",{icon:"walletConnectBrown",iconColor:"accent-100"})):this.badge=void 0}qrButtonTemplate(){return n.j.isMobile()?(0,i.dy)`
        <wui-icon-box
          size="xl"
          iconSize="xl"
          color="accent-primary"
          icon="qrCode"
          border
          borderColor="wui-accent-glass-010"
          @click=${this.onWalletConnectQr.bind(this)}
        ></wui-icon-box>
      `:null}onWalletConnectQr(){w.RouterController.push("ConnectingWalletConnect")}};tw([(0,r.SB)()],tg.prototype,"search",void 0),tw([(0,r.SB)()],tg.prototype,"badge",void 0),tg=tw([(0,c.Mo)("w3m-all-wallets-view")],tg);var tm=(0,W.iv)`
  :host {
    width: 100%;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${({spacing:e})=>e[3]};
    width: 100%;
    background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
    border-radius: ${({borderRadius:e})=>e[4]};
    transition:
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      scale ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color, scale;
  }

  wui-text {
    text-transform: capitalize;
  }

  wui-image {
    color: ${({tokens:e})=>e.theme.textPrimary};
  }

  @media (hover: hover) {
    button:hover:enabled {
      background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    }
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`,tf=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l};let ty=class extends i.oi{constructor(){super(...arguments),this.imageSrc="google",this.loading=!1,this.disabled=!1,this.rightIcon=!0,this.rounded=!1,this.fullSize=!1}render(){return this.dataset.rounded=this.rounded?"true":"false",(0,i.dy)`
      <button
        ?disabled=${!!this.loading||!!this.disabled}
        data-loading=${this.loading}
        tabindex=${(0,d.o)(this.tabIdx)}
      >
        <wui-flex gap="2" alignItems="center">
          ${this.templateLeftIcon()}
          <wui-flex gap="1">
            <slot></slot>
          </wui-flex>
        </wui-flex>
        ${this.templateRightIcon()}
      </button>
    `}templateLeftIcon(){return this.icon?(0,i.dy)`<wui-image
        icon=${this.icon}
        iconColor=${(0,d.o)(this.iconColor)}
        ?boxed=${!0}
        ?rounded=${this.rounded}
      ></wui-image>`:(0,i.dy)`<wui-image
      ?boxed=${!0}
      ?rounded=${this.rounded}
      ?fullSize=${this.fullSize}
      src=${this.imageSrc}
    ></wui-image>`}templateRightIcon(){return this.rightIcon?this.loading?(0,i.dy)`<wui-loading-spinner size="md" color="accent-primary"></wui-loading-spinner>`:(0,i.dy)`<wui-icon name="chevronRight" size="lg" color="default"></wui-icon>`:null}};ty.styles=[P.ET,P.ZM,tm],tf([(0,r.Cb)()],ty.prototype,"imageSrc",void 0),tf([(0,r.Cb)()],ty.prototype,"icon",void 0),tf([(0,r.Cb)()],ty.prototype,"iconColor",void 0),tf([(0,r.Cb)({type:Boolean})],ty.prototype,"loading",void 0),tf([(0,r.Cb)()],ty.prototype,"tabIdx",void 0),tf([(0,r.Cb)({type:Boolean})],ty.prototype,"disabled",void 0),tf([(0,r.Cb)({type:Boolean})],ty.prototype,"rightIcon",void 0),tf([(0,r.Cb)({type:Boolean})],ty.prototype,"rounded",void 0),tf([(0,r.Cb)({type:Boolean})],ty.prototype,"fullSize",void 0),ty=tf([(0,I.M)("wui-list-item")],ty);let tv=class extends i.oi{constructor(){super(...arguments),this.wallet=w.RouterController.state.data?.wallet}render(){if(!this.wallet)throw Error("w3m-downloads-view");return(0,i.dy)`
      <wui-flex gap="2" flexDirection="column" .padding=${["3","3","4","3"]}>
        ${this.chromeTemplate()} ${this.iosTemplate()} ${this.androidTemplate()}
        ${this.homepageTemplate()}
      </wui-flex>
    `}chromeTemplate(){return this.wallet?.chrome_store?(0,i.dy)`<wui-list-item
      variant="icon"
      icon="chromeStore"
      iconVariant="square"
      @click=${this.onChromeStore.bind(this)}
      chevron
    >
      <wui-text variant="md-medium" color="primary">Chrome Extension</wui-text>
    </wui-list-item>`:null}iosTemplate(){return this.wallet?.app_store?(0,i.dy)`<wui-list-item
      variant="icon"
      icon="appStore"
      iconVariant="square"
      @click=${this.onAppStore.bind(this)}
      chevron
    >
      <wui-text variant="md-medium" color="primary">iOS App</wui-text>
    </wui-list-item>`:null}androidTemplate(){return this.wallet?.play_store?(0,i.dy)`<wui-list-item
      variant="icon"
      icon="playStore"
      iconVariant="square"
      @click=${this.onPlayStore.bind(this)}
      chevron
    >
      <wui-text variant="md-medium" color="primary">Android App</wui-text>
    </wui-list-item>`:null}homepageTemplate(){return this.wallet?.homepage?(0,i.dy)`
      <wui-list-item
        variant="icon"
        icon="browser"
        iconVariant="square-blue"
        @click=${this.onHomePage.bind(this)}
        chevron
      >
        <wui-text variant="md-medium" color="primary">Website</wui-text>
      </wui-list-item>
    `:null}openStore(e){e.href&&this.wallet&&(b.X.sendEvent({type:"track",event:"GET_WALLET",properties:{name:this.wallet.name,walletRank:this.wallet.order,explorerId:this.wallet.id,type:e.type}}),n.j.openHref(e.href,"_blank"))}onChromeStore(){this.wallet?.chrome_store&&this.openStore({href:this.wallet.chrome_store,type:"chrome_store"})}onAppStore(){this.wallet?.app_store&&this.openStore({href:this.wallet.app_store,type:"app_store"})}onPlayStore(){this.wallet?.play_store&&this.openStore({href:this.wallet.play_store,type:"play_store"})}onHomePage(){this.wallet?.homepage&&this.openStore({href:this.wallet.homepage,type:"homepage"})}};tv=function(e,t,o,i){var r,n=arguments.length,l=n<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)l=Reflect.decorate(e,t,o,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(l=(n<3?r(l):n>3?r(t,o,l):r(t,o))||l);return n>3&&l&&Object.defineProperty(t,o,l),l}([(0,c.Mo)("w3m-downloads-view")],tv)}}]);