// Stylesheet for the 1280×720 stage. Colors follow the game's palette; scripts/build.cjs fills the
// font placeholder with the subsetted pixel font (Fusion Pixel Font, SIL OFL 1.1).
const JokerPokerStyle = `
@font-face{font-family:'JKPPixel';src:url(data:font/woff2;base64,__FONT_DATA__) format('woff2');font-display:block}
.jkp{position:relative;flex:1 1 auto;align-self:stretch;width:100%;height:100%;min-height:360px;overflow:hidden;overflow:clip;background:#1c4b38;color:#fff;user-select:none;-webkit-user-select:none;
  font-family:'JKPPixel','PingFang SC','Microsoft YaHei',sans-serif;-webkit-font-smoothing:none;font-smooth:never}
.jkp *{box-sizing:border-box}
.jkp-swirl{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;display:block}
.jkp-crt{position:absolute;inset:0;pointer-events:none;z-index:200;
  background:repeating-linear-gradient(0deg,rgba(0,0,0,.07) 0 1px,transparent 1px 3px),radial-gradient(ellipse at center,transparent 58%,rgba(0,0,0,.42) 100%)}
.jkp-stage{position:absolute;left:50%;top:50%;width:1280px;height:720px;transform-origin:center;font-size:18px;line-height:1.15;
  text-shadow:0 2px 0 rgba(0,0,0,.35)}
.jkp-stage button{font-family:inherit}

/* Text colors (also used on the white tooltip panel) */
.jkp-t-mult{color:#fe5f55}.jkp-t-chips{color:#009dff}.jkp-t-money{color:#f5b143}.jkp-t-attention{color:#ff9a00}
.jkp-t-planet{color:#13afce}.jkp-t-rare{color:#fe5f55}.jkp-t-green{color:#4bc292}.jkp-t-inactive{color:#9aa4a7}
.jkp-t-hearts{color:#f03464}.jkp-t-diamonds{color:#f06b3f}.jkp-t-spades{color:#3c4368}.jkp-t-clubs{color:#235955}
.jkp-pill{display:inline-block;padding:0 4px;border-radius:4px;color:#fff}
.jkp-pill-mult{background:#fe5f55}
.jkp-rich{white-space:pre-line}

/* Buttons */
.jkp-btn{--bg:#fda200;--sh:#b87500;font:inherit;font-size:20px;color:#fff;border:0;border-radius:10px;padding:8px 16px;cursor:pointer;
  background:var(--bg);box-shadow:0 4px 0 var(--sh);text-shadow:0 2px 0 rgba(0,0,0,.3);transition:transform .08s,filter .08s;white-space:pre-line;line-height:1.1}
.jkp-btn:hover:not(:disabled){filter:brightness(1.08);transform:translateY(-1px)}
.jkp-btn:active:not(:disabled){transform:translateY(3px);box-shadow:0 1px 0 var(--sh)}
.jkp-btn:focus-visible{outline:3px solid #fff;outline-offset:2px}
.jkp-btn.is-red{--bg:#fe5f55;--sh:#b8423b}.jkp-btn.is-blue{--bg:#009dff;--sh:#0068a8}.jkp-btn.is-green{--bg:#4bc292;--sh:#2f8c66}
.jkp-btn.is-grey{--bg:#5b6466;--sh:#3a4244}
.jkp-btn:disabled{--bg:#5b6466;--sh:#3a4244;color:#8f989b;cursor:not-allowed;text-shadow:none}
.jkp-btn b{display:block;font-weight:400}

/* HUD */
.jkp-hud{--tint:#4f6367;position:absolute;left:0;top:0;width:316px;height:720px;padding:8px;display:flex;flex-direction:column;gap:8px;z-index:20;
  background:color-mix(in srgb,var(--tint) 16%,#1b2427);border-right:4px solid color-mix(in srgb,var(--tint) 75%,#000);transition:background .5s,border-color .5s}
.jkp-hud-blind,.jkp-hud-shop{height:222px;display:flex;flex-direction:column;gap:6px;flex:none}
.jkp-hud-title{height:52px;flex:none;border-radius:10px;background:var(--tint);display:flex;align-items:center;justify-content:center;font-size:30px;
  box-shadow:0 4px 0 color-mix(in srgb,var(--tint) 55%,#000)}
.jkp-hud-blind-body{flex:1;border-radius:10px;background:color-mix(in srgb,var(--tint) 32%,#1b2427);padding:6px 8px;display:flex;flex-direction:column;justify-content:center;gap:4px}
.jkp-hud-boss-desc{font-size:15px;text-align:center}
.jkp-hud-blind-row{display:flex;align-items:center;gap:8px}
.jkp-hud-target{flex:1;background:#1b2427;border-radius:8px;padding:6px 4px;text-align:center}
.jkp-hud-target-num{display:flex;align-items:center;justify-content:center;gap:6px;color:#fe5f55;font-size:34px;line-height:1.1}
.jkp-hud-small{font-size:15px}
.jkp-hud-blind.is-choose{border-radius:10px;background:color-mix(in srgb,var(--tint) 32%,#1b2427);align-items:center;justify-content:center;padding:16px}
.jkp-hud-choose{font-size:30px;text-align:center;line-height:1.3}
.jkp-hud-shop{align-items:center;justify-content:center;border-radius:12px;border:4px solid #3aa6b9;background:#162022}
.jkp-neon{position:relative;padding:4px 18px;border-radius:14px;border:5px solid #fe5f55;background:#1b2427;
  box-shadow:0 0 0 3px #ffd36b inset,0 0 16px rgba(254,95,85,.8);animation:jkp-neon 1.6s steps(2) infinite}
.jkp-neon span{font-size:72px;color:#f5b143;text-shadow:0 4px 0 #8a5a12,0 0 10px rgba(245,177,67,.6);letter-spacing:4px}
.jkp-neon-tag{font-size:22px;color:#f5b143;margin-top:8px}
.jkp-hud-round{height:64px;flex:none;border-radius:10px;background:color-mix(in srgb,var(--tint) 32%,#1b2427);display:flex;align-items:center;gap:8px;padding:6px 8px}
.jkp-hud-label{width:76px;font-size:19px;white-space:pre-line;line-height:1.1}
.jkp-hud-well{flex:1;height:100%;background:#1b2427;border-radius:8px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:32px}
.jkp-hud-hand{position:relative;height:150px;flex:none;border-radius:10px;background:#1b2427;padding:8px;display:flex;flex-direction:column;gap:6px;
  border:3px solid color-mix(in srgb,var(--tint) 40%,#1b2427)}
.jkp-hud-handname{height:52px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:30px;white-space:nowrap;overflow:hidden}
.jkp-hud-handname small{font-size:16px;opacity:.85}
.jkp-hud-total{font-size:40px;animation:jkp-pop .3s}
.jkp-hud-cm{flex:1;display:flex;align-items:stretch;gap:4px}
.jkp-hud-chips,.jkp-hud-mult{position:relative;flex:1;border-radius:8px;display:flex;align-items:center;padding:0 10px;font-size:40px;min-width:0}
.jkp-hud-chips{background:#009dff;justify-content:flex-end;box-shadow:0 4px 0 #0068a8}
.jkp-hud-mult{background:#fe5f55;justify-content:flex-start;box-shadow:0 4px 0 #b8423b}
.jkp-hud-chips span,.jkp-hud-mult span{position:relative;z-index:2;display:inline-block}
.jkp-hud-cm .is-mid{font-size:32px}.jkp-hud-cm .is-small{font-size:24px}
.jkp-hud-x{display:flex;align-items:center;color:#fe5f55;font-size:30px}
.is-bump{animation:jkp-bump .26s ease-out}
.jkp-flame{position:absolute;left:4px;right:4px;bottom:55%;height:56px;z-index:1;pointer-events:none;border-radius:50% 50% 20% 20%;
  background:radial-gradient(ellipse at 50% 100%,#fff3b0 0%,#ffb13b 35%,#fe5f55 65%,transparent 72%);filter:blur(1px);transform-origin:bottom;animation:jkp-flame .22s steps(2) infinite alternate}
.jkp-flame.is-blue{background:radial-gradient(ellipse at 50% 100%,#e8fbff 0%,#5fd8ff 35%,#009dff 65%,transparent 72%)}
.jkp-hud-bottom{flex:1;display:flex;gap:8px;min-height:0}
.jkp-hud-buttons{width:96px;display:flex;flex-direction:column;gap:12px;padding-bottom:4px}
.jkp-hud-btn{flex:1;font-size:24px;border-radius:12px}
.jkp-hud-stats{flex:1;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr 1fr;gap:8px}
.jkp-hud-stat{border-radius:10px;background:color-mix(in srgb,var(--tint) 32%,#1b2427);padding:4px;text-align:center;display:flex;flex-direction:column;justify-content:center}
.jkp-hud-stat small{display:block;font-size:17px}
.jkp-hud-stat b{display:block;font-weight:400;font-size:34px;line-height:1;background:#1b2427;border-radius:8px;padding:4px 0;margin-top:3px}
.jkp-hud-stat b small{display:inline;font-size:16px;color:#fff}
.jkp-hud-stat.is-wide{grid-column:span 2}
.jkp-hud-stat.is-wide b{font-size:42px;margin:0;padding:10px 0}

/* Table regions */
.jkp-area{position:absolute;background:rgba(0,0,0,.2);border-radius:12px}
.jkp-area-jokers{left:340px;top:14px;width:620px;height:150px}
.jkp-area-cons{left:978px;top:14px;width:286px;height:150px}
.jkp-area-hand{left:372px;top:470px;width:696px;height:150px}
.jkp-count{position:absolute;font-size:17px}
.jkp-count-jokers{left:344px;top:168px}
.jkp-count-cons{left:1200px;top:168px;width:60px;text-align:right}
.jkp-count-hand{left:690px;top:624px;width:60px;text-align:center}
.jkp-count-deck{left:1160px;top:624px;width:80px;text-align:center}
.jkp-deck{position:absolute;left:1152px;top:481px;width:96px;height:128px;padding:0;border:0;background:none;cursor:pointer}
.jkp-deck-card{position:absolute;inset:0;border-radius:7px;box-shadow:0 5px 0 rgba(0,0,0,.3)}
.jkp-deck:hover .jkp-deck-card:first-child{transform:translate(-8px,-10px)!important}
.jkp-center{position:absolute;left:330px;top:180px;width:950px;height:540px;pointer-events:none}
.jkp-center>*{pointer-events:auto}
.jkp-tags{position:absolute;left:324px;top:200px;display:flex;flex-direction:column;gap:6px;z-index:25}
.jkp-tag-wrap{position:relative;display:inline-flex;cursor:help}

/* Cards */
.jkp-c{position:absolute;left:0;top:0;width:96px;height:128px;transition:transform .42s cubic-bezier(.3,1.35,.5,1);touch-action:none;cursor:pointer}
.jkp-c.is-inline{position:relative;transition:none}
.jkp-c.is-entering,.jkp-c.is-dragging{transition:none}
.jkp-c.is-dragging{cursor:grabbing}
.jkp-c-tilt{width:100%;height:100%;transition:transform .14s ease-out}
.jkp-c-sway{width:100%;height:100%}
.jkp-c-sway.is-swaying{animation:jkp-sway 5.5s ease-in-out infinite}
.jkp-c-face{position:relative;width:100%;height:100%;border-radius:7px;box-shadow:0 7px 0 rgba(0,0,0,.32)}
.jkp-c-face.is-jiggle{animation:jkp-jiggle .34s ease-out}
.jkp-c.is-focused .jkp-c-face{box-shadow:0 7px 0 rgba(0,0,0,.32),0 0 0 3px rgba(255,255,255,.85)}
.jkp-c.is-selected .jkp-c-face{box-shadow:0 12px 0 rgba(0,0,0,.25)}
.jkp-c.is-debuffed .jkp-c-face{filter:grayscale(.8) brightness(.85)}
.jkp-c.is-debuffed .jkp-c-face::after{content:'';position:absolute;inset:22% 18%;
  background:linear-gradient(45deg,transparent 44%,rgba(254,95,85,.9) 44% 56%,transparent 56%),linear-gradient(-45deg,transparent 44%,rgba(254,95,85,.9) 44% 56%,transparent 56%)}
.jkp-c.is-destroyed .jkp-c-face{animation:jkp-melt .4s forwards}
.jkp-svg{width:100%;height:100%;display:block;overflow:visible}
.jkp-svg-rank{font-family:'JKPPixel',sans-serif;font-size:12px}
.jkp-svg-joker{font-family:'JKPPixel',sans-serif;font-size:9px}
.jkp-svg-small{font-family:'JKPPixel',sans-serif;font-size:8px}
.jkp-svg-chiptext{font-family:'JKPPixel',sans-serif;font-size:12px}
.jkp-blind-chip,.jkp-chip-icon,.jkp-tag-icon{flex:none;display:block}

/* Score popups */
.jkp-pops{position:absolute;left:50%;bottom:calc(100% + 8px);transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:4px;z-index:20;pointer-events:none}
.jkp-pops.is-below{bottom:auto;top:calc(100% + 14px)}
.jkp-pop{font-size:26px;padding:3px 12px;border-radius:8px;white-space:nowrap;box-shadow:0 3px 0 rgba(0,0,0,.3);animation:jkp-pop .28s cubic-bezier(.3,1.6,.5,1)}
.jkp-pop.is-chips{background:#009dff}.jkp-pop.is-mult{background:#fe5f55}.jkp-pop.is-xmult{background:#fe5f55;outline:2px solid #fff}
.jkp-pop.is-debuff{background:#5b6466}

/* Tooltips */
.jkp-tip-layer{position:absolute;inset:0;z-index:900;pointer-events:none;overflow:hidden}
.jkp-tip-anchor{position:absolute}
.jkp-tip{position:absolute;pointer-events:none;animation:jkp-fade .12s}
.jkp-tip.is-bottom{top:calc(100% + 14px);left:50%;transform:translateX(-50%)}
.jkp-tip.is-top{bottom:calc(100% + 14px);left:50%;transform:translateX(-50%)}
.jkp-tip.is-right{left:calc(100% + 12px);top:50%;transform:translateY(-50%)}
.jkp-tip.is-left{right:calc(100% + 12px);top:50%;transform:translateY(-50%)}
.jkp-tipbox{min-width:190px;max-width:270px;background:#3a4a4f;border:3px solid #c5cfd2;border-radius:12px;padding:6px 8px 8px;text-align:center;
  box-shadow:0 6px 0 rgba(0,0,0,.35)}
.jkp-tip-title{font-size:24px;margin-bottom:4px;white-space:nowrap}
.jkp-tip-desc{background:#fff;color:#4f6367;border-radius:8px;padding:6px 8px;font-size:16px;line-height:1.3;text-shadow:none;white-space:pre-line}
.jkp-tip-badges{display:flex;justify-content:center;gap:6px;margin-top:6px}
.jkp-badge{min-width:110px;padding:2px 12px;border-radius:12px;font-size:16px;box-shadow:0 3px 0 rgba(0,0,0,.25)}

/* Attached action tabs */
.jkp-tabs{position:absolute;z-index:30;display:flex;gap:6px}
.jkp-tabs.is-below{top:calc(100% + 12px);left:50%;transform:translateX(-50%)}
.jkp-tabs.is-right{left:calc(100% - 4px);top:28%;flex-direction:column}
.jkp-tabs .jkp-btn{font-size:18px;padding:6px 12px;white-space:pre}
.jkp-stage.is-dragging .jkp-tip{display:none}

/* Hand controls */
.jkp-controls{position:absolute;left:400px;top:646px;width:640px;height:64px;display:flex;gap:12px;justify-content:center;z-index:30;
  transition:transform .3s cubic-bezier(.3,1.3,.5,1),opacity .2s}
.jkp-controls.is-hidden{transform:translateY(100px);opacity:0;pointer-events:none}
.jkp-ctl-play,.jkp-ctl-discard{width:180px;font-size:26px}
.jkp-ctl-sort{width:180px;border:3px solid #c5cfd2;border-radius:12px;padding:2px 6px 6px;text-align:center;font-size:16px;background:rgba(0,0,0,.3)}
.jkp-ctl-sort-row{display:flex;gap:6px;margin-top:2px}
.jkp-ctl-sort-row .jkp-btn{flex:1;font-size:17px;padding:4px 6px;border-radius:8px}
.jkp-bigtext{position:absolute;left:330px;width:950px;top:196px;text-align:center;font-size:64px;z-index:60;pointer-events:none;
  text-shadow:0 5px 0 rgba(0,0,0,.4);animation:jkp-wobble 1.4s ease-in-out infinite}
.jkp-notices{position:absolute;left:330px;width:950px;top:210px;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;z-index:70}
.jkp-notice{font-size:38px;text-shadow:0 4px 0 rgba(0,0,0,.45);animation:jkp-notice 1.9s forwards}
.jkp-notice.is-error{color:#fe5f55}

/* Blind select */
.jkp-blinds{position:absolute;inset:0;display:flex;justify-content:center;align-items:flex-end;gap:24px;animation:jkp-rise .5s cubic-bezier(.3,1.2,.5,1)}
.jkp-blind-panel{--tint:#3878c8;width:240px;height:480px;background:#1e2b2d;border:3px solid color-mix(in srgb,var(--tint) 70%,#1e2b2d);border-bottom:0;
  border-radius:16px 16px 0 0;display:flex;flex-direction:column;align-items:center;padding:10px;gap:8px;transform:translateY(70px);transition:transform .35s}
.jkp-blind-panel.is-current{transform:translateY(0)}
.jkp-blind-panel.is-defeated,.jkp-blind-panel.is-skipped{opacity:.55}
.jkp-blind-action{width:100%;height:52px;flex:none}
.jkp-blind-select{width:100%;height:100%;font-size:28px}
.jkp-blind-status{height:100%;border-radius:10px;background:#3a4a4f;display:flex;align-items:center;justify-content:center;font-size:22px;color:#c5cfd2}
.jkp-blind-ribbon{width:100%;border-radius:10px;background:var(--tint);padding:6px;text-align:center;font-size:24px;box-shadow:0 4px 0 color-mix(in srgb,var(--tint) 55%,#000)}
.jkp-blind-body{width:100%;border-radius:10px;background:#2b3a3d;padding:10px;display:flex;flex-direction:column;align-items:center;gap:8px}
.jkp-blind-desc{font-size:15px;text-align:center;line-height:1.25}
.jkp-blind-score{width:100%;background:#1b2427;border-radius:8px;padding:6px;text-align:center}
.jkp-blind-target{display:flex;align-items:center;justify-content:center;gap:6px;color:#fe5f55;font-size:32px}
.jkp-blind-skip{width:100%;text-align:center}
.jkp-blind-or{font-size:16px;color:#c5cfd2;margin-bottom:4px}
.jkp-blind-skiprow{display:flex;gap:10px;align-items:center;justify-content:center}
.jkp-blind-skipbtn{font-size:20px}

/* Shop */
.jkp-shop{position:absolute;left:40px;right:40px;top:16px;bottom:0;background:#1e2b2d;border:3px solid #3a5055;border-bottom:0;border-radius:16px 16px 0 0;
  padding:14px;display:flex;flex-direction:column;gap:14px;animation:jkp-rise .45s cubic-bezier(.3,1.2,.5,1)}
.jkp-shop-top{display:flex;gap:14px;height:240px;flex:none}
.jkp-shop-buttons{width:150px;display:flex;flex-direction:column;gap:12px}
.jkp-shop-next{flex:1.3;font-size:30px}
.jkp-shop-reroll{flex:1;font-size:24px}
.jkp-shop-reroll b{font-size:28px}
.jkp-shop-cards{flex:1;background:rgba(0,0,0,.3);border-radius:12px;display:flex;align-items:center;justify-content:center;gap:34px;padding-top:20px}
.jkp-shop-slot{position:relative;width:96px;height:128px;flex:none}
.jkp-shop-slot.is-sold{border:2px dashed rgba(255,255,255,.12);border-radius:8px}
.jkp-price{position:absolute;bottom:calc(100% + 2px);left:50%;transform:translateX(-50%);background:#1e2b2d;border:2px solid #3a5055;border-bottom:0;
  border-radius:8px 8px 0 0;padding:1px 12px;font-size:22px;color:#f5b143;z-index:2}
.jkp-shop-bottom{flex:1;display:flex;gap:14px;min-height:0}
.jkp-shop-voucher{position:relative;width:250px;background:rgba(0,0,0,.3);border-radius:12px;display:flex;flex-direction:column-reverse;align-items:center;justify-content:center;gap:14px;padding-top:20px}
.jkp-shop-caption{font-size:16px;color:#c5cfd2}
.jkp-shop-packs{flex:1;background:rgba(0,0,0,.3);border-radius:12px;display:flex;align-items:center;justify-content:center;gap:50px;padding-top:20px}

/* Booster pack */
.jkp-packscreen{position:absolute;inset:0}
.jkp-pack-choices{position:absolute;left:0;right:0;top:110px;display:flex;justify-content:center;gap:44px;animation:jkp-rise .4s cubic-bezier(.3,1.2,.5,1)}
.jkp-pack-panel{position:absolute;left:50%;bottom:0;width:470px;height:160px;transform:translateX(-50%);background:#1e2b2d;border:3px solid #3aa6b9;border-bottom:0;
  border-radius:16px 16px 0 0;text-align:center;padding:14px;display:flex;flex-direction:column;align-items:center;gap:6px}
.jkp-pack-title{font-size:40px}
.jkp-pack-sub{font-size:18px;color:#c5cfd2}
.jkp-pack-skip{font-size:26px;padding:6px 44px}

/* Cash out */
.jkp-cashout{position:absolute;left:120px;right:120px;top:30px;bottom:0;background:#1e2b2d;border:3px solid #3a5055;border-bottom:0;border-radius:16px 16px 0 0;
  padding:18px 22px;display:flex;flex-direction:column;gap:12px;animation:jkp-rise .45s cubic-bezier(.3,1.2,.5,1)}
.jkp-cashout-btn{font-size:36px;padding:14px;align-self:center;width:70%}
.jkp-cashout-rows{display:flex;flex-direction:column}
.jkp-cashout-row{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:2px dashed rgba(255,255,255,.15);font-size:22px;animation:jkp-slidein .3s both}
.jkp-cashout-left{display:flex;align-items:center;gap:12px}
.jkp-cashout-right{font-size:30px;letter-spacing:2px}

/* Game over */
.jkp-over{position:absolute;left:100px;right:100px;top:10px;bottom:20px;background:#1e2b2d;border:4px solid #fe5f55;border-radius:18px;padding:22px 28px;
  display:flex;flex-direction:column;align-items:center;gap:14px;animation:jkp-drop .55s cubic-bezier(.3,1.3,.5,1)}
.jkp-over.is-won{border-color:#f5b143}
.jkp-over-title{font-size:72px;color:#fe5f55;text-shadow:0 6px 0 rgba(0,0,0,.45);animation:jkp-wobble 1.6s ease-in-out infinite}
.jkp-over.is-won .jkp-over-title{color:#f5b143}
.jkp-over-sub{font-size:22px;color:#c5cfd2}
.jkp-over-body{width:100%;display:flex;gap:20px;flex:1;min-height:0}
.jkp-over-stats{flex:1;display:flex;flex-direction:column;gap:8px}
.jkp-over-row{display:flex;justify-content:space-between;align-items:center;background:#2b3a3d;border-radius:10px;padding:8px 14px;font-size:20px}
.jkp-over-row b{font-weight:400;font-size:24px}
.jkp-over-side{width:190px;display:flex;flex-direction:column;gap:10px}
.jkp-over-side .jkp-hud-stat{background:#2b3a3d;padding:8px}
.jkp-over-record{font-size:15px;color:#c5cfd2;text-align:center;line-height:1.4}
.jkp-over-actions{display:flex;gap:16px}
.jkp-over-actions .jkp-btn{font-size:28px;padding:12px 34px}

/* Overlays */
.jkp-overlay{position:absolute;inset:0;z-index:150;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;animation:jkp-fade .2s}
.jkp-overlay-panel{width:1000px;height:660px;background:#2e3d40;border:4px solid #c5cfd2;border-radius:20px;padding:20px 26px;display:flex;flex-direction:column;gap:14px;
  box-shadow:0 10px 0 rgba(0,0,0,.35);animation:jkp-drop .35s cubic-bezier(.3,1.3,.5,1)}
.jkp-back{margin-top:auto;width:100%;font-size:28px;padding:10px}
.jkp-info-tabs{display:flex;justify-content:center;gap:14px}
.jkp-info-tab{font-size:24px;padding:8px 28px}
.jkp-info-tab.is-on{outline:3px solid #fff;outline-offset:3px}
.jkp-info-body{flex:1;min-height:0;overflow:auto}
.jkp-info-hands{display:flex;flex-direction:column;gap:6px}
.jkp-info-hand{display:grid;grid-template-columns:90px 1fr 230px 80px;align-items:center;gap:10px;background:#1e2b2d;border-radius:10px;padding:6px 12px;font-size:22px}
.jkp-info-lvl{background:#c5cfd2;color:#2b3a3d;border-radius:8px;text-align:center;font-size:18px;text-shadow:none;padding:2px 0}
.jkp-info-cm{display:flex;gap:6px;justify-content:flex-end;align-items:center}
.jkp-info-cm b{font-weight:400;min-width:84px;border-radius:6px;padding:2px 10px}
.jkp-info-cm b.is-chips{background:#009dff;text-align:right}.jkp-info-cm b.is-mult{background:#fe5f55}
.jkp-info-cm i{font-style:normal;color:#fe5f55}
.jkp-info-plays{color:#f5b143;text-align:right}
.jkp-info-blinds{display:flex;gap:20px;justify-content:center;padding-top:30px}
.jkp-info-blind{width:300px;background:#1e2b2d;border-radius:14px;padding:14px;display:flex;gap:14px;align-items:center}
.jkp-info-name{font-size:24px}
.jkp-info-desc{font-size:15px;color:#c5cfd2;margin:4px 0}
.jkp-info-vouchers{display:flex;flex-wrap:wrap;gap:20px;justify-content:center;padding-top:20px}
.jkp-info-voucher{display:flex;flex-direction:column;align-items:center;gap:8px}
.jkp-info-voucher-card{width:96px;height:128px}
.jkp-info-empty{text-align:center;font-size:24px;color:#c5cfd2;padding-top:120px}
.jkp-opt-title{font-size:40px;text-align:center}
.jkp-opt-row{display:flex;align-items:center;gap:24px;justify-content:center;padding:10px}
.jkp-opt-label{width:200px;font-size:26px;text-align:right}
.jkp-opt-values{display:flex;gap:10px;justify-content:center}
.jkp-opt-values .jkp-btn{min-width:84px;font-size:22px}
.jkp-opt-new{align-self:center;width:320px;font-size:28px;padding:12px;margin-top:24px}
.jkp-opt-confirm{align-self:center;text-align:center;font-size:24px;display:flex;flex-direction:column;gap:14px;margin-top:24px}
.jkp-deckview{display:flex;flex-direction:column;gap:10px;align-items:center}
.jkp-deckview-row{display:flex;gap:4px}
.jkp-deckview-card{width:62px;height:83px;border-radius:5px;box-shadow:0 3px 0 rgba(0,0,0,.3)}
.jkp-deckview-card.is-gone{opacity:.22}

/* Editions, stickers, forced selection */
.jkp-ed{position:absolute;inset:0;border-radius:7px;pointer-events:none;overflow:hidden}
.ed-foil .jkp-ed{mix-blend-mode:screen;background:linear-gradient(115deg,transparent 25%,rgba(110,170,255,.55) 42%,rgba(235,245,255,.75) 50%,rgba(110,170,255,.55) 58%,transparent 75%);
  background-size:260% 260%;animation:jkp-shine 3.2s linear infinite}
.ed-holo .jkp-ed{mix-blend-mode:multiply;opacity:.55;background:repeating-linear-gradient(115deg,#ff7a7a 0 6%,#ffd36a 6% 12%,#7affa8 12% 18%,#7ab8ff 18% 24%,#d37aff 24% 30%);
  background-size:300% 300%;animation:jkp-shine 5s linear infinite}
.ed-poly .jkp-c-face>svg,.ed-poly>svg{animation:jkp-hue 4s linear infinite}
.ed-poly .jkp-ed{mix-blend-mode:overlay;background:conic-gradient(from 0deg,#ff5f9e,#ffd84d,#5fff9e,#5fbaff,#c75fff,#ff5f9e);opacity:.45}
.ed-negative .jkp-c-face>svg,.ed-negative>svg{filter:invert(.92) hue-rotate(180deg)}
.ed-negative .jkp-ed{box-shadow:inset 0 0 0 2px rgba(180,120,255,.8)}
.jkp-stickers{position:absolute;top:4px;right:4px;display:flex;flex-direction:column;gap:3px;z-index:2}
.jkp-sticker{min-width:20px;height:20px;padding:0 4px;border-radius:6px;font-size:14px;line-height:20px;text-align:center;color:#fff;box-shadow:0 2px 0 rgba(0,0,0,.3)}
.jkp-sticker.is-eternal{background:#8867a5}.jkp-sticker.is-perish{background:#4f8fd8}.jkp-sticker.is-rental{background:#d6a31f}
.jkp-c.is-forced .jkp-c-face{box-shadow:0 12px 0 rgba(0,0,0,.25),0 0 0 3px #009dff}
.jkp-pop.is-again{background:#ff9a00}.jkp-pop.is-money{background:#f5b143;color:#3a2600;text-shadow:none}
.is-struck{text-decoration:line-through;opacity:.6}
.jkp-hud-boss-desc.is-off{text-decoration:line-through;opacity:.6}
.jkp-t-money.is-debt{color:#fe5f55}
.jkp-t-tarot{color:#a782d1}.jkp-t-spectral{color:#4584fa}
.jkp-tipwrap{display:flex;flex-direction:column;align-items:center;gap:6px}
.jkp-tipbox.is-extra{min-width:160px;max-width:240px;padding:4px 6px 6px;border-width:2px}
.jkp-tip-title.is-small{font-size:18px}

/* Shop rows, boss reroll, pack hand */
.jkp-shop-row{display:flex;gap:30px;justify-content:center}
.jkp-blind-reroll{position:absolute;bottom:-60px;left:50%;transform:translateX(-50%);font-size:16px;white-space:nowrap}
.jkp-blind-panel{position:relative}
.jkp-packscreen.has-hand .jkp-pack-choices{top:20px}
.jkp-pack-hand{position:absolute;left:40px;right:40px;top:196px;display:flex;justify-content:center;padding-top:30px}
.jkp-pack-hand-slot{position:relative;width:96px;height:128px;margin:0 -8px;transition:transform .2s}
.jkp-pack-hand-slot .jkp-c.is-selected{transform:translateY(-26px)}
.jkp-packscreen.has-hand .jkp-pack-panel{height:120px}

/* New run */
.jkp-newrun{display:flex;gap:40px;justify-content:center;align-items:flex-start;flex:1;min-height:0}
.jkp-newrun-col{display:flex;flex-direction:column;align-items:center;gap:10px;width:380px}
.jkp-newrun-label{font-size:26px;color:#c5cfd2}
.jkp-newrun-picker{display:flex;align-items:center;gap:20px}
.jkp-newrun-deck{position:relative;width:96px;height:128px}
.jkp-newrun-deck-tint{position:absolute;inset:0;border-radius:7px;mix-blend-mode:multiply;pointer-events:none}
.jkp-newrun-dots{display:flex;gap:5px}
.jkp-dot{width:8px;height:8px;border-radius:50%;background:#4f6367}.jkp-dot.is-on{background:#fff}
.jkp-newrun-stakes{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.jkp-stake-chip{width:38px;height:38px;border-radius:50%;border:3px solid rgba(255,255,255,.25);cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,.35)}
.jkp-stake-chip.is-on{border-color:#fff;transform:translateY(-3px)}
.jkp-newrun-play{align-self:center;width:320px;font-size:30px;padding:12px}
.jkp-info-run{display:flex;gap:20px;justify-content:center;margin-top:24px}
.jkp-deckview-row{display:flex;gap:0}
.jkp-deckview-card{position:relative;margin-right:-10px}
.jkp-pack-choices>.jkp-shop-slot{animation:jkp-flipin .45s cubic-bezier(.3,1.4,.5,1) both}
.jkp-pack-choices>.jkp-shop-slot:nth-child(2){animation-delay:.08s}.jkp-pack-choices>.jkp-shop-slot:nth-child(3){animation-delay:.16s}
.jkp-pack-choices>.jkp-shop-slot:nth-child(4){animation-delay:.24s}.jkp-pack-choices>.jkp-shop-slot:nth-child(5){animation-delay:.32s}
.jkp-pack-hand-slot{animation:jkp-rise-sm .4s ease-out both}
@keyframes jkp-flipin{from{opacity:0;transform:translateY(-40px) rotateY(90deg) scale(.6)}to{opacity:1;transform:none}}
@keyframes jkp-rise-sm{from{opacity:0;transform:translateY(60px)}to{opacity:1;transform:none}}
/* Title screen */
.jkp-title{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center}
.jkp-title-fan{position:relative;width:520px;height:190px;margin-top:40px}
.jkp-title-card{position:absolute;left:50%;top:20px;width:96px;height:128px;margin-left:-48px;
  transform:translate(var(--x),var(--y)) rotate(var(--r));animation:jkp-title-deal .6s cubic-bezier(.3,1.4,.5,1) both}
.jkp-title-card-in{position:relative;width:100%;height:100%;border-radius:7px;box-shadow:0 8px 0 rgba(0,0,0,.35);animation:jkp-float 3.4s ease-in-out infinite}
.jkp-title-card .jkp-ed{border-radius:7px}
.jkp-title-logo{text-align:center;margin-top:6px;animation:jkp-wobble 3s ease-in-out infinite}
.jkp-title-main{font-size:112px;line-height:1;color:#fff;letter-spacing:10px;
  text-shadow:0 6px 0 #fe5f55,0 12px 0 #8a2a24,0 18px 26px rgba(0,0,0,.45)}
.jkp-title-sub{margin-top:18px;font-size:26px;letter-spacing:12px;color:#f5b143;text-shadow:0 3px 0 rgba(0,0,0,.45)}
.jkp-title-menu{display:flex;gap:34px;margin-top:40px}
.jkp-title-slot{display:flex;flex-direction:column;align-items:center;gap:12px;width:300px}
.jkp-title-btn{width:100%;font-size:36px;padding:16px;border-radius:14px}
.jkp-title-save{display:flex;align-items:center;gap:12px;min-height:64px;width:100%;padding:8px 14px;border-radius:12px;
  background:rgba(20,26,30,.72);border:2px solid rgba(255,255,255,.18);font-size:18px}
.jkp-title-save.is-empty{justify-content:center;color:#c5cfd2}
.jkp-title-save-deck{width:36px;height:48px;flex:none}
.jkp-title-save-meta{font-size:16px;margin-top:2px}
.jkp-title-record{position:absolute;bottom:18px;font-size:16px;color:#e8eef0;text-shadow:0 2px 0 rgba(0,0,0,.5)}
@keyframes jkp-title-deal{from{opacity:0;transform:translate(0,320px) rotate(0)}to{opacity:1}}
@keyframes jkp-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}

/* Deck picker */
.jkp-newrun-col.is-deck{width:470px}
.jkp-deckstack{position:relative;width:calc(96px * var(--s));height:calc(128px * var(--s))}
.jkp-deckstack .jkp-deck-card{position:absolute;inset:0}
.jkp-deckstack-won{position:absolute;right:-8px;bottom:-8px;width:30px;height:30px;border-radius:50%;border:3px solid #fff;
  display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;box-shadow:0 3px 0 rgba(0,0,0,.35);z-index:5}
.jkp-newrun-picker{display:flex;align-items:center;gap:14px;height:170px}
.jkp-newrun-arrow{padding:10px 12px}
.jkp-newrun-side{padding:0;border:0;background:none;cursor:pointer;opacity:.55;transition:opacity .15s,transform .15s}
.jkp-newrun-side:hover{opacity:.9;transform:translateY(-4px)}
.jkp-newrun-main{animation:jkp-pop .28s cubic-bezier(.3,1.6,.5,1)}
.jkp-newrun-info{display:flex;flex-direction:column;align-items:center;gap:6px}
.jkp-newrun-won{font-size:16px;color:#f5b143}
.jkp-newrun-dots .jkp-dot{border:0;padding:0;cursor:pointer;width:12px;height:12px}
.jkp-newrun-warn{text-align:center;font-size:16px;color:#f5b143}
.jkp-opt-actions{display:flex;gap:16px;justify-content:center;margin-top:24px}
.jkp-opt-actions .jkp-opt-new{margin-top:0}
/* Score juice */
.jkp-stage.is-shaking{animation:jkp-shake .32s steps(6) 2}
.jkp-burst{position:absolute;inset:0;z-index:850;pointer-events:none;overflow:hidden}
.jkp-burst i{position:absolute;box-shadow:0 2px 0 rgba(0,0,0,.3);animation:jkp-burst 1.1s cubic-bezier(.2,.7,.4,1) both}
@keyframes jkp-shake{0%,100%{translate:0 0}20%{translate:-5px 3px}40%{translate:5px -3px}60%{translate:-3px -4px}80%{translate:4px 2px}}
@keyframes jkp-burst{0%{opacity:1;transform:translate(0,0) rotate(0)}70%{opacity:1}100%{opacity:0;transform:translate(var(--dx),calc(var(--dy) + 260px)) rotate(var(--rot))}}
/* Collection */
.jkp-title-extra{position:absolute;right:24px;bottom:22px;display:flex;gap:12px}
.jkp-title-extra .jkp-btn{font-size:24px;padding:10px 26px}
.jkp-info-tabs.is-wrap{flex-wrap:wrap;gap:8px}
.jkp-info-tab.is-small{font-size:19px;padding:6px 16px}
.jkp-col-grid{flex:1;display:flex;flex-wrap:wrap;align-content:flex-start;justify-content:center;gap:22px 18px;padding:14px 20px 0;animation:jkp-fade .2s}
.jkp-col-grid.is-tags,.jkp-col-grid.is-bosses{gap:14px 18px}
.jkp-col-grid.is-planets .jkp-shop-slot,.jkp-col-grid.is-tarots .jkp-shop-slot,.jkp-col-grid.is-spectrals .jkp-shop-slot{width:80px;height:107px}
.jkp-col-grid.is-planets .jkp-c,.jkp-col-grid.is-tarots .jkp-c,.jkp-col-grid.is-spectrals .jkp-c{transform:scale(.83);transform-origin:top left}
.jkp-col-icon{display:flex;align-items:center;justify-content:center;cursor:help;transition:transform .12s}
.jkp-col-icon:hover{transform:translateY(-4px) scale(1.08)}
.jkp-col-deck{width:96px;height:128px;border-radius:7px;box-shadow:0 6px 0 rgba(0,0,0,.3)}
.jkp-col-pager{display:flex;align-items:center;justify-content:center;gap:18px;font-size:22px}
.jkp-col-count{text-align:center;font-size:15px;color:#c5cfd2}
/* Challenges */
.jkp-ch-progress{font-size:18px;color:#c5cfd2;margin-left:14px}
.jkp-ch{flex:1;min-height:0;display:flex;gap:20px}
.jkp-ch-list{width:430px;display:grid;grid-template-columns:1fr 1fr;gap:6px;align-content:start}
.jkp-ch-item{display:flex;align-items:center;gap:8px;font:inherit;font-size:17px;color:#fff;text-align:left;cursor:pointer;
  padding:6px 10px;border-radius:8px;border:2px solid transparent;background:#1e2b2d;text-shadow:0 2px 0 rgba(0,0,0,.35)}
.jkp-ch-item:hover{background:#2b3a3d}
.jkp-ch-item.is-on{border-color:#fff;background:#3a5055}
.jkp-ch-num{width:24px;height:24px;flex:none;border-radius:6px;background:#4bc292;display:flex;align-items:center;justify-content:center;font-size:14px}
.jkp-ch-item.is-done .jkp-ch-num{background:#f5b143}
.jkp-ch-check{margin-left:auto;color:#4bc292}
.jkp-ch-detail{flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;animation:jkp-fade .2s}
.jkp-ch-detail .jkp-tipbox{max-width:420px;min-width:320px}
.jkp-ch-label{font-size:18px;color:#c5cfd2;margin-top:4px}
.jkp-ch-starters{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
.jkp-ch-card{width:72px;height:96px}
.jkp-ch-card .jkp-c{transform:scale(.75);transform-origin:top left}
.jkp-ch-none{font-size:16px;color:#9aa4a7}
.jkp-ch-start{margin-top:auto;width:320px;font-size:28px;padding:10px}
.jkp-ch-bans{font-size:15px;color:#fe9a8f;text-align:center;max-width:470px;line-height:1.4}
/* Seeds */
.jkp-newrun-seed{display:flex;align-items:center;justify-content:center;gap:10px;font-size:20px}
.jkp-newrun-seed input{width:170px;font:inherit;font-size:22px;letter-spacing:3px;text-transform:uppercase;text-align:center;color:#fff;
  background:#1b2427;border:2px solid #4f6367;border-radius:8px;padding:4px 8px;outline:none}
.jkp-newrun-seed input:focus{border-color:#009dff}
.jkp-newrun-seed-note{font-size:14px;color:#f5b143}
.jkp-info-seed,.jkp-over-seed{text-align:center;font-size:18px;color:#c5cfd2;margin-top:16px}
.jkp-info-seed b,.jkp-over-seed b{font-weight:400;color:#fff;letter-spacing:3px;margin:0 6px}
.jkp-over-seed{font-size:15px;margin-top:4px}
.jkp-c.is-legendary .jkp-c-face{box-shadow:0 7px 0 rgba(0,0,0,.32),0 0 14px 2px rgba(245,200,67,.55);animation:jkp-legend 2.4s ease-in-out infinite}
@keyframes jkp-legend{50%{box-shadow:0 7px 0 rgba(0,0,0,.32),0 0 22px 5px rgba(245,200,67,.8)}}
/* Locks and discovery */
.jkp-deckstack.is-locked .jkp-deck-card{filter:grayscale(1) brightness(.45)}
.jkp-lock{position:absolute;inset:0;z-index:6;display:flex;align-items:center;justify-content:center;font-size:calc(34px * var(--s))}
.jkp-stake-chip.is-locked{filter:grayscale(.8) brightness(.45);cursor:not-allowed}
.jkp-col-unknown{width:96px;height:128px;border-radius:7px;background:repeating-linear-gradient(45deg,#2b3a3d 0 6px,#26343a 6px 12px);
  border:2px solid #3a5055;display:flex;align-items:center;justify-content:center;font-size:44px;color:#5b6f74;box-shadow:0 6px 0 rgba(0,0,0,.3)}
.jkp-col-unknown.is-tags{width:52px;height:52px;font-size:26px;border-radius:10px}
.jkp-col-unknown.is-bosses{width:64px;height:64px;font-size:30px;border-radius:50%}
.jkp-col-unknown.is-planets,.jkp-col-unknown.is-tarots,.jkp-col-unknown.is-spectrals{width:80px;height:107px}
.jkp-title-unlock{position:absolute;left:24px;bottom:22px;font-size:18px;padding:8px 18px}
.jkp-title-lockhint{position:absolute;right:24px;bottom:72px;font-size:14px;color:#e8eef0;text-shadow:0 2px 0 rgba(0,0,0,.5)}
.jkp-unlock-body{flex:1;display:flex;align-items:center;justify-content:center;text-align:center;white-space:pre-line;font-size:26px;line-height:1.6}
/* Stats */
.jkp-stats{flex:1;min-height:0;display:flex;gap:30px;padding:0 20px}
.jkp-stats-col{flex:1;display:flex;flex-direction:column;gap:6px}
.jkp-stats-col .jkp-over-row{font-size:17px;padding:3px 10px}
.jkp-stats-col.is-grid{display:grid;grid-template-columns:1fr 1fr;align-content:start;gap:6px 10px}
.jkp-stats-bar{display:grid;grid-template-columns:110px 1fr 50px;align-items:center;gap:10px;font-size:17px}
.jkp-stats-bar b{font-weight:400;text-align:right;color:#f5b143}
.jkp-stats-track{height:14px;border-radius:7px;background:#1b2427;overflow:hidden}
.jkp-stats-track i{display:block;height:100%;background:linear-gradient(90deg,#009dff,#fe5f55);border-radius:7px}
.jkp-stats-jokers{display:flex;gap:14px;justify-content:center}
.jkp-stats-joker{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:14px;color:#c5cfd2}
.jkp-stake-sticker{position:absolute;right:5px;bottom:5px;width:16px;height:16px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 0 rgba(0,0,0,.35);z-index:3}
/* Deck counts */
.jkp-deckview-wrap{flex:1;min-height:0;display:flex;gap:18px;align-items:flex-start;justify-content:center}
.jkp-deck-counts{width:170px;flex:none;display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:10px;background:rgba(0,0,0,.25)}
.jkp-deck-suits{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.jkp-deck-suit{display:flex;align-items:center;justify-content:center;gap:6px;font-size:20px;background:#fff;border-radius:6px;padding:2px 0;color:#4f6367;text-shadow:none}
.jkp-deck-suit b,.jkp-deck-rank b,.jkp-deck-stone b{font-weight:400}
.jkp-deck-ranks{display:grid;grid-template-columns:1fr 1fr;gap:3px 10px;font-size:17px}
.jkp-deck-rank{display:flex;justify-content:space-between;padding:0 6px;border-radius:4px;background:#1e2b2d}
.jkp-deck-rank b{color:#f5b143}.jkp-deck-rank b.is-zero{color:#5b6466}
.jkp-deck-stone{display:flex;justify-content:space-between;font-size:16px;color:#c5cfd2}
/* Hand examples */
.jkp-info-hand{cursor:help}
.jkp-info-hand .jkp-info-name{width:max-content}
.jkp-info-hand:hover{background:#2f4044}
.jkp-hand-example{min-width:330px}
.jkp-hand-cards{display:flex;justify-content:center;gap:4px;margin:4px 0 8px;padding-top:10px}
.jkp-hand-card{width:52px;height:69px;border-radius:4px;box-shadow:0 3px 0 rgba(0,0,0,.3);transform:translateY(-10px)}
.jkp-hand-card.is-dim{transform:none;filter:brightness(.6)}
@keyframes jkp-shine{from{background-position:0% 0%}to{background-position:-260% -260%}}
@keyframes jkp-hue{from{filter:hue-rotate(0deg) saturate(1.3)}to{filter:hue-rotate(360deg) saturate(1.3)}}
@keyframes jkp-sway{0%,100%{transform:rotate(-.9deg) translateY(0)}50%{transform:rotate(.9deg) translateY(-2px)}}
@keyframes jkp-jiggle{0%{transform:scale(1) rotate(0)}30%{transform:scale(1.18) rotate(-7deg)}60%{transform:scale(1.08) rotate(5deg)}100%{transform:scale(1) rotate(0)}}
@keyframes jkp-pop{from{opacity:0;transform:scale(.3)}to{opacity:1;transform:scale(1)}}
@keyframes jkp-bump{0%{transform:scale(1)}40%{transform:scale(1.28)}100%{transform:scale(1)}}
@keyframes jkp-rise{from{transform:translateY(560px)}to{transform:translateY(0)}}
@keyframes jkp-drop{from{transform:translateY(-700px)}to{transform:translateY(0)}}
@keyframes jkp-fade{from{opacity:0}to{opacity:1}}
@keyframes jkp-slidein{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}
@keyframes jkp-notice{0%{opacity:0;transform:scale(.5)}12%{opacity:1;transform:scale(1.1)}22%{transform:scale(1)}80%{opacity:1}100%{opacity:0;transform:translateY(-24px)}}
@keyframes jkp-wobble{0%,100%{transform:rotate(-1.5deg)}50%{transform:rotate(1.5deg)}}
@keyframes jkp-flame{from{transform:scaleY(.85) skewX(-4deg)}to{transform:scaleY(1.12) skewX(4deg)}}
@keyframes jkp-neon{0%{box-shadow:0 0 0 3px #ffd36b inset,0 0 16px rgba(254,95,85,.8)}100%{box-shadow:0 0 0 3px #fff2c4 inset,0 0 24px rgba(254,95,85,1)}}
@keyframes jkp-melt{to{transform:scale(.2) rotate(30deg);opacity:0}}

@media (prefers-reduced-motion: reduce){.jkp *{animation-duration:.01ms!important;animation-iteration-count:1!important}}
`;
